import { all, expectEq, type Fact } from "./types"
import { codeBlock } from "./extract"
import { simulate } from "@/lib/pipeline"
import { oneBit, runPredictor, twoBitPredictor, type Outcome } from "@/lib/predictor"
import { SRC } from "@/figures/notes-pipe"
import { branchHazardsNote as note } from "../notes/branch-hazards"

const ID = { forwarding: true, branchIn: "ID" as const }

export const branchNoteChecks: Fact[] = [
  {
    id: "note-bh-penalties",
    claim: "taken branch costs 1 cycle decided in ID, 3 decided in MEM",
    problem: () => {
      const src = "beq $1, $2, L\nadd $3, $3, $3\nadd $4, $4, $4\nadd $5, $5, $5\nL: add $6, $6, $6"
      const id = simulate(src, { ...ID, outcomes: [true] })
      const mem = simulate(src, { forwarding: true, branchIn: "MEM", outcomes: [true] })
      return all(expectEq("ID", id.controlStalls, 1), expectEq("MEM", mem.controlStalls, 3), expectEq("ID cycles", id.cycles, 2 + 4 + 1))
    },
  },
  {
    id: "note-bh-data-table",
    claim: "branch data hazards: 0 / 1 / 1 / 2 stalls (figures and the note's code)",
    problem: () => {
      const blocks = codeBlock(note, "# no stall: $1 from the 2nd").split(/\n\s*\n/)
      const stalls = blocks.map((b) => simulate(`${b}\ntarget: nop`, ID).dataStalls)
      return all(
        expectEq("note code", stalls, [0, 1, 1, 2]),
        expectEq("fig alu2", simulate(SRC.brAlu2.replace("add $1, $2, $3\n", "add $1, $2, $3\nadd $7, $8, $9\n"), ID).dataStalls, 0),
        expectEq("fig alu1", simulate(SRC.brAlu1, ID).dataStalls, 1),
        expectEq("fig load2", simulate(SRC.brLoad2, ID).dataStalls, 1),
        expectEq("fig load1", simulate(SRC.brLoad1, ID).dataStalls, 2),
      )
    },
  },
  {
    id: "note-bh-slide78",
    claim: "slide 78 example: the `and` is flushed and `lw` follows",
    problem: () => {
      const r = simulate(SRC.branchTaken, { ...ID, outcomes: [true] })
      return all(expectEq("flushed", r.flushed.map((f) => f.instr?.op), ["and"]), expectEq("next", r.seq[2].instr.op, "lw"))
    },
  },
  {
    id: "note-bh-1bit",
    claim: "1-bit nested loop: 2 mispredictions per inner-loop pass after the first",
    problem: () => {
      const pass: Outcome[] = ["T", "T", "T", "N"]
      const r = runPredictor(oneBit("T"), [...pass, ...pass, ...pass])
      const wrongIn = (k: number) => r.steps.slice(4 * k, 4 * k + 4).filter((s) => !s.correct).length
      return all(expectEq("pass 2", wrongIn(1), 2), expectEq("pass 3", wrongIn(2), 2), note.includes("5 of 8 correct") ? null : "note's count changed")
    },
  },
  {
    id: "note-bh-2bit",
    claim: "2-bit predictor: 1 misprediction per pass in steady state",
    problem: () => {
      const pass: Outcome[] = ["T", "T", "T", "N"]
      const r = runPredictor(twoBitPredictor("ST"), [...pass, ...pass, ...pass])
      return expectEq("pass 3 wrong", r.steps.slice(8).filter((s) => !s.correct).length, 1)
    },
  },
]
