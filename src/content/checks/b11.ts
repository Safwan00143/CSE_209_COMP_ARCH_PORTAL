import { all, expectEq, type Fact } from "./types"
import { codeBlock } from "./extract"
import { simulate } from "@/lib/pipeline"
import { simulateCache } from "@/lib/cache"
import { encode, SINGLE } from "@/lib/ieee"
import { assemble, call, loadWord, newMachine, parse, run, storeWord } from "@/lib/mips"
import { b11Solutions as S, Q1B_CFG, Q1B_SEQ, Q6B_SRC } from "../papers/b11-solutions"
import { b13Solutions } from "../papers/b13-solutions"
import { b16Solutions } from "../papers/b16-solutions"
import { b17Solutions } from "../papers/b17-solutions"
import { b19Solutions } from "../papers/b19-solutions"

const near = (a: number, b: number, t = 1e-3) => (Math.abs(a - b) <= t * Math.max(1, Math.abs(b)) ? null : `${a} ≠ ${b}`)

export const b11Checks: Fact[] = [
  {
    id: "b11-reuse",
    claim: "repeated questions reuse the earlier worked solutions",
    problem: () =>
      all(
        S["2e"] === b17Solutions["7c"] ? null : "2e",
        S["3a"] === b16Solutions["8b"] ? null : "3a",
        S["5d"] === b13Solutions["2a"] ? null : "5d",
        S["7b"] === b16Solutions["6a"] ? null : "7b",
        S["8a"] === b13Solutions["2c"] ? null : "8a",
        S["8c"] === b19Solutions["1c"] ? null : "8c",
        S["8d"] === b19Solutions["1d"] ? null : "8d",
      ),
  },
  { id: "b11-1b", claim: "2-way, 4 blocks, 0,2,4 ×3: 0 hits", problem: () => expectEq("hits", simulateCache(Q1B_CFG, Q1B_SEQ).hits, 0) },
  { id: "b11-1e", claim: "tag = 32 − n − m − 2; n = 10, m = 0 gives 20", problem: () => expectEq("tag", 32 - 10 - 0 - 2, 20) },
  { id: "b11-2d", claim: "2^19 entries × 4 B = 2 MB", problem: () => all(expectEq("entries", 2 ** 32 / 2 ** 13, 524288), expectEq("bytes", 524288 * 4, 2 * 2 ** 20)) },
  { id: "b11-3b", claim: "−0.75 = 0xBF400000", problem: () => expectEq("hex", parseInt(encode(-0.75, SINGLE).bits, 2).toString(16), "bf400000") },
  {
    id: "b11-5b",
    claim: "P1 560 cycles, 186.67 ns, CPI 2.8; P2 400 cycles, 200 ns, CPI 2",
    problem: () => all(expectEq("c1", 20 + 80 + 300 + 160, 560), expectEq("c2", 400, 400), near(560 / 3, 186.667), near(200 / (560 / 3), 1.0714)),
  },
  { id: "b11-5c", claim: "80/n + 20 = 25 → n = 16", problem: () => expectEq("n", 80 / (25 - 20), 16) },
  {
    id: "b11-6b",
    claim: "A[3] = A[1] − A[2]: fields 35 16 8 4 / 35 16 9 8 / 0 8 9 8 0 34 / 43 16 8 12; and it runs",
    problem: () => {
      const fields = assemble(parse(Q6B_SRC), 0).map((x) => x.enc.fields.map((f) => f[1]))
      const m = newMachine({ s0: 0x1000 })
      ;[10, 30, 7, 0].forEach((v, i) => storeWord(m.mem, 0x1000 + 4 * i, v))
      run(parse(codeBlock(S["6b"], "A[1] - A[2]")), m)
      return all(expectEq("fields", fields, [[35, 16, 8, 4], [35, 16, 9, 8], [0, 8, 9, 8, 0, 34], [43, 16, 8, 12]]), expectEq("A[3]", loadWord(m.mem, 0x100c), 23))
    },
  },
  {
    id: "b11-6c",
    claim: "sum(n) = n(n+1)/2 for n > 0, 0 for n ≤ 0",
    problem: () => {
      const src = codeBlock(S["6c"], "sum:")
      for (const n of [-2, 0, 1, 3, 10]) {
        const v = call(src, "sum", [n]).v0
        if (v !== (n <= 0 ? 0 : (n * (n + 1)) / 2)) return `sum(${n}) = ${v}`
      }
      return null
    },
  },
  {
    id: "b11-7a",
    claim: "ll/sc loop stores X into A[0] and leaves the old value in $t1",
    problem: () => {
      const m = newMachine({ s1: 0x2000, s2: 77 })
      storeWord(m.mem, 0x2000, 5)
      run(parse(codeBlock(S["7a"], "try:")), m)
      return all(expectEq("A[0]", loadWord(m.mem, 0x2000), 77), expectEq("old", m.regs[9], 5))
    },
  },
  { id: "b11-7d", claim: "800/200 ps: 1.714; +1,000,000 lw ≈ 3.99998", problem: () => all(near(2400 / 1400, 1.7143), near((1000003 * 800) / (1000007 * 200), 3.99998)) },
  {
    id: "b11-8b",
    claim: "3 hazards; with forwarding 1 stall, 9 cycles; reordered 0 stalls, 8 cycles",
    problem: () => {
      const orig = "add $s0, $t0, $t1\nsub $t2, $s0, $t3\nlw $s1, 20($t1)\nsub $t4, $s1, $t2"
      const o = simulate(orig, { forwarding: true })
      const r = simulate(codeBlock(S["8b"], "# moved up"), { forwarding: true })
      return all(
        expectEq("orig", [o.dataStalls, o.cycles], [1, 9]),
        expectEq("paths", o.forwards.map((f) => f.path), ["EX/MEM→EX", "MEM/WB→EX", "register file"]),
        expectEq("reordered", [r.dataStalls, r.cycles], [0, 8]),
      )
    },
  },
]
