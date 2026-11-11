/*
  Five-stage MIPS pipeline timing (IF ID EX MEM WB), as on Rifat Sir's slides:

  - The register file is written in the first half of a cycle and read in the
    second half, so an instruction in ID reads a value written by WB in the
    same cycle.
  - Without forwarding, a consumer must be in ID no earlier than the
    producer's WB.
  - With forwarding (EX/MEM and MEM/WB to the ALU inputs), an ALU result is
    usable in the next cycle's EX; a loaded value is usable in the EX after the
    load's MEM, so a load followed by a use costs one stall.
  - A branch decided in ID (the slides' "reduce branch delay" design) needs its
    operands in ID: one stall after an ALU producer, two after a load right
    before it, one after a load two before it (slides "data hazards for branches").
  - Branches are predicted not taken; a taken branch flushes the instruction
    fetched behind it (penalty 1 cycle when decided in ID, 3 when decided in MEM).
  - The pipeline holds a stalled instruction in its stage; the one behind it
    repeats IF.

  The input is the program plus the outcome of each branch as it executes; the
  simulator walks the dynamic path, so loops and taken branches are handled.
*/
import { deps, parse, type Instr } from "./mips"

export type PipeOptions = {
  forwarding: boolean
  /** Stage in which beq/bne is decided. */
  branchIn?: "ID" | "EX" | "MEM"
  /** Cycles lost after a j/jal/jr (decoded in ID): 1 on the slides' pipeline. */
  jumpPenalty?: number
  /** Allow MEM-to-MEM forwarding of a loaded value into a following store's data. */
  memToMem?: boolean
  /** Outcome of each executed branch, in order (true = taken). Missing entries mean not taken. */
  outcomes?: boolean[]
  /** Stop after this many executed instructions (for loops). */
  maxInstrs?: number
}

export type Stage = "IF" | "ID" | "EX" | "MEM" | "WB"

export type Forwarding = {
  from: number // dynamic index of producer
  to: number // dynamic index of consumer
  reg: number
  /** Pipeline register the value comes from, and the stage that uses it. */
  path: "EX/MEM→EX" | "MEM/WB→EX" | "EX/MEM→ID" | "MEM/WB→ID" | "MEM/WB→MEM" | "register file"
  /** Cycle in which the producer's value is taken (end of this cycle). */
  fromCycle: number
  fromStage: Stage
  toCycle: number
  toStage: Stage
}

export type DynInstr = {
  instr: Instr
  /** First IF cycle, last IF cycle (> first when held), final ID cycle, EX, MEM, WB. */
  ifFirst: number
  ifLast: number
  idFirst: number
  idLast: number
  ex: number
  mem: number
  wb: number
  /** Stalls this instruction spent held in ID. */
  stalls: number
  taken?: boolean
}

export type Flushed = { instr: Instr | undefined; ifCycle: number; ifLast: number; after: number }

export type PipeResult = {
  seq: DynInstr[]
  flushed: Flushed[]
  forwards: Forwarding[]
  /** Cycle in which the last instruction finishes WB (= total cycles from cycle 1). */
  cycles: number
  /** Data-hazard stall cycles (instructions held in ID). */
  dataStalls: number
  /** Cycles lost to flushed fetches. */
  controlStalls: number
}

