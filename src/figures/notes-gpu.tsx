import type { FigureMap } from "./figure"
import { Blocks } from "./kit"
import type { Block, Wire } from "./builders"

const lab = (at: [number, number], text: string, anchor: "start" | "middle" | "end" = "middle") => ({ at, text, anchor, size: 10.5 })

/* (a) Intel: CPU – Front Side Bus – North Bridge; GPU on x16 PCIe to the North Bridge; DDR2 on the North Bridge; South Bridge below. */
const intelBlocks: Block[] = [
  { id: "cpu", x: 200, y: 0, w: 120, h: 54, label: ["Intel", "CPU"], size: 12 },
  { id: "nb", x: 200, y: 120, w: 120, h: 54, label: ["North", "Bridge"], size: 12 },
  { id: "ddr", x: 380, y: 124, w: 76, h: 46, label: ["DDR2", "Memory"], size: 11 },
  { id: "gpu", x: 0, y: 120, w: 130, h: 54, label: ["GPU"], size: 12.5, fill: "accent", tone: "accent" },
  { id: "gmem", x: 30, y: 230, w: 70, h: 50, label: ["GPU", "Memory"], size: 11, fill: "muted" },
  { id: "sb", x: 200, y: 250, w: 120, h: 54, label: ["South", "Bridge"], size: 12 },
]
const intelWires: Wire[] = [
  { id: "fsb", pts: [[260, 54], [260, 120]], arrow: "both", label: lab([268, 87], "Front Side Bus", "start") },
  { id: "pcie", pts: [[130, 147], [200, 147]], arrow: "both", label: lab([165, 108], "x16 PCI-Express Link") },
  { id: "mem", pts: [[320, 147], [380, 147]], arrow: "both" },
  { id: "sbl", pts: [[260, 174], [260, 250]], arrow: "both", label: lab([254, 212], "x4 PCIe derivative", "end") },
  { id: "memlab", pts: [[350, 190], [350, 190]], arrow: "none", label: lab([350, 205], "128-bit, 667 MT/s") },
  { id: "gm", pts: [[65, 174], [65, 230]], arrow: "both" },
  { id: "disp", pts: [[0, 147], [-40, 147]], label: lab([-44, 147], "display", "end") },
]

/* (b) AMD: CPU core + North Bridge on one chip (internal bus); DDR2 on it; HyperTransport to the chipset; GPU on x16 PCIe to the chipset. */
const amdBlocks: Block[] = [
  { id: "amd", x: 160, y: 0, w: 190, h: 200, label: ["AMD CPU"], size: 12, container: true, fill: "accent", tone: "accent" },
  { id: "core", x: 195, y: 34, w: 120, h: 50, label: ["CPU", "core"], size: 12 },
  { id: "nb", x: 195, y: 130, w: 120, h: 54, label: ["North", "Bridge"], size: 12 },
  { id: "ddr", x: 400, y: 134, w: 76, h: 46, label: ["DDR2", "Memory"], size: 11 },
  { id: "chip", x: 195, y: 270, w: 120, h: 50, label: ["Chipset"], size: 12 },
  { id: "gpu", x: 0, y: 270, w: 120, h: 50, label: ["GPU"], size: 12.5, fill: "accent", tone: "accent" },
  { id: "gmem", x: 25, y: 370, w: 70, h: 50, label: ["GPU", "Memory"], size: 11, fill: "muted" },
]
const amdWires: Wire[] = [
  { id: "ib", pts: [[255, 84], [255, 130]], arrow: "both", label: lab([249, 107], "internal bus", "end") },
  { id: "mem", pts: [[315, 157], [400, 157]], arrow: "both", label: lab([440, 118], "128-bit, 667 MT/s") },
  { id: "ht", pts: [[255, 184], [255, 270]], arrow: "both", label: lab([263, 235], "HyperTransport 1.03", "start") },
  { id: "pcie", pts: [[120, 295], [195, 295]], arrow: "both", label: lab([140, 252], "x16 PCI-Express Link") },
  { id: "gm", pts: [[60, 320], [60, 370]], arrow: "both" },
  { id: "disp", pts: [[0, 295], [-40, 295]], label: lab([-44, 295], "display", "end") },
]

/* CUDA hierarchy: grid → blocks → threads, with the matching memories. */
const cudaBlocks: Block[] = [
  { id: "grid", x: 0, y: 0, w: 430, h: 190, label: ["Grid (one kernel) · global memory shared by all threads"], size: 11, container: true },
  ...[0, 1, 2].map((i): Block => ({ id: `b${i}`, x: 18 + i * 140, y: 34, w: 124, h: 140, label: [`Thread block ${i}`], size: 11, container: true, fill: "muted" })),
  ...[0, 1, 2].flatMap((i) => [0, 1, 2].map((j): Block => ({ id: `t${i}${j}`, x: 30 + i * 140, y: 62 + j * 26, w: 100, h: 20, label: [`thread ${j}: local mem`], size: 9.5 }))),
  ...[0, 1, 2].map((i): Block => ({ id: `s${i}`, x: 30 + i * 140, y: 142, w: 100, h: 22, label: ["shared memory"], size: 10, fill: "accent", tone: "accent" })),
]

export const gpuNoteFigures: FigureMap = {
  "gpu-intel": {
    wide: true,
    caption: "(a) A PC with an Intel CPU: the GPU attaches to the North Bridge by a x16 PCI-Express link and has its own GPU memory; the CPU reaches the North Bridge over the front-side bus.",
    node: <Blocks blocks={intelBlocks} wires={intelWires} />,
  },
  "gpu-amd": {
    wide: true,
    caption: "(b) A PC with an AMD CPU: the North Bridge (memory controller) is on the CPU die; HyperTransport links it to the chipset, and the GPU attaches to the chipset by x16 PCI-Express.",
    node: <Blocks blocks={amdBlocks} wires={amdWires} />,
  },
  "gpu-cuda": {
    wide: true,
    caption: "The CUDA hierarchy: threads (with private local memory) form thread blocks (sharing fast on-chip shared memory and barrier synchronisation), and blocks form a grid that runs one kernel and shares global memory.",
    node: <Blocks blocks={cudaBlocks} wires={[]} />,
  },
}
