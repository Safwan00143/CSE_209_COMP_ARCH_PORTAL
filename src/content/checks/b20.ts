import { all, expectEq, type Fact } from "./types"
import { codeBlock } from "./extract"
import { simulate } from "@/lib/pipeline"
import { simulateCache, totalBits } from "@/lib/cache"
import { aluCheck, type AluDesign } from "@/lib/alu"
import { assemble, call, newMachine, parse, run } from "@/lib/mips"
import { encode, range, SINGLE } from "@/lib/ieee"
import { B20_Q1 } from "@/figures/papers/b20"
import { b20Solutions as S, Q2A_SEQ } from "../papers/b20-solutions"

const near = (a: number, b: number, t = 1e-3) => (Math.abs(a - b) <= t * Math.max(1, Math.abs(b)) ? null : `${a} ≠ ${b}`)

export const b20Checks: Fact[] = [
  {
    id: "b20-1",
    claim: "no forwarding: 4 stalls, 11 cycles; forwarding: 7 cycles, both from EX/MEM",
    problem: () => {
      const f = simulate(B20_Q1, { forwarding: true })
      return all(expectEq("nofwd", simulate(B20_Q1, { forwarding: false }).cycles, 11), expectEq("fwd", f.cycles, 7), expectEq("paths", f.forwards.map((x) => x.path), ["EX/MEM→EX", "EX/MEM→EX"]))
    },
  },
  {
    id: "b20-2a",
    claim: "DM 1/8 hits, 2-way 3/8 hits; 2-way replaces 36 for 48",
    problem: () => {
      const d = simulateCache({ sets: 8, ways: 1 }, Q2A_SEQ)
      const s = simulateCache({ sets: 4, ways: 2 }, Q2A_SEQ)
      return all(expectEq("dm", d.hits, 1), expectEq("sa", s.hits, 3), expectEq("evict", s.accesses[4].evicted, 36))
    },
  },
  { id: "b20-2b", claim: "512 sets, tag 19, 148 bits/block, 606,208 bits", problem: () => { const t = totalBits({ addressBits: 32, dataBytes: 65536, blockBytes: 16, ways: 8 }); return all(expectEq("sets", t.sets, 512), expectEq("tag", t.split.tag, 19), expectEq("total", t.total, 606208)) } },
  { id: "b20-3a", claim: "CPI 17, 8.5×; CPI 5.0; 3.4×", problem: () => all(expectEq("c1", 2 + 0.05 * 300, 17), expectEq("c2", 2 + 0.05 * 30 + 0.005 * 300, 5), expectEq("r", 17 / 5, 3.4), expectEq("ideal", 17 / 2, 8.5)) },
  { id: "b20-3c", claim: "2^51 entries", problem: () => expectEq("bits", 64 - Math.log2(8192), 51) },
  {
    id: "b20-5b",
    claim: "subtractor ALU: X = A ⊕ S₂′S₁; Y = S₂′(B⊕S₀) + S₂S₁′B + S₂S₁AB′; Bin = S₂′(S₁⊕S₀); Z = S₂′·borrow",
    problem: () => {
      const n = (x: number) => 1 - x
      const d: AluDesign = {
        bits: 4,
        selBits: 3,
        subtractor: true,
        X: ([s2, s1], a) => a ^ (n(s2) & s1),
        Y: ([s2, s1, s0], a, b) => (n(s2) & (b ^ s0)) | (s2 & n(s1) & b) | (s2 & s1 & a & n(b)),
        cin: ([s2, s1, s0]) => n(s2) & (s1 ^ s0),
        Z: ([s2], c) => n(s2) & c,
      }
      return aluCheck(d, { "000": (A, B) => A - B, "001": (A, B) => A + B, "010": (A, B) => -A - B - 2, "011": (A, B) => B - A, "100": (A, B) => A ^ B, "110": (A, B) => A & B })[0] ?? null
    },
  },
  {
    id: "b20-5c",
    claim: "B text at 0x00400150; Y = 0x10000040; gp offsets 0x8000 / 0x8040; jal fields 0x100054 / 0x100000",
    problem: () => {
      const gp = 0x10008000
      return all(
        expectEq("btext", 0x00400000 + 0x150, 0x00400150),
        expectEq("Y", 0x10000000 + 0x40, 0x10000040),
        expectEq("X off", (0x10000000 - gp) & 0xffff, 0x8000),
        expectEq("Y off", (0x10000040 - gp) & 0xffff, 0x8040),
        expectEq("jal B", assemble(parse(`jal ${0x00400150}`), 0x00400004)[0].enc.fields[1][1], 0x100054),
        expectEq("jal A", assemble(parse(`jal ${0x00400000}`), 0x00400154)[0].enc.fields[1][1], 0x100000),
        expectEq("sizes", [0x150 + 0x350, 0x40 + 0x50], [0x4a0, 0x90]),
      )
    },
  },
  {
    id: "b20-6c",
    claim: "x = 8 exactly when x > y + 131075",
    problem: () => {
      const src = codeBlock(S["6c"], "lui  $t3, 2")
      for (const [x, y] of [[200000, 10], [100, 10], [131086, 10], [131085, 10], [-5, -131080]]) {
        const m = newMachine({ t1: x, t2: y })
        run(parse(src), m)
        const want = x > y + 131075 ? 8 : x
        if (m.regs[9] !== want) return `x=${x}, y=${y}: got ${m.regs[9]}`
      }
      return null
    },
  },
  {
    id: "b20-6d",
    claim: "CPI 2.15 / 2.40; 2.58M / 2.88M cycles; 0.956 / 0.900 ms; P2 1.06×; Amdahl max 1.67",
    problem: () =>
      all(
        near(0.2 * 2 + 0.25 * 1 + 0.4 * 3 + 0.15 * 2, 2.15),
        near(0.2 * 2 + 0.25 * 3 + 0.4 * 2 + 0.15 * 3, 2.4),
        near(1.2e6 * 2.15, 2.58e6),
        near((1.2e6 * 2.15) / 2.7e9 / ((1.2e6 * 2.4) / 3.2e9), 1.0617),
        near(1 / 0.6, 1.667),
      ),
  },
  {
    id: "b20-7c",
    claim: "f(a,b,c,d) = func(func(a,b), c+d), even when func clobbers $t0",
    problem: () => {
      const f = codeBlock(S["7c"], "f:      addi $sp, $sp, -8")
      const func = "func: sub $v0, $a0, $a1\naddi $t0, $zero, 999\naddi $a2, $zero, 999\njr $ra"
      for (const [a, b, c, d] of [[10, 3, 4, 5], [1, 2, 3, 4], [-7, 8, 100, -1]]) {
        const v = call(`${f}\n${func}`, "f", [a, b, c, d]).v0
        if (v !== a - b - (c + d)) return `f(${a},${b},${c},${d}) = ${v}`
      }
      return null
    },
  },
  {
    id: "b20-8b",
    claim: "12-bit exponent: Emax 2047, Emin −2046; ≈1e−616 and ≈3.2e616",
    problem: () => {
      const r = range({ expBits: 12, fracBits: 19 })
      const log10min = -2046 * Math.log10(2)
      const log10max = Math.log10(2 - 2 ** -19) + 2047 * Math.log10(2)
      return all(expectEq("emax", r.emax, 2047), expectEq("emin", r.emin, -2046), near(log10min, -615.9, 1e-3), near(10 ** (log10max - 616), 3.23, 1e-2))
    },
  },
  {
    id: "b20-8c",
    claim: "f1 < f2 ⇒ i1 < i2 only if both ≥ 0; ⇒ j1 < j2 except when both < 0 (random test)",
    problem: () => {
      const bits = (x: number) => BigInt("0b" + encode(x, SINGLE).bits)
      const signed = (u: bigint) => (u >= 2n ** 31n ? u - 2n ** 32n : u)
      let seed = 7
      const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31) * 2 - 1
      for (let k = 0; k < 2000; k++) {
        const a = Math.fround(rnd() * 1000)
        const b = Math.fround(rnd() * 1000)
        if (a === b || a === 0 || b === 0) continue
        const [f1, f2] = a < b ? [a, b] : [b, a]
        const i = bits(f1) < bits(f2)
        const j = signed(bits(f1)) < signed(bits(f2))
        if (i !== (f1 >= 0 && f2 >= 0)) return `unsigned claim fails for ${f1}, ${f2}`
        if (j !== !(f1 < 0 && f2 < 0)) return `signed claim fails for ${f1}, ${f2}`
      }
      return all(expectEq("ex1", [encode(-1, SINGLE).bits, encode(1, SINGLE).bits].map((b) => parseInt(b, 2).toString(16)), ["bf800000", "3f800000"]), expectEq("ex2", Number(signed(bits(-2))), -1073741824), expectEq("ex3", Number(signed(bits(-1))), -1082130432))
    },
  },
]
