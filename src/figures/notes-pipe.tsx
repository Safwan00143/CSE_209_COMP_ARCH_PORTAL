import type { FigureMap } from "./figure"
import { Blocks, Pipeline, StateDiagram } from "./kit"
import type { Block, Wire } from "./builders"
import { pipeSpec } from "./pipe"
import { twoBit } from "./kit-demo"

export const SRC = {
  threeLw: "lw $1, 100($0)\nlw $2, 200($0)\nlw $3, 300($0)",
  addSub: "add $s0, $t0, $t1\nsub $t2, $s0, $t3",
  loadUse: "lw $s0, 20($t1)\nsub $t2, $s0, $t3",
  schedBefore: "lw $t1, 0($t0)\nlw $t2, 4($t0)\nadd $t3, $t1, $t2\nsw $t3, 12($t0)\nlw $t4, 8($t0)\nadd $t5, $t1, $t4\nsw $t5, 16($t0)",
  schedAfter: "lw $t1, 0($t0)\nlw $t2, 4($t0)\nlw $t4, 8($t0)\nadd $t3, $t1, $t2\nsw $t3, 12($t0)\nadd $t5, $t1, $t4\nsw $t5, 16($t0)",
  aluSeq: "sub $2, $1, $3\nand $12, $2, $5\nor $13, $6, $2\nadd $14, $2, $2\nsw $15, 100($2)",
  double: "add $1, $1, $2\nadd $1, $1, $3\nadd $1, $1, $4",
  stallSeq: "lw $2, 20($1)\nand $4, $2, $5\nor $8, $2, $6\nadd $9, $4, $2\nslt $1, $6, $7",
  branchTaken: "sub $10, $4, $8\nbeq $1, $3, L\nand $12, $2, $5\nor $13, $2, $6\nadd $14, $4, $2\nslt $15, $6, $7\nnop\nnop\nL: lw $4, 50($7)",
  brAlu2: "add $4, $5, $6\nadd $1, $2, $3\nbeq $1, $4, target\ntarget: nop",
  brLoad2: "lw $1, 0($2)\nadd $4, $5, $6\nbeq $1, $4, target\ntarget: nop",
  brAlu1: "add $4, $5, $6\nadd $1, $2, $3\nbeq $1, $4, target\ntarget: nop",
  brLoad1: "lw $1, 0($2)\nbeq $1, $0, target\ntarget: nop",
}

const stages: Block[] = [
  ["IF", "Instruction fetch", "from memory"],
  ["ID", "Instruction decode", "& register read"],
  ["EX", "Execute, or", "calculate address"],
  ["MEM", "Access memory", "operand"],
  ["WB", "Write result back", "to register"],
].map(([id, a, b], i) => ({ id, x: i * 132, y: 0, w: 120, h: 70, label: [id, a, b], size: 11.5 }))
const stageWires: Wire[] = [0, 1, 2, 3].map((i) => ({ id: `s${i}`, pts: [[i * 132 + 120, 35], [i * 132 + 132, 35]] }))

const fig = (src: string, opt: Parameters<typeof pipeSpec>[1], forwards = true) => <Pipeline {...pipeSpec(src, opt, { forwards }).spec} />

