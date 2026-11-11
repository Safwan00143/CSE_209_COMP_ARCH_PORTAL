import type { FigureMap } from "../figure"
import { BitFields, Pipeline } from "../kit"
import { pipeSpec } from "../pipe"

export const B16_Q2B = "lw $1, 100($2)\nadd $1, $1, $2\nbeq $1, $2, TARGET\nTARGET: or $5, $6, $7"

export const paperB16Figures: FigureMap = {
  "b16-2b": {
    wide: true,
    caption: "Branch decided in ID: one load-use stall before add, then one more before beq, which needs add's result in ID (forwarded from EX/MEM to the ID comparator). The last row is the branch target.",
    node: <Pipeline {...pipeSpec(B16_Q2B, { forwarding: true, branchIn: "ID" }, { forwards: true }).spec} />,
  },
  "b16-3b-va": {
    wide: true,
    caption: "The 40-bit virtual address, split for the 2-way, 256-entry TLB (128 sets): the 26-bit virtual page number is a 19-bit TLB tag and a 7-bit TLB index.",
    node: <BitFields fields={[{ label: "TLB tag", bits: 19 }, { label: "TLB index", bits: 7 }, { label: "page offset", bits: 14 }]} />,
  },
  "b16-3b-pa": {
    wide: true,
    caption: "The 36-bit physical address as the 16 KB direct-mapped cache sees it (256 blocks of 64 bytes).",
    node: <BitFields fields={[{ label: "cache tag", bits: 22 }, { label: "index", bits: 8 }, { label: "word", bits: 4 }, { label: "byte", bits: 2 }]} />,
  },
  "b16-4a": {
    wide: true,
    caption: "Processor 3's cache, assuming 16 KiB of data: 1024 four-word blocks in 512 sets of 2.",
    node: <BitFields fields={[{ label: "tag", bits: 19 }, { label: "index", bits: 9 }, { label: "word", bits: 2 }, { label: "byte", bits: 2 }]} />,
  },
}
