import type { FigureMap } from "./figure"
import { Blocks } from "./kit"
import type { Block, Wire } from "./builders"

/* Arithmetic circuit = combinational circuit in front of a parallel adder (slide, right of Fig. 9-8). */
const arithBlocks: Block[] = [
  { id: "comb", x: 120, y: 0, w: 130, h: 130, label: ["Combinational", "circuit"], size: 12.5 },
  { id: "add", x: 330, y: 20, w: 110, h: 90, label: ["n-bit", "parallel", "adder"], size: 12.5 },
]
const arithWires: Wire[] = [
  { id: "sel", pts: [[60, 22], [120, 22]], label: { at: [56, 22], text: "selection variables", anchor: "end", size: 11.5 } },
  { id: "a", pts: [[60, 64], [120, 64]], label: { at: [56, 64], text: "A", anchor: "end", size: 12 } },
  { id: "b", pts: [[60, 104], [120, 104]], label: { at: [56, 104], text: "B", anchor: "end", size: 12 } },
  { id: "x", pts: [[250, 44], [330, 44]], label: { at: [290, 32], text: "X", size: 12 } },
  { id: "y", pts: [[250, 88], [330, 88]], label: { at: [290, 76], text: "Y", size: 12 } },
  { id: "cin", pts: [[385, -26], [385, 20]], label: { at: [400, -18], text: "C_{in}", anchor: "start", size: 12 } },
  { id: "f", pts: [[440, 65], [490, 65]], label: { at: [496, 65], text: "F = X + Y + C_{in}", anchor: "start", size: 12 } },
]

/* Fig. 9-12: one stage of the arithmetic circuit and one of the logic circuit feed a 2-to-1 mux on s2. */
const combineBlocks: Block[] = [
  { id: "arith", x: 120, y: 30, w: 150, h: 60, label: ["One stage of", "arithmetic circuit"], size: 12 },
  { id: "logic", x: 120, y: 130, w: 150, h: 60, label: ["One stage of", "logic circuit"], size: 12 },
  { id: "mux", x: 330, y: 70, w: 80, h: 80, label: ["MUX"], size: 12, ports: [{ at: [6, 16], text: "0" }, { at: [6, 64], text: "1" }] },
]
const combineWires: Wire[] = [
  { id: "in", pts: [[40, 110], [120, 110]], label: { at: [36, 110], text: "Aᵢ, Bᵢ, s₁, s₀", anchor: "end", size: 11.5 } },
  { id: "in-a", pts: [[80, 110], [80, 60], [120, 60]], dot: false },
  { id: "in-l", pts: [[80, 110], [80, 160], [120, 160]] },
  { id: "ci", pts: [[195, -4], [195, 30]], label: { at: [205, 2], text: "Cᵢ", anchor: "start", size: 12 } },
  { id: "co", pts: [[240, 30], [240, 6], [300, 6]], label: { at: [306, 6], text: "Cᵢ₊₁", anchor: "start", size: 12 } },
  { id: "a-m", pts: [[270, 60], [300, 60], [300, 86], [330, 86]] },
  { id: "l-m", pts: [[270, 160], [300, 160], [300, 134], [330, 134]] },
  { id: "s2", pts: [[40, 224], [370, 224], [370, 150]], label: { at: [36, 224], text: "s₂ (select)", anchor: "end", size: 11.5 } },
  { id: "f", pts: [[410, 110], [450, 110]], label: { at: [456, 110], text: "Fᵢ", anchor: "start", size: 12 } },
]

