import type { BookProblem, TopicSlug } from "../types"
import { partA } from "./part-a"
import { partB } from "./part-b"

/**
 * Practice problems in the style of Patterson & Hennessy's exercises, written for this site
 * (no copy of the book was available, so none is quoted). Only topics on the lecture slides.
 */
export const bookProblems: BookProblem[] = [...partA, ...partB]

export const BOOK_NOTE =
  "Written for this site in the style of Patterson & Hennessy's exercises, on topics from the slides. These are not exam questions."

/** Kept in the order written: each topic runs from warm-up problems to harder ones. */
export function bookProblemsFor(topic: TopicSlug) {
  return bookProblems.filter((p) => p.topic === topic)
}
