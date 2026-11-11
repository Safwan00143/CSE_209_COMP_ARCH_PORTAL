/*
  A "scene" is the plain geometry of one figure: boxes, lines and text. Every
  figure type in the kit (pipeline diagrams, datapaths, flowcharts, bit fields,
  instruction formats) builds a scene with a pure function, and one component
  (SceneSvg in kit.tsx) draws it. scripts/check-figures.tsx runs sceneIssues()
  over every scene on the site, so a label that overlaps another label, sits on
  a line it does not belong to, spills out of its box, or leaves the view box
  is caught without opening a browser.
*/
import { textWidth, type Pt } from "./diagram-geometry"

export type { Pt }

export type Tone = "ink" | "accent" | "second" | "muted"
export type Fill = "card" | "accent" | "second" | "muted" | "none" | "ink"

export type Shape = {
  id?: string
  kind: "rect" | "round" | "ellipse" | "diamond" | "mux" | "alu" | "pill"
  x: number
  y: number
  w: number
  h: number
  fill?: Fill
  tone?: Tone
  dash?: boolean
  /** Thicker outline, e.g. the path an instruction uses. */
  bold?: boolean
  /** A grouping frame: other shapes and labels may sit inside it. */
  container?: boolean
}

export type Line = {
  id?: string
  pts: Pt[]
  tone?: Tone
  arrow?: "end" | "start" | "both"
  dash?: boolean
  width?: number
  /** Draw as a smooth curve through the points instead of straight segments. */
  curve?: boolean
  /** A dot at the first point (a wire junction). */
  dot?: boolean
}

export type Text = {
  at: Pt
  text: string
  size?: number
  anchor?: "start" | "middle" | "end"
  tone?: Tone
  bold?: boolean
  mono?: boolean
  italic?: boolean
  /** Draw on a card-coloured halo, for labels that sit near lines. */
  halo?: boolean
  /** Index into scene.shapes: the text must lie inside that shape. */
  inside?: number
  /** Ids of lines this text labels; it may touch those but no others. */
  of?: string[]
  /** Rotated text (degrees), e.g. vertical pipeline-register names. Checked by its rotated box. */
  rotate?: number
}

export type Scene = {
  /** View box. */
  x: number
  y: number
  w: number
  h: number
  shapes: Shape[]
  lines: Line[]
  texts: Text[]
  /** Cap on the drawn width in px (defaults to the view width × 1.1). */
  maxWidth?: number
}

export const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"

/** Rendered width estimate for scene text (generous, so checks err on the safe side). */
export function sceneTextWidth(t: Text) {
  const size = t.size ?? 14
  if (t.mono) return [...t.text].length * size * 0.62
  return textWidth(t.text, size) * (t.bold ? 1.06 : 1)
}

export type BoxR = { x: number; y: number; w: number; h: number }

export function textBox(t: Text): BoxR {
  const size = t.size ?? 14
  const w = sceneTextWidth(t)
  const h = size * 1.05
  const anchor = t.anchor ?? "middle"
  const x0 = anchor === "start" ? t.at[0] : anchor === "end" ? t.at[0] - w : t.at[0] - w / 2
  if (t.rotate && Math.abs(Math.abs(t.rotate) - 90) < 1e-6) {
    // Rotated a quarter turn about its anchor point: width and height swap.
    return { x: t.at[0] - h / 2, y: t.at[1] - w / 2, w: h, h: w }
  }
  return { x: x0, y: t.at[1] - h / 2, w, h }
}

const overlap = (a: BoxR, b: BoxR, slack = 0) =>
  a.x < b.x + b.w - slack && b.x < a.x + a.w - slack && a.y < b.y + b.h - slack && b.y < a.y + a.h - slack

