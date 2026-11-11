/*
  Pure builders that turn data (a pipeline schedule, a list of bit fields, a
  block diagram description) into a Scene. They are kept free of React so the
  figure checker and the verify script can call them directly.
*/
import { sceneTextWidth, type Fill, type Line, type Pt, type Scene, type Shape, type Text, type Tone } from "./scene"

/* ───────────── Pipeline timing diagram ───────────── */

export type CellKind = "stage" | "stall" | "bubble" | "flush" | "idle"
export type PipeCell = { cycle: number; text: string; kind?: CellKind }
export type PipeRow = { label: string; cells: PipeCell[]; kind?: "bubble" }
export type Forward = { from: [row: number, cycle: number]; to: [row: number, cycle: number]; label?: string }
export type PipeSpec = { rows: PipeRow[]; forwards?: Forward[]; firstCycle?: number; lastCycle?: number; cellW?: number }

const CELL_H = 26
const ROW_GAP = 12
const HEAD_H = 24

export function pipelineScene(spec: PipeSpec): Scene {
  const cycles = spec.rows.flatMap((r) => r.cells.map((c) => c.cycle))
  const first = spec.firstCycle ?? Math.min(...cycles)
  const last = spec.lastCycle ?? Math.max(...cycles)
  const cw = spec.cellW ?? 44
  const labelW = Math.max(...spec.rows.map((r) => sceneTextWidth({ at: [0, 0], text: r.label, size: 12.5, mono: true }))) + 14
  const x0 = labelW
  const shapes: Shape[] = []
  const texts: Text[] = []
  const lines: Line[] = []
  const colX = (c: number) => x0 + (c - first) * cw
  const rowY = (i: number) => HEAD_H + i * (CELL_H + ROW_GAP)
  for (let c = first; c <= last; c++) texts.push({ at: [colX(c) + cw / 2, HEAD_H / 2 - 2], text: String(c), size: 11.5, tone: "muted" })
  spec.rows.forEach((r, i) => {
    const y = rowY(i)
    texts.push({ at: [labelW - 10, y + CELL_H / 2], text: r.label, size: 12.5, anchor: "end", mono: true, tone: r.kind === "bubble" ? "muted" : "ink" })
    for (const cell of r.cells) {
      const kind = cell.kind ?? "stage"
      if (kind === "idle") continue
      const fill: Fill = kind === "stall" ? "second" : kind === "bubble" || kind === "flush" ? "muted" : "card"
      const idx = shapes.length
      shapes.push({ kind: "rect", x: colX(cell.cycle) + 1.5, y, w: cw - 3, h: CELL_H, fill, dash: kind === "bubble" || kind === "flush", tone: kind === "stall" ? "second" : "ink" })
      const small = cell.text.length > 4
      texts.push({ at: [colX(cell.cycle) + cw / 2, y + CELL_H / 2], text: cell.text, size: small ? 10.5 : 12, inside: idx, tone: kind === "stage" ? "ink" : kind === "stall" ? "second" : "muted", italic: kind !== "stage" })
    }
  })
  for (const f of spec.forwards ?? []) {
    const [ri, ci] = f.from
    const [rj, cj] = f.to
    const p: Pt = [colX(ci) + cw - 7, rowY(ri) + CELL_H]
    const q: Pt = [colX(cj) + 7, rowY(rj)]
    lines.push({ id: `fw-${ri}-${ci}-${rj}-${cj}`, pts: [p, q], tone: "accent", arrow: "end", width: 1.6 })
  }
  const w = colX(last + 1) + 4
  const h = rowY(spec.rows.length) - ROW_GAP + 6
  return { x: 0, y: 0, w, h, shapes, lines, texts }
}

/* ───────────── Bit fields: instruction formats and address splits ───────────── */

export type Field = { label: string; bits: number; value?: string; tone?: "accent" | "second" | "muted" }
export type FieldSpec = { fields: Field[]; title?: string; /** px per bit */ scale?: number; positions?: boolean; caption?: string }

