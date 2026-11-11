/*
  A small MIPS-32 toolkit in the course's syntax (Patterson & Hennessy):
    - parse()   assembly text → instructions (labels, comments, $t0 / $8 names)
    - encode()  one instruction → its R/I/J fields and 32-bit machine word
    - run()     executes a program on a register file and byte-addressed memory,
                so assembly answers can be tested on real inputs (recursion included)
    - deps()    which registers an instruction reads and writes (for the pipeline simulator)

  Only the instructions used on the slides and in the papers are supported; an
  unknown mnemonic throws, so a typo in an answer cannot pass silently.
*/

export const REG_NAMES = [
  "zero", "at", "v0", "v1", "a0", "a1", "a2", "a3",
  "t0", "t1", "t2", "t3", "t4", "t5", "t6", "t7",
  "s0", "s1", "s2", "s3", "s4", "s5", "s6", "s7",
  "t8", "t9", "k0", "k1", "gp", "sp", "fp", "ra",
]

export function regNum(r: string): number {
  const s = r.trim().replace(/^\$/, "")
  if (/^\d+$/.test(s)) {
    const n = +s
    if (n < 0 || n > 31) throw new Error(`bad register ${r}`)
    return n
  }
  const i = REG_NAMES.indexOf(s)
  if (i < 0) throw new Error(`unknown register ${r}`)
  return i
}

export type Instr = {
  op: string
  args: string[]
  label?: string
  /** Source line, trimmed, for display. */
  text: string
  /** Index in the program. */
  index: number
}

export type Program = { instrs: Instr[]; labels: Record<string, number> }

