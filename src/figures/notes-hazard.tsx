import type { FigureMap } from "./figure"
import { Blocks } from "./kit"
import type { Block, Wire } from "./builders"

/* Forwarding (P&H Figure 4.56 simplified): ID/EX, EX/MEM, MEM/WB registers, two 3-input muxes, the ALU and the forwarding unit. */
const fwBlocks: Block[] = [
  { id: "idex", x: 0, y: 0, w: 46, h: 300, label: ["ID/EX"], size: 11 },
  { id: "muxa", kind: "mux", x: 130, y: 30, w: 24, h: 80, size: 10 },
  { id: "muxb", kind: "mux", x: 130, y: 150, w: 24, h: 80, size: 10 },
  { id: "alu", kind: "alu", x: 200, y: 50, w: 70, h: 160, label: ["ALU"], size: 12 },
  { id: "exmem", x: 320, y: 0, w: 52, h: 300, label: ["EX/MEM"], size: 11 },
  { id: "dmem", x: 410, y: 90, w: 90, h: 80, label: ["Data", "memory"], size: 11.5 },
  { id: "memwb", x: 540, y: 0, w: 56, h: 300, label: ["MEM/WB"], size: 11 },
  { id: "wbmux", kind: "mux", x: 630, y: 110, w: 22, h: 60, size: 10 },
  { id: "fu", kind: "ellipse", x: 150, y: 280, w: 150, h: 54, label: ["Forwarding", "unit"], size: 12 },
]
const fwWires: Wire[] = [
  { id: "rd1", pts: [[46, 50], [130, 50]], label: { at: [67, 40], text: "Reg[rs]", size: 10.5 } },
  { id: "rd2", pts: [[46, 170], [130, 170]], label: { at: [67, 160], text: "Reg[rt]", size: 10.5 } },
  { id: "a-alu", pts: [[154, 70], [200, 70]] },
  { id: "b-alu", pts: [[154, 190], [200, 190]] },
  { id: "alu-exmem", pts: [[270, 130], [320, 130]] },
  { id: "exmem-dmem", pts: [[372, 130], [410, 130]] },
  { id: "dmem-memwb", pts: [[500, 130], [540, 130]] },
  { id: "memwb-mux", pts: [[596, 130], [630, 130]] },
  { id: "fwd-exmem", pts: [[346, 300], [346, 400], [110, 400], [110, 75]], tone: "accent" },
  { id: "fwd-exmem-b", pts: [[110, 195], [130, 195]], tone: "accent", dot: true },
  { id: "fwd-exmem-a", pts: [[110, 75], [130, 75]], tone: "accent" },
  { id: "fwd-memwb", pts: [[660, 140], [680, 140], [680, 420], [90, 420], [90, 95], [130, 95]], tone: "second" },
  { id: "fwd-memwb-b", pts: [[90, 215], [130, 215]], tone: "second", dot: true },
  { id: "rs", pts: [[30, 300], [30, 307], [150, 307]], label: { at: [36, 318], text: "Rs, Rt", anchor: "start" } },
  { id: "rdex", pts: [[360, 300], [360, 316], [298, 316]], label: { at: [366, 312], text: "EX/MEM.RegisterRd", anchor: "start" } },
  { id: "rdwb", pts: [[570, 300], [570, 326], [296, 326]], label: { at: [576, 326], text: "MEM/WB.RegisterRd", anchor: "start" } },
  { id: "fa", pts: [[230, 281], [142, 110]], label: { at: [156, 128], text: "ForwardA", anchor: "start", size: 9.5 } },
  { id: "fb", pts: [[165, 282], [142, 230]], label: { at: [156, 245], text: "ForwardB", anchor: "start", size: 9.5 } },
]

/* Hazard detection unit (P&H Figure 4.60 simplified). */
const hdBlocks: Block[] = [
  { id: "pc", x: 0, y: 140, w: 40, h: 50, label: ["PC"], size: 12 },
  { id: "im", x: 70, y: 120, w: 90, h: 90, label: ["Instruction", "memory"], size: 11 },
  { id: "ifid", x: 190, y: 60, w: 46, h: 230, label: ["IF/ID"], size: 11 },
  { id: "ctl", kind: "ellipse", x: 280, y: 90, w: 80, h: 44, label: ["Control"], size: 11.5 },
  { id: "mux0", kind: "mux", x: 400, y: 82, w: 22, h: 60, size: 10 },
  { id: "regs", x: 290, y: 170, w: 100, h: 80, label: ["Registers"], size: 11.5 },
  { id: "idex", x: 450, y: 60, w: 50, h: 230, label: ["ID/EX"], size: 11 },
  { id: "hdu", kind: "ellipse", x: 230, y: -40, w: 160, h: 50, label: ["Hazard", "detection unit"], size: 11.5 },
]
const hdWires: Wire[] = [
  { id: "pc-im", pts: [[40, 165], [70, 165]] },
  { id: "im-ifid", pts: [[160, 165], [190, 165]] },
  { id: "ifid-ctl", pts: [[236, 112], [280, 112]] },
  { id: "ctl-mux", pts: [[360, 102], [400, 102]] },
  { id: "zero", pts: [[380, 135], [400, 135]], label: { at: [374, 135], text: "0", anchor: "end" } },
  { id: "mux-idex", pts: [[422, 112], [450, 112]] },
  { id: "ifid-regs", pts: [[236, 210], [290, 210]] },
  { id: "regs-idex", pts: [[390, 210], [450, 210]] },
  { id: "rsrt", pts: [[260, 60], [260, 10]], label: { at: [266, 38], text: "IF/ID.Rs, Rt", anchor: "start" } },
  { id: "memread", pts: [[475, 60], [475, -15], [390, -15]], label: { at: [481, 20], text: "ID/EX.MemRead, ID/EX.Rt", anchor: "start" } },
  { id: "stall-mux", pts: [[390, -5], [411, -5], [411, 82]], tone: "second" },
  { id: "pcwrite", pts: [[230, -15], [20, -15], [20, 140]], tone: "second", label: { at: [120, -27], text: "PCWrite" } },
  { id: "ifidwrite", pts: [[240, -2], [213, -2], [213, 60]], tone: "second", label: { at: [207, 24], text: "IF/IDWrite", anchor: "end" } },
]

export const hazardNoteFigures: FigureMap = {
  "dh-forwarding-unit": {
    wide: true,
    caption: "The forwarding unit compares the source registers in ID/EX with the destinations in EX/MEM and MEM/WB, and sets the ALU input muxes: ForwardA/B = 00 register file, 10 from EX/MEM (green), 01 from MEM/WB (amber).",
    node: <Blocks blocks={fwBlocks} wires={fwWires} />,
  },
  "dh-hazard-unit": {
    wide: true,
    caption: "The hazard detection unit, in ID. On a load-use hazard it holds the PC and IF/ID (PCWrite = IF/IDWrite = 0) and selects 0 for the control bits entering ID/EX, which sends a bubble down the pipeline.",
    node: <Blocks blocks={hdBlocks} wires={hdWires} />,
  },
}