export function bitFieldScene(spec: FieldSpec): Scene {
  const total = spec.fields.reduce((s, f) => s + f.bits, 0)
  const scale = spec.scale ?? Math.max(8, Math.min(22, 560 / total))
  const shapes: Shape[] = []
  const texts: Text[] = []
  const top = spec.positions === false ? 4 : 20
  const hasValues = spec.fields.some((f) => f.value)
  const boxH = hasValues ? 46 : 32
  let x = 0
  let hi = total - 1
  for (const f of spec.fields) {
    // Proportional to the bit count, but never narrower than the field's own labels.
    const need = Math.max(
      sceneTextWidth({ at: [0, 0], text: f.label, size: 12.5 }),
      f.value ? sceneTextWidth({ at: [0, 0], text: f.value, size: 11.5, mono: true }) : 0,
      sceneTextWidth({ at: [0, 0], text: `${f.bits} bits`, size: 10.5 }),
      spec.positions === false ? 0 : sceneTextWidth({ at: [0, 0], text: `${hi}${hi - f.bits + 1}`, size: 10.5 }) + 6,
    )
    const w = Math.max(f.bits * scale, need + 8)
    const idx = shapes.length
    const fill: Fill = f.tone ?? "card"
    shapes.push({ kind: "rect", x, y: top, w, h: boxH, fill, tone: f.tone === "accent" ? "accent" : f.tone === "second" ? "second" : "ink" })
    texts.push({ at: [x + w / 2, top + (hasValues ? 14 : boxH / 2)], text: f.label, size: 12.5, inside: idx })
    if (f.value) texts.push({ at: [x + w / 2, top + 32], text: f.value, size: 11.5, mono: true, inside: idx, tone: "accent" })
    if (spec.positions !== false) {
      const lo = hi - f.bits + 1
      if (f.bits === 1) texts.push({ at: [x + w / 2, 9], text: String(hi), size: 10.5, tone: "muted" })
      else {
        texts.push({ at: [x + 2, 9], text: String(hi), size: 10.5, anchor: "start", tone: "muted" })
        texts.push({ at: [x + w - 2, 9], text: String(lo), size: 10.5, anchor: "end", tone: "muted" })
      }
      hi = lo - 1
    }
    texts.push({ at: [x + w / 2, top + boxH + 11], text: `${f.bits} bit${f.bits === 1 ? "" : "s"}`, size: 10.5, tone: "muted" })
    x += w
  }
  return { x: -1, y: 0, w: x + 2, h: top + boxH + 20, shapes, lines: [], texts }
}

/* ───────────── Register / bit strips (arithmetic) ───────────── */

export type Strip = { label: string; bits: string; /** indices (from the left) drawn in the accent colour */ mark?: number[]; gapAfter?: number[] }

export function bitStripScene(rows: Strip[]): Scene {
  const cw = 20
  const ch = 24
  const labelW = Math.max(...rows.map((r) => sceneTextWidth({ at: [0, 0], text: r.label, size: 12.5 }))) + 12
  const shapes: Shape[] = []
  const texts: Text[] = []
  let maxX = 0
  rows.forEach((r, i) => {
    const y = i * (ch + 8)
    texts.push({ at: [labelW - 8, y + ch / 2], text: r.label, size: 12.5, anchor: "end" })
    let x = labelW
    ;[...r.bits].forEach((b, k) => {
      const idx = shapes.length
      const marked = r.mark?.includes(k)
      shapes.push({ kind: "rect", x, y, w: cw, h: ch, fill: marked ? "accent" : "card", tone: marked ? "accent" : "ink" })
      texts.push({ at: [x + cw / 2, y + ch / 2], text: b, size: 12.5, mono: true, inside: idx, tone: marked ? "accent" : "ink" })
      x += cw + (r.gapAfter?.includes(k) ? 6 : 0)
    })
    maxX = Math.max(maxX, x)
  })
  return { x: 0, y: -2, w: maxX + 2, h: rows.length * (ch + 8) - 4, shapes, lines: [], texts }
}

/* ───────────── Block diagrams and flowcharts ───────────── */

export type Block = {
  id: string
  kind?: Shape["kind"]
  x: number
  y: number
  w: number
  h: number
  /** One string per line, centred in the block. */
  label?: string[]
  size?: number
  fill?: Fill
  tone?: Tone
  bold?: boolean
  dash?: boolean
  container?: boolean
  /** Small labels inside the block at given offsets from its top-left, e.g. port names. */
  ports?: { at: Pt; text: string; anchor?: "start" | "middle" | "end" }[]
}

export type Wire = {
  id: string
  pts: Pt[]
  tone?: Tone
  /** Arrowhead at the end by default; "none" for a plain wire. */
  arrow?: Line["arrow"] | "none"
  dash?: boolean
  width?: number
  dot?: boolean
  curve?: boolean
  /** Label placed at a point, on a halo. */
  label?: { at: Pt; text: string; anchor?: "start" | "middle" | "end"; size?: number }
}

export type BlockSpec = { blocks: Block[]; wires: Wire[]; notes?: Text[]; pad?: number; maxWidth?: number; highlight?: string[] }

/**
 * A block diagram from hand-placed blocks and wires. Anything whose id is in
 * `highlight` is drawn in the accent colour and thicker (an instruction's active path).
 */
