export type TopicSlug =
  // Part A · Tushar Sir
  | "performance"
  | "isa-basics"
  | "mips-programming"
  | "addressing"
  | "sync-linking"
  | "int-arithmetic"
  | "floating-point"
  | "alu-design"
  // Part B · Rifat Sir
  | "single-cycle"
  | "multicycle-control"
  | "pipelining"
  | "data-hazards"
  | "branch-hazards"
  | "multiple-issue"
  | "memory-tech"
  | "caches"
  | "cache-performance"
  | "virtual-memory"
  | "coherence"
  | "gpu"

/** The course code printed on the paper. CSE 305 is the course's code before the 2021 curriculum. */
export type Course = "CSE 209" | "CSE 305"

export type Question = {
  id: string
  topic: TopicSlug
  course: Course
  /** Academic session printed on the paper, e.g. "2023-2024". */
  session: string
  /** Batch that sat the paper, e.g. "22 batch". */
  batch: string
  /** Sort key, newest first: the year the exam was held. */
  year: number
  label: string
  marks?: number
  prompt: string
  /** Undefined while the worked solution is still being written. */
  solution?: string
  /** Other papers where essentially the same question appeared. */
  alsoAsked?: string[]
  note?: string
}

/** A worked practice problem in the style of the textbook (Patterson & Hennessy). Kept apart from term-final questions. */
export type BookProblem = {
  /** Prefixed "bk-" so solved-progress never collides with term-final ids. */
  id: string
  topic: TopicSlug
  /** Short title shown on the card. */
  ref: string
  prompt: string
  solution: string
}

/** One lettered part of a question on a full past paper. */
export type PaperPart = {
  /** "a", "b", … as printed; "" for a question with no lettered parts. */
  part: string
  /** Marks as printed. */
  marks: number
  topic: TopicSlug
  /** The part's own text, without the question's shared stem. Figures go inline as ```fig blocks. */
  prompt: string
  solution?: string
  alsoAsked?: string[]
  note?: string
  /**
   * Set when the part asks for something the lecture slides do not cover. The part stays on the
   * Papers page (so the paper reads whole) with this reason, gets no solution, and is left out of Practice.
   */
  outOfScope?: string
}

export type PaperQuestion = {
  no: number
  /** Text shared by every part, printed once above them. */
  stem?: string
  parts: PaperPart[]
}

/** A whole term-final paper, kept in its printed order. */
export type Paper = {
  /** URL segment, e.g. "b22". */
  slug: string
  /** "22 batch". */
  batch: string
  course: Course
  /** As printed: "2023-2024". */
  session: string
  /** Year the exam was held, for sorting. */
  year: number
  /** Header line as printed, e.g. "L-2/T-2 B. Sc. Engineering Examinations 2023-2024". */
  exam: string
  date: string
  fullMarks: number
  time: string
  sections: { name: string; instructions: string; questions: PaperQuestion[] }[]
}

export type Topic = {
  slug: TopicSlug
  title: string
  short: string
  part: "A" | "B"
  teacher: "Tushar Sir" | "Rifat Sir"
  lectures: string
  /** One line on the notation the topic uses. */
  notation: string
  /** A pointer to a related topic, shown under the title (e.g. where questions of this kind are filed). */
  seeAlso?: { slug: TopicSlug; text: string }
}