export const pipeNoteFigures: FigureMap = {
  "pipe-stages": { wide: true, caption: "The five MIPS pipeline stages, one step per stage.", node: <Blocks blocks={stages} wires={stageWires} /> },
  "pipe-three-lw": {
    wide: true,
    caption: "Three loads, pipelined: a new instruction starts every cycle (200 ps). The third finishes in cycle 7, so 7 × 200 = 1400 ps, against 3 × 800 = 2400 ps single-cycle.",
    node: fig(SRC.threeLw, { forwarding: true }),
  },
  "dh-add-sub-nofwd": {
    wide: true,
    caption: "Without forwarding, `sub` must wait in ID until `add` writes `$s0` in WB (cycle 5): two stall cycles.",
    node: fig(SRC.addSub, { forwarding: false }),
  },
  "dh-add-sub-fwd": {
    wide: true,
    caption: "With forwarding, the ALU result goes from the EX/MEM register straight into `sub`'s EX: no stall.",
    node: fig(SRC.addSub, { forwarding: true }),
  },
  "dh-load-use": {
    wide: true,
    caption: "Load-use hazard: the loaded value exists only at the end of MEM, so `sub` stalls one cycle and then gets it from MEM/WB.",
    node: fig(SRC.loadUse, { forwarding: true }),
  },
  "dh-sched-before": {
    wide: true,
    caption: "A = B + E; C = B + F as compiled: two load-use stalls, 13 cycles.",
    node: fig(SRC.schedBefore, { forwarding: true }),
  },
  "dh-sched-after": {
    wide: true,
    caption: "The third load moved up: no load is followed by its use, 11 cycles.",
    node: fig(SRC.schedAfter, { forwarding: true }),
  },
  "dh-alu-seq": {
    wide: true,
    caption: "Slide 53: `and` gets `$2` from EX/MEM, `or` from MEM/WB; `add` reads it from the register file (written in the first half of cycle 5). No stalls.",
    node: fig(SRC.aluSeq, { forwarding: true }),
  },
  "dh-double": {
    wide: true,
    caption: "Double data hazard: the third add needs `$1`, which is in both EX/MEM (newer) and MEM/WB (older). It must take the newer value from EX/MEM.",
    node: fig(SRC.double, { forwarding: true }),
  },
  "dh-stall-seq": {
    wide: true,
    caption: "Slide 73: the hazard detection unit holds `and` in ID (and `or` in IF) for one cycle, and a bubble goes down the pipeline.",
    node: fig(SRC.stallSeq, { forwarding: true }),
  },
  "bh-taken": {
    wide: true,
    caption: "Slide 78: beq decided in ID and taken. The `and` fetched behind it is flushed; the target `lw` is fetched next. Penalty: 1 cycle.",
    node: fig(SRC.branchTaken, { forwarding: true, branchIn: "ID", outcomes: [true] }, false),
  },
  "bh-alu-2nd": {
    wide: true,
    caption: "Comparison registers produced by the 2nd and 3rd preceding ALU instructions: forwarding to ID solves it, no stall.",
    node: fig(SRC.brAlu2.replace("add $1, $2, $3\n", "add $1, $2, $3\nadd $7, $8, $9\n"), { forwarding: true, branchIn: "ID" }),
  },
  "bh-load-2nd": {
    wide: true,
    caption: "A load two instructions before the branch: one stall (beq waits in ID).",
    node: fig(SRC.brLoad2, { forwarding: true, branchIn: "ID" }),
  },
  "bh-alu-1st": {
    wide: true,
    caption: "An ALU instruction right before the branch: one stall.",
    node: fig(SRC.brAlu1, { forwarding: true, branchIn: "ID" }),
  },
  "bh-load-1st": {
    wide: true,
    caption: "A load right before the branch: two stalls, since the value exists only after MEM.",
    node: fig(SRC.brLoad1, { forwarding: true, branchIn: "ID" }),
  },
  "bh-2bit": {
    caption: "2-bit predictor (slide 84). ST, WT = predict taken (strong, weak); WN, SN = predict not taken. The prediction changes only after two mispredictions in a row.",
    node: (
      <StateDiagram
        machine={twoBit}
        layout={{
          pos: { ST: [0, 0], WT: [190, 0], WN: [190, 130], SN: [0, 130] },
          radius: { ST: 24, WT: 24, WN: 24, SN: 24 },
          names: { ST: "ST", WT: "WT", WN: "WN", SN: "SN" },
          edges: {
            "ST>ST": { loop: 180 },
            "SN>SN": { loop: 180 },
            "ST>WT": { bend: 22 },
            "WT>ST": { bend: 22 },
            "WT>WN": { bend: 22 },
            "WN>WT": { bend: 22 },
            "WN>SN": { bend: 22 },
            "SN>WN": { bend: 22 },
          },
          startFrom: 225,
        }}
      />
    ),
  },
}
