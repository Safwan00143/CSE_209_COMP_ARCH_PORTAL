import type { FigureMap } from "./figure"
import { BitFields, Blocks, Pyramid } from "./kit"
import type { Block, Wire } from "./builders"
import { splitAddress } from "@/lib/cache"

const s1024 = splitAddress(32, 4, 1024)
const s64 = splitAddress(32, 16, 64)

/* Direct-mapped cache with 1024 one-word blocks (slide 26). */
const dmBlocks: Block[] = [
  { id: "addr", x: 0, y: 0, w: 420, h: 30, label: ["Address (31–0): tag 31–12 | index 11–2 | byte offset 1–0"], size: 11.5 },
  { id: "cache", x: 60, y: 70, w: 300, h: 150, label: [], ports: [{ at: [20, 14], text: "Index", anchor: "start" }, { at: [80, 14], text: "Valid", anchor: "start" }, { at: [140, 14], text: "Tag (20)", anchor: "start" }, { at: [220, 14], text: "Data (32)", anchor: "start" }, { at: [20, 40], text: "0 … 1023", anchor: "start" }] },
  { id: "cmp", kind: "ellipse", x: 120, y: 250, w: 60, h: 34, label: ["="], size: 14 },
  { id: "and", kind: "round", x: 120, y: 310, w: 60, h: 28, label: ["AND"], size: 11 },
]
const dmWires: Wire[] = [
  { id: "idx", pts: [[300, 30], [300, 50], [40, 50], [40, 130], [60, 130]], label: { at: [192, 40], text: "index (10 bits) selects one entry" } },
  { id: "tag", pts: [[80, 30], [80, 44], [20, 44], [20, 267], [120, 267]], label: { at: [14, 160], text: "tag (20)", anchor: "end" } },
  { id: "stag", pts: [[230, 220], [230, 267], [180, 267]] },
  { id: "eq", pts: [[150, 284], [150, 310]] },
  { id: "valid", pts: [[150, 220], [150, 236], [100, 236], [100, 324], [120, 324]] },
  { id: "hit", pts: [[180, 324], [240, 324]], label: { at: [248, 324], text: "Hit", anchor: "start" } },
  { id: "data", pts: [[320, 220], [320, 324]], label: { at: [328, 300], text: "Data (32 bits)", anchor: "start" } },
]

export const memNoteFigures: FigureMap = {
  "mem-pyramid": {
    caption: "The memory hierarchy (slide 3): everything lives on disk; recently used items are copied into DRAM, and the most recent into the SRAM cache next to the CPU.",
    node: (
      <Pyramid
        levels={[
          { name: "Registers", note: "inside the CPU" },
          { name: "Cache (SRAM)", note: "0.5–2.5 ns, $2000–$5000 per GB" },
          { name: "Main memory (DRAM)", note: "50–70 ns, $20–$75 per GB" },
          { name: "Magnetic disk", note: "5–20 ms, $0.20–$2 per GB" },
        ]}
      />
    ),
  },
  "cache-dm-1024": {
    wide: true,
    caption: "A direct-mapped cache with 1024 one-word blocks (slide 26): the index picks an entry; it is a hit if that entry is valid and its stored tag equals the address's tag.",
    node: <Blocks blocks={dmBlocks} wires={dmWires} />,
  },
  "cache-split-1024": {
    wide: true,
    caption: "1024 blocks of one word: 2-bit byte offset, 10-bit index, 20-bit tag.",
    node: <BitFields fields={[{ label: "tag", bits: s1024.tag, tone: "accent" }, { label: "index", bits: s1024.index }, { label: "byte offset", bits: s1024.offset, tone: "muted" }]} />,
  },
  "cache-split-64x16": {
    wide: true,
    caption: "64 blocks of 16 bytes (slide 27): 4-bit offset, 6-bit index, 22-bit tag.",
    node: <BitFields fields={[{ label: "tag", bits: s64.tag, tone: "accent" }, { label: "index", bits: s64.index }, { label: "offset", bits: s64.offset, tone: "muted" }]} />,
  },
}
