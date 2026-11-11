import { all, expectEq, type Fact } from "./types"
import { codeBlock } from "./extract"
import { simulate } from "@/lib/pipeline"
import { totalBits } from "@/lib/cache"
import { aluCheck, type AluDesign } from "@/lib/alu"
import { call, newMachine, parse, run } from "@/lib/mips"
import { B21_Q1C, B21_Q1C_SCHED, B21_Q2 } from "@/figures/papers/b21"
import { b21Solutions as S, Q9A } from "../papers/b21-solutions"

const near = (a: number, b: number, t = 1e-3) => (Math.abs(a - b) <= t ? null : `${a} ≠ ${b}`)

export const b21Checks: Fact[] = [
  {
    id: "b21-1c",
    claim: "A=B+C; D=A+E: 13 cycles, rescheduled 11 (code in the solution)",
    problem: () =>
      all(
        expectEq("before", simulate(codeBlock(S["1c"], "(needs $t2, loaded just before: stall)"), { forwarding: true }).cycles, 13),
        expectEq("after", simulate(codeBlock(S["1c"], "(moved up)"), { forwarding: true }).cycles, 11),
        expectEq("fig before", simulate(B21_Q1C, { forwarding: true }).cycles, 13),
        expectEq("fig after", simulate(B21_Q1C_SCHED, { forwarding: true }).cycles, 11),
        expectEq("nofwd", [simulate(B21_Q1C, { forwarding: false }).cycles, simulate(B21_Q1C_SCHED, { forwarding: false }).cycles], [19, 16]),
      ),
  },
  {
    id: "b21-1c-semantics",
    claim: "both versions store A = B + C and D = A + E",
    problem: () => {
      const base = 0x10010000
      const mem = { [base + 4]: 7, [base + 8]: 5, [base + 16]: 100 }
      for (const src of [codeBlock(S["1c"], "(needs $t2, loaded just before: stall)"), codeBlock(S["1c"], "(moved up)")]) {
        const m = newMachine({ t0: base }, mem)
        run(parse(src), m)
        const word = (a: number) => [0, 1, 2, 3].reduce((w, i) => (w << 8) | (m.mem.get(a + i) ?? 0), 0)
        if (word(base) !== 12 || word(base + 12) !== 112) return `A=${word(base)}, D=${word(base + 12)}`
      }
      return null
    },
  },
  { id: "b21-2", claim: "lw/addi/lw/sw: 2 stalls, 10 cycles", problem: () => all(expectEq("cycles", simulate(B21_Q2, { forwarding: true }).cycles, 10), expectEq("stalls", simulate(B21_Q2, { forwarding: true }).seq.map((d) => d.stalls), [0, 1, 0, 1])) },
  {
    id: "b21-9a",
    claim: "P1 CPI 4.498 (6.185 ns/instr), P2 CPI 3.281 (5.003 ns/instr), P2 1.24× faster; P1 needs L2 miss ≈ 42.3%",
    problem: () => {
      // Independent recomputation in nanoseconds per instruction (AMAT style).
      const t1 = 1.375 + 1.3 * 0.04 * (27.5 + 0.65 * 100)
      const t2 = 1.525 + 1.3 * (0.03 * 30.5 + 0.015 * 50.7 + 0.01 * 100)
      const m = ((t2 - 1.375) / (1.3 * 0.04) - 27.5) / 100
      return all(near(Q9A.t1, t1), near(Q9A.t2, t2), near(Q9A.cpi1, 4.498), near(Q9A.cpi2, 3.281), near(Q9A.need, m), near(t1 / t2, 1.236))
    },
  },
  {
    id: "b21-9b",
    claim: "4-way, 48-bit, 64 KB, 64 B blocks: tag 34, index 8, offset 6; 1024 × 549 = 562,176 bits",
    problem: () => {
      const t = totalBits({ addressBits: 48, dataBytes: 65536, blockBytes: 64, ways: 4, extraBitsPerBlock: 2 })
      return all(expectEq("split", [t.split.tag, t.split.index, t.split.offset], [34, 8, 6]), expectEq("per", t.perBlock, 549), expectEq("total", t.total, 562176))
    },
  },
  {
    id: "b21-9c",
    claim: "the MIPS fun matches C (truncating division) for a in −3…5, b in −40…70",
    problem: () => {
      const src = codeBlock(S["9c"], "fun:")
      const ref = (a: number, b: number): number => (b === 0 ? 0 : Math.trunc(b / 2) === 0 ? ref(a * 4, Math.trunc(b / 8)) : ref(a + a, Math.trunc(b / 4)) + a)
      for (let a = -3; a <= 5; a++)
        for (let b = -40; b <= 70; b += 3) {
          const v = call(src, "fun", [a, b]).v0
          if (v !== ref(a, b)) return `fun(${a}, ${b}) = ${v}, C gives ${ref(a, b)}`
        }
      return all(expectEq("trace", ref(3, 20), 9), expectEq("asm trace", call(src, "fun", [3, 20]).v0, 9))
    },
  },
  { id: "b21-10a", claim: "2^24 × 4 B = 64 MiB per process; 75 × = 4.6875 GiB", problem: () => all(expectEq("one", 2 ** 24 * 4, 64 * 2 ** 20), expectEq("all", (75 * 64) / 1024, 4.6875)) },
  {
    id: "b21-10b",
    claim: "VPN 49, PPN 21, TLB entry 96 bits; cache tag 20, index 8, offset 8",
    problem: () => all(expectEq("vpn", 64 - 15, 49), expectEq("ppn", 36 - 15, 21), expectEq("entry", 49 + 1 + 1 + 24 + 21, 96), expectEq("cache", [36 - 8 - 8, Math.log2(65536 / 256), Math.log2(256)], [20, 8, 8])),
  },
  {
    id: "b21-11d",
    claim: "Xᵢ = S₂′(Aᵢ⊕S₁′) + S₂(Aᵢ + S₁′Bᵢ′); Yᵢ = Bᵢ ⊕ [S₂′(S₁⊙S₀) + S₂S₁′]; Zᵢ = S₂′Cᵢ; Cin = S₂′S₁S₀",
    problem: () => {
      const n = (x: number) => 1 - x
      const d: AluDesign = {
        bits: 4,
        selBits: 3,
        X: ([s2, s1], a, b) => (n(s2) & (a ^ n(s1))) | (s2 & (a | (n(s1) & n(b)))),
        Y: ([s2, s1, s0], _a, b) => b ^ ((n(s2) & n(s1 ^ s0)) | (s2 & n(s1))),
        cin: ([s2, s1, s0]) => n(s2) & s1 & s0,
        Z: ([s2], c) => n(s2) & c,
      }
      const NOT = (x: number) => ~x & 15
      return aluCheck(d, { "000": (A, B) => -A - B - 2, "001": (A, B) => B + NOT(A), "010": (A, B) => A + B, "011": (A, B) => A - B, "10x": (A, B) => A & B, "11x": (A, B) => A ^ B })[0] ?? null
    },
  },
  {
    id: "b21-12c",
    claim: "lui 8193 / ori 18724 builds 0x20014924; j from 0 cannot reach it; branch offset 22088 fits",
    problem: () => {
      const m = newMachine()
      run(parse(codeBlock(S["12c"], "lui $t1, 8193")), m)
      const off = (0x20014924 - (0x1fff_f000 + 4)) / 4
      return all(expectEq("t1", m.regs[9] >>> 0, 0x20014924), expectEq("regions", [(0x00000004 >>> 28) & 15, (0x20014924 >>> 28) & 15], [0, 2]), expectEq("offset", off, 22088), off <= 32767 ? null : "out of range")
    },
  },
]
