import { all, expectEq, type Fact } from "./types"
import { codeBlock } from "./extract"
import { simulate } from "@/lib/pipeline"
import { simulateCache } from "@/lib/cache"
import { traceVM } from "@/lib/vm"
import { aluCheck, type AluDesign } from "@/lib/alu"
import { multiplyFirst, multiplyRefined } from "@/lib/multiply"
import { encode, range, SINGLE, DOUBLE } from "@/lib/ieee"
import { toHex } from "@/lib/numbers"
import { newMachine, parse, run } from "@/lib/mips"
import { B22_Q1B } from "@/figures/papers/b22"
import { b22Solutions as S, Q2B_REFS, Q3B } from "../papers/b22-solutions"

const near = (a: number, b: number, t = 1e-9) => (Math.abs(a - b) <= t ? null : `${a} ≠ ${b}`)
const has = (key: string, text: string) => (S[key].includes(text) ? null : `solution ${key} no longer says "${text}"`)

export const b22Checks: Fact[] = [
  {
    id: "b22-1b",
    claim: "15 / 12 / 14 cycles; stalls 3 / 3 / 4",
    problem: () => {
      const c = (o: boolean[]) => simulate(B22_Q1B, { forwarding: true, branchIn: "ID", outcomes: o })
      const nt = c([false, false])
      const t1 = c([true])
      const t2 = c([false, true])
      return all(
        expectEq("nt", nt.cycles, 15),
        expectEq("t1", t1.cycles, 12),
        expectEq("t2", t2.cycles, 14),
        expectEq("stalls", [nt.dataStalls + nt.controlStalls, t1.dataStalls + t1.controlStalls, t2.dataStalls + t2.controlStalls], [3, 3, 4]),
        expectEq("n", [nt.seq.length, t1.seq.length, t2.seq.length], [8, 5, 6]),
        has("1b", "8 + 4 + 3 = 15"),
        has("1b", "5 + 4 + 3 = 12"),
        has("1b", "6 + 4 + 4 = 14"),
      )
    },
  },
  {
    id: "b22-2a",
    claim: "CPI 41 → 19 (×2.16) → 14.2 (×1.34; ×2.89 over L1 only)",
    problem: () => {
      const tc = 0.25
      const mem = 200 / tc
      const l2 = 10 / tc
      const l3 = 40 / tc
      const c1 = 1 + 0.05 * mem
      const c2 = 1 + 0.05 * l2 + 0.02 * mem
      const c3 = 1 + 0.05 * l2 + 0.02 * l3 + 0.01 * mem
      return all(expectEq("c1", c1, 41), expectEq("c2", c2, 19), near(c3, 14.2), near(c1 / c2, 2.158, 1e-3), near(c2 / c3, 1.338, 1e-3), near(c1 / c3, 2.887, 1e-3))
    },
  },
  {
    id: "b22-2b",
    claim: "8-word blocks, 32 entries, 4 replaced, hit ratio 4/12",
    problem: () => {
      const r = simulateCache({ sets: 32, ways: 1, blockBytes: 32 }, Q2B_REFS)
      return all(expectEq("words", 2 ** 5 / 4, 8), expectEq("entries", 2 ** 5, 32), expectEq("replaced", r.accesses.filter((a) => a.evicted !== undefined).length, 4), expectEq("hits", r.hits, 4), has("2b", "<0, 3, Mem[3072–3103]>"))
    },
  },
  {
    id: "b22-3b",
    claim: "fault, PT hit, TLB hit, fault, PT hit, TLB hit, fault; new pages 13, 14, 15",
    problem: () => {
      const r = traceVM(Q3B)
      return all(
        expectEq("results", r.steps.map((s) => s.result), ["page fault", "page table hit", "TLB hit", "page fault", "page table hit", "TLB hit", "page fault"]),
        expectEq("vpns", r.steps.map((s) => s.vpn), [1, 0, 3, 8, 11, 3, 12]),
        expectEq("ppns", r.steps.filter((s) => s.result === "page fault").map((s) => s.ppn), [13, 14, 15]),
        expectEq("tlb", r.tlb.map((e) => [e.tag, e.ppn]).sort((a, b) => a[0] - b[0]), [[3, 6], [8, 14], [11, 12], [12, 15]]),
      )
    },
  },
  {
    id: "b22-5a",
    claim: "MIPS-v22: add = 0x00821800, addi = 0x18820001, lw = 0x14620004",
    problem: () => {
      // Independent packing by arithmetic, in MIPS-v22 field order.
      const rType = (op: number, rt: number, rd: number, rs: number) => ((op << 26) | (rt << 21) | (rd << 16) | (rs << 11)) >>> 0
      const iType = (op: number, rt: number, rs: number, k: number) => ((op << 26) | (rt << 21) | (rs << 16) | (k & 0xffff)) >>> 0
      const hx = (n: number) => n.toString(16).toUpperCase().padStart(8, "0")
      return all(
        expectEq("add", hx(rType(0, 4, 2, 3)), "00821800"),
        expectEq("addi", hx(iType(6, 4, 2, 1)), "18820001"),
        expectEq("lw", hx(iType(5, 3, 2, 4)), "14620004"),
        has("5a", "0x00821800"),
        has("5a", "0x18820001"),
        has("5a", "0x14620004"),
      )
    },
  },
  {
    id: "b22-5b",
    claim: "Xᵢ = Aᵢ + S₂S₁′Bᵢ; Yᵢ = S₂′S₁′S₀′Bᵢ′ + S₂′S₁′S₀Bᵢ + S₁S₀ + S₁S₂; Zᵢ = S₂′Cᵢ; Cin = S₂′S₁′S₀ meets the table",
    problem: () => {
      const n = (x: number) => 1 - x
      const d: AluDesign = {
        bits: 4,
        selBits: 3,
        X: ([s2, s1], a, b) => a | (s2 & n(s1) & b),
        Y: ([s2, s1, s0], _a, b) => (n(s2) & n(s1) & n(s0) & n(b)) | (n(s2) & n(s1) & s0 & b) | (s1 & s0) | (s1 & s2),
        cin: ([s2, s1, s0]) => n(s2) & n(s1) & s0,
        Z: ([s2], c) => n(s2) & c,
      }
      const NOT = (x: number) => ~x & 15
      return (
        aluCheck(d, {
          "000": (A, B) => A - B - 1,
          "001": (A, B) => A + B + 1,
          "010": (A) => A,
          "011": (A) => A - 1,
          "10x": (A, B) => A | B,
          "11x": (A) => NOT(A),
        })[0] ?? null
      )
    },
  },
  { id: "b22-6a", claim: "B needs 8 GHz", problem: () => all(expectEq("cyc", 10 * 4e9 * 1.2, 48e9), expectEq("rate", (10 * 4e9 * 1.2) / 6, 8e9)) },
  {
    id: "b22-6b",
    claim: "the MIPS code ends with a = 31, b = 121, $v0 = 0, matching the C program",
    problem: () => {
      let a = 5
      let b = 10
      const c = 2
      do {
        if (a << 2 > b) {
          a += 2
          b += a
        } else {
          a += c
          b += c
        }
      } while (a < 30)
      const m = newMachine({ v0: 99 })
      run(parse(codeBlock(S["6b"], "main:")), m)
      return all(expectEq("C a", a, 31), expectEq("C b", b, 121), expectEq("$t0", m.regs[8], a), expectEq("$t1", m.regs[9], b), expectEq("$v0", m.regs[2], 0))
    },
  },
  {
    id: "b22-7a",
    claim: "1000 × 1011 = 01011000 (88) by both multipliers",
    problem: () => all(expectEq("first", multiplyFirst("1000", "1011").product, "01011000"), expectEq("refined", multiplyRefined("1000", "1011").product, "01011000")),
  },
  {
    id: "b22-7b",
    claim: "single 0x00800000 / 0x7F7FFFFF; double 0x0010000000000000 / 0x7FEFFFFFFFFFFFFF",
    problem: () => {
      const s = range(SINGLE)
      const d = range(DOUBLE)
      return all(
        expectEq("smin", toHex(encode(s.smallest, SINGLE).bits), "00800000"),
        expectEq("smax", toHex(encode(s.largest, SINGLE).bits), "7F7FFFFF"),
        expectEq("dmin", toHex(encode(d.smallest, DOUBLE).bits), "0010000000000000"),
        expectEq("dmax", toHex(encode(d.largest, DOUBLE).bits), "7FEFFFFFFFFFFFFF"),
      )
    },
  },
  {
    id: "b22-8c",
    claim: "bne/j pair reaches L1 when $s0 = $s1 and falls through otherwise",
    problem: () => {
      // The block ends with "L2: ..." standing for the following code; make it a nop.
      const pair = codeBlock(S["8c"], "bne $s0, $s1, L2").replace("...", "nop")
      for (const [x, y] of [[4, 4], [4, 5]]) {
        const m = newMachine({ s0: x, s1: y })
        run(parse(`${pair}\naddi $v0, $zero, 2\nj E\nL1: addi $v0, $zero, 1\nE:`), m)
        if (m.regs[2] !== (x === y ? 1 : 2)) return `wrong path for ${x}, ${y}`
      }
      return null
    },
  },
]
