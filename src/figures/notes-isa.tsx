import type { FigureMap } from "./figure"
import { BitFields, BitStrips, Blocks } from "./kit"
import type { Block, Wire } from "./builders"
import { assemble, parse } from "@/lib/mips"
import { toBits } from "@/lib/numbers"

/* Encodings are computed by the MIPS encoder, so the figures cannot disagree with the checks. */
function fieldsOf(src: string, pc = 0) {
  const prog = parse(src)
  const [{ enc }] = assemble(prog, pc)
  return enc.fields.map(([name, value, width]) => ({
    label: name === "immediate" ? "constant or address" : name,
    bits: width,
    value: `${value < 0 ? value : value} = ${toBits(value < 0 ? value + 2 ** width : value, width)}`.split(" = ")[1],
  }))
}

const addFields = fieldsOf("add $t0, $s1, $s2")

/* ───────────── Addressing modes (P&H Figure 2.18 layout) ───────────── */

const FH = 26
function field(id: string, x: number, w: number, label: string, y = 0): Block {
  return { id, x, y, w, h: FH, label: [label], size: 12 }
}

const modes = {
  immediate: {
    blocks: [field("op", 0, 44, "op"), field("rs", 44, 40, "rs"), field("rt", 84, 40, "rt"), { ...field("imm", 124, 150, "Immediate"), fill: "accent" as const, tone: "accent" as const }],
    wires: [] as Wire[],
  },
  register: {
    blocks: [
      field("op", 0, 44, "op"),
      field("rs", 44, 40, "rs"),
      field("rt", 84, 40, "rt"),
      field("rd", 124, 40, "rd"),
      field("dots", 164, 40, ". . ."),
      field("funct", 204, 50, "funct"),
      { id: "regs", x: 300, y: 56, w: 110, h: 40, label: ["Registers"], size: 12.5 },
      { id: "reg", x: 300, y: 112, w: 110, h: 30, label: ["Register"], size: 12, fill: "accent" as const, tone: "accent" as const },
    ],
    wires: [{ id: "w", pts: [[144, 26], [144, 76], [300, 76]] }] as Wire[],
  },
  base: {
    blocks: [
      field("op", 0, 44, "op"),
      field("rs", 44, 40, "rs"),
      field("rt", 84, 40, "rt"),
      field("addr", 124, 150, "Address"),
      { id: "reg", x: 0, y: 64, w: 104, h: 30, label: ["Register"], size: 12 },
      { id: "add", kind: "ellipse" as const, x: 222, y: 60, w: 38, h: 38, label: ["+"], size: 15 },
      { id: "mem", x: 300, y: 50, w: 150, h: 58, label: ["Memory:", "byte, halfword, word"], size: 12, fill: "accent" as const, tone: "accent" as const },
    ],
    wires: [
      { id: "w1", pts: [[64, 26], [64, 64]] },
      { id: "w2", pts: [[104, 79], [222, 79]] },
      { id: "w3", pts: [[241, 26], [241, 60]] },
      { id: "w4", pts: [[260, 79], [300, 79]] },
    ] as Wire[],
  },
  pcrel: {
    blocks: [
      field("op", 0, 44, "op"),
      field("rs", 44, 40, "rs"),
      field("rt", 84, 40, "rt"),
      field("addr", 124, 150, "Address"),
      { id: "pc", x: 0, y: 64, w: 104, h: 30, label: ["PC"], size: 12 },
      { id: "x4", x: 222, y: 42, w: 38, h: 22, label: ["×4"], size: 11.5 },
      { id: "add", kind: "ellipse" as const, x: 222, y: 76, w: 38, h: 38, label: ["+"], size: 15 },
      { id: "mem", x: 300, y: 66, w: 120, h: 58, label: ["Memory:", "word"], size: 12, fill: "accent" as const, tone: "accent" as const },
    ],
    wires: [
      { id: "w1", pts: [[104, 79], [160, 79], [160, 95], [222, 95]] },
      { id: "w2", pts: [[241, 26], [241, 42]] },
      { id: "w3", pts: [[241, 64], [241, 76]] },
      { id: "w4", pts: [[260, 95], [300, 95]] },
    ] as Wire[],
  },
  pseudo: {
    blocks: [
      field("op", 0, 44, "op"),
      { ...field("addr", 44, 230, "Address (26 bits)") },
      { id: "pc", x: 0, y: 64, w: 104, h: 30, label: ["PC[31–28]"], size: 12 },
      { id: "cat", x: 170, y: 58, w: 104, h: 42, label: ["4 bits : 26 bits", ": 00"], size: 11.5 },
      { id: "mem", x: 316, y: 50, w: 120, h: 58, label: ["Memory:", "word"], size: 12, fill: "accent" as const, tone: "accent" as const },
    ],
    wires: [
      { id: "w1", pts: [[104, 79], [170, 79]] },
      { id: "w2", pts: [[222, 26], [222, 58]] },
      { id: "w3", pts: [[274, 79], [316, 79]] },
    ] as Wire[],
  },
}

/* ───────────── Memory layout and stack ───────────── */

const layoutBlocks: Block[] = [
  { id: "stack", x: 140, y: 0, w: 170, h: 46, label: ["Stack"], size: 13 },
  { id: "dyn", x: 140, y: 74, w: 170, h: 40, label: ["Dynamic data (heap)"], size: 12.5 },
  { id: "static", x: 140, y: 114, w: 170, h: 34, label: ["Static data"], size: 12.5 },
  { id: "text", x: 140, y: 148, w: 170, h: 34, label: ["Text (program code)"], size: 12.5 },
  { id: "res", x: 140, y: 182, w: 170, h: 28, label: ["Reserved"], size: 12, fill: "muted" },
]

