/*
  Figure toolkit. Every diagram on the site is drawn from these server-rendered
  SVG pieces so they share one look: ink for structure, the accent (sage) for
  what the reader should notice (an active path, a forwarding arrow, a hit), the
  amber second colour for stalls, and labels on a card-coloured halo so they
  never sit on top of a line.

  Most figures are Scenes (see scene.ts): pure geometry built by builders.ts and
  drawn by SceneSvg. State diagrams (branch predictors, control FSMs) use the
  StateDiagram geometry from diagram-geometry.ts. scripts/check-figures.tsx
  checks both kinds for overlaps.
*/
import { useId, type ReactNode } from "react"
import type { Machine } from "@/lib/fsm"
import { diagramGeometry, runs, LABEL_SIZE, R, type Layout, type Pt } from "./diagram-geometry"
import { MONO, type Fill, type Line, type Scene, type Shape, type Tone } from "./scene"
import { bitFieldScene, bitStripScene, blockScene, pipelineScene, pyramidScene, type BlockSpec, type FieldSpec, type PipeSpec, type Strip } from "./builders"

export { stateLabel, symLabel, edgeLabels, textWidth, type Layout, type EdgeStyle } from "./diagram-geometry"

const FONT = "KaTeX_Main, 'Times New Roman', serif"
const SANS = "var(--font-inter), system-ui, sans-serif"

/* ───────────── Text with subscripts: "q_0", "S_{2}", "2^n" ───────────── */

export function SvgText({
  at,
  text,
  size = 15,
  anchor = "middle",
  className = "fill-foreground",
  halo = false,
  italic = false,
  bold = false,
  font = FONT,
  rotate,
}: {
  at: Pt
  text: string
  size?: number
  anchor?: "start" | "middle" | "end"
  className?: string
  halo?: boolean
  italic?: boolean
  bold?: boolean
  font?: string
  rotate?: number
}) {
  const parts = runs(text)
  let level = 0
  return (
    <text
      x={at[0]}
      y={at[1]}
      textAnchor={anchor}
      dominantBaseline="central"
      fontFamily={font}
      fontSize={size}
      fontStyle={italic ? "italic" : undefined}
      fontWeight={bold ? 600 : undefined}
      transform={rotate ? `rotate(${rotate} ${at[0]} ${at[1]})` : undefined}
      className={halo ? `${className} stroke-card` : className}
      style={halo ? { paintOrder: "stroke", strokeWidth: 5, strokeLinejoin: "round" } : undefined}
    >
      {parts.map((r, k) => {
        const target = r.shift * size * 0.32
        const dy = target - level
        level = target
        return (
          <tspan key={k} dy={dy || undefined} fontSize={r.shift ? size * 0.72 : undefined}>
            {r.text}
          </tspan>
        )
      })}
    </text>
  )
}

/* ───────────── Scenes ───────────── */

const STROKE: Record<Tone, string> = {
  ink: "stroke-foreground/80",
  accent: "stroke-primary",
  second: "stroke-figure-2",
  muted: "stroke-foreground/40",
}
const FILL: Record<Fill, string> = {
  card: "fill-card",
  accent: "fill-accent",
  second: "fill-figure-2/15",
  muted: "fill-muted",
  none: "fill-none",
  ink: "fill-foreground",
}
const TEXT: Record<Tone, string> = {
  ink: "fill-foreground",
  accent: "fill-primary",
  second: "fill-figure-2",
  muted: "fill-muted-foreground",
}
const HEAD: Record<Tone, string> = {
  ink: "fill-foreground/80",
  accent: "fill-primary",
  second: "fill-figure-2",
  muted: "fill-foreground/40",
}

