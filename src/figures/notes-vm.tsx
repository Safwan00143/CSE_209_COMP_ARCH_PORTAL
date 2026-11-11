import type { FigureMap } from "./figure"
import { BitFields, Blocks } from "./kit"
import type { Block, Wire } from "./builders"

/* Translation using a page table (slide 60). */
const ptBlocks: Block[] = [
  { id: "va", x: 0, y: 0, w: 440, h: 30, label: ["Virtual address: virtual page number (31–12) | page offset (11–0)"], size: 11 },
  { id: "ptr", x: 0, y: 70, w: 110, h: 40, label: ["Page table", "register"], size: 11 },
  { id: "pt", x: 150, y: 60, w: 200, h: 170, label: [], ports: [{ at: [10, 14], text: "Valid", anchor: "start" }, { at: [70, 14], text: "Physical page number", anchor: "start" }, { at: [100, 90], text: "Page table", anchor: "middle" }, { at: [100, 110], text: "(indexed by VPN)", anchor: "middle" }] },
  { id: "pa", x: 0, y: 270, w: 440, h: 30, label: ["Physical address: physical page number (29–12) | page offset (11–0)"], size: 11 },
]
const ptWires: Wire[] = [
  { id: "ptr-pt", pts: [[110, 90], [150, 90]] },
  { id: "vpn", pts: [[120, 30], [120, 48], [250, 48], [250, 60]], label: { at: [200, 40], text: "VPN (20 bits)" } },
  { id: "ppn", pts: [[250, 230], [250, 270]], label: { at: [258, 250], text: "PPN (18 bits)", anchor: "start" } },
  { id: "off", pts: [[330, 30], [330, 44], [370, 44], [370, 255], [330, 255], [330, 270]], label: { at: [376, 150], text: "page offset (12 bits), copied", anchor: "start" } },
  { id: "valid", pts: [[160, 230], [160, 250], [120, 250]], label: { at: [114, 250], text: "if 0: page fault", anchor: "end" } },
]

/* TLB and cache interaction (slide 69/70, P&H Figure 5.31): read and write. */
const W = 190
const fb = (id: string, x: number, y: number, text: string[], kind: Block["kind"] = "rect", w = W, h = 44): Block => ({ id, kind, x, y, w, h, label: text, size: 11 })
const flowBlocks: Block[] = [
  fb("va", 150, 0, ["Virtual address"], "pill", 140, 30),
  fb("tlb", 125, 56, ["TLB access"]),
  fb("tlbhit", 145, 128, ["TLB hit?"], "diamond", 150, 64),
  fb("tlbmiss", 380, 138, ["TLB miss exception"], "rect", 170, 44),
  fb("pa", 125, 222, ["Physical address"]),
  fb("write", 145, 296, ["Write?"], "diamond", 150, 64),
  fb("read", 0, 390, ["Try to read data", "from cache"], "rect", 170, 50),
  fb("rhit", 10, 466, ["Cache hit?"], "diamond", 150, 64),
  fb("deliver", 0, 560, ["Deliver data", "to the CPU"], "rect", 170, 50),
  fb("rstall", 190, 474, ["Cache miss stall", "while reading block"], "rect", 160, 50),
  fb("wbit", 360, 390, ["Write access", "bit on?"], "diamond", 160, 70),
  fb("wprot", 560, 400, ["Write protection", "exception"], "rect", 140, 50),
  fb("wtry", 360, 490, ["Try to write data", "to cache"], "rect", 170, 50),
  fb("whit", 370, 566, ["Cache hit?"], "diamond", 150, 64),
  fb("wdo", 340, 660, ["Write data into cache, update", "dirty bit, put data and address", "into write buffer"], "rect", 210, 66),
  fb("wstall", 580, 574, ["Cache miss stall", "while reading block"], "rect", 160, 50),
]
const lab = (at: [number, number], text: string, anchor: "start" | "end" | "middle" = "start") => ({ at, text, anchor, size: 10.5 })
const flowWires: Wire[] = [
  { id: "f1", pts: [[220, 30], [220, 56]] },
  { id: "f2", pts: [[220, 100], [220, 128]] },
  { id: "f3", pts: [[295, 160], [380, 160]], label: lab([310, 150], "No") },
  { id: "f4", pts: [[220, 192], [220, 222]], label: lab([226, 207], "Yes") },
  { id: "f5", pts: [[220, 266], [220, 296]] },
  { id: "f6", pts: [[145, 328], [85, 328], [85, 390]], label: lab([110, 318], "No", "middle") },
  { id: "f7", pts: [[295, 328], [440, 328], [440, 390]], label: lab([370, 318], "Yes", "middle") },
  { id: "f8", pts: [[85, 440], [85, 466]] },
  { id: "f9", pts: [[85, 530], [85, 560]], label: lab([91, 545], "Yes") },
  { id: "f10", pts: [[160, 498], [190, 498]], label: lab([175, 488], "No", "middle") },
  { id: "f11", pts: [[520, 425], [560, 425]], label: lab([540, 415], "No", "middle") },
  { id: "f12", pts: [[440, 460], [440, 490]], label: lab([446, 475], "Yes") },
  { id: "f13", pts: [[445, 540], [445, 566]] },
  { id: "f14", pts: [[445, 630], [445, 660]], label: lab([451, 645], "Yes") },
  { id: "f15", pts: [[520, 598], [580, 598]], label: lab([550, 588], "No", "middle") },
]

export const vmNoteFigures: FigureMap = {
  "vm-page-table": {
    wide: true,
    caption: "Translation using a page table (slide 60): the page table register points to the table; the virtual page number indexes it; the physical page number is joined with the unchanged page offset.",
    node: <Blocks blocks={ptBlocks} wires={ptWires} />,
  },
  "vm-split": {
    wide: true,
    caption: "A 32-bit virtual address with 4 KiB pages: 20-bit virtual page number, 12-bit page offset.",
    node: <BitFields fields={[{ label: "virtual page number", bits: 20, tone: "accent" }, { label: "page offset", bits: 12 }]} />,
  },
  "vm-tlb-flow": {
    wide: true,
    caption: "Processing a read or a write through the TLB and the cache (the slides' flow chart, P&H Figure 5.31). A TLB miss and a write to a read-only page both raise exceptions handled by the OS.",
    node: <Blocks blocks={flowBlocks} wires={flowWires} />,
  },
}
