import { all, expectEq, type Fact } from "./types"
import { codeBlock } from "./extract"
import { assemble, newMachine, parse, run } from "@/lib/mips"
import { addressingNote as note } from "../notes/addressing"

export const addressingNoteChecks: Fact[] = [
  {
    id: "note-addr-lui-ori",
    claim: "lui 61 / ori 2304 builds 0x003D0900",
    problem: () => {
      const m = newMachine()
      run(parse(codeBlock(note, "ori $s0, $s0, 2304")), m)
      return all(expectEq("$s0", m.regs[16] >>> 0, 0x003d0900), expectEq("upper", 0x003d, 61), expectEq("lower", 0x0900, 2304))
    },
  },
  { id: "note-addr-131075", claim: "131075 = 0002 0003 hex", problem: () => expectEq("hex", (131075).toString(16).padStart(8, "0"), "00020003") },
  {
    id: "note-addr-loop-80000",
    claim: "loop at 80000: field values in the table, bne offset 2, j field 20000",
    problem: () => {
      const src = "Loop: sll $t1, $s3, 2\nadd $t1, $t1, $s6\nlw $t0, 0($t1)\nbne $t0, $s5, Exit\naddi $s3, $s3, 1\nj Loop\nExit:"
      const got = assemble(parse(src), 80000).map((x) => [x.pc, ...x.enc.fields.map((f) => f[1])])
      const want = [
        [80000, 0, 0, 19, 9, 2, 0],
        [80004, 0, 9, 22, 9, 0, 32],
        [80008, 35, 9, 8, 0],
        [80012, 5, 8, 21, 2],
        [80016, 8, 19, 19, 1],
        [80020, 2, 20000],
      ]
      // The note's table must show the same numbers.
      const rows = ["| 80000 | \`Loop: sll $t1, $s3, 2\` | 0 | 0 | 19 | 9 | 2 | 0 |", "| 80012 | \`bne $t0, $s5, Exit\` | 5 | 8 | 21 | 2 (offset) | | |", "| 80020 | \`j Loop\` | 2 | 20000 (address field) | | | | |"]
      const missing = rows.find((r) => !note.includes(r))
      return all(expectEq("encodings", got, want), missing ? `table row changed: ${missing}` : null)
    },
  },
  {
    id: "note-addr-branch-reach",
    claim: "a branch reaches (PC+4) − 2^17 … (PC+4) + 2^17 − 4",
    problem: () => {
      const pc = 0x00400000
      const ok = (t: number) => {
        try {
          assemble(parse(`beq $s0, $s1, ${t}`), pc)
          return true
        } catch {
          return false
        }
      }
      return all(
        ok(pc + 4 + 2 ** 17 - 4) ? null : "max forward rejected",
        ok(pc + 4 - 2 ** 17) ? null : "max backward rejected",
        !ok(pc + 4 + 2 ** 17) ? null : "one past forward accepted",
        !ok(pc + 4 - 2 ** 17 - 4) ? null : "one past backward accepted",
      )
    },
  },
  {
    id: "note-addr-far-rewrite",
    claim: "bne/j rewrite behaves like beq",
    problem: () => {
      const rewrite = codeBlock(note, "bne $s0, $s1, L2")
      for (const [a, b] of [[1, 1], [1, 2]]) {
        const m = newMachine({ s0: a, s1: b })
        run(parse(`${rewrite}\naddi $v0, $zero, 2\nj E\nL1: addi $v0, $zero, 1\nE:`), m)
        const want = a === b ? 1 : 2
        if (m.regs[2] !== want) return `s0=${a}, s1=${b}: took the wrong path`
      }
      return null
    },
  },
  {
    id: "note-addr-jump-region",
    claim: "j cannot leave the 256 MB region of PC + 4",
    problem: () => {
      let threw = false
      try {
        assemble(parse("j 0x40000000"), 0x20000000)
      } catch {
        threw = true
      }
      return threw ? null : "jump across regions was accepted"
    },
  },
]