/** Parses assembly. Labels may sit on their own line or before an instruction; "#" and "//" start comments. */
export function parse(src: string): Program {
  const instrs: Instr[] = []
  const labels: Record<string, number> = {}
  let pending: string[] = []
  for (const raw of src.split("\n")) {
    let line = raw.replace(/(#|\/\/).*$/, "").trim()
    if (!line) continue
    let m: RegExpMatchArray | null
    while ((m = line.match(/^([A-Za-z_.][\w.]*)\s*:\s*(.*)$/))) {
      pending.push(m[1])
      line = m[2].trim()
    }
    if (!line) continue
    const sp = line.search(/\s/)
    const op = (sp < 0 ? line : line.slice(0, sp)).toLowerCase()
    const rest = sp < 0 ? "" : line.slice(sp + 1)
    const args = rest
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean)
    for (const l of pending) {
      if (l in labels) throw new Error(`duplicate label ${l}`)
      labels[l] = instrs.length
    }
    instrs.push({ op, args, label: pending[0], text: line, index: instrs.length })
    pending = []
  }
  for (const l of pending) labels[l] = instrs.length // label at the very end (e.g. Exit:)
  return { instrs, labels }
}

/* ───────────── Formats and encoding ───────────── */

const R_FUNCT: Record<string, number> = {
  sll: 0, srl: 2, sra: 3, jr: 8, mfhi: 16, mflo: 18, mult: 24, multu: 25, div: 26, divu: 27,
  add: 32, addu: 33, sub: 34, subu: 35, and: 36, or: 37, xor: 38, nor: 39, slt: 42, sltu: 43,
}
const I_OP: Record<string, number> = {
  beq: 4, bne: 5, addi: 8, addiu: 9, slti: 10, sltiu: 11, andi: 12, ori: 13, xori: 14, lui: 15,
  lb: 32, lh: 33, ll: 48, lw: 35, lbu: 36, lhu: 37, sb: 40, sh: 41, sw: 43, sc: 56,
}
const J_OP: Record<string, number> = { j: 2, jal: 3 }

export type Encoding = {
  format: "R" | "I" | "J"
  /** Field name → value, in printed order. */
  fields: [string, number, number][] // [name, value, width]
  word: number
}

function memArg(a: string): [number, string] {
  const m = a.match(/^(-?(?:0x[0-9a-f]+|\d+))?\s*\(\s*(\$?\w+)\s*\)$/i)
  if (!m) throw new Error(`bad memory operand ${a}`)
  return [m[1] ? Number(m[1]) : 0, m[2]]
}

const imm = (s: string) => {
  const v = Number(s)
  if (!Number.isFinite(v)) throw new Error(`bad immediate ${s}`)
  return v
}

function pack(fields: [string, number, number][]) {
  let w = 0n
  for (const [, v, width] of fields) {
    const mask = (1n << BigInt(width)) - 1n
    w = (w << BigInt(width)) | (BigInt(v) & mask)
  }
  return Number(w)
}

/**
 * Encodes one instruction. `pc` is the instruction's own address (for branch
 * offsets: offset = (target − (pc + 4)) / 4) and `labels` maps labels to addresses.
 */
export function encode(ins: Instr, pc = 0, labels: Record<string, number> = {}): Encoding {
  const { op, args } = ins
  const target = (a: string) => {
    if (a in labels) return labels[a]
    const v = Number(a)
    if (!Number.isFinite(v)) throw new Error(`unknown label ${a}`)
    return v
  }
  if (op === "nop") {
    // nop is sll $zero, $zero, 0: the all-zero word.
    const fields: [string, number, number][] = [["op", 0, 6], ["rs", 0, 5], ["rt", 0, 5], ["rd", 0, 5], ["shamt", 0, 5], ["funct", 0, 6]]
    return { format: "R", fields, word: 0 }
  }
  if (op in R_FUNCT) {
    let rs = 0, rt = 0, rd = 0, sh = 0
    if (op === "sll" || op === "srl" || op === "sra") [rd, rt, sh] = [regNum(args[0]), regNum(args[1]), imm(args[2])]
    else if (op === "jr") rs = regNum(args[0])
    else if (op === "mfhi" || op === "mflo") rd = regNum(args[0])
    else if (op.startsWith("mult") || op.startsWith("div")) [rs, rt] = [regNum(args[0]), regNum(args[1])]
    else [rd, rs, rt] = [regNum(args[0]), regNum(args[1]), regNum(args[2])]
    const fields: [string, number, number][] = [["op", 0, 6], ["rs", rs, 5], ["rt", rt, 5], ["rd", rd, 5], ["shamt", sh, 5], ["funct", R_FUNCT[op], 6]]
    return { format: "R", fields, word: pack(fields) }
  }
  if (op in I_OP) {
    let rs = 0, rt = 0, k = 0
    if (op === "beq" || op === "bne") {
      ;[rs, rt] = [regNum(args[0]), regNum(args[1])]
      const t = target(args[2])
      if ((t - (pc + 4)) % 4) throw new Error("branch target not word-aligned")
      k = (t - (pc + 4)) / 4
    } else if (op === "lui") [rt, k] = [regNum(args[0]), imm(args[1])]
    else if (/^(l[bhw]u?|s[bhw]|ll|sc)$/.test(op)) {
      rt = regNum(args[0])
      const [off, base] = memArg(args[1])
      ;[k, rs] = [off, regNum(base)]
    } else [rt, rs, k] = [regNum(args[0]), regNum(args[1]), imm(args[2])]
    // Logical immediates and lui are zero-extended (0…65535); everything else is a signed 16-bit value.
    const unsigned = ["andi", "ori", "xori", "lui"].includes(op)
    if (unsigned ? k < 0 || k > 65535 : k < -32768 || k > 32767) throw new Error(`immediate ${k} does not fit in 16 bits`)
    const fields: [string, number, number][] = [["op", I_OP[op], 6], ["rs", rs, 5], ["rt", rt, 5], ["immediate", k, 16]]
    return { format: "I", fields, word: pack(fields) }
  }
  if (op in J_OP) {
    const t = target(args[0])
    if (t % 4) throw new Error("jump target not word-aligned")
    if (((t >>> 28) & 0xf) !== (((pc + 4) >>> 28) & 0xf)) throw new Error("jump target outside the current 256 MB region")
    const fields: [string, number, number][] = [["op", J_OP[op], 6], ["address", (t >>> 2) & 0x3ffffff, 26]]
    return { format: "J", fields, word: pack(fields) }
  }
  throw new Error(`cannot encode ${op}`)
}

/** Encodes a whole program loaded at `base`; labels resolve to byte addresses. */
export function assemble(prog: Program, base = 0) {
  const addr: Record<string, number> = {}
  for (const [l, i] of Object.entries(prog.labels)) addr[l] = base + 4 * i
  return prog.instrs.map((ins, i) => ({ ins, pc: base + 4 * i, enc: encode(ins, base + 4 * i, addr) }))
}

/* ───────────── Register dependences (pipeline) ───────────── */

export type Deps = { writes?: number; reads: number[]; /** registers read only as store data */ storeData?: number; load: boolean; branch: boolean; jump: boolean }

export function deps(ins: Instr): Deps {
  const { op, args } = ins
  const r = (i: number) => regNum(args[i])
  const out = (d: Deps): Deps => ({ ...d, writes: d.writes === 0 ? undefined : d.writes, reads: d.reads.filter((x) => x !== 0) })
  if (["add", "addu", "sub", "subu", "and", "or", "xor", "nor", "slt", "sltu", "mul"].includes(op)) return out({ writes: r(0), reads: [r(1), r(2)], load: false, branch: false, jump: false })
  if (["sll", "srl", "sra"].includes(op)) return out({ writes: r(0), reads: [r(1)], load: false, branch: false, jump: false })
  if (["addi", "addiu", "andi", "ori", "xori", "slti", "sltiu"].includes(op)) return out({ writes: r(0), reads: [r(1)], load: false, branch: false, jump: false })
  if (op === "lui") return out({ writes: r(0), reads: [], load: false, branch: false, jump: false })
  if (/^(lw|lb|lbu|lh|lhu|ll)$/.test(op)) return out({ writes: r(0), reads: [regNum(memArg(args[1])[1])], load: true, branch: false, jump: false })
  if (/^(sw|sb|sh)$/.test(op)) {
    const d = r(0)
    return out({ reads: [regNum(memArg(args[1])[1]), d], storeData: d === 0 ? undefined : d, load: false, branch: false, jump: false })
  }
  if (op === "beq" || op === "bne") return out({ reads: [r(0), r(1)], load: false, branch: true, jump: false })
  if (op === "j") return { reads: [], load: false, branch: false, jump: true }
  if (op === "jal") return { writes: 31, reads: [], load: false, branch: false, jump: true }
  if (op === "jr") return out({ reads: [r(0)], load: false, branch: false, jump: true })
  if (op === "nop") return { reads: [], load: false, branch: false, jump: false }
  throw new Error(`no dependence rule for ${op}`)
}

/* ───────────── Execution ───────────── */

export type Machine = { regs: Int32Array; mem: Map<number, number>; hi: number; lo: number; pc: number; steps: number }

const s32 = (x: number) => x | 0
const u32 = (x: number) => x >>> 0

export function newMachine(init: Partial<Record<string, number>> = {}, memory: Record<number, number> = {}): Machine {
  const regs = new Int32Array(32)
  regs[29] = 0x7ffffffc // $sp, as in the slides' memory layout
  regs[28] = 0x10008000 // $gp
  for (const [k, v] of Object.entries(init)) regs[regNum(k)] = v ?? 0
  const mem = new Map<number, number>()
  for (const [a, v] of Object.entries(memory)) storeWord(mem, +a, v)
  return { regs, mem, hi: 0, lo: 0, pc: 0, steps: 0 }
}

function loadByte(mem: Map<number, number>, a: number) {
  return mem.get(u32(a)) ?? 0
}
function storeByte(mem: Map<number, number>, a: number, v: number) {
  mem.set(u32(a), v & 0xff)
}
/** Big-endian, as MIPS on the slides. */
export function loadWord(mem: Map<number, number>, a: number) {
  if (a % 4) throw new Error(`unaligned word access at ${a}`)
  return s32((loadByte(mem, a) << 24) | (loadByte(mem, a + 1) << 16) | (loadByte(mem, a + 2) << 8) | loadByte(mem, a + 3))
}
export function storeWord(mem: Map<number, number>, a: number, v: number) {
  if (a % 4) throw new Error(`unaligned word access at ${a}`)
  for (let i = 0; i < 4; i++) storeByte(mem, a + i, v >>> (24 - 8 * i))
}

const RETURN = 0x7ffffff0 // fake return address: jr $ra to here stops the run

/**
 * Runs a program from `entry` (a label or index) until it returns through the
 * initial $ra, falls off the end, or exceeds `maxSteps`. Instructions are word
 * addresses base + 4·i; jal stores pc + 4.
 */
export function run(prog: Program, m: Machine, opts: { entry?: string | number; maxSteps?: number; base?: number; /** stop quietly after this many instructions */ stopAfter?: number } = {}) {
  const base = opts.base ?? 0x00400000
  const at = (i: number) => base + 4 * i
  const idxOf = (addr: number) => (u32(addr) - base) / 4
  const labelAddr = (l: string) => {
    if (!(l in prog.labels)) throw new Error(`unknown label ${l}`)
    return at(prog.labels[l])
  }
  let pc = typeof opts.entry === "string" ? labelAddr(opts.entry) : at(opts.entry ?? 0)
  m.regs[31] = RETURN
  const R = m.regs
  const max = opts.maxSteps ?? 1_000_000
  while (true) {
    if (u32(pc) === RETURN) break
    const i = idxOf(pc)
    if (i === prog.instrs.length) break
    if (!Number.isInteger(i) || i < 0 || i > prog.instrs.length) throw new Error(`pc ${pc.toString(16)} outside the program`)
    if (++m.steps > max) throw new Error("too many steps (infinite loop?)")
    const ins = prog.instrs[i]
    const a = ins.args
    const g = (k: number) => R[regNum(a[k])]
    const set = (k: number, v: number) => {
      const n = regNum(a[k])
      if (n !== 0) R[n] = s32(v)
    }
    let next = pc + 4
    const ea = (k: number) => {
      const [off, b] = memArg(a[k])
      return s32(R[regNum(b)] + off)
    }
    const ov = (x: number, y: number, r: number) => ((x ^ r) & (y ^ r)) < 0
    switch (ins.op) {
      case "add": { const r = s32(g(1) + g(2)); if (ov(g(1), g(2), r)) throw new Error(`overflow in ${ins.text}`); set(0, r); break }
      case "addu": set(0, g(1) + g(2)); break
      case "sub": { const r = s32(g(1) - g(2)); if (ov(g(1), -g(2), r)) throw new Error(`overflow in ${ins.text}`); set(0, r); break }
      case "subu": set(0, g(1) - g(2)); break
      case "and": set(0, g(1) & g(2)); break
      case "or": set(0, g(1) | g(2)); break
      case "xor": set(0, g(1) ^ g(2)); break
      case "nor": set(0, ~(g(1) | g(2))); break
      case "slt": set(0, g(1) < g(2) ? 1 : 0); break
      case "sltu": set(0, u32(g(1)) < u32(g(2)) ? 1 : 0); break
      case "sll": set(0, g(1) << imm(a[2])); break
      case "srl": set(0, g(1) >>> imm(a[2])); break
      case "sra": set(0, g(1) >> imm(a[2])); break
      case "addi": { const r = s32(g(1) + imm(a[2])); if (ov(g(1), imm(a[2]), r)) throw new Error(`overflow in ${ins.text}`); set(0, r); break }
      case "addiu": set(0, g(1) + imm(a[2])); break
      case "andi": set(0, g(1) & (imm(a[2]) & 0xffff)); break
      case "ori": set(0, g(1) | (imm(a[2]) & 0xffff)); break
      case "xori": set(0, g(1) ^ (imm(a[2]) & 0xffff)); break
      case "slti": set(0, g(1) < imm(a[2]) ? 1 : 0); break
      case "sltiu": set(0, u32(g(1)) < u32(s32(imm(a[2]))) ? 1 : 0); break
      case "lui": set(0, (imm(a[1]) & 0xffff) << 16); break
      case "lw": set(0, loadWord(m.mem, ea(1))); break
      // One processor: nothing else can write between ll and sc, so sc always succeeds.
      case "ll": set(0, loadWord(m.mem, ea(1))); break
      case "sc": storeWord(m.mem, ea(1), g(0)); set(0, 1); break
      case "sw": storeWord(m.mem, ea(1), g(0)); break
      case "lb": set(0, (loadByte(m.mem, ea(1)) << 24) >> 24); break
      case "lbu": set(0, loadByte(m.mem, ea(1))); break
      case "sb": storeByte(m.mem, ea(1), g(0)); break
      case "lh": { const e = ea(1); set(0, (((loadByte(m.mem, e) << 8) | loadByte(m.mem, e + 1)) << 16) >> 16); break }
      case "lhu": { const e = ea(1); set(0, (loadByte(m.mem, e) << 8) | loadByte(m.mem, e + 1)); break }
      case "sh": { const e = ea(1); storeByte(m.mem, e, g(0) >>> 8); storeByte(m.mem, e + 1, g(0)); break }
      case "mult": { const p = BigInt(g(0)) * BigInt(g(1)); m.lo = Number(BigInt.asIntN(32, p)); m.hi = Number(BigInt.asIntN(32, p >> 32n)); break }
      case "div": { if (g(1) === 0) throw new Error("divide by zero"); m.lo = s32(Math.trunc(g(0) / g(1))); m.hi = s32(g(0) % g(1)); break }
      case "mul": set(0, Number(BigInt.asIntN(32, BigInt(g(1)) * BigInt(g(2))))); break
      case "mflo": set(0, m.lo); break
      case "mfhi": set(0, m.hi); break
      case "beq": if (g(0) === g(1)) next = labelAddr(a[2]); break
      case "bne": if (g(0) !== g(1)) next = labelAddr(a[2]); break
      case "j": next = labelAddr(a[0]); break
      case "jal": R[31] = pc + 4; next = labelAddr(a[0]); break
      case "jr": next = g(0); break
      case "nop": break
      // Pseudoinstructions the slides use.
      case "move": set(0, g(1)); break
      case "li": set(0, imm(a[1])); break
      case "blt": if (g(0) < g(1)) next = labelAddr(a[2]); break
      case "bgt": if (g(0) > g(1)) next = labelAddr(a[2]); break
      case "ble": if (g(0) <= g(1)) next = labelAddr(a[2]); break
      case "bge": if (g(0) >= g(1)) next = labelAddr(a[2]); break
      default:
        throw new Error(`cannot execute ${ins.op}`)
    }
    pc = next
    if (opts.stopAfter !== undefined && m.steps >= opts.stopAfter) break
  }
  m.pc = pc
  return m
}

/** Convenience: run a procedure with arguments in $a0–$a3 and return $v0. Checks $sp and $s0–$s7 are preserved. */
export function call(src: string, entry: string, args: number[], opts: { memory?: Record<number, number>; regs?: Record<string, number> } = {}) {
  const prog = parse(src)
  const init: Record<string, number> = { ...opts.regs }
  args.forEach((v, i) => (init[`a${i}`] = v))
  const saved = [16, 17, 18, 19, 20, 21, 22, 23].map((r) => [r, 1000 + r] as const)
  for (const [r, v] of saved) if (!(REG_NAMES[r] in init)) init[REG_NAMES[r]] = v
  const m = newMachine(init, opts.memory)
  const sp = m.regs[29]
  const before = saved.map(([r]) => m.regs[r])
  run(prog, m, { entry })
  if (m.regs[29] !== sp) throw new Error(`$sp not restored: ${m.regs[29]} vs ${sp}`)
  saved.forEach(([r], i) => {
    if (m.regs[r] !== before[i]) throw new Error(`$${REG_NAMES[r]} not preserved`)
  })
  return { v0: m.regs[2], machine: m }
}
