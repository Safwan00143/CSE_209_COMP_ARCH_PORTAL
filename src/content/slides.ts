import type { TopicSlug } from "./types"

/** Animated slide decks (self-contained HTML files in public/slides). */
export type Deck = {
  file: string
  title: string
  teacher: string
  source: string
  slides: number
  summary: string
  topics: TopicSlug[]
  highlights: string[]
}

/** Empty for now: decks are added later. */
export const decks: Deck[] = []

export const decksFor = (slug: string) => decks.filter((d) => d.topics.includes(slug as TopicSlug))
