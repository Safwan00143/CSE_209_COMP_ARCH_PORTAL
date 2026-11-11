import { all, expectEq, type Fact } from "./types"
import { codeBlock } from "./extract"
import { simulate } from "@/lib/pipeline"
import { aluCheck } from "@/lib/alu"
import { totalBits } from "@/lib/cache"
import { decode, encode, fpAddSteps, SINGLE } from "@/lib/ieee"
import { assemble, call, parse } from "@/lib/mips"
import { B16_Q2B } from "@/figures/papers/b16"
import { b16Solutions as S, HALF, q4a, Q7A_SRC } from "../papers/b16-solutions"
import { b21Solutions } from "../papers/b21-solutions"

const n = (x: number) => 1 - x
const near = (a: number, b: number, t = 1e-3) => (Math.abs(a - b) <= t * Math.max(1, Math.abs(b)) ? null : `${a} ≠ ${b}`)

export const b16Checks: Fact[] = [
  { id: "b16-2a", claim: "reuses the 2022-23 Q5 solution", problem: () => (S["2a"] === b21Solutions["5"] ? null : "text differs") },
  {
    id: "b16-2b",
    claim: "branch in ID: 2 stalls; beq leaves WB in cycle 9",
    problem: () => {
      const r = simulate(B16_Q2B, { forwarding: true, branchIn: "ID" })
      return all(expectEq("stalls", r.dataStalls, 2), expectEq("beq WB", r.seq[2].wb, 9), expectEq("paths", r.forwards.map((f) => f.path), ["MEM/WB→EX", "EX/MEM→ID"]))
    },
  },
  {
    id: "b16-3b",
    claim: "VPN 26, PPN 22, entry 26 bits, table 208 MiB; TLB 128 sets → tag 19; cache tag 22, index 8, offset 6",
    problem: () => {
      const c = totalBits({ addressBits: 36, dataBytes: 16 * 1024, blockBytes: 64, ways: 1 })
      return all(expectEq("table MiB", (2 ** 26 * 26) / 8 / 2 ** 20, 208), expectEq("tlb tag", 26 - Math.log2(256 / 2), 19), expectEq("cache", [c.split.tag, c.split.index, c.split.offset], [22, 8, 6]))
    },
  },
  { id: "b16-3c", claim: "TLB reach 64 KB; 2 MB = 512 pages; 128 KB pages reach 2 MB", problem: () => all(expectEq("reach", 16 * 4, 64), expectEq("pages", 2048 / 4, 512), expectEq("big", 16 * 128, 2048)) },
  {
    id: "b16-4a",
    claim: "stalls 0.49 / 0.40 / 0.35; base CPI 1.51; times 840 / 802.2 / 576.6 ps",
    problem: () =>
      all(
        expectEq("stall", q4a.map((p) => p.stall), [0.49, 0.4, 0.35]),
        expectEq("base", q4a[0].base, 1.51),
        expectEq("time", q4a.map((p) => p.time), [840, 802.2, 576.6]),
      ),
  },
  {
    id: "b16-4a-c",
    claim: "16 KiB 2-way, 4-word blocks: tag 19, index 9, offset 4",
    problem: () => {
      const t = totalBits({ addressBits: 32, dataBytes: 16 * 1024, blockBytes: 16, ways: 2 })
      return expectEq("fields", [t.split.tag, t.split.index, t.split.offset], [19, 9, 4])
    },
  },
  {
    id: "b16-4b",
    claim: "overhead 15,360 / 16,384 / 25,600 bits; 1018 → tag 0, index 3, offset 250",
    problem: () => {
      const o = [1, 2, 1024].map((w) => {
        const t = totalBits({ addressBits: 32, dataBytes: 256 * 1024, blockBytes: 256, ways: w })
        return t.blocks * (t.split.tag + 1)
      })
      return all(expectEq("overhead", o, [15360, 16384, 25600]), expectEq("addr", [Math.floor(1018 / 256 / 1024), Math.floor(1018 / 256) % 1024, 1018 % 256], [0, 3, 250]))
    },
  },
  {
    id: "b16-5b",
    claim: "−1.25 = 0xBA00, 0.375 = 0x2C00 (1/4/11, bias 7)",
    problem: () => expectEq("bits", [encode(-1.25, HALF).bits, encode(0.375, HALF).bits], ["1011101000000000", "0010110000000000"]),
  },
  {
    id: "b16-5c",
    claim: "0xDF807500 = −1.003570556640625 × 2^64",
    problem: () => {
      const d = decode("0xDF807500", SINGLE)
      return d.kind === "normal" ? all(expectEq("e", d.e, 64), expectEq("value", d.value, -1.003570556640625 * 2 ** 64)) : "not normal"
    },
  },
  {
    id: "b16-5d",
    claim: "X, Y, Z equations give all 8 operations",
    problem: () =>
      aluCheck(
        {
          bits: 4,
          selBits: 3,
          X: ([s2, s1, s0], a, b) => a | (s2 & s1 & n(s0) & n(b)) | (s2 & s1 & s0 & b),
          Y: ([, s1, s0], _a, b) => (n(s1) & b) | (n(s1) & s0) | (s1 & n(s0) & n(b)),
          Z: ([s2], c) => n(s2) & c,
          cin: ([s2, , s0]) => n(s2) & s0,
        },
        { "000": (A, B) => A + B, "001": (A) => A, "010": (A, B) => A + (~B & 15), "011": (A) => A + 1, "100": (A, B) => A ^ B, "101": (A) => ~A, "110": (A, B) => A & B, "111": (A, B) => A | B },
      )[0] ?? null,
  },
  {
    id: "b16-7a",
    claim: "machine code fields at 60000 (beq offset 1, jumps 15007 / 15000)",
    problem: () =>
      expectEq(
        "fields",
        assemble(parse(Q7A_SRC), 60000).slice(0, 7).map((x) => x.enc.fields.map((f) => f[1])),
        [[0, 0, 18, 9, 2, 0], [0, 9, 22, 9, 0, 32], [35, 9, 8, 0], [4, 8, 21, 1], [2, 15007], [8, 18, 18, 1], [2, 15000]],
      ),
  },
  {
    id: "b16-7b",
    claim: "512M cycles, 0.128 s; FP CPI 0.4; L/S impossible; 459.3M cycles, −10.29%",
    problem: () => {
      const c0 = 160 * 2 + 110 + 50 + 32
      const c4 = 160 * 1.6 + 110 * 1.15 + 10 * 4 + 16 * 2.3
      return all(expectEq("c0", c0, 512), near(c0 / 4000, 0.128), near((256 - 192) / 160, 0.4), 512 - 50 > 256 ? null : "L/S possible", near(c4, 459.3), near(((c0 - c4) / c0) * 100, 10.29))
    },
  },
  {
    id: "b16-8a",
    claim: "as printed returns 0; with base case 1 returns a^b for small cases; preserves $sp",
    problem: () => {
      const src = codeBlock(S["8a"], "fun:")
      const fixed = src.replace("add  $v0, $zero, $zero", "addi $v0, $zero, 1")
      if (fixed === src) return "base-case line not found"
      for (const [a, b] of [[3, 5], [2, 10], [5, 0], [7, 1], [-2, 3], [1, 31]]) {
        if (call(src, "fun", [a, b]).v0 !== 0) return `printed fun(${a},${b}) ≠ 0`
        const v = call(fixed, "fun", [a, b]).v0
        if (v !== (a ** b | 0)) return `fixed fun(${a},${b}) = ${v}`
      }
      return null
    },
  },
  {
    id: "b16-8b",
    claim: "0.5 + (−0.4375) = 1.000 × 2^−4 in 4 significant bits",
    problem: () => {
      const r = fpAddSteps(0.5, -0.4375, { expBits: 8, fracBits: 3 })
      return all(expectEq("result", r.result, 0.0625), expectEq("e", r.steps[r.steps.length - 1].e, -4))
    },
  },
  {
    id: "b16-8c",
    claim: "hex: offset 44351 does not fit; decimal: 6374 fits; j reaches 0x30500",
    problem: () => {
      let threw = false
      try {
        assemble(parse("beq $s0, $s1, 0x30500"), 0x5000)
      } catch {
        threw = true
      }
      const dec = assemble(parse("beq $s0, $s1, 30500"), 5000)[0].enc.fields[3][1]
      const j = assemble(parse("j 0x30500"), 0x5004)[0].enc.fields[1][1]
      return all(threw ? null : "hex branch encoded", expectEq("hex offset", (0x30500 - 0x5004) / 4, 44351), expectEq("dec", dec, 6374), expectEq("j", j, 0x30500 / 4))
    },
  },
]
