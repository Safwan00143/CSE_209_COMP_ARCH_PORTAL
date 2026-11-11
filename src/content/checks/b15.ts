import { all, expectEq, type Fact } from "./types"
import { codeBlock } from "./extract"
import { aluCheck, runAlu, type AluDesign } from "@/lib/alu"
import { simulateCache } from "@/lib/cache"
import { decode, encode, fpAddSteps, SINGLE } from "@/lib/ieee"
import { assemble, call, loadWord, newMachine, parse, run, storeWord } from "@/lib/mips"
import { b15Solutions as S, HALF, Q4B_CFG, Q4B_SEQ, readMs, speedup } from "../papers/b15-solutions"
import { b16Solutions } from "../papers/b16-solutions"
import { b19Solutions } from "../papers/b19-solutions"
import { b21Solutions } from "../papers/b21-solutions"
import { b22Solutions } from "../papers/b22-solutions"

const n = (x: number) => 1 - x
const near = (a: number, b: number, t = 1e-3) => (Math.abs(a - b) <= t * Math.max(1, Math.abs(b)) ? null : `${a} ≠ ${b}`)

/** Q6(a) design; selection bits most significant first: [S2, S1, S0]. */
export const Q6_ALU: AluDesign = {
  bits: 4,
  selBits: 3,
  X: ([s2, s1, s0], a, b) => (a & n(s2 & s0)) | (s2 & n(s1) & s0 & a & b) | (s2 & s1 & s0 & (n(a) | b)),
  Y: ([, s1, s0], _a, b) => (n(s1) & n(s0) & b) | (s1 & n(s0)) | (s1 & n(b)),
  Z: ([s2], c) => n(s2) & c,
  cin: () => 0,
}

export const b15Checks: Fact[] = [
  {
    id: "b15-reuse",
    claim: "repeated questions reuse the earlier worked solutions",
    problem: () =>
      all(
        S["1a"] === b21Solutions["1c"] ? null : "1a",
        S["2b"] === b22Solutions["1a"] ? null : "2b",
        S["2c"] === b19Solutions["1c"] ? null : "2c",
        S["2d"] === b19Solutions["1d"] ? null : "2d",
        S["3c"] === b19Solutions["3b"] ? null : "3c",
        S["4a"] === b19Solutions["3a"] ? null : "4a",
        S["8c"] === b16Solutions["6c"] ? null : "8c",
        S["1d"].startsWith("- **Why.**") ? null : "1d does not start at the penalty answer",
      ),
  },
  {
    id: "b15-1c",
    claim: "700 vs 200 ps: 3 lw → 2100/1400 = 1.5; 3,000,003 lw → ≈ 3.5",
    problem: () => all(near(speedup(3), 2100 / 1400), near(speedup(3000003), 3.49999), speedup(3000003) < 3.5 ? null : "not below 3.5"),
  },
  {
    id: "b15-3a",
    claim: "disk read 5 + 3 + 10 + 0.5 = 18.5 ms; 15.5 ms with 2 ms seek",
    problem: () => all(near(readMs(5), 18.5), near(readMs(2), 15.5)),
  },
  {
    id: "b15-3d",
    claim: "stalls 6 + 4 = 10; CPI 12; perfect cache 6× faster; 83.3% on stalls",
    problem: () => {
      const st = 0.03 * 200 + 0.4 * 0.05 * 200
      return all(near(st, 10), near((2 + st) / 2, 6), near(st / (2 + st), 0.8333))
    },
  },
  {
    id: "b15-4b",
    claim: "misses: fully associative 3, two-way 9, direct mapped 7",
    problem: () => expectEq("misses", (["fa", "two", "dm"] as const).map((k) => simulateCache(Q4B_CFG[k], Q4B_SEQ).misses), [3, 9, 7]),
  },
  {
    id: "b15-5a",
    claim: "P1 108, P2 140.4 cycles: P1 1.3× faster; A + C = 88 > 54",
    problem: () => all(near(40 * 1.2 + 10 * 2 + 16 * 2.5, 108), near(12 * 1.2 + 13 * 2 + 40 * 2.5, 140.4), near(140.4 / 108, 1.3), 48 + 40 > 54 ? null : "possible"),
  },
  {
    id: "b15-5b",
    claim: "0.75 = 0x3400, 1.25 = 0x3A00, sum 2.0 = 0x4000",
    problem: () => {
      const r = fpAddSteps(0.75, 1.25, HALF)
      return all(expectEq("0.75", encode(0.75, HALF).bits, "0011010000000000"), expectEq("1.25", encode(1.25, HALF).bits, "0011101000000000"), expectEq("sum", r.encoded.bits, "0100000000000000"), expectEq("value", r.result, 2))
    },
  },
  { id: "b15-5c", claim: "0x7F800005 is NaN", problem: () => expectEq("kind", decode("0x7F800005", SINGLE).kind, "nan") },
  {
    id: "b15-6a",
    claim: "X, Y, Z equations give all 8 operations",
    problem: () =>
      aluCheck(Q6_ALU, {
        "000": (A, B) => A + B, "001": (A) => A, "010": (A) => A - 1, "011": (A, B) => A + (~B & 15),
        "100": (A, B) => A ^ B, "101": (A, B) => A & B, "110": (A) => ~A, "111": (A, B) => A | B,
      })[0] ?? null,
  },
  {
    id: "b15-6b",
    claim: "carry out: add A+B ≥ 16; transfer never; decrement A ≠ 0; A + B' when A > B",
    problem: () => {
      const want: Record<string, (a: number, b: number) => boolean> = { "000": (a, b) => a + b >= 16, "001": () => false, "010": (a) => a !== 0, "011": (a, b) => a > b }
      for (const [code, f] of Object.entries(want))
        for (let a = 0; a < 16; a++)
          for (let b = 0; b < 16; b++) if ((runAlu(Q6_ALU, [...code].map(Number), a, b).cout === 1) !== f(a, b)) return `${code}: A=${a}, B=${b}`
      return null
    },
  },
  {
    id: "b15-7a",
    claim: "sort orders several arrays; registers and $sp preserved",
    problem: () => {
      const src = codeBlock(S["7a"], "swap:")
      for (const arr of [[5, 2, 9, 1, 7], [1, 2, 3], [3, 2, 1, 0, -4], [7], [4, 4, -1, 4, 2, 8, 0, 3]]) {
        const base = 0x10010000
        const memory: Record<number, number> = {}
        arr.forEach((v, i) => (memory[base + 4 * i] = v))
        const { machine } = call(src, "sort", [base, arr.length], { memory })
        const got = arr.map((_, i) => loadWord(machine.mem, base + 4 * i))
        const sorted = [...arr].sort((x, y) => x - y)
        if (got.join() !== sorted.join()) return `${arr} → ${got}`
      }
      return null
    },
  },
  {
    id: "b15-7b",
    claim: "j to 0x40000001 is rejected (not word-aligned); lui + jr reaches 0x40000000",
    problem: () => {
      let threw = false
      try {
        assemble(parse("j 0x40000001"), 0x40000000)
      } catch {
        threw = true
      }
      const m = newMachine()
      storeWord(m.mem, 0, 0)
      run(parse(codeBlock(S["7b"], "lui  $t0, 0x4000")), m, { stopAfter: 1 })
      return all(threw ? null : "unaligned jump encoded", expectEq("t0", m.regs[8] >>> 0, 0x40000000))
    },
  },
]
