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

/** Rifat Sir's lectures as animated decks (built in /decks, numbers from src/lib; checked by decks/check.mjs). */
export const decks: Deck[] = [
  {
    file: "datapath.html",
    title: "The Processor: Datapath and Control",
    teacher: "Rifat Sir",
    source: "Chapter 4, Part 1",
    slides: 20,
    summary: "The single-cycle MIPS datapath built piece by piece, the control signals for every instruction type, and how to build or extend a datapath the way exam questions ask.",
    topics: ["single-cycle"],
    highlights: [
      "Build it yourself: R-type from nothing, then lw/sw, where every conflict becomes a mux",
      "Extend a given datapath with beq and j, and add jr, bne, jal, addi, ori or slt",
      "Pick R-type, lw, sw, beq or j and watch only its path through the datapath light up",
    ],
  },
  {
    file: "pipelining.html",
    title: "Pipelining",
    teacher: "Rifat Sir",
    source: "Chapter 4, Part 2",
    slides: 23,
    summary: "The five-stage pipeline, hazards and their fixes (forwarding, stalls, prediction), the pipelined datapath stage by stage, and multiple issue.",
    topics: ["pipelining", "data-hazards", "branch-hazards", "multiple-issue"],
    highlights: [
      "Type your own code: the forwarding detector draws every forwarding path and stall",
      "Code scheduling animates the rows moving: 13 cycles become 11",
      "Type a branch history and compare 1-bit and 2-bit predictors step by step",
    ],
  },
  {
    file: "memory-hierarchy.html",
    title: "Large and Fast: Exploiting Memory Hierarchy",
    teacher: "Rifat Sir",
    source: "Chapter 5",
    slides: 22,
    summary: "Locality, direct-mapped and associative caches, cache performance, multilevel caches, virtual memory with the TLB, and cache coherence.",
    topics: ["memory-tech", "caches", "cache-performance", "virtual-memory", "coherence"],
    highlights: [
      "Edit the address sequence: the cache table, address bits and hit/miss log update access by access",
      "The same sequence in direct-mapped, 2-way and fully associative caches side by side",
      "A TLB trace with hits, page-table hits and a page fault, plus a pick-a-case TLB/cache flowchart",
    ],
  },
  {
    file: "gpus.html",
    title: "Graphics and Computing GPUs",
    teacher: "Rifat Sir",
    source: "GPU lecture",
    slides: 14,
    summary: "Why GPUs use many simple cores, CPU–GPU system architectures, the graphics pipeline, the unified Tesla array, and CUDA's grids, blocks and threads.",
    topics: ["gpu"],
    highlights: [
      "A triangle travels through the graphics pipeline, from vertices to coloured pixels",
      "Zoom from the GeForce 8800 chip into one SM and its 8 SP cores",
      "SAXPY: type n and the block size to see the grid, each thread's i, and the idle threads",
    ],
  },
]

export const decksFor = (slug: string) => decks.filter((d) => d.topics.includes(slug as TopicSlug))