export function simulate(src: string, opt: PipeOptions): PipeResult {
  const prog = parse(src)
  const branchIn = opt.branchIn ?? "ID"
  const jumpPenalty = opt.jumpPenalty ?? 1
  const outcomes = [...(opt.outcomes ?? [])]
  const seq: DynInstr[] = []
  const flushed: Flushed[] = []
  const forwards: Forwarding[] = []
  let pcIndex = 0
  let nextIfFirst = 1
  let prevIdLast = 0
  const maxInstrs = opt.maxInstrs ?? 10_000
  let dataStalls = 0
  let controlStalls = 0
  while (pcIndex < prog.instrs.length && seq.length < maxInstrs) {
    const ins = prog.instrs[pcIndex]
    const d = deps(ins)
    const ifFirst = nextIfFirst
    // Earliest final-ID cycle from structure: one after the previous instruction leaves ID, and after our own IF.
    let idLast = Math.max(prevIdLast + 1, ifFirst + 1)
    const structural = idLast
    // Data hazards: for each source register find the most recent earlier writer (double data hazard: newest wins).
    const needInID = d.branch && branchIn === "ID" ? true : ins.op === "jr"
    for (const reg of new Set(d.reads)) {
      let p: DynInstr | undefined
      for (let k = seq.length - 1; k >= 0; k--) {
        if (deps(seq[k].instr).writes === reg) {
          p = seq[k]
          break
        }
      }
      if (!p) continue
      const pd = deps(p.instr)
      const isStoreData = d.storeData === reg && !d.reads.slice(0, 1).includes(reg)
      let minId: number
      if (!opt.forwarding) minId = p.wb // read in second half of the producer's WB cycle
      else {
        const ready = pd.load ? p.mem : p.ex // value exists at the end of this cycle
        if (needInID) minId = ready + 1
        else if (isStoreData && opt.memToMem && pd.load) minId = ready - 1 // store's MEM = idLast + 2 must be > load's MEM
        else minId = ready // EX = idLast + 1 > ready
      }
      idLast = Math.max(idLast, minId)
    }
    const stalls = idLast - structural
    dataStalls += stalls
    const ex = idLast + 1
    // Held in IF until the instruction ahead leaves ID, then in ID until its hazards clear.
    const idFirst = Math.max(ifFirst + 1, prevIdLast + 1)
    const di: DynInstr = { instr: ins, ifFirst, ifLast: idFirst - 1, idFirst, idLast, ex, mem: ex + 1, wb: ex + 2, stalls }
    seq.push(di)
    // Record how each source operand arrives.
    const myIdx = seq.length - 1
    for (const reg of new Set(d.reads)) {
      let pk = -1
      for (let k = myIdx - 1; k >= 0; k--)
        if (deps(seq[k].instr).writes === reg) {
          pk = k
          break
        }
      if (pk < 0) continue
      const p = seq[pk]
      const pd = deps(p.instr)
      const isStoreData = d.storeData === reg && d.reads[0] !== reg
      if (!opt.forwarding || idLast >= p.wb) {
        forwards.push({ from: pk, to: myIdx, reg, path: "register file", fromCycle: p.wb, fromStage: "WB", toCycle: idLast, toStage: "ID" })
        continue
      }
      const useStage: Stage = needInID ? "ID" : isStoreData && opt.memToMem && pd.load ? "MEM" : "EX"
      const useCycle = useStage === "ID" ? idLast : useStage === "EX" ? ex : ex + 1
      // The value was produced at the end of `ready`; one cycle later it sits in the next pipeline register.
      const ready = pd.load ? p.mem : p.ex
      const fromReg = useCycle - ready === 1 && !pd.load ? "EX/MEM" : "MEM/WB"
      forwards.push({ from: pk, to: myIdx, reg, path: `${fromReg}→${useStage}` as Forwarding["path"], fromCycle: useCycle - 1, fromStage: fromReg === "EX/MEM" ? "EX" : "MEM", toCycle: useCycle, toStage: useStage })
    }
    prevIdLast = idLast
    nextIfFirst = ifFirst + 1
    // Control flow. Predict not taken: the instructions fetched behind a taken branch (or a jump) are flushed.
    let nextIndex = pcIndex + 1
    const flushUntil = (decided: number) => {
      // The first one is fetched right behind and held in IF while this instruction is held in ID.
      flushed.push({ instr: prog.instrs[pcIndex + 1], ifCycle: ifFirst + 1, ifLast: idLast, after: myIdx })
      for (let c = idLast + 1, k = 2; c <= decided; c++, k++) flushed.push({ instr: prog.instrs[pcIndex + k], ifCycle: c, ifLast: c, after: myIdx })
      controlStalls += decided - idLast + 1
      nextIfFirst = decided + 1
    }
    if (d.branch) {
      const taken = outcomes.length ? (outcomes.shift() as boolean) : false
      di.taken = taken
      if (taken) {
        nextIndex = prog.labels[ins.args[2]]
        if (nextIndex === undefined) throw new Error(`unknown label ${ins.args[2]}`)
        flushUntil(branchIn === "ID" ? idLast : branchIn === "EX" ? ex : ex + 1)
      }
    } else if (d.jump) {
      nextIndex = ins.op === "jr" ? NaN : prog.labels[ins.args[0]]
      if (jumpPenalty > 0) flushUntil(idLast + jumpPenalty - 1)
    }
    if (!Number.isFinite(nextIndex)) break
    pcIndex = nextIndex
  }
  const cycles = seq.length ? seq[seq.length - 1].wb : 0
  return { seq, flushed, forwards, cycles, dataStalls, controlStalls }
}

/** Stage occupied by each dynamic instruction in each cycle, for drawing: "IF", "ID", "stall", "EX", … */
export function cellsOf(d: DynInstr) {
  const cells: { cycle: number; text: string; kind: "stage" | "stall" }[] = []
  cells.push({ cycle: d.ifFirst, text: "IF", kind: "stage" })
  // A held instruction repeats its stage (as on the slides: "IF ID ID ID EX"); the repeats are drawn as stalls.
  for (let c = d.ifFirst + 1; c <= d.ifLast; c++) cells.push({ cycle: c, text: "IF", kind: "stall" })
  cells.push({ cycle: d.idFirst, text: "ID", kind: "stage" })
  for (let c = d.idFirst + 1; c <= d.idLast; c++) cells.push({ cycle: c, text: "ID", kind: "stall" })
  cells.push({ cycle: d.ex, text: "EX", kind: "stage" }, { cycle: d.mem, text: "MEM", kind: "stage" }, { cycle: d.wb, text: "WB", kind: "stage" })
  return cells
}
