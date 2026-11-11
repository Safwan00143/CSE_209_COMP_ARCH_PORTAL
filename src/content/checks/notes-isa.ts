import { all, expectEq, type Fact } from "./types"
import { assemble, call, newMachine, parse, run } from "@/lib/mips"
import { fromBits, negateBits, signExtend, toBits, toHex } from "@/lib/numbers"

const enc = (src: string, pc = 0) => assemble(parse(src), pc)[0].enc
const hex32 = (w: number) => (w >>> 0).toString(16).toUpperCase().padStart(8, "0")

export const isaNoteChecks: Fact[] = [
  {
    id: "note-isa-add-encoding",
    claim: "add $t0, $s1, $s2 = 0 17 18 8 0 32 = 0x02324020",
    problem: () => {
      const e = enc("add $t0, $s1, $s2")
      return all(expectEq("fields", e.fields.map((f) => f[1]), [0, 17, 18, 8, 0, 32]), expectEq("hex", hex32(e.word), "02324020"))
    },
  },
  { id: "note-isa-lw-encoding", claim: "lw $t0, 32($s3) = 35 19 8 32", problem: () => expectEq("fields", enc("lw $t0, 32($s3)").fields.map((f) => f[1]), [35, 19, 8, 32]) },
  { id: "note-isa-unsigned-11", claim: "…1011 = 11", problem: () => expectEq("value", fromBits("1011"), 11n) },
  { id: "note-isa-minus4", claim: "1111…1100 = −4", problem: () => expectEq("value", fromBits("1".repeat(30) + "00", true), -4n) },
  { id: "note-isa-ranges", claim: "32-bit ranges", problem: () => all(expectEq("u", 2 ** 32 - 1, 4294967295), expectEq("smin", -(2 ** 31), -2147483648), expectEq("smax", 2 ** 31 - 1, 2147483647)) },
  { id: "note-isa-negate2", claim: "−2 = 1111…1110", problem: () => expectEq("bits", negateBits(toBits(2, 32)), "1".repeat(31) + "0") },
  { id: "note-isa-signext", claim: "sign extension of ±2 to 16 bits", problem: () => all(expectEq("+2", signExtend("00000010", 16), "0000000000000010"), expectEq("-2", signExtend("11111110", 16), "1111111111111110")) },
  { id: "note-isa-hex", claim: "eca8 6420 bits", problem: () => expectEq("hex", toHex("11101100101010000110010000100000"), "ECA86420") },
  {
    id: "note-isa-logic",
    claim: "and/or/nor slide examples",
    problem: () => {
      const t2 = 0b110111000000
      const t1 = 0b11110000000000
      const m = newMachine({ t1, t2 })
      run(parse("and $t0, $t1, $t2\nor $t3, $t1, $t2\nnor $t4, $t1, $zero"), m)
      return all(
        expectEq("and", m.regs[8], 0b110000000000),
        expectEq("or", m.regs[11], 0b11110111000000),
        expectEq("nor", (m.regs[12] >>> 0).toString(2), "11111111111111111100001111111111"),
      )
    },
  },
  {
    id: "note-isa-memory-examples",
    claim: "g = h + A[8]; A[12] = h + A[8]",
    problem: () => {
      const base = 0x10010000
      const mem: Record<number, number> = {}
      for (let i = 0; i < 16; i++) mem[base + 4 * i] = 100 + i
      const m = newMachine({ s2: 5, s3: base }, mem)
      run(parse("lw $t0, 32($s3)\nadd $s1, $s2, $t0\nlw $t0, 32($s3)\nadd $t0, $s2, $t0\nsw $t0, 48($s3)"), m)
      return all(expectEq("g", m.regs[17], 5 + 108), expectEq("A[12]", (m.mem.get(base + 48 + 3) ?? 0) | ((m.mem.get(base + 48 + 2) ?? 0) << 8), 113))
    },
  },
  {
    id: "note-isa-slide-arith",
    claim: "f = (g+h) − (i+j) with $s registers",
    problem: () => {
      const m = newMachine({ s1: 10, s2: 20, s3: 3, s4: 4 })
      run(parse("add $t0, $s1, $s2\nadd $t1, $s3, $s4\nsub $s0, $t0, $t1"), m)
      return expectEq("f", m.regs[16], 23)
    },
  },
  { id: "note-isa-call-sanity", claim: "simulator returns $v0", problem: () => expectEq("v0", call("f: add $v0, $a0, $a1\njr $ra", "f", [2, 3]).v0, 5) },
]
