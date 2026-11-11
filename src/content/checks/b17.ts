import { all, expectEq, type Fact } from "./types"
import { codeBlock } from "./extract"
import { simulate } from "@/lib/pipeline"
import { aluCheck, NOT } from "@/lib/alu"
import { simulateCache, totalBits } from "@/lib/cache"
import { encode, range } from "@/lib/ieee"
import { CONTROL } from "@/lib/datapath"
import { newMachine, parse, run, storeWord } from "@/lib/mips"
import { B17_Q5_AFTER, B17_Q5_BEFORE, B17_Q8C } from "@/figures/papers/b17"
import { b17Solutions as S, Q1A, Q4_FMT, Q6A_CFG, Q6A_SEQ } from "../papers/b17-solutions"

const n = (x: number) => 1 - x
const signed4 = (v: number) => (v >= 8 ? v - 16 : v)
/** Status bits of a − b for 4-bit inputs, computed as a + b' + 1. */
function status(a: number, b: number) {
  const raw = a + (~b & 15) + 1
  const r = raw & 15
  const d = signed4(a) - signed4(b)
  return { V: d > 7 || d < -8 ? 1 : 0, Z: r === 0 ? 1 : 0, S: r >> 3, C: raw >> 4 }
}

export const b17Checks: Fact[] = [
  {
    id: "b17-1a",
    claim: "Program 1: A 20 cycles, B 25 cycles, both 10 ns",
    problem: () => {
      const c = (k: "A" | "B") => Q1A[k].ops.reduce((t, [, x]) => t + x, 0)
      return all(expectEq("A", c("A"), 20), expectEq("B", c("B"), 25), expectEq("tA", c("A") / 2, 10), expectEq("tB", c("B") / 2.5, 10))
    },
  },
  { id: "b17-1b", claim: "80 s of 100 s sped up 5×: 36 s, ≈2.8×", problem: () => all(expectEq("t", 80 / 5 + 20, 36), Math.abs(100 / 36 - 2.78) < 0.01 ? null : "speed-up") },
  {
    id: "b17-2a",
    claim: "X, Y, Z equations give all 12 required functions",
    problem: () =>
      aluCheck(
        {
          bits: 4,
          selBits: 4,
          X: ([s3, s2, s1], a, b) => (n(a) & n(s3 & s2 & s1)) | (n(a) & n(b)) | (s3 & n(s2) & n(s1) & n(b)),
          Y: ([, s2, s1], _a, b) => (s1 & b) | (s2 & n(b)),
          Z: ([s3], c) => n(s3) & c,
          cin: ([s3, , , s0]) => n(s3) & s0,
        },
        {
          "0000": (A, _B, k) => NOT(A, k), "0001": (A, _B, k) => NOT(A, k) + 1, "0010": (A, B, k) => NOT(A, k) + B, "0011": (A, B, k) => NOT(A, k) + B + 1,
          "0100": (A, B, k) => NOT(A, k) - B - 1, "0101": (A, B, k) => NOT(A, k) - B, "0110": (A, _B, k) => NOT(A, k) - 1, "0111": (A, _B, k) => NOT(A, k),
          "100x": (A, B, k) => NOT(A & B, k), "101x": (A, B, k) => NOT(A ^ B, k), "110x": (A, B) => A ^ B, "111x": (A, B) => A | B,
        },
      )[0] ?? null,
  },
  {
    id: "b17-2b",
    claim: "F = (S1⊕V1)'Z2' + Z3 (signed) and C1Z2' + Z3 (unsigned) on all inputs",
    problem: () => {
      for (let a = 0; a < 16; a++)
        for (let b = 0; b < 16; b++)
          for (let cd = 0; cd < 2; cd++)
            for (const x of [0, 1, 9]) {
              const [c, d] = cd ? [5, 5] : [5, 6]
              const m1 = status(a, b)
              const m2 = status(c, d)
              const m3 = status(x, 0)
              const fs = (n(m1.S ^ m1.V) & n(m2.Z)) | m3.Z
              const fu = (m1.C & n(m2.Z)) | m3.Z
              const ws = (signed4(a) >= signed4(b) && c !== d) || x === 0 ? 1 : 0
              const wu = (a >= b && c !== d) || x === 0 ? 1 : 0
              if (fs !== ws) return `signed a=${a} b=${b} c=${c} d=${d} x=${x}`
              if (fu !== wu) return `unsigned a=${a} b=${b} c=${c} d=${d} x=${x}`
            }
      return null
    },
  },
  {
    id: "b17-3a",
    claim: "loop gives sum 5035, x = −6; if sets x = 1 exactly when x > y + 131075; A[131075] + 5",
    problem: () => {
      const m = newMachine()
      run(parse(codeBlock(S["3a"], "# sum = 0")), m)
      const loop = all(expectEq("sum", m.regs[16], 5035), expectEq("x", m.regs[17], -6))
      const ifSrc = codeBlock(S["3a"], "lui  $t0, 2")
      for (const [x, y] of [[200000, 10], [100, 10], [131086, 10], [131085, 10], [-5, -131081]]) {
        const k = newMachine({ s0: x, s1: y })
        run(parse(ifSrc), k)
        const want = x > y + 131075 ? 1 : x
        if (k.regs[16] !== want) return `x=${x}, y=${y}: got ${k.regs[16]}`
      }
      const base = 0x10010000
      const k = newMachine({ s2: base })
      storeWord(k.mem, base + 4 * 131075, 37)
      storeWord(k.mem, base + 4 * 131074, 999)
      run(parse(codeBlock(S["3a"], "lui  $t0, 8")), k)
      return all(loop, expectEq("x", k.regs[16], 42))
    },
  },
  {
    id: "b17-4a",
    claim: "1/7/8 bits, bias 63, range matches; −110.11 × 2^1 = 0xC2B0",
    problem: () => {
      const r = range(Q4_FMT)
      const e = encode(-0b11011 / 4 * 2, Q4_FMT)
      return all(expectEq("emin", r.emin, -62), expectEq("emax", r.emax, 63), expectEq("max", r.largest, (2 - 2 ** -8) * 2 ** 63), expectEq("bits", e.bits, "1100001010110000"), expectEq("rounded", e.rounded, false))
    },
  },
  {
    id: "b17-5",
    claim: "as written 2 stalls, 13 cycles; rearranged 0 stalls, 11 cycles",
    problem: () => {
      const b = simulate(B17_Q5_BEFORE, { forwarding: true })
      const a = simulate(B17_Q5_AFTER, { forwarding: true })
      return all(expectEq("before", [b.dataStalls, b.cycles], [2, 13]), expectEq("after", [a.dataStalls, a.cycles], [0, 11]))
    },
  },
  {
    id: "b17-6a",
    claim: "misses: direct mapped 5, two-way 5, four-way 4",
    problem: () => expectEq("misses", (["dm", "two", "four"] as const).map((k) => simulateCache(Q6A_CFG[k], Q6A_SEQ).misses), [5, 5, 4]),
  },
  {
    id: "b17-6b",
    claim: "tag 19 bits × 4096 = 77,824",
    problem: () => expectEq("tag bits", totalBits({ addressBits: 32, dataBytes: 4096 * 16, blockBytes: 16, ways: 8 }).tagBits, 77824),
  },
  {
    id: "b17-7a",
    claim: "2048 × 273 = 559,104 bits",
    problem: () => expectEq("total", totalBits({ addressBits: 32, dataBytes: 65536, blockBytes: 32, ways: 1 }).total, 559104),
  },
  {
    id: "b17-8a",
    claim: "control rows for add, sw, beq match the slides' table",
    problem: () =>
      all(
        expectEq("add", [CONTROL["R-format"].RegDst, CONTROL["R-format"].ALUSrc, CONTROL["R-format"].RegWrite], [1, 0, 1]),
        expectEq("sw", [CONTROL.sw.MemWrite, CONTROL.sw.ALUSrc, CONTROL.sw.RegWrite], [1, 1, 0]),
        expectEq("beq", [CONTROL.beq.Branch, CONTROL.beq.ALUSrc, CONTROL.beq.RegWrite], [1, 0, 0]),
      ),
  },
  {
    id: "b17-8c",
    claim: "sub → and via EX/MEM → EX, sub → or via MEM/WB → EX",
    problem: () => expectEq("paths", simulate(B17_Q8C, { forwarding: true }).forwards.map((f) => f.path), ["EX/MEM→EX", "MEM/WB→EX"]),
  },
]
