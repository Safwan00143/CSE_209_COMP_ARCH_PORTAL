import type { FigureMap } from "../figure"
import { BitFields, Blocks } from "../kit"
import type { Block, Wire } from "../builders"
import { singleCycle } from "../datapath"
import { Pipeline } from "../kit"
import { pipeSpec } from "../pipe"

export const B22_Q1B = `lw $t0, 0($s0)
add $t1, $t0, $s1
beq $t1, $zero, L1
add $t2, $t1, $s2
bne $t2, $zero, L2
sub $t3, $t2, $t1
L1: and $t4, $t1, $t2
L2: or $t5, $t3, $t4`
const q1b = (outcomes: boolean[]) => <Pipeline {...pipeSpec(B22_Q1B, { forwarding: true, branchIn: "ID", outcomes }).spec} />

/* Q5(a)(i): connections from MIPS-v22 instruction bits to the register file's three number inputs. */
const regBlocks: Block[] = [
  { id: "im", x: 0, y: 40, w: 120, h: 150, label: ["Instruction", "memory"], size: 12 },
  { id: "m1", kind: "mux", x: 300, y: 20, w: 22, h: 64, size: 10, ports: [{ at: [3, 14], text: "0" }, { at: [3, 52], text: "1" }] },
  { id: "m3", kind: "mux", x: 300, y: 150, w: 22, h: 64, size: 10, ports: [{ at: [3, 14], text: "0" }, { at: [3, 52], text: "1" }] },
  {
    id: "rf",
    x: 380,
    y: 20,
    w: 160,
    h: 200,
    label: [],
    ports: [
      { at: [6, 32], text: "Read register 1" },
      { at: [6, 102], text: "Read register 2" },
      { at: [6, 162], text: "Write register" },
      { at: [80, 186], text: "Register file", anchor: "middle" },
    ],
  },
]
const regWires: Wire[] = [
  { id: "bus", pts: [[120, 115], [150, 115]], arrow: "none", label: { at: [135, 104], text: "32" } },
  { id: "busv", pts: [[150, 34], [150, 196]], arrow: "none" },
  { id: "rs-r", pts: [[150, 34], [300, 34]], label: { at: [160, 24], text: "[15–11] rs (R-type)", anchor: "start" } },
  { id: "rs-i", pts: [[150, 72], [300, 72]], label: { at: [160, 62], text: "[20–16] rs (I-type)", anchor: "start" } },
  { id: "m1-rf", pts: [[322, 52], [380, 52]], label: { at: [351, 42], text: "5" } },
  { id: "rt", pts: [[150, 122], [380, 122]], label: { at: [160, 112], text: "[25–21] rt (both formats)", anchor: "start" } },
  { id: "rd-r", pts: [[150, 164], [300, 164]], label: { at: [160, 154], text: "[20–16] rd (R-type)", anchor: "start" } },
  { id: "rt-i", pts: [[150, 196], [300, 196]], label: { at: [160, 186], text: "[25–21] rt (I-type)", anchor: "start" } },
  { id: "m3-rf", pts: [[322, 182], [380, 182]], label: { at: [351, 172], text: "5" } },
  { id: "s1", pts: [[311, -6], [311, 20]], label: { at: [317, -4], text: "RegSrc", anchor: "start" } },
  { id: "s3", pts: [[311, 236], [311, 214]], label: { at: [317, 236], text: "RegDst", anchor: "start" } },
]

export const paperB22Figures: FigureMap = {
  "b22-1b-nt": { wide: true, caption: "Q1(b)(ii): both branches not taken. Three stall cycles (amber), 15 cycles.", node: q1b([false, false]) },
  "b22-1b-t1": { wide: true, caption: "Q1(b)(iii): the first branch is taken. The add after it is flushed; 12 cycles.", node: q1b([true]) },
  "b22-1b-t2": { wide: true, caption: "Q1(b)(iv): the first branch not taken, the second taken. The sub after bne is flushed; 14 cycles.", node: q1b([false, true]) },
  "b22-5a-formats": {
    wide: true,
    caption: "MIPS-v22 formats from the paper: R-type is opcode, rt, rd, rs, shamt, funct; I-type is opcode, rt, rs, constant.",
    node: (
      <>
        <BitFields fields={[{ label: "opcode", bits: 6 }, { label: "rt", bits: 5 }, { label: "rd", bits: 5 }, { label: "rs", bits: 5 }, { label: "shamt", bits: 5 }, { label: "funct", bits: 6 }]} />
        <div className="h-3" />
        <BitFields fields={[{ label: "opcode", bits: 6 }, { label: "rt", bits: 5 }, { label: "rs", bits: 5 }, { label: "constant or address", bits: 16 }]} />
      </>
    ),
  },
  "b22-5a-regfile": {
    wide: true,
    caption: "Q5(a)(i): Read register 2 is wired straight to bits 25–21; Read register 1 and Write register each need a 2-to-1 mux, because rs and the destination sit in different fields in the two formats. Every connection is 5 bits.",
    node: <Blocks blocks={regBlocks} wires={regWires} />,
  },
  "b22-8a-datapath": {
    wide: true,
    caption: "The paper's figure: the single-cycle datapath with control (no jump).",
    node: <Blocks {...singleCycle([], { noJump: true })} />,
  },
}
