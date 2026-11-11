/*
  The single-cycle MIPS datapath of Rifat Sir's Chapter 4 (P&H Figures 4.17 and
  4.24) as a function: given an instruction word and the control signals, it
  moves values through the muxes, ALU and memories exactly as the hardware does.
  Checks run every control-table row through it and compare the result with the
  MIPS reference simulator, trying both values of every don't-care (X).
*/
import { assemble, newMachine, parse, run, loadWord, storeWord, type Machine } from "./mips"

export type Signal = 0 | 1 | "X"
export type Controls = {
  RegDst: Signal
  ALUSrc: Signal
  MemtoReg: Signal
  RegWrite: Signal
  MemRead: Signal
  MemWrite: Signal
  Branch: Signal
  ALUOp1: Signal
  ALUOp0: Signal
  Jump: Signal
}

/** The main control table, as on the slides (Figure 4.18 plus the Jump signal of Figure 4.24). */
export const CONTROL: Record<"R-format" | "lw" | "sw" | "beq" | "j", Controls> = {
  "R-format": { RegDst: 1, ALUSrc: 0, MemtoReg: 0, RegWrite: 1, MemRead: 0, MemWrite: 0, Branch: 0, ALUOp1: 1, ALUOp0: 0, Jump: 0 },
  lw: { RegDst: 0, ALUSrc: 1, MemtoReg: 1, RegWrite: 1, MemRead: 1, MemWrite: 0, Branch: 0, ALUOp1: 0, ALUOp0: 0, Jump: 0 },
  sw: { RegDst: "X", ALUSrc: 1, MemtoReg: "X", RegWrite: 0, MemRead: 0, MemWrite: 1, Branch: 0, ALUOp1: 0, ALUOp0: 0, Jump: 0 },
  beq: { RegDst: "X", ALUSrc: 0, MemtoReg: "X", RegWrite: 0, MemRead: 0, MemWrite: 0, Branch: 1, ALUOp1: 0, ALUOp0: 1, Jump: 0 },
  j: { RegDst: "X", ALUSrc: "X", MemtoReg: "X", RegWrite: 0, MemRead: 0, MemWrite: 0, Branch: 0, ALUOp1: "X", ALUOp0: "X", Jump: 1 },
}

/** ALU control (slide 24): 4-bit ALU control from ALUOp and funct. */
export function aluControl(aluOp: number, funct: number): number {
  if (aluOp === 0b00) return 0b0010 // add for lw/sw
  if (aluOp & 0b01) return 0b0110 // subtract for beq
  switch (funct) {
    case 0b100000: return 0b0010 // add
    case 0b100010: return 0b0110 // sub
    case 0b100100: return 0b0000 // and
    case 0b100101: return 0b0001 // or
    case 0b101010: return 0b0111 // slt
    default: throw new Error(`no ALU control for funct ${funct}`)
  }
}

function alu(ctl: number, a: number, b: number) {
  switch (ctl) {
    case 0b0000: return a & b
    case 0b0001: return a | b
    case 0b0010: return (a + b) | 0
    case 0b0110: return (a - b) | 0
    case 0b0111: return a < b ? 1 : 0
    case 0b1100: return ~(a | b)
    default: throw new Error(`bad ALU control ${ctl}`)
  }
}

const bit = (s: Signal, x: 0 | 1) => (s === "X" ? x : s)

/** One clock cycle of the single-cycle datapath. `xs` chooses the value used for every don't-care. */
export function step(m: Machine, word: number, pc: number, c: Controls, xs: 0 | 1) {
  const rs = (word >>> 21) & 31
  const rt = (word >>> 16) & 31
  const rd = (word >>> 11) & 31
  const imm = (word << 16) >> 16 // sign-extend
  const funct = word & 63
  const pc4 = (pc + 4) | 0
  const rd1 = m.regs[rs]
  const rd2 = m.regs[rt]
  const aluB = bit(c.ALUSrc, xs) ? imm : rd2
  const aluOp = (bit(c.ALUOp1, xs) << 1) | bit(c.ALUOp0, xs)
  const result = alu(aluControl(aluOp, funct), rd1, aluB)
  const zero = result === 0
  let readData = 0
  if (bit(c.MemRead, xs)) readData = loadWord(m.mem, result)
  if (bit(c.MemWrite, xs)) storeWord(m.mem, result, rd2)
  const writeReg = bit(c.RegDst, xs) ? rd : rt
  const writeData = bit(c.MemtoReg, xs) ? readData : result
  if (bit(c.RegWrite, xs) && writeReg !== 0) m.regs[writeReg] = writeData
  const branchTarget = (pc4 + (imm << 2)) | 0
  const pcSrc = bit(c.Branch, xs) && zero
  const jumpTarget = (pc4 & 0xf0000000) | ((word & 0x3ffffff) << 2)
  return bit(c.Jump, xs) ? jumpTarget >>> 0 : pcSrc ? branchTarget >>> 0 : pc4 >>> 0
}

/**
 * Runs one instruction through the datapath with the given control row and
 * through the reference simulator; returns a mismatch description or null.
 */
export function checkRow(src: string, row: Controls, init: Record<string, number>, memory: Record<number, number> = {}): string | null {
  const base = 0x00400000
  const prog = parse(`${src}\nnop\nnop\nT: nop`)
  const word = assemble(prog, base)[0].enc.word
  for (const xs of [0, 1] as const) {
    const a = newMachine(init, memory)
    const b = newMachine(init, memory)
    a.regs[31] = 0x7ffffff0 // run() parks $ra at its stop address; match it so registers compare equal
    const nextPc = step(a, word, base, row, xs)
    // Reference: execute only the first instruction.
    run(prog, b, { stopAfter: 1, base })
    const refPc = b.pc >>> 0
    for (let r = 0; r < 32; r++) if (a.regs[r] !== b.regs[r]) return `X=${xs}: register ${r} is ${a.regs[r]}, reference ${b.regs[r]}`
    for (const [k, v] of b.mem) if ((a.mem.get(k) ?? 0) !== v) return `X=${xs}: memory ${k} differs`
    // The reference stops after one step; for a jump/branch its pc is the target.
    if (nextPc !== refPc) return `X=${xs}: next PC ${nextPc.toString(16)}, reference ${refPc.toString(16)}`
  }
  return null
}