function ShapeEl({ s }: { s: Shape }) {
  const cls = `${FILL[s.fill ?? "card"]} ${STROKE[s.tone ?? "ink"]}`
  const sw = s.bold ? 2.2 : 1.3
  const dash = s.dash ? "4 3" : undefined
  const { x, y, w, h } = s
  switch (s.kind) {
    case "round":
      return <rect x={x} y={y} width={w} height={h} rx={Math.min(10, h / 2)} className={cls} strokeWidth={sw} strokeDasharray={dash} />
    case "pill":
      return <rect x={x} y={y} width={w} height={h} rx={h / 2} className={cls} strokeWidth={sw} strokeDasharray={dash} />
    case "ellipse":
      return <ellipse cx={x + w / 2} cy={y + h / 2} rx={w / 2} ry={h / 2} className={cls} strokeWidth={sw} strokeDasharray={dash} />
    case "diamond":
      return <polygon points={`${x + w / 2},${y} ${x + w},${y + h / 2} ${x + w / 2},${y + h} ${x},${y + h / 2}`} className={cls} strokeWidth={sw} strokeDasharray={dash} />
    case "mux":
      return <rect x={x} y={y} width={w} height={h} rx={w / 2} className={cls} strokeWidth={sw} strokeDasharray={dash} />
    case "alu":
      return (
        <polygon
          points={`${x},${y} ${x + w},${y + h * 0.3} ${x + w},${y + h * 0.7} ${x},${y + h} ${x},${y + h * 0.6} ${x + w * 0.18},${y + h / 2} ${x},${y + h * 0.4}`}
          className={cls}
          strokeWidth={sw}
          strokeDasharray={dash}
          strokeLinejoin="round"
        />
      )
    default:
      return <rect x={x} y={y} width={w} height={h} rx={2} className={cls} strokeWidth={sw} strokeDasharray={dash} />
  }
}

function curvePath(pts: Pt[]) {
  if (pts.length === 2) return `M${pts[0][0]},${pts[0][1]} L${pts[1][0]},${pts[1][1]}`
  // Quadratic segments through midpoints, so the curve passes near every control point.
  let d = `M${pts[0][0]},${pts[0][1]}`
  for (let i = 1; i < pts.length - 1; i++) {
    const m: Pt = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2]
    d += ` Q${pts[i][0]},${pts[i][1]} ${i === pts.length - 2 ? `${pts[i + 1][0]},${pts[i + 1][1]}` : `${m[0]},${m[1]}`}`
  }
  return d
}

function LineEl({ l, marker }: { l: Line; marker: (t: Tone) => string }) {
  const tone = l.tone ?? "ink"
  const d = l.curve ? curvePath(l.pts) : `M${l.pts.map((p) => `${p[0]},${p[1]}`).join(" L")}`
  return (
    <g>
      <path
        d={d}
        fill="none"
        className={STROKE[tone]}
        strokeWidth={l.width ?? 1.3}
        strokeDasharray={l.dash ? "5 4" : undefined}
        strokeLinejoin="round"
        markerEnd={l.arrow === "end" || l.arrow === "both" ? marker(tone) : undefined}
        markerStart={l.arrow === "start" || l.arrow === "both" ? marker(tone) : undefined}
      />
      {l.dot && <circle cx={l.pts[0][0]} cy={l.pts[0][1]} r={2.6} className={HEAD[tone]} />}
    </g>
  )
}