function frame(top: number, items: string[], title: string): Block[] {
  return items.map((t, i) => ({ id: `${title}-${i}`, x: 0, y: top + i * 28, w: 150, h: 28, label: [t], size: 12 }))
}

export const isaNoteFigures: FigureMap = {
  "isa-r-format": {
    wide: true,
    caption: "R-format. `add $t0, $s1, $s2`: op = 0, rs = 17 (`$s1`), rt = 18 (`$s2`), rd = 8 (`$t0`), shamt = 0, funct = 32. Machine word 0x02324020.",
    node: <BitFields fields={addFields} />,
  },
  "isa-i-format": {
    wide: true,
    caption: "I-format: loads, stores, branches and immediate arithmetic. rt is the destination for loads and addi, the source for stores.",
    node: <BitFields fields={[{ label: "op", bits: 6 }, { label: "rs", bits: 5 }, { label: "rt", bits: 5 }, { label: "constant or address", bits: 16 }]} />,
  },
  "isa-j-format": {
    wide: true,
    caption: "J-format: j and jal. The 26-bit field is a word address inside the current 256 MB region.",
    node: <BitFields fields={[{ label: "op", bits: 6 }, { label: "address", bits: 26 }]} />,
  },
  "isa-mode-immediate": {
    caption: "1. Immediate addressing: the operand is the constant inside the instruction.",
    node: <Blocks {...modes.immediate} />,
  },
  "isa-mode-register": {
    caption: "2. Register addressing: the operand is a register named by a 5-bit field.",
    node: <Blocks {...modes.register} />,
  },
  "isa-mode-base": {
    caption: "3. Base (displacement) addressing: memory address = register + sign-extended 16-bit constant.",
    node: <Blocks {...modes.base} />,
  },
  "isa-mode-pcrel": {
    caption: "4. PC-relative addressing: target = (PC + 4) + offset × 4. The PC has already been incremented when the offset is added.",
    node: <Blocks {...modes.pcrel} />,
  },
  "isa-mode-pseudo": {
    caption: "5. Pseudodirect addressing: target = upper 4 bits of PC + 4, then the 26-bit field, then 00.",
    node: <Blocks {...modes.pseudo} />,
  },
  "isa-memory-layout": {
    caption: "MIPS memory layout. `$sp` starts at 7fff fffc (hex) and the stack grows down; `$gp` = 1000 8000 (hex) points into static data; text starts at 0040 0000 (hex).",
    node: (
      <Blocks
        blocks={layoutBlocks}
        wires={[
          { id: "down", pts: [[225, 50], [225, 66]] },
          { id: "up", pts: [[225, 74], [225, 58]], tone: "muted" },
          { id: "sp", pts: [[100, 6], [138, 6]], label: { at: [52, 6], text: "$sp → 7fff fffc", anchor: "middle" } },
          { id: "gp", pts: [[100, 120], [138, 120]], label: { at: [52, 120], text: "$gp → 1000 8000", anchor: "middle" } },
          { id: "pc", pts: [[100, 176], [138, 176]], label: { at: [52, 176], text: "pc → 0040 0000", anchor: "middle" } },
        ]}
        notes={[
          { at: [318, 148], text: "1000 0000", size: 11, anchor: "start", tone: "muted" },
          { at: [318, 208], text: "0", size: 11, anchor: "start", tone: "muted" },
        ]}
      />
    ),
  },
  "isa-fact-stack": {
    caption: "Stack during fact(2) → fact(1) → fact(0). Each call pushes an 8-byte frame: the return address at `4($sp)` and the argument at `0($sp)`. The stack grows towards lower addresses.",
    node: (
      <Blocks
        blocks={[
          ...frame(0, ["$ra (caller of fact)", "$a0 = 2"], "f2"),
          ...frame(64, ["$ra (inside fact)", "$a0 = 1"], "f1"),
          ...frame(128, ["$ra (inside fact)", "$a0 = 0"], "f0"),
        ]}
        wires={[{ id: "sp", pts: [[210, 142], [152, 142]], label: { at: [234, 142], text: "$sp", anchor: "middle" } }]}
        notes={[
          { at: [160, 28], text: "frame of fact(2)", size: 11, anchor: "start", tone: "muted" },
          { at: [160, 92], text: "frame of fact(1)", size: 11, anchor: "start", tone: "muted" },
          { at: [160, 172], text: "frame of fact(0)", size: 11, anchor: "start", tone: "muted" },
        ]}
      />
    ),
  },
  "isa-lui-ori": {
    caption: "Building 0x003D0900 in `$s0`: lui puts 61 in the upper half and clears the lower half; ori then fills the lower half with 2304.",
    node: (
      <BitStrips
        rows={[
          { label: "after lui $s0, 61", bits: toBits(61, 16) + "0".repeat(16), mark: [...Array(16).keys()], gapAfter: [3, 7, 11, 15, 19, 23, 27] },
          { label: "after ori $s0, $s0, 2304", bits: toBits(61, 16) + toBits(2304, 16), mark: [...Array(16).keys()].map((i) => i + 16), gapAfter: [3, 7, 11, 15, 19, 23, 27] },
        ]}
      />
    ),
  },
}
