import { all, expectEq, type Fact } from "./types"
import { ipc, scheduleProblems, sameResult } from "@/lib/dualissue"
import { LOOP, SCHED, UNROLLED } from "../notes/multiple-issue"

export const multiNoteChecks: Fact[] = [
  {
    id: "note-mi-sched",
    claim: "slide 95 schedule: legal, same result as the loop, IPC = 5/4 = 1.25",
    problem: () => all(scheduleProblems(SCHED)[0] ?? null, sameResult(LOOP, SCHED, 6), expectEq("ipc", ipc(SCHED).ipc, 1.25)),
  },
  {
    id: "note-mi-unrolled",
    claim: "slide 97 unrolled schedule (typo fixed): legal, same result for 8 elements, IPC = 14/8 = 1.75",
    problem: () => all(scheduleProblems(UNROLLED)[0] ?? null, sameResult(LOOP, UNROLLED, 8), expectEq("ipc", ipc(UNROLLED).ipc, 1.75)),
  },
  {
    id: "note-mi-typo-caught",
    claim: "the slide's printed `addu $t3, $t4, $s2` gives a wrong result",
    problem: () => {
      const bad = UNROLLED.map((p) => p.map((s) => s.replace("addu $t3, $t3, $s2", "addu $t3, $t4, $s2"))) as typeof UNROLLED
      return sameResult(LOOP, bad, 8) ? null : "the typo version still matched"
    },
  },
  {
    id: "note-mi-bad-schedule-caught",
    claim: "using the load in the next packet is rejected",
    problem: () => (scheduleProblems([["nop", "Loop: lw $t0, 0($s1)"], ["addu $t0, $t0, $s2", "nop"]]).length ? null : "load-use in the next packet accepted"),
  },
  { id: "note-mi-bips", claim: "4 GHz 4-way: 16 BIPS, CPI 0.25", problem: () => all(expectEq("bips", 4e9 * 4, 16e9), expectEq("cpi", 1 / 4, 0.25)) },
]