function segHitsBox(p: Pt, q: Pt, b: BoxR) {
  // Liang–Barsky clip of segment pq against box b (shrunk by 1px so a line grazing a label edge is allowed).
  const x0 = b.x + 1
  const y0 = b.y + 1
  const x1 = b.x + b.w - 1
  const y1 = b.y + b.h - 1
  if (x1 <= x0 || y1 <= y0) return false
  let t0 = 0
  let t1 = 1
  const dx = q[0] - p[0]
  const dy = q[1] - p[1]
  const tests: [number, number][] = [
    [-dx, p[0] - x0],
    [dx, x1 - p[0]],
    [-dy, p[1] - y0],
    [dy, y1 - p[1]],
  ]
  for (const [pp, qq] of tests) {
    if (pp === 0) {
      if (qq < 0) return false
    } else {
      const r = qq / pp
      if (pp < 0) t0 = Math.max(t0, r)
      else t1 = Math.min(t1, r)
      if (t0 > t1) return false
    }
  }
  return true
}

function shapeBox(s: Shape): BoxR {
  return { x: s.x, y: s.y, w: s.w, h: s.h }
}

/** The usable interior of a shape for text (a mux, ALU or diamond is narrower than its bounding box). */
function interior(s: Shape): BoxR {
  if (s.kind === "diamond") return { x: s.x + s.w * 0.2, y: s.y + s.h * 0.25, w: s.w * 0.6, h: s.h * 0.5 }
  if (s.kind === "ellipse") return { x: s.x + s.w * 0.12, y: s.y + s.h * 0.12, w: s.w * 0.76, h: s.h * 0.76 }
  if (s.kind === "alu") return { x: s.x, y: s.y + s.h * 0.12, w: s.w * 0.8, h: s.h * 0.76 }
  return { x: s.x - 0.5, y: s.y - 0.5, w: s.w + 1, h: s.h + 1 }
}

/** Every layout problem in a scene, as readable strings. Empty means the figure is clean. */
export function sceneIssues(s: Scene, name = "scene"): string[] {
  const out: string[] = []
  const boxes = s.texts.map(textBox)
  const view: BoxR = { x: s.x, y: s.y, w: s.w, h: s.h }
  s.texts.forEach((t, i) => {
    const b = boxes[i]
    if (!t.text.trim()) return
    if (b.x < view.x - 0.5 || b.y < view.y - 0.5 || b.x + b.w > view.x + view.w + 0.5 || b.y + b.h > view.y + view.h + 0.5)
      out.push(`${name}: text "${t.text}" leaves the view box`)
    if (t.inside !== undefined) {
      const sh = s.shapes[t.inside]
      if (!sh) out.push(`${name}: text "${t.text}" refers to missing shape ${t.inside}`)
      else {
        const r = interior(sh)
        if (b.x < r.x - 0.5 || b.y < r.y - 0.5 || b.x + b.w > r.x + r.w + 0.5 || b.y + b.h > r.y + r.h + 0.5)
          out.push(`${name}: text "${t.text}" does not fit inside its ${sh.kind}${sh.id ? ` (${sh.id})` : ""}`)
      }
    }
    for (let j = i + 1; j < s.texts.length; j++) {
      if (!s.texts[j].text.trim()) continue
      if (overlap(b, boxes[j], 0.5)) out.push(`${name}: texts "${t.text}" and "${s.texts[j].text}" overlap`)
    }
    for (const l of s.lines) {
      if (l.id && t.of?.includes(l.id)) continue
      for (let k = 0; k + 1 < l.pts.length; k++) {
        if (segHitsBox(l.pts[k], l.pts[k + 1], b)) {
          out.push(`${name}: line ${l.id ?? JSON.stringify(l.pts[0])} crosses text "${t.text}"`)
          break
        }
      }
    }
    // A label must not sit on another shape's outline or inside a shape it does not belong to.
    s.shapes.forEach((sh, k) => {
      if (k === t.inside || sh.container) return
      const sb = shapeBox(sh)
      if (overlap(b, sb, 0.5)) out.push(`${name}: text "${t.text}" overlaps ${sh.kind}${sh.id ? ` ${sh.id}` : ` #${k}`}`)
    })
  })
  for (const sh of s.shapes) {
    const b = shapeBox(sh)
    if (b.x < view.x - 0.5 || b.y < view.y - 0.5 || b.x + b.w > view.x + view.w + 0.5 || b.y + b.h > view.y + view.h + 0.5)
      out.push(`${name}: ${sh.kind} ${sh.id ?? ""} leaves the view box`)
  }
  return out
}
