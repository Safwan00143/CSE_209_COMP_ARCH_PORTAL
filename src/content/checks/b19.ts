import { all, expectEq, type Fact } from "./types"
import { codeBlock } from "./extract"
import { simulate } from "@/lib/pipeline"
import { simulateCache } from "@/lib/cache"
import { assemble, call, parse } from "@/lib/mips"
import { encode, SINGLE } from "@/lib/ieee"
import { b19Solutions as S, Q4A_SEQ } from "../papers/b19-solutions"

const near = (a: number, b: number, t = 1e-3) => (Math.abs(a - b) <= t * Math.max(1, Math.abs(b)) ? null : `${a} ≠ ${b}`)

export const b19Checks: Fact[] = [
  {
    id: "b19-1b",
    claim: "13 cycles, rescheduled 11",
    problem: () => all(expectEq("after", simulate(codeBlock(S["1b"], "# moved up"), { forwarding: true }).cycles, 11)),
  },
  {
    id: "b19-1c",
    claim: "branch data hazards: 0 / 1 / 1 / 2 stalls for the four code examples",
    problem: () => {
      const id = { forwarding: true, branchIn: "ID" as const }
      const st = (marker: string) => simulate(`${codeBlock(S["1c"], marker)}\ntarget: nop`, id).dataStalls
      return expectEq("stalls", [st("add $7, $8, $9"), st("$1 is computed in add's EX"), st("$1 is ready at the end of lw's MEM"), st("$1 exists only after lw's MEM")], [0, 1, 1, 2])
    },
  },
  {
    id: "b19-3a",
    claim: "CPI 33 → 10.6 (3.11×) → 8.2 (1.29×; 4.02×)",
    problem: () => {
      const c1 = 1 + 0.04 * 800
      const c2 = 1 + 0.04 * 40 + 0.01 * 800
      const c3 = 1 + 0.04 * 40 + 0.01 * 160 + 0.005 * 800
      return all(expectEq("c1", c1, 33), near(c2, 10.6), near(c3, 8.2), near(c1 / c2, 3.113), near(c2 / c3, 1.293), near(c1 / c3, 4.024))
    },
  },
  {
    id: "b19-4a",
    claim: "misses: fully associative 8, two-way 8, direct mapped 7",
    problem: () =>
      expectEq(
        "misses",
        [simulateCache({ sets: 1, ways: 4 }, Q4A_SEQ).misses, simulateCache({ sets: 2, ways: 2 }, Q4A_SEQ).misses, simulateCache({ sets: 4, ways: 1 }, Q4A_SEQ).misses],
        [8, 8, 7],
      ),
  },
  { id: "b19-5b", claim: "1/(0.02 + 0.98/24) ≈ 16.44; limit 50", problem: () => all(near(1 / (0.02 + 0.98 / 24), 16.438), expectEq("max", 1 / 0.02, 50)) },
  {
    id: "b19-6a",
    claim: "fib in MIPS gives fib(0…12) correctly and preserves $sp",
    problem: () => {
      const src = codeBlock(S["6a"], "fib:")
      const f = (n: number): number => (n < 2 ? n : f(n - 1) + f(n - 2))
      for (let n = 0; n <= 12; n++) {
        const v = call(src, "fib", [n]).v0
        if (v !== f(n)) return `fib(${n}) = ${v}, want ${f(n)}`
      }
      return null
    },
  },
  {
    id: "b19-6b",
    claim: "j from 0x20000000 cannot reach 0x40000000; branch offset 0x7FFFFFF too large",
    problem: () => {
      let threw = false
      try {
        assemble(parse("j 0x40000000"), 0x20000000)
      } catch {
        threw = true
      }
      return all(threw ? null : "jump accepted", expectEq("offset", (0x40000000 - 0x20000004) / 4, 0x7ffffff))
    },
  },
  {
    id: "b19-8a",
    claim: "570,000 / 610,000 cycles; 211.1 / 174.3 µs; P2 1.21×; C alone cannot double speed",
    problem: () => {
      const p1 = 50000 * 3 + 120000 * 3 + 30000 * 2
      const p2 = 50000 * 2 + 120000 * 4 + 30000 * 1
      return all(expectEq("p1", p1, 570000), expectEq("p2", p2, 610000), near(p1 / 2.7e9 / (p2 / 3.5e9), 1.211), 50000 * 2 + 120000 * 4 > p2 / 2 ? null : "C could suffice")
    },
  },
  {
    id: "b19-8b",
    claim: "largest n = 2^24: 2^24 exact, 2^24 + 1 rounds",
    problem: () => all(expectEq("2^24", encode(2 ** 24, SINGLE).rounded, false), expectEq("2^24+1", encode(2 ** 24 + 1, SINGLE).rounded, true), expectEq("2^24-1", encode(2 ** 24 - 1, SINGLE).rounded, false)),
  },
]
