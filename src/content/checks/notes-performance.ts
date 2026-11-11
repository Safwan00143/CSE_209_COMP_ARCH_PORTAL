import { all, expectEq, type Fact } from "./types"

const close = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b))

export const performanceNoteChecks: Fact[] = [
  { id: "note-perf-relative", claim: "10 s vs 15 s: A is 1.5× faster", problem: () => expectEq("ratio", 15 / 10, 1.5) },
  { id: "note-perf-period", claim: "4 GHz ↔ 250 ps", problem: () => expectEq("Tc (ps)", 1e12 / 4e9, 250) },
  {
    id: "note-perf-clockB",
    claim: "B's clock must be 4 GHz",
    problem: () => {
      const cyclesA = 10 * 2e9
      const cyclesB = 1.2 * cyclesA
      return all(expectEq("cycles A", cyclesA, 20e9), expectEq("cycles B", cyclesB, 24e9), expectEq("rate B", cyclesB / 6, 4e9))
    },
  },
  { id: "note-perf-cpi-ab", claim: "500I vs 600I ps: A 1.2× faster", problem: () => all(expectEq("A", 2.0 * 250, 500), expectEq("B", 1.2 * 500, 600), expectEq("ratio", (1.2 * 500) / (2.0 * 250), 1.2)) },
  {
    id: "note-perf-sequences",
    claim: "sequence 1: 10 cycles CPI 2.0; sequence 2: 9 cycles CPI 1.5",
    problem: () => {
      const cpi = [1, 2, 3]
      const s1 = [2, 1, 2]
      const s2 = [4, 1, 1]
      const cyc = (s: number[]) => s.reduce((t, n, i) => t + n * cpi[i], 0)
      const ic = (s: number[]) => s.reduce((a, b) => a + b, 0)
      return all(expectEq("c1", cyc(s1), 10), expectEq("cpi1", cyc(s1) / ic(s1), 2), expectEq("c2", cyc(s2), 9), expectEq("cpi2", cyc(s2) / ic(s2), 1.5))
    },
  },
  {
    id: "note-perf-amdahl",
    claim: "multiply 80 of 100 s: 5× overall impossible",
    problem: () => (80 / 1e12 + 20 > 100 / 5 ? null : "a huge multiply speed-up reaches the 20 s target"),
  },
  {
    id: "note-perf-mips",
    claim: "MIPS 4000 vs ≈3636; times 2.5 s vs 2.2 s; B ≈1.14× faster",
    problem: () =>
      all(
        expectEq("mipsA", 4e9 / 1e6, 4000),
        close(4e9 / 1.1e6, 3636.36, 1e-4) ? null : "mipsB",
        expectEq("tA", (10e9 * 1.0) / 4e9, 2.5),
        expectEq("tB", (8e9 * 1.1) / 4e9, 2.2),
        close(2.5 / 2.2, 1.136, 1e-3) ? null : "ratio",
      ),
  },
]
