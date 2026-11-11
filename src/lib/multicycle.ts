/*
  The multicycle MIPS control FSM of Appendix D (Figure D.3.1): ten states, the
  control signals each one asserts, and the next-state function. The note's
  tables are generated from this object, and checks trace every instruction
  class through it.
*/

export type Op = "lw" | "sw" | "R-type" | "beq" | "j"

export type State = {
  n: number
  name: string
  /** What the datapath does in this state, in register-transfer notation. */
  rtl: string
  /** Signals asserted (1-bit names) and multi-bit fields with their values. */
  signals: string[]
  next: (op: Op) => number
}

export const STATES: State[] = [
  { n: 0, name: "Instruction fetch", rtl: "IR ← Memory[PC]; PC ← PC + 4", signals: ["MemRead", "ALUSrcA = 0", "IorD = 0", "IRWrite", "ALUSrcB = 01", "ALUOp = 00", "PCWrite", "PCSource = 00"], next: () => 1 },
  {
    n: 1,
    name: "Instruction decode / register fetch",
    rtl: "A ← Reg[IR[25:21]]; B ← Reg[IR[20:16]]; ALUOut ← PC + (sign-extend(IR[15:0]) << 2)",
    signals: ["ALUSrcA = 0", "ALUSrcB = 11", "ALUOp = 00"],
    next: (op) => ({ lw: 2, sw: 2, "R-type": 6, beq: 8, j: 9 })[op],
  },
  { n: 2, name: "Memory address computation", rtl: "ALUOut ← A + sign-extend(IR[15:0])", signals: ["ALUSrcA = 1", "ALUSrcB = 10", "ALUOp = 00"], next: (op) => (op === "lw" ? 3 : 5) },
  { n: 3, name: "Memory access (read)", rtl: "MDR ← Memory[ALUOut]", signals: ["MemRead", "IorD = 1"], next: () => 4 },
  { n: 4, name: "Memory read completion (write-back)", rtl: "Reg[IR[20:16]] ← MDR", signals: ["RegDst = 0", "RegWrite", "MemtoReg = 1"], next: () => 0 },
  { n: 5, name: "Memory access (write)", rtl: "Memory[ALUOut] ← B", signals: ["MemWrite", "IorD = 1"], next: () => 0 },
  { n: 6, name: "Execution", rtl: "ALUOut ← A op B", signals: ["ALUSrcA = 1", "ALUSrcB = 00", "ALUOp = 10"], next: () => 7 },
  { n: 7, name: "R-type completion", rtl: "Reg[IR[15:11]] ← ALUOut", signals: ["RegDst = 1", "RegWrite", "MemtoReg = 0"], next: () => 0 },
  { n: 8, name: "Branch completion", rtl: "if (A == B) PC ← ALUOut", signals: ["ALUSrcA = 1", "ALUSrcB = 00", "ALUOp = 01", "PCWriteCond", "PCSource = 01"], next: () => 0 },
  { n: 9, name: "Jump completion", rtl: "PC ← PC[31:28] : (IR[25:0] << 2)", signals: ["PCWrite", "PCSource = 10"], next: () => 0 },
]

/** States visited by one instruction, starting at fetch, until it returns to state 0. */
export function path(op: Op): number[] {
  const out = [0]
  let s = STATES[0].next(op)
  while (s !== 0) {
    out.push(s)
    s = STATES[s].next(op)
    if (out.length > 10) throw new Error("FSM does not return to state 0")
  }
  return out
}

/** The 16 datapath control bits: name → width. */
export const CONTROL_BITS: [string, number][] = [
  ["PCWrite", 1], ["PCWriteCond", 1], ["IorD", 1], ["MemRead", 1], ["MemWrite", 1], ["IRWrite", 1], ["MemtoReg", 1],
  ["PCSource", 2], ["ALUOp", 2], ["ALUSrcB", 2], ["ALUSrcA", 1], ["RegWrite", 1], ["RegDst", 1],
]

/** Value of one control bit (e.g. "PCSource0") in a state; unlisted bits are 0. */
export function bitIn(state: State, bit: string): number {
  const m = bit.match(/^([A-Za-z]+?)(\d)?$/)!
  const name = m[1]
  const idx = m[2] === undefined ? undefined : +m[2]
  for (const s of state.signals) {
    const [k, v] = s.split(" = ")
    if (k !== name) continue
    if (v === undefined) return 1
    return idx === undefined ? +v : +v[v.length - 1 - idx]
  }
  return 0
}
