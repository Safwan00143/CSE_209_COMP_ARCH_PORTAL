/*
  The single-cycle MIPS datapath with control and jumps (P&H Figure 4.24, as on
  Rifat Sir's slide 32), drawn once as data. `singleCycle(highlight)` returns the
  block spec with an instruction's active units and wires in the accent colour.
  Control signals are shown as labels at the unit they drive; the control unit
  lists all of them.
*/
import type { Block, BlockSpec, Wire } from "./builders"

const blocks: Block[] = [
  { id: "pc", x: 10, y: 262, w: 40, h: 56, label: ["PC"] },
  { id: "add4", kind: "alu", x: 120, y: 92, w: 50, h: 76, label: ["Add"], size: 11.5 },
  { id: "im", x: 70, y: 270, w: 120, h: 100, label: ["Instruction", "memory"], size: 12, ports: [{ at: [4, 20], text: "Read address" }] },
  {
    id: "control",
    kind: "ellipse",
    x: 370,
    y: 96,
    w: 104,
    h: 196,
    label: ["Control", "RegDst", "Jump", "Branch", "MemRead", "MemtoReg", "ALUOp", "MemWrite", "ALUSrc", "RegWrite"],
    size: 10.5,
  },
  { id: "regdst", kind: "mux", x: 380, y: 380, w: 20, h: 60, size: 9 },
  {
    id: "regs",
    x: 420,
    y: 320,
    w: 140,
    h: 130,
    label: [],
    size: 12,
    ports: [
      { at: [95, 62], text: "Registers", anchor: "middle" },
      { at: [4, 15], text: "Read reg 1" },
      { at: [4, 40], text: "Read reg 2" },
      { at: [4, 90], text: "Write reg" },
      { at: [4, 115], text: "Write data" },
      { at: [136, 32], text: "Read data 1", anchor: "end" },
      { at: [136, 75], text: "Read data 2", anchor: "end" },
    ],
  },
  { id: "signext", kind: "ellipse", x: 420, y: 470, w: 92, h: 40, label: ["Sign-extend"], size: 10.5 },
  { id: "alusrc", kind: "mux", x: 600, y: 380, w: 20, h: 60, size: 9 },
  { id: "alu", kind: "alu", x: 650, y: 330, w: 70, h: 110, label: ["ALU"], size: 12, ports: [{ at: [52, 27], text: "Zero", anchor: "end" }] },
  { id: "aluctl", kind: "ellipse", x: 630, y: 470, w: 90, h: 40, label: ["ALU control"], size: 10.5 },
  { id: "dmem", x: 770, y: 330, w: 120, h: 120, label: ["Data", "memory"], size: 12, ports: [{ at: [4, 55], text: "Address" }, { at: [4, 100], text: "Write data" }, { at: [116, 35], text: "Read data", anchor: "end" }] },
  { id: "memtoreg", kind: "mux", x: 920, y: 350, w: 20, h: 60, size: 9 },
  { id: "shl2b", kind: "ellipse", x: 640, y: 182, w: 62, h: 36, label: ["Shift", "left 2"], size: 10 },
  { id: "addb", kind: "alu", x: 740, y: 150, w: 60, h: 80, label: ["Add"], size: 11.5 },
  { id: "and", kind: "round", x: 790, y: 250, w: 38, h: 26, label: ["AND"], size: 10.5 },
  { id: "pcsrc", kind: "mux", x: 850, y: 60, w: 20, h: 60, size: 9 },
  { id: "shl2j", kind: "ellipse", x: 400, y: 12, w: 62, h: 36, label: ["Shift", "left 2"], size: 10 },
  { id: "jmux", kind: "mux", x: 940, y: 20, w: 20, h: 60, size: 9 },
]

const W = (id: string, pts: [number, number][], extra: Partial<Wire> = {}): Wire => ({ id, pts, ...extra })
const L = (at: [number, number], text: string, anchor: "start" | "middle" | "end" = "start") => ({ at, text, anchor, size: 10.5 })

