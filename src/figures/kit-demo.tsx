import type { FigureMap } from "./figure"
import { BitFields, BitStrips, Blocks, Pipeline, Pyramid, StateDiagram } from "./kit"
import type { FA } from "@/lib/fsm"

/** The 2-bit predictor from Rifat Sir's Chapter 4 slides: change the prediction only after two misses in a row. */
export const twoBit: FA = {
  kind: "fa",
  states: ["ST", "WT", "WN", "SN"],
  alphabet: ["T", "N"],
  start: "SN",
  accept: [],
  delta: [
    ["ST", "T", "ST"],
    ["ST", "N", "WT"],
    ["WT", "T", "ST"],
    ["WT", "N", "WN"],
    ["WN", "T", "WT"],
    ["WN", "N", "SN"],
    ["SN", "T", "WN"],
    ["SN", "N", "SN"],
  ],
}

/** Every kit element once, so the look can be checked on /figures. Ids start with "kit-". */
export const kitDemoFigures: FigureMap = {
  "kit-pipeline": {
    caption: "Load-use hazard: the add waits one cycle (amber), then gets `$t1` forwarded from MEM/WB (green arrow).",
    wide: true,
    node: (
      <Pipeline
        rows={[
          { label: "lw  $t1, 0($t0)", cells: ["IF", "ID", "EX", "MEM", "WB"].map((t, i) => ({ cycle: 1 + i, text: t })) },
          {
            label: "add $t2, $t1, $t3",
            cells: [
              { cycle: 2, text: "IF" },
              { cycle: 3, text: "ID" },
              { cycle: 4, text: "stall", kind: "stall" },
              { cycle: 5, text: "EX" },
              { cycle: 6, text: "MEM" },
              { cycle: 7, text: "WB" },
            ],
          },
        ]}
        forwards={[{ from: [0, 4], to: [1, 5] }]}
      />
    ),
  },
  "kit-fields": {
    caption: "R-format: six fields, 32 bits.",
    wide: true,
    node: (
      <BitFields
        fields={[
          { label: "op", bits: 6, value: "000000" },
          { label: "rs", bits: 5, value: "10001" },
          { label: "rt", bits: 5, value: "10010" },
          { label: "rd", bits: 5, value: "01000" },
          { label: "shamt", bits: 5, value: "00000" },
          { label: "funct", bits: 6, value: "100000" },
        ]}
      />
    ),
  },
  "kit-address": {
    caption: "A 32-bit byte address split for a direct-mapped cache with 1024 blocks of 4 words.",
    wide: true,
    node: <BitFields fields={[{ label: "tag", bits: 18, tone: "accent" }, { label: "index", bits: 10 }, { label: "word", bits: 2 }, { label: "byte", bits: 2, tone: "muted" }]} />,
  },
  "kit-strips": {
    caption: "Registers after one step of the refined multiplier.",
    node: <BitStrips rows={[{ label: "Multiplicand", bits: "0010" }, { label: "Product", bits: "00010011", mark: [0, 1, 2, 3], gapAfter: [3] }]} />,
  },
  "kit-blocks": {
    caption: "A block diagram: blocks, wires, a mux and an ALU.",
    node: (
      <Blocks
        highlight={["pc", "w1"]}
        blocks={[
          { id: "pc", x: 0, y: 30, w: 40, h: 50, label: ["PC"] },
          { id: "im", x: 80, y: 10, w: 110, h: 90, label: ["Instruction", "memory"] },
          { id: "mux", kind: "mux", x: 230, y: 25, w: 22, h: 60 },
          { id: "alu", kind: "alu", x: 290, y: 15, w: 60, h: 80, label: ["ALU"] },
        ]}
        wires={[
          { id: "w1", pts: [[40, 55], [80, 55]] },
          { id: "w2", pts: [[190, 55], [230, 55]] },
          { id: "w3", pts: [[252, 55], [290, 55]], label: { at: [271, 42], text: "32" } },
        ]}
      />
    ),
  },
  "kit-pyramid": {
    caption: "The memory hierarchy: each level is a cache for the one below.",
    node: (
      <Pyramid
        levels={[
          { name: "Registers", note: "< 1 ns" },
          { name: "Cache (SRAM)", note: "0.5–2.5 ns" },
          { name: "Main memory (DRAM)", note: "50–70 ns" },
          { name: "Disk / flash", note: "5–20 ms (disk)" },
        ]}
      />
    ),
  },
  "kit-predictor": {
    caption: "2-bit predictor: the prediction flips only after two wrong guesses in a row.",
    node: (
      <StateDiagram
        machine={twoBit}
        layout={{
          pos: { ST: [0, 0], WT: [190, 0], WN: [190, 130], SN: [0, 130] },
          names: { ST: "ST", WT: "WT", WN: "WN", SN: "SN" },
          radius: { ST: 24, WT: 24, WN: 24, SN: 24 },
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