/* The efficient design: X, Y and Z logic in front of one full adder per stage. */
const stageBlocks: Block[] = [
  { id: "x", x: 120, y: 0, w: 260, h: 40, label: ["Xᵢ = Aᵢ + s₂s₁′s₀′Bᵢ + s₂s₁s₀′Bᵢ′"], size: 12 },
  { id: "y", x: 120, y: 60, w: 260, h: 40, label: ["Yᵢ = s₀Bᵢ + s₁Bᵢ′"], size: 12 },
  { id: "z", x: 120, y: 120, w: 260, h: 40, label: ["Zᵢ = s₂′Cᵢ"], size: 12 },
  { id: "fa", x: 430, y: 30, w: 80, h: 100, label: ["Full", "adder"], size: 12.5 },
]
const stageWires: Wire[] = [
  { id: "in", pts: [[40, 50], [120, 50]], label: { at: [36, 50], text: "Aᵢ, Bᵢ, s₂, s₁, s₀", anchor: "end", size: 11.5 } },
  { id: "ci", pts: [[40, 140], [120, 140]], label: { at: [36, 140], text: "Cᵢ", anchor: "end", size: 12 } },
  { id: "xo", pts: [[380, 20], [405, 20], [405, 50], [430, 50]] },
  { id: "yo", pts: [[380, 80], [430, 80]] },
  { id: "zo", pts: [[380, 140], [405, 140], [405, 110], [430, 110]] },
  { id: "f", pts: [[510, 60], [550, 60]], label: { at: [556, 60], text: "Fᵢ = Xᵢ ⊕ Yᵢ ⊕ Zᵢ", anchor: "start", size: 12 } },
  { id: "co", pts: [[510, 110], [550, 110]], label: { at: [556, 110], text: "Cᵢ₊₁", anchor: "start", size: 12 } },
]

/* Fig. 9-14: setting the status bits. */
const statusBlocks: Block[] = [
  { id: "alu", x: 260, y: 0, w: 150, h: 120, label: ["8-bit ALU"], size: 13 },
  { id: "v", x: 0, y: 150, w: 40, h: 32, label: ["V"], size: 13 },
  { id: "z", x: 40, y: 150, w: 40, h: 32, label: ["Z"], size: 13 },
  { id: "s", x: 80, y: 150, w: 40, h: 32, label: ["S"], size: 13 },
  { id: "c", x: 120, y: 150, w: 40, h: 32, label: ["C"], size: 13 },
  { id: "xor", kind: "round", x: 0, y: 40, w: 60, h: 36, label: ["XOR"], size: 12 },
  { id: "nor", kind: "round", x: 150, y: 230, w: 70, h: 36, label: ["NOR"], size: 12 },
]
const statusWires: Wire[] = [
  { id: "c8", pts: [[260, 46], [60, 46]], label: { at: [160, 34], text: "C₈ (into the sign bit)", size: 11 } },
  { id: "c9", pts: [[260, 80], [140, 80], [140, 150]], label: { at: [200, 92], text: "C₉ = Cout", size: 11 } },
  { id: "c9x", pts: [[140, 80], [80, 80], [80, 70], [60, 70]] },
  { id: "xv", pts: [[20, 76], [20, 150]] },
  { id: "f", pts: [[335, 120], [335, 300]], label: { at: [345, 290], text: "F (8 bits)", anchor: "start", size: 11 } },
  { id: "fs", pts: [[300, 120], [300, 200], [100, 200], [100, 182]], label: { at: [210, 212], text: "F₇ (sign)", size: 11 } },
  { id: "fn", pts: [[320, 248], [220, 248]], label: { at: [270, 260], text: "all 8 bits of F", size: 11 } },
  { id: "nz", pts: [[150, 248], [60, 248], [60, 182]] },
  { id: "sel", pts: [[470, 60], [410, 60]], label: { at: [476, 60], text: "Select", anchor: "start", size: 11.5 } },
  { id: "ab", pts: [[335, -36], [335, 0]], label: { at: [345, -28], text: "A, B", anchor: "start", size: 11.5 } },
]

export const aluNoteFigures: FigureMap = {
  "alu-arith-structure": {
    caption: "An arithmetic circuit: a combinational circuit turns A, B and the selection variables into the adder inputs X and Y; the parallel adder computes $F = X + Y + C_{in}$.",
    node: <Blocks blocks={arithBlocks} wires={arithWires} />,
  },
  "alu-combine": {
    caption: "Combining the circuits (Fig. 9-12): s₂ selects the arithmetic stage or the logic stage. Simple, but it duplicates hardware.",
    node: <Blocks blocks={combineBlocks} wires={combineWires} />,
  },
  "alu-stage": {
    caption: "The efficient design: one full adder per stage, with logic in front producing Xᵢ, Yᵢ and Zᵢ. Zᵢ = s₂′Cᵢ forces the carries to 0 for the logic operations.",
    node: <Blocks blocks={stageBlocks} wires={stageWires} />,
  },
  "alu-status": {
    caption: "Setting the status bits (Fig. 9-14): C is the carry out, S the sign bit of F, Z = NOR of all bits of F, and V = C₈ ⊕ C₉.",
    node: <Blocks blocks={statusBlocks} wires={statusWires} />,
  },
}
