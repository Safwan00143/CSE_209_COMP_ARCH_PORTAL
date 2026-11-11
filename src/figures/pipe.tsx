/*
  Pipeline timing diagrams drawn straight from the pipeline simulator, so a
  figure, its stall count and its forwarding arrows always agree with the check.
*/
import type { PipeRow, PipeSpec } from "./builders"
import { cellsOf, simulate, type PipeOptions, type PipeResult } from "@/lib/pipeline"

export function pipeSpec(src: string, opt: PipeOptions, extra: { forwards?: boolean; lastCycle?: number } = {}): { spec: PipeSpec; result: PipeResult } {
  const r = simulate(src, opt)
  // Interleave flushed fetches right after the instruction that caused them.
  const rows: PipeRow[] = []
  const rowOf: number[] = []
  r.seq.forEach((d, i) => {
    rowOf[i] = rows.length
    rows.push({ label: d.instr.text, cells: cellsOf(d) })
    for (const f of r.flushed.filter((x) => x.after === i)) {
      // Fetched (and held while the branch waits), then turned into a bubble: its control bits are zeroed.
      const cells: PipeRow["cells"] = [{ cycle: f.ifCycle, text: "IF", kind: "stage" }]
      for (let c = f.ifCycle + 1; c <= f.ifLast; c++) cells.push({ cycle: c, text: "IF", kind: "stall" })
      cells.push({ cycle: f.ifLast + 1, text: "flush", kind: "flush" })
      rows.push({ label: f.instr ? `${f.instr.text} (flushed)` : "(flushed)", cells, kind: "bubble" })
    }
  })
  const forwards =
    extra.forwards === false
      ? []
      : r.forwards
          .filter((f) => f.path !== "register file")
          .map((f) => ({ from: [rowOf[f.from], f.fromCycle] as [number, number], to: [rowOf[f.to], f.toCycle] as [number, number] }))
  return { spec: { rows, forwards, firstCycle: 1, lastCycle: extra.lastCycle ?? Math.max(r.cycles, ...rows.flatMap((x) => x.cells.map((c) => c.cycle))) }, result: r }
}
