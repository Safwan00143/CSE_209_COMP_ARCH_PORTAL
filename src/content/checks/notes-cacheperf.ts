import { all, expectEq, type Fact } from "./types"

const near = (a: number, b: number, t = 1e-9) => (Math.abs(a - b) <= t ? null : `${a} ≠ ${b}`)

export const cachePerfNoteChecks: Fact[] = [
  {
    id: "note-cp-slide34",
    claim: "CPI 2 + 2 + 1.44 = 5.44; 2.72× ; 63%",
    problem: () => {
      const i = 0.02 * 100
      const d = 0.36 * 0.04 * 100
      const cpi = 2 + i + d
      return all(expectEq("i", i, 2), near(d, 1.44), near(cpi, 5.44), near(cpi / 2, 2.72), near((i + d) / cpi, 0.632, 1e-3))
    },
  },
  { id: "note-cp-slide35", claim: "CPI 4.44; stalls 77%", problem: () => all(near(1 + 2 + 1.44, 4.44), near(3.44 / 4.44, 0.775, 1e-3)) },
  { id: "note-cp-amat", claim: "AMAT = 1 + 0.05 × 20 = 2 cycles", problem: () => expectEq("amat", 1 + 0.05 * 20, 2) },
  {
    id: "note-cp-multilevel",
    claim: "4 GHz, 100 ns: 400 cycles, CPI 9; with L2 (5 ns, 0.5%): CPI 3.4, ratio 2.6",
    problem: () => {
      const tc = 1 / 4
      const pen = 100 / tc
      const l2 = 5 / tc
      const one = 1 + 0.02 * pen
      const two = 1 + 0.02 * l2 + 0.005 * pen
      return all(expectEq("pen", pen, 400), expectEq("l2", l2, 20), expectEq("one", one, 9), near(two, 3.4), near(one / two, 2.647, 1e-3))
    },
  },
]
