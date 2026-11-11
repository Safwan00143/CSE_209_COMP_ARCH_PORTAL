/**
 * Pulls a fenced code block out of rendered markdown, so a check runs the exact
 * code a page shows. `marker` is a string that must appear in the block; the
 * call throws if no block (or more than one) contains it.
 */
export function codeBlock(markdown: string, marker: string): string {
  const blocks = [...markdown.matchAll(/```[a-z]*\n([\s\S]*?)```/g)].map((m) => m[1]).filter((b) => b.includes(marker))
  if (blocks.length !== 1) throw new Error(`expected one code block containing ${JSON.stringify(marker)}, found ${blocks.length}`)
  return blocks[0]
}

/** Every markdown table row (as cell arrays) in the section whose ## heading starts with `heading`. */
export function section(markdown: string, heading: string): string {
  const i = markdown.indexOf(`## ${heading}`)
  if (i < 0) throw new Error(`no section ${heading}`)
  const j = markdown.indexOf("\n## ", i + 3)
  return markdown.slice(i, j < 0 ? undefined : j)
}
