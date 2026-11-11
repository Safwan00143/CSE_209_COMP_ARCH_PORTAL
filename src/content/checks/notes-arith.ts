import { all, expectEq, type Fact } from "./types"
import { addBits, fromBits, subBits, toBits } from "@/lib/numbers"
import { multiplyFirst, multiplyRefined, productOk } from "@/lib/multiply"
import { intArithmeticNote as note } from "../notes/int-arithmetic"

export const arithNoteChecks: Fact[] = [
  { id: "note-arith-7plus6", claim: "7 + 6 = 13, no overflow", problem: () => all(expectEq("sum", fromBits(addBits("00000111", "00000110").sum), 13n), expectEq("v", addBits("00000111", "00000110").overflow, false)) },
  { id: "note-arith-127plus1", claim: "127 + 1 overflows on 8 bits", problem: () => expectEq("v", addBits("01111111", "00000001").overflow, true) },
  { id: "note-arith-7minus6", claim: "7 − 6 = 1", problem: () => expectEq("diff", fromBits(subBits(toBits(7, 32), toBits(6, 32)).sum, true), 1n) },
  {
    id: "note-arith-overflow-function",
    claim: "V formula (signs and O) and V = Cn ⊕ Cn−1 agree with true overflow for every 4-bit add and subtract",
    problem: () => {
      for (const O of [0, 1])
        for (let a = -8; a < 8; a++)
          for (let b = -8; b < 8; b++) {
            const A = toBits(a, 4, true)
            const B = toBits(b, 4, true)
            const r = O ? subBits(A, B) : addBits(A, B)
            const truth = O ? a - b : a + b
            const real = truth < -8 || truth > 7
            const [SA, SB, SR] = [+A[0], +B[0], +r.sum[0]]
            const n = (x: number) => 1 - x
            const V = (n(O) & n(SA) & n(SB) & SR) | (n(O) & SA & SB & n(SR)) | (O & n(SA) & SB & SR) | (O & SA & n(SB) & n(SR))
            const carryRule = r.carries[4] !== r.carries[3]
            if (!!V !== real) return `formula wrong for O=${O}, a=${a}, b=${b}`
            if (carryRule !== real) return `carry rule wrong for O=${O}, a=${a}, b=${b}`
          }
      return null
    },
  },
  {
    id: "note-arith-multipliers",
    claim: "both multipliers give 0110 for 0010 × 0011 and 1001000 for 1000 × 1001; all 4-bit pairs correct",
    problem: () => {
      for (let x = 0; x < 16; x++)
        for (let y = 0; y < 16; y++) {
          const a = toBits(x, 4)
          const b = toBits(y, 4)
          if (!productOk(a, b, multiplyFirst(a, b).product)) return `first version wrong for ${a} × ${b}`
          if (!productOk(a, b, multiplyRefined(a, b).product)) return `refined version wrong for ${a} × ${b}`
        }
      return all(expectEq("slide", multiplyRefined("1000", "1001").product, "01001000"), note.includes("Product: 01001000 = 72") ? null : "note text changed")
    },
  },
]
