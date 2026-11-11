import { all, expectEq, type Fact } from "./types"
import { codeBlock } from "./extract"
import { assemble, loadWord, newMachine, parse, run, storeWord } from "@/lib/mips"
import { syncLinkingNote as note } from "../notes/sync-linking"

const s16 = (x: number) => ((x & 0xffff) ^ 0x8000) - 0x8000

export const syncNoteChecks: Fact[] = [
  {
    id: "note-sync-swap",
    claim: "ll/sc swap exchanges $s4 with memory (single processor)",
    problem: () => {
      const m = newMachine({ s1: 0x10010000, s4: 7 })
      storeWord(m.mem, 0x10010000, 42)
      run(parse(codeBlock(note, "try: add $t0, $zero, $s4")), m)
      return all(expectEq("$s4", m.regs[20], 42), expectEq("memory", loadWord(m.mem, 0x10010000), 7))
    },
  },
  {
    id: "note-sync-a0x",
    claim: "atomic A[0] = X",
    problem: () => {
      const m = newMachine({ s1: 0x10010000, s2: 99 })
      run(parse(codeBlock(note, "try: ll  $t1, 0($s1)")), m)
      return expectEq("A[0]", loadWord(m.mem, 0x10010000), 99)
    },
  },
  {
    id: "note-link-example",
    claim: "linking example: addresses, $gp offsets 8000/8020 hex, jal fields",
    problem: () => {
      const gp = 0x10008000
      const X = 0x10000000
      const Y = 0x10000000 + 0x20
      const bText = 0x00400000 + 0x100
      const jalB = assemble(parse(`jal ${bText}`), 0x00400004)[0].enc.fields[1][1]
      const jalA = assemble(parse(`jal ${0x00400000}`), 0x00400104)[0].enc.fields[1][1]
      return all(
        expectEq("X offset", s16(X - gp), -0x8000),
        expectEq("X field", (X - gp) & 0xffff, 0x8000),
        expectEq("Y offset", Y - gp, -0x7fe0),
        expectEq("Y field", (Y - gp) & 0xffff, 0x8020),
        expectEq("B text", bText, 0x00400100),
        expectEq("jal B field", jalB, 0x100040),
        expectEq("jal A field", jalA, 0x100000),
      )
    },
  },
]
