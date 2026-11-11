import { all, expectEq, type Fact } from "./types"
import { CONTROL_BITS, STATES, bitIn, path } from "@/lib/multicycle"

export const controlNoteChecks: Fact[] = [
  {
    id: "note-ctl-paths",
    claim: "lw 0-1-2-3-4, sw 0-1-2-5, R 0-1-6-7, beq 0-1-8, j 0-1-9",
    problem: () =>
      all(
        expectEq("lw", path("lw"), [0, 1, 2, 3, 4]),
        expectEq("sw", path("sw"), [0, 1, 2, 5]),
        expectEq("R", path("R-type"), [0, 1, 6, 7]),
        expectEq("beq", path("beq"), [0, 1, 8]),
        expectEq("j", path("j"), [0, 1, 9]),
      ),
  },
  { id: "note-ctl-16bits", claim: "16 datapath control bits", problem: () => expectEq("bits", CONTROL_BITS.reduce((s, [, w]) => s + w, 0), 16) },
  {
    id: "note-ctl-rom",
    claim: "single ROM 2^10 × 20 = 20 Kbits; two ROMs 256 + 4096 = 4352 bits",
    problem: () => all(expectEq("single", 2 ** 10 * 20, 20480), expectEq("two", 2 ** 4 * 16 + 2 ** 10 * 4, 4352)),
  },
  { id: "note-ctl-pla", claim: "PLA 510 cells; split 200 + 98 = 298 (≈58%)", problem: () => all(expectEq("pla", 10 * 17 + 20 * 17, 510), expectEq("p1", 4 * 10 + 16 * 10, 200), expectEq("p2", 10 * 7 + 4 * 7, 98), Math.abs(298 / 510 - 0.58) < 0.005 ? null : `ratio ${298 / 510}`) },
  {
    id: "note-ctl-state8",
    claim: "PCWriteCond, PCSource0 and ALUOp0 are 1 in exactly the same states (only state 8)",
    problem: () => {
      const where = (b: string) => STATES.filter((s) => bitIn(s, b) === 1).map((s) => s.n)
      return all(expectEq("PCWriteCond", where("PCWriteCond"), [8]), expectEq("PCSource0", where("PCSource0"), [8]), expectEq("ALUOp0", where("ALUOp0"), [8]))
    },
  },
]
