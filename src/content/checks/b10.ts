import { all, expectEq, type Fact } from "./types"
import { codeBlock } from "./extract"
import { simulateCache } from "@/lib/cache"
import { assemble, newMachine, parse, run, storeWord } from "@/lib/mips"
import { bitIn, STATES } from "@/lib/multicycle"
import { b10Solutions as S, Q1C_SRC, Q6D_CFG, Q6D_SEQ, SWITCH_SRC } from "../papers/b10-solutions"
import { b16Solutions } from "../papers/b16-solutions"

const near = (a: number, b: number, t = 1e-3) => (Math.abs(a - b) <= t * Math.max(1, Math.abs(b)) ? null : `${a} ≠ ${b}`)

export const b10Checks: Fact[] = [
  { id: "b10-2", claim: "Q2 reuses the 2018-19 Q1(a) answer", problem: () => (S["2"].endsWith(b16Solutions["1a"]) ? null : "text differs") },
  {
    id: "b10-1a",
    claim: "jump-table switch picks the right case for k = 0…3 and skips k outside 0…3",
    problem: () => {
      const prog = parse(SWITCH_SRC.replace(/^Exit:$/m, "Exit:   nop"))
      const labelAddr = (l: string) => 0x00400000 + 4 * prog.labels[l] // run()'s default text base
      const table = 0x4000
      const vals = { s1: 10, s2: 3, s3: 100, s4: 7 }
      const want = [107, 13, 7, 93]
      for (let k = -1; k <= 4; k++) {
        const m = newMachine({ ...vals, s0: -1, s5: k, t4: table })
        ;["L0", "L1", "L2", "L3"].forEach((l, i) => storeWord(m.mem, table + 4 * i, labelAddr(l)))
        run(prog, m)
        const w = k >= 0 && k <= 3 ? want[k] : -1
        if (m.regs[16] !== w) return `k = ${k}: f = ${m.regs[16]}, want ${w}`
      }
      return null
    },
  },
  {
    id: "b10-1b",
    claim: "lui 61 + ori 2304 = 0x003D0900 = 4,000,000",
    problem: () => {
      const m = newMachine()
      run(parse(codeBlock(S["1b"], "lui $s0, 61")), m)
      return all(expectEq("s0", m.regs[16], 0x003d0900), expectEq("dec", 0x003d0900, 4000000))
    },
  },
  {
    id: "b10-1c",
    claim: "bne offset 2, j address 20000",
    problem: () => {
      const a = assemble(parse(Q1C_SRC), 80000)
      return all(expectEq("bne", a[3].enc.fields[3][1], 2), expectEq("j", a[5].enc.fields[1][1], 20000))
    },
  },
  {
    id: "b10-3d",
    claim: "PCWriteCond and PCSource0 are 1 in exactly the same states (state 8)",
    problem: () => {
      const a = STATES.map((s) => bitIn(s, "PCWriteCond"))
      const b = STATES.map((s) => bitIn(s, "PCSource0"))
      return all(expectEq("same", a, b), expectEq("where", a.flatMap((v, i) => (v ? [i] : [])), [8]))
    },
  },
  { id: "b10-5a", claim: "4 + 2 + 0.005 + 0.2 = 6.205 ms", problem: () => near(4 + (0.5 / 250) * 1000 + (512 / 100e6) * 1000 + 0.2, 6.205) },
  { id: "b10-6a", claim: "4.76%; INT −52.5%; branch alone cannot save 42 s", problem: () => all(near((10 / 210) * 100, 4.7619), near(42 / 80, 0.525), 30 < 42 ? null : "possible") },
  {
    id: "b10-6d",
    claim: "0x1000 and 0x2000 both index 0: 200 misses, 2 compulsory, 198 conflict",
    problem: () => {
      const r = simulateCache(Q6D_CFG, Q6D_SEQ)
      return all(expectEq("misses", r.misses, 200), expectEq("idx", [(0x1000 >> 5) % 32, (0x2000 >> 5) % 32], [0, 0]), expectEq("2-way", simulateCache({ sets: 16, ways: 2, blockBytes: 32 }, Q6D_SEQ).misses, 2))
    },
  },
  { id: "b10-7b", claim: "128 lines: 64 / 32 / 16 sets", problem: () => expectEq("sets", [2, 4, 8].map((w) => 16384 / 128 / w), [64, 32, 16]) },
  { id: "b10-7c", claim: "CPI 6.0 / 6.4 / 4.4", problem: () => all(near(2 + 0.04 * 100, 6), near(2 + 0.04 * 10 + 0.04 * 100, 6.4), near(2 + 0.04 * 20 + 0.016 * 100, 4.4)) },
  { id: "b10-7d", claim: "65 vs 20 bus cycles", problem: () => all(expectEq("narrow", 1 + 4 * 15 + 4, 65), expectEq("interleaved", 1 + 15 + 4, 20)) },
]