/** Draws any Scene. Arrowhead ids come from useId, so two figures on a page never clash. */
export function SceneSvg({ scene }: { scene: Scene }) {
  const base = useId().replace(/[^a-zA-Z0-9_-]/g, "")
  const tones: Tone[] = ["ink", "accent", "second", "muted"]
  const marker = (t: Tone) => `url(#${base}-${t})`
  const { x, y, w, h } = scene
  return (
    <svg
      viewBox={`${x} ${y} ${w} ${h}`}
      width="100%"
      // Large diagrams keep a readable size on phones and scroll inside the figure frame instead of shrinking.
      style={{ maxWidth: scene.maxWidth ?? w * 1.1, minWidth: w > 520 ? Math.min(w, 1000) * 0.72 : undefined }}
      className="mx-auto block h-auto"
      role="img"
    >
      <defs>
        {tones.map((t) => (
          <marker key={t} id={`${base}-${t}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className={HEAD[t]} />
          </marker>
        ))}
      </defs>
      {scene.shapes.filter((s) => s.container).map((s, i) => <ShapeEl key={`c${i}`} s={s} />)}
      {scene.lines.map((l, i) => (
        <LineEl key={i} l={l} marker={marker} />
      ))}
      {scene.shapes.filter((s) => !s.container).map((s, i) => <ShapeEl key={i} s={s} />)}
      {scene.texts.map((t, i) => (
        <SvgText
          key={i}
          at={t.at}
          text={t.text}
          size={t.size ?? 14}
          anchor={t.anchor}
          className={TEXT[t.tone ?? "ink"]}
          halo={t.halo}
          italic={t.italic}
          bold={t.bold}
          rotate={t.rotate}
          font={t.mono ? MONO : SANS}
        />
      ))}
    </svg>
  )
}

/** Pipeline timing diagram: rows are instructions, columns are clock cycles. */
export const Pipeline = (p: PipeSpec) => <SceneSvg scene={pipelineScene(p)} />
/** Instruction format or address split, with bit positions. */
export const BitFields = (p: FieldSpec) => <SceneSvg scene={bitFieldScene(p)} />
/** Rows of bits for arithmetic (registers in a multiplication step). */
export const BitStrips = ({ rows }: { rows: Strip[] }) => <SceneSvg scene={bitStripScene(rows)} />
/** Block diagram or flowchart with hand-placed blocks and wires. */
export const Blocks = (p: BlockSpec) => <SceneSvg scene={blockScene(p)} />
export const Pyramid = ({ levels }: { levels: { name: string; note: string }[] }) => <SceneSvg scene={pyramidScene(levels)} />

/* ───────────── State diagrams (branch predictors, control FSMs) ───────────── */

export function StateDiagram({ machine, layout, labels }: { machine: Machine; layout: Layout; labels?: Record<string, string[]> }) {
  const g = diagramGeometry(machine, layout, labels)
  const { x, y, w, h } = g.view
  return (
    <svg viewBox={`${x} ${y} ${w} ${h}`} width="100%" style={{ maxWidth: w * 1.1 }} className="mx-auto block h-auto" role="img">
      {!layout.noStart && <line x1={g.start.tail[0]} y1={g.start.tail[1]} x2={g.start.head[0]} y2={g.start.head[1]} className="stroke-primary" strokeWidth={1.6} />}
      {!layout.noStart && <polygon points={g.start.arrow.join(" ")} className="fill-primary" />}
      {g.edges.map((e) => (
        <g key={e.key}>
          <path d={e.d} fill="none" className="stroke-foreground/80" strokeWidth={1.4} />
          <polygon points={e.head.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ")} className="fill-foreground/80" />
        </g>
      ))}
      {g.states.map((s) => (
        <g key={s.name} opacity={s.faded ? 0.45 : 1}>
          <circle cx={s.at[0]} cy={s.at[1]} r={s.r} className="fill-card stroke-foreground/80" strokeWidth={1.5} />
          {s.accept && <circle cx={s.at[0]} cy={s.at[1]} r={s.r - 4} fill="none" className="stroke-primary" strokeWidth={1.5} />}
          <SvgText at={s.at} text={s.label} size={s.r > R ? 13 : 15} />
        </g>
      ))}
      {g.labels.flatMap((l) =>
        l.lines.map((line, i) => (
          <SvgText key={`${l.key}-${i}`} at={[l.center[0], l.box.y + l.lineH * (i + 0.5)]} text={line} size={LABEL_SIZE} halo />
        )),
      )}
    </svg>
  )
}

/* ───────────── Layout helpers ───────────── */

export function Row({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-start justify-center gap-6">{children}</div>
}

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-w-0 flex-1 basis-56">
      <p className="mb-2 text-center text-[13px] text-muted-foreground">{title}</p>
      {children}
    </div>
  )
}