const wires: Wire[] = [
  // Fetch
  W("pc-im", [[50, 290], [70, 290]]),
  W("pc-add4", [[60, 290], [60, 107], [120, 107]], { arrow: "end", dot: true }),
  W("four", [[96, 153], [120, 153]], { label: L([90, 153], "4", "end") }),
  W("pc4", [[170, 130], [200, 130], [200, 75], [850, 75]]),
  W("pc4-addb", [[725, 75], [725, 166], [740, 166]], { dot: true }),
  W("pc4-top", [[480, 75], [480, 44], [462, 44]], { dot: true, label: L([486, 58], "PC + 4 [31–28]") }),
  // Instruction bus and fields
  W("im-bus", [[190, 330], [225, 330]], { arrow: "none" }),
  W("bus", [[225, 30], [225, 525]], { arrow: "none" }),
  W("f-jump", [[225, 30], [400, 30]], { label: L([232, 20], "Instruction [25–0]") }),
  W("f-op", [[225, 190], [370, 190]], { label: L([232, 180], "Instruction [31–26]") }),
  W("f-rs", [[225, 335], [420, 335]], { label: L([232, 325], "Instruction [25–21]") }),
  W("f-rt", [[225, 360], [420, 360]], { label: L([232, 350], "Instruction [20–16]") }),
  W("f-rt-mux", [[335, 360], [335, 395], [380, 395]], { dot: true }),
  W("f-rd", [[225, 425], [380, 425]], { label: L([232, 415], "Instruction [15–11]") }),
  W("f-imm", [[225, 490], [420, 490]], { label: L([232, 480], "Instruction [15–0]") }),
  W("f-funct", [[225, 525], [675, 525], [675, 510]], { label: L([232, 515], "Instruction [5–0]") }),
  // Register file
  W("regdst-wr", [[400, 410], [420, 410]]),
  W("rd1", [[560, 352], [650, 352]]),
  W("rd2", [[560, 395], [600, 395]]),
  W("rd2-dmem", [[585, 395], [585, 460], [750, 460], [750, 430], [770, 430]], { dot: true }),
  W("se-out", [[512, 490], [575, 490], [575, 425], [600, 425]]),
  W("se-shl", [[575, 425], [575, 200], [640, 200]], { dot: true }),
  W("alusrc-alu", [[620, 410], [635, 410], [635, 418], [650, 418]]),
  W("aluctl-alu", [[675, 470], [675, 430]]),
  // ALU and memory
  W("alu-dmem", [[720, 385], [770, 385]]),
  W("alu-bypass", [[745, 385], [745, 312], [905, 312], [905, 395], [920, 395]], { dot: true }),
  W("dmem-mux", [[890, 365], [920, 365]]),
  W("wb", [[940, 380], [960, 380], [960, 545], [400, 545], [400, 435], [420, 435]]),
  W("zero", [[720, 357], [760, 357], [760, 270], [790, 270]]),
  // Branch
  W("shl-addb", [[702, 200], [720, 200], [720, 214], [740, 214]]),
  W("addb-pcsrc", [[800, 190], [830, 190], [830, 105], [850, 105]]),
  W("and-pcsrc", [[828, 263], [860, 263], [860, 120]], { label: L([866, 200], "PCSrc") }),
  // Jump
  W("jaddr", [[462, 30], [920, 30], [920, 35], [940, 35]], { label: L([560, 20], "Jump address [31–0]") }),
  W("pcsrc-jmux", [[870, 90], [900, 90], [900, 65], [940, 65]]),
  W("next-pc", [[960, 50], [985, 50], [985, -10], [0, -10], [0, 290], [10, 290]]),
]

/** Control-signal labels drawn at the unit each signal drives. */
const signalLabels = [
  { at: [390, 371] as [number, number], text: "RegDst" },
  { at: [490, 312] as [number, number], text: "RegWrite" },
  { at: [610, 371] as [number, number], text: "ALUSrc" },
  { at: [726, 490] as [number, number], text: "ALUOp", anchor: "start" as const },
  { at: [830, 322] as [number, number], text: "MemWrite" },
  { at: [830, 461] as [number, number], text: "MemRead" },
  { at: [930, 341] as [number, number], text: "MemtoReg" },
  { at: [809, 241] as [number, number], text: "Branch" },
  { at: [950, 11] as [number, number], text: "Jump" },
]

