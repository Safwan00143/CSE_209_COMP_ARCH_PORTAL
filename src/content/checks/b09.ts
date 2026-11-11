import { all, expectEq, type Fact } from "./types"
import { codeBlock } from "./extract"
import { simulate } from "@/lib/pipeline"
import { simulateCache, totalBits } from "@/lib/cache"
import { b09Solutions as S, q4e, Q5C_CFG, Q5C_SEQ } from "../papers/b09-solutions"
import { b11Solutions } from "../papers/b11-solutions"
import { b16Solutions } from "../papers/b16-solutions"

const near = (a: number, b: number, t = 1e-3) => (Math.abs(a - b) <= t * Math.max(1, Math.abs(b)) ? null : `${a} ≠ ${b}`)

export const b09Checks: Fact[] = [
  {
    id: "b09-reuse",
    claim: "repeated questions reuse the earlier worked solutions",
    problem: () => all(S["2c"] === b11Solutions["6d"] ? null : "2c", S["2d"] === b16Solutions["6a"] ? null : "2d", S["5a"] === b16Solutions["8b"] ? null : "5a"),
  },
  { id: "b09-1c", claim: "A 500 ps, B 600 ps per instruction: A 1.2× faster", problem: () => all(expectEq("A", 250 * 2, 500), near(500 * 1.2, 600), near(600 / 500, 1.2)) },
  { id: "b09-1d", claim: "5/5 + 5 = 6 s; speed-up 1.67", problem: () => all(expectEq("t", 5 / 5 + 5, 6), near(10 / 6, 1.6667)) },
  {
    id: "b09-4d",
    claim: "no forwarding: 2 stalls; with 2 nops no hazard remains",
    problem: () => {
      const orig = simulate("lw $1, 40($6)\nadd $6, $2, $2\nsw $6, 50($1)", { forwarding: false })
      const nops = simulate(codeBlock(S["4d"], "nop"), { forwarding: false })
      return all(expectEq("stalls", orig.dataStalls, 2), expectEq("with nops", nops.dataStalls, 0), expectEq("cycles", nops.cycles, orig.cycles))
    },
  },
  {
    id: "b09-4e",
    claim: "2-bit from SN on T,T,NT,T: 0/4 first pass, then 3/4 in steady state",
    problem: () => expectEq("correct", q4e.map((r) => r.correct), [0, 3, 3, 3]),
  },
  {
    id: "b09-5c",
    claim: "misses: fully associative 5, two-way 5, direct mapped 6",
    problem: () => expectEq("misses", (["fa", "two", "dm"] as const).map((k) => simulateCache(Q5C_CFG[k], Q5C_SEQ).misses), [5, 5, 6]),
  },
  {
    id: "b09-6b",
    claim: "with 36% loads/stores: stalls 8 + 5.76; CPI 19.76; 3.29×",
    problem: () => {
      const st = 0.02 * 400 + 0.36 * 0.04 * 400
      return all(near(st, 13.76), near((6 + st) / 6, 3.2933))
    },
  },
  { id: "b09-7a", claim: "VPN 20, PPN 18; table 2^20 × 4 B = 4 MB", problem: () => all(expectEq("vpn", 32 - 12, 20), expectEq("ppn", 30 - 12, 18), expectEq("size", 2 ** 20 * 4, 4 * 2 ** 20)) },
  {
    id: "b09-8a",
    claim: "tag 16 × 16K = 262,144; 145 bits/block; 2,375,680 bits = 290 KiB",
    problem: () => {
      const t = totalBits({ addressBits: 32, dataBytes: 16 * 1024 * 16, blockBytes: 16, ways: 4 })
      return all(expectEq("tag", t.split.tag, 16), expectEq("tagBits", t.tagBits, 262144), expectEq("total", t.total, 2375680), expectEq("KiB", t.total / 8 / 1024, 290))
    },
  },
]
