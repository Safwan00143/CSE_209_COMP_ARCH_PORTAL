import { all, expectEq, type Fact } from "./types"
import { codeBlock } from "./extract"
import { call, newMachine, parse, run, storeWord } from "@/lib/mips"
import { mipsProgrammingNote as note } from "../notes/mips-programming"

const block = (m: string) => codeBlock(note, m)

export const mipsNoteChecks: Fact[] = [
  {
    id: "note-mips-if",
    claim: "if (i == j) f = g + h; else f = g - h",
    problem: () => {
      const src = block("bne $s3, $s4, Else")
      for (const [i, j] of [[1, 1], [1, 2]]) {
        const m = newMachine({ s1: 10, s2: 3, s3: i, s4: j })
        run(parse(src), m)
        const want = i === j ? 13 : 7
        if (m.regs[16] !== want) return `i=${i}, j=${j}: f=${m.regs[16]}, want ${want}`
      }
      return null
    },
  },
  {
    id: "note-mips-while",
    claim: "while (save[i] == k) i += 1",
    problem: () => {
      const base = 0x10010000
      const mem: Record<number, number> = {}
      ;[5, 5, 5, 7, 5].forEach((v, k) => (mem[base + 4 * k] = v))
      const m = newMachine({ s3: 0, s5: 5, s6: base }, mem)
      run(parse(block("Loop: sll  $t1, $s3, 2")), m)
      return expectEq("i", m.regs[19], 3)
    },
  },
  {
    id: "note-mips-slt-table",
    claim: "the four slt branch patterns",
    problem: () => {
      const pats: [string, (a: number, b: number) => boolean][] = [
        ["slt $t0, $s1, $s2\nbne $t0, $zero, L", (a, b) => a < b],
        ["slt $t0, $s1, $s2\nbeq $t0, $zero, L", (a, b) => a >= b],
        ["slt $t0, $s2, $s1\nbne $t0, $zero, L", (a, b) => a > b],
        ["slt $t0, $s2, $s1\nbeq $t0, $zero, L", (a, b) => a <= b],
      ]
      for (const [code, want] of pats)
        for (const a of [-3, 0, 2])
          for (const b of [-3, 0, 2]) {
            const m = newMachine({ s1: a, s2: b })
            run(parse(`${code}\naddi $v0, $zero, 0\nj E\nL: addi $v0, $zero, 1\nE:`), m)
            if ((m.regs[2] === 1) !== want(a, b)) return `${code.replace("\n", "; ")} wrong for a=${a}, b=${b}`
          }
      // Also check the slide rows in the note's table exist.
      return note.includes("| a ≥ b | \`slt $t0, a, b\` then \`beq $t0, $zero, L\` |") ? null : "table row for a ≥ b changed"
    },
  },
  {
    id: "note-mips-slt-unsigned",
    claim: "slt gives 1, sltu gives 0 for −1 vs 1",
    problem: () => {
      const m = newMachine({ s0: -1, s1: 1 })
      run(parse("slt $t0, $s0, $s1\nsltu $t1, $s0, $s1"), m)
      return all(expectEq("slt", m.regs[8], 1), expectEq("sltu", m.regs[9], 0))
    },
  },
  {
    id: "note-mips-leaf",
    claim: "leaf_example returns (g+h)−(i+j) and preserves $s0",
    problem: () => {
      const src = block("leaf_example:")
      return expectEq("v0", call(src, "leaf_example", [10, 20, 3, 4]).v0, 23)
    },
  },
  {
    id: "note-mips-fact",
    claim: "fact(n) for n = 0…7 (and fact(3) = 6 in the trace)",
    problem: () => {
      const src = block("fact:")
      const f = (n: number): number => (n < 1 ? 1 : n * f(n - 1))
      for (let n = 0; n <= 7; n++) {
        const v = call(src, "fact", [n]).v0
        if (v !== f(n)) return `fact(${n}) = ${v}, want ${f(n)}`
      }
      return null
    },
  },
  {
    id: "note-mips-strcpy",
    claim: "strcpy copies the string including the terminator",
    problem: () => {
      const src = block("strcpy:")
      const y = 0x10010000
      const x = 0x10020000
      const text = "MIPS!"
      const mem: Record<number, number> = {}
      const bytes = [...text].map((c) => c.charCodeAt(0)).concat(0)
      // Write bytes via word stores (big endian), padding to a word boundary.
      for (let k = 0; k < bytes.length; k += 4) {
        const w = ((bytes[k] ?? 0) << 24) | ((bytes[k + 1] ?? 0) << 16) | ((bytes[k + 2] ?? 0) << 8) | (bytes[k + 3] ?? 0)
        mem[y + k] = w
      }
      const { machine } = call(src, "strcpy", [x, y], { memory: mem })
      const out = bytes.map((_, k) => machine.mem.get(x + k) ?? -1)
      return expectEq("copied bytes", out, bytes)
    },
  },
  {
    id: "note-mips-jumptable",
    claim: "jump table dispatches k = 0…3 and skips k outside 0…3",
    problem: () => {
      const table = block("JumpTable")
      const src = `${table}\nL0: addi $v0, $zero, 10\nj Exit\nL1: addi $v0, $zero, 11\nj Exit\nL2: addi $v0, $zero, 12\nj Exit\nL3: addi $v0, $zero, 13\nj Exit\nExit:`
      const prog = parse(src)
      const base = 0x00400000
      const tab = 0x10010000
      for (const k of [-1, 0, 1, 2, 3, 4]) {
        const m = newMachine({ s5: k, t4: tab, v0: -7 })
        ;["L0", "L1", "L2", "L3"].forEach((l, i) => storeWord(m.mem, tab + 4 * i, base + 4 * prog.labels[l]))
        run(prog, m)
        const want = k >= 0 && k <= 3 ? 10 + k : -7
        if (m.regs[2] !== want) return `k=${k}: $v0=${m.regs[2]}, want ${want}`
      }
      return null
    },
  },
]