export function blockScene(spec: BlockSpec): Scene {
  const hl = new Set(spec.highlight ?? [])
  const shapes: Shape[] = []
  const texts: Text[] = []
  const lines: Line[] = []
  for (const b of spec.blocks) {
    const on = hl.has(b.id)
    const idx = shapes.length
    shapes.push({
      id: b.id,
      kind: b.kind ?? "rect",
      x: b.x,
      y: b.y,
      w: b.w,
      h: b.h,
      fill: on ? "accent" : (b.fill ?? "card"),
      tone: on ? "accent" : (b.tone ?? "ink"),
      bold: on || b.bold,
      dash: b.dash,
      container: b.container,
    })
    const lab = b.label ?? []
    const size = b.size ?? 13
    const lh = size * 1.25
    if (b.kind === "mux") {
      // Letters stacked vertically, as on the slides.
      const letters = lab.length ? lab : ["M", "u", "x"]
      letters.forEach((l, i) => texts.push({ at: [b.x + b.w / 2, b.y + b.h / 2 + (i - (letters.length - 1) / 2) * size], text: l, size: size - 1, inside: idx, tone: on ? "accent" : "ink" }))
    } else {
      const cy = b.container ? b.y + 12 : b.y + b.h / 2
      lab.forEach((l, i) =>
        texts.push({
          at: [b.kind === "alu" ? b.x + b.w * 0.42 : b.x + b.w / 2, cy + (i - (lab.length - 1) / 2) * lh],
          text: l,
          size,
          inside: idx,
          bold: b.container,
          tone: on ? "accent" : "ink",
        }),
      )
    }
    for (const p of b.ports ?? []) texts.push({ at: [b.x + p.at[0], b.y + p.at[1]], text: p.text, size: 10.5, anchor: p.anchor ?? "start", inside: idx, tone: "muted" })
  }
  for (const w of spec.wires) {
    const on = hl.has(w.id)
    lines.push({ id: w.id, pts: w.pts, tone: on ? "accent" : (w.tone ?? "ink"), arrow: w.arrow === "none" ? undefined : (w.arrow ?? "end"), dash: w.dash, width: on ? 2.4 : w.width, dot: w.dot, curve: w.curve })
    if (w.label) texts.push({ at: w.label.at, text: w.label.text, size: w.label.size ?? 11, anchor: w.label.anchor ?? "middle", halo: true, of: [w.id], tone: on ? "accent" : "muted" })
  }
  texts.push(...(spec.notes ?? []))
  const pad = spec.pad ?? 8
  const xs = [...shapes.flatMap((s) => [s.x, s.x + s.w]), ...lines.flatMap((l) => l.pts.map((p) => p[0]))]
  const ys = [...shapes.flatMap((s) => [s.y, s.y + s.h]), ...lines.flatMap((l) => l.pts.map((p) => p[1]))]
  for (const t of texts) {
    const w = sceneTextWidth(t)
    const a = t.anchor ?? "middle"
    xs.push(a === "start" ? t.at[0] + w : a === "end" ? t.at[0] - w : t.at[0] - w / 2, a === "start" ? t.at[0] : a === "end" ? t.at[0] : t.at[0] + w / 2)
    ys.push(t.at[1] - (t.size ?? 14) * 0.6, t.at[1] + (t.size ?? 14) * 0.6)
  }
  const x = Math.min(...xs) - pad
  const y = Math.min(...ys) - pad
  return { x, y, w: Math.max(...xs) + pad - x, h: Math.max(...ys) + pad - y, shapes, lines, texts, maxWidth: spec.maxWidth }
}

/* ───────────── Memory-hierarchy pyramid ───────────── */

export function pyramidScene(levels: { name: string; note: string }[]): Scene {
  const H = 40
  const W = 380
  const shapes: Shape[] = []
  const texts: Text[] = []
  const lines: Line[] = []
  const n = levels.length
  levels.forEach((lv, i) => {
    const topW = 70 + (W - 70) * (i / n)
    const y = i * H
    const idx = shapes.length
    const x = (W - topW) / 2
    shapes.push({ kind: "rect", x, y: y + 2, w: topW, h: H - 4, fill: i === 0 ? "accent" : "card", tone: i === 0 ? "accent" : "ink" })
    texts.push({ at: [W / 2, y + H / 2], text: lv.name, size: 13, inside: idx, bold: true })
    texts.push({ at: [W + 18, y + H / 2], text: lv.note, size: 11.5, anchor: "start", tone: "muted" })
  })
  lines.push({ id: "faster", pts: [[-16, n * H - 6], [-16, 6]], arrow: "end", tone: "muted" })
  texts.push({ at: [-24, (n * H) / 2], text: "faster, smaller", size: 11, rotate: -90, tone: "muted", of: ["faster"] })
  const noteW = Math.max(...levels.map((l) => sceneTextWidth({ at: [0, 0], text: l.note, size: 11.5 })))
  return { x: -40, y: -2, w: W + 18 + noteW + 48, h: n * H + 6, shapes, lines, texts }
}
