import { all, expectEq, type Fact } from "./types"
import { codeBlock } from "./extract"
import { simulateCache } from "@/lib/cache"
import { newMachine, parse, run } from "@/lib/mips"
import { b13Solutions as S, q1c, Q4C_CFG, Q4C_SEQS } from "../papers/b13-solutions"
import { b14Solutions } from "../papers/b14-solutions"
import { b15Solutions } from "../papers/b15-solutions"
import { b16Solutions } from "../papers/b16-solutions"
import { b19Solutions } from "../papers/b19-solutions"
import { b21Solutions } from "../papers/b21-solutions"
import { b22Solutions } from "../papers/b22-solutions"

const near = (a: number, b: number, t = 1e-3) => (Math.abs(a - b) <= t * Math.max(1, Math.abs(b)) ? null : `${a} ≠ ${b}`)

export const b13Checks: Fact[] = [
  {
    id: "b13-reuse",
    claim: "repeated questions reuse the earlier worked solutions",
    problem: () =>
      all(
        S["2d"] === b21Solutions["1c"] ? null : "2d",
        S["2e"] === b15Solutions["1d"] ? null : "2e",
        S["3c"] === b19Solutions["3b"] ? null : "3c",
        S["3d"] === b22Solutions["3a"] ? null : "3d",
        S["4b"] === b22Solutions["2b"] ? null : "4b",
        S["6a"] === b16Solutions["8b"] ? null : "6a",
        S["6b"] === b16Solutions["6a"] ? null : "6b",
        S["7c"] === b16Solutions["7c"] ? null : "7c",
        S["3a"].startsWith(b15Solutions["2a"]) ? null : "3a",
        S["6c"].includes(b14Solutions["6b"].slice(b14Solutions["6b"].indexOf("**MIPS support:"))) ? null : "6c",
      ),
  },
  {
    id: "b13-1a",
    claim: "IPS 2e9 / 2.5e9 / 1.82e9; new clock = 1.2/0.7 × old",
    problem: () => all(near(3e9 / 1.5, 2e9), near(2.5e9 / 1, 2.5e9), near(4e9 / 2.2, 1.818e9), near(1.2 / 0.7, 1.714)),
  },
  {
    id: "b13-1b",
    claim: "1350 cycles, 337.5 ns, CPI 1.93; half loads: 1100 cycles, speed-up 1.227, CPI 1.69",
    problem: () => all(expectEq("c", 500 + 250 + 500 + 100, 1350), near(1350 / 4, 337.5), near(1350 / 700, 1.9286), near(1350 / 1100, 1.2273), near(1100 / 650, 1.6923)),
  },
  {
    id: "b13-1c",
    claim: "9.6 / 7.04 / 3.84 s; doubled arithmetic 10.88 / 7.95 / 4.30 s; CPI_LS 3",
    problem: () =>
      all(
        near(q1c(1).time, 9.6),
        near(q1c(2).time, 7.04),
        near(q1c(4).time, 3.84),
        near(q1c(1, 2).time, 10.88),
        near(q1c(2, 2).time, 7.9543),
        near(q1c(4, 2).time, 4.2971),
        near(q1c(1, 1, 3).time, q1c(4).time),
      ),
  },
  { id: "b13-2a", claim: "MIPS 4000 vs 3636; 2.5 s vs 2.2 s", problem: () => all(near(4e9 / 1e6, 4000), near(4e9 / 1.1e6, 3636.36), near(10 / 4, 2.5), near((8 * 1.1) / 4, 2.2)) },
  { id: "b13-2b", claim: "2400/1400 ≈ 1.71; 2,000,003 lw ≈ 4.00", problem: () => all(near(2400 / 1400, 1.7143), near((2000003 * 800) / (2000007 * 200), 3.99999)) },
  { id: "b13-4a", claim: "stalls 3 + 2 = 5; CPI 7; 3.5×; 71.4%", problem: () => all(near(0.03 * 100 + 0.4 * 0.05 * 100, 5), near(7 / 2, 3.5), near(5 / 7, 0.7143)) },
  {
    id: "b13-4c",
    claim: "misses: seq 1 FA 9, 2-way 9, DM 9; seq 2 FA 3, 2-way 6, DM 5",
    problem: () =>
      expectEq(
        "misses",
        Q4C_SEQS.map((s) => (["fa", "two", "dm"] as const).map((k) => simulateCache(Q4C_CFG[k], s).misses)),
        [
          [9, 9, 9],
          [3, 6, 5],
        ],
      ),
  },
  { id: "b13-4d", claim: "CPI 13 → 5.6, ≈ 2.32×", problem: () => all(near(1 + 0.03 * 400, 13), near(1 + 0.03 * 20 + 0.01 * 400, 5.6), near(13 / 5.6, 2.3214)) },
  {
    id: "b13-5a",
    claim: "rstrcopy copies strings including the terminator",
    problem: () => {
      const src = codeBlock(S["5a"], "rstrcopy:")
      for (const str of ["abc", "", "hello world", "x"]) {
        const m = newMachine({ a0: 0x2000, a1: 0x1000, ra: 0 })
        ;[...str].forEach((c, i) => m.mem.set(0x1000 + i, c.charCodeAt(0)))
        m.mem.set(0x1000 + str.length, 0)
        for (let i = 0; i <= str.length + 2; i++) m.mem.set(0x2000 + i, 0x55)
        run(parse(src), m)
        const out = Array.from({ length: str.length + 1 }, (_, i) => m.mem.get(0x2000 + i))
        const want = [...[...str].map((c) => c.charCodeAt(0)), 0]
        if (out.join() !== want.join()) return `"${str}": got ${out}`
        if (m.mem.get(0x2000 + str.length + 1) !== 0x55) return `"${str}": wrote past the terminator`
      }
      return null
    },
  },
  {
    id: "b13-5b",
    claim: "lui 4157 + ori 2304 = 0x103D0900",
    problem: () => {
      const m = newMachine()
      run(parse(codeBlock(S["5b"], "lui $s0, 4157")), m)
      return expectEq("s0", m.regs[16] >>> 0, 0b00010000001111010000100100000000)
    },
  },
]
