import type { ReactNode } from "react"
import katex from "katex"

export type FigureEntry = { node: ReactNode; caption?: string; wide?: boolean }
export type FigureMap = Record<string, FigureEntry>

/**
 * Captions are plain text with optional `code spans` (MIPS such as `lw $t0, 0($s1)`, shown as code,
 * never parsed as maths) and `$…$` inline math; write `\$` for a literal dollar sign outside code.
 */
function Caption({ text }: { text: string }) {
  const chunks = text.split(/(`[^`]+`)/g)
  return (
    <>
      {chunks.map((c, k) =>
        c.startsWith("`") && c.endsWith("`") && c.length > 1 ? (
          <code key={k} className="rounded bg-muted px-1 py-px font-mono text-[12px]">
            {c.slice(1, -1)}
          </code>
        ) : (
          <MathText key={k} text={c} />
        ),
      )}
    </>
  )
}

function MathText({ text }: { text: string }) {
  const DOLLAR = "\u0000"
  const parts = text.replace(/\\\$/g, DOLLAR).split(/(\$[^$]+\$)/g)
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("$") && p.endsWith("$") ? (
          <span
            key={i}
            dangerouslySetInnerHTML={{ __html: katex.renderToString(p.slice(1, -1).replaceAll(DOLLAR, "\\$"), { throwOnError: false }) }}
          />
        ) : (
          <span key={i}>{p.replaceAll(DOLLAR, "$")}</span>
        ),
      )}
    </>
  )
}

export function FigureFrame({ entry, id }: { entry?: FigureEntry; id: string }) {
  if (!entry) {
    return <p className="text-sm text-destructive">Missing figure: {id}</p>
  }
  return (
    <figure className={entry.wide ? "my-8" : "my-8 max-w-[30rem]"}>
      <div className="overflow-x-auto rounded-lg border border-border bg-card p-3 text-foreground">{entry.node}</div>
      {entry.caption && (
        <figcaption className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          <Caption text={entry.caption} />
        </figcaption>
      )}
    </figure>
  )
}