/** Units and wires each instruction class uses (the slides' highlighted paths). */
export const PATHS: Record<"R-format" | "lw" | "sw" | "beq" | "j", string[]> = {
  "R-format": ["pc", "pc-im", "im", "im-bus", "bus", "f-rs", "f-rt", "f-rd", "regdst", "regdst-wr", "regs", "rd1", "rd2", "alusrc", "alusrc-alu", "alu", "f-funct", "aluctl", "aluctl-alu", "alu-dmem", "alu-bypass", "memtoreg", "wb", "pc-add4", "add4", "pc4", "pcsrc", "pcsrc-jmux", "jmux", "next-pc", "f-op", "control"],
  lw: ["pc", "pc-im", "im", "im-bus", "bus", "f-rs", "f-rt", "f-rt-mux", "regdst", "regdst-wr", "regs", "rd1", "f-imm", "signext", "se-out", "alusrc", "alusrc-alu", "alu", "aluctl", "aluctl-alu", "alu-dmem", "dmem", "dmem-mux", "memtoreg", "wb", "pc-add4", "add4", "pc4", "pcsrc", "pcsrc-jmux", "jmux", "next-pc", "f-op", "control"],
  sw: ["pc", "pc-im", "im", "im-bus", "bus", "f-rs", "f-rt", "regs", "rd1", "rd2", "rd2-dmem", "f-imm", "signext", "se-out", "alusrc", "alusrc-alu", "alu", "aluctl", "aluctl-alu", "alu-dmem", "dmem", "pc-add4", "add4", "pc4", "pcsrc", "pcsrc-jmux", "jmux", "next-pc", "f-op", "control"],
  beq: ["pc", "pc-im", "im", "im-bus", "bus", "f-rs", "f-rt", "regs", "rd1", "rd2", "alusrc", "alusrc-alu", "alu", "aluctl", "aluctl-alu", "zero", "and", "and-pcsrc", "f-imm", "signext", "se-out", "se-shl", "shl2b", "shl-addb", "addb", "pc-add4", "add4", "pc4", "pc4-addb", "addb-pcsrc", "pcsrc", "pcsrc-jmux", "jmux", "next-pc", "f-op", "control"],
  j: ["pc", "pc-im", "im", "im-bus", "bus", "f-jump", "shl2j", "jaddr", "pc-add4", "add4", "pc4", "pc4-top", "jmux", "next-pc", "f-op", "control"],
}

const JUMP_PARTS = new Set(["shl2j", "jmux", "f-jump", "jaddr", "pc4-top", "pcsrc-jmux", "next-pc"])

export function singleCycle(highlight: string[] = [], opts: { noJump?: boolean } = {}): BlockSpec {
  // Without jumps (Figure 4.17): the branch mux feeds the PC directly.
  const ws = opts.noJump
    ? [...wires.filter((w) => !JUMP_PARTS.has(w.id)), { id: "next-pc", pts: [[870, 90], [900, 90], [900, -10], [0, -10], [0, 290], [10, 290]] as [number, number][] }]
    : wires
  const bs = opts.noJump
    ? blocks.filter((b) => !JUMP_PARTS.has(b.id)).map((b) => (b.id === "control" ? { ...b, label: b.label!.filter((l) => l !== "Jump") } : b))
    : blocks
  const labels = opts.noJump ? signalLabels.filter((s) => s.text !== "Jump") : signalLabels
  return {
    blocks: bs,
    wires: ws,
    highlight,
    notes: labels.map((s) => ({ at: s.at, text: s.text, size: 10, anchor: s.anchor ?? "middle", tone: "muted" as const })),
    maxWidth: 980,
  }
}
