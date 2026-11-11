import type { TopicSlug } from "../types"
import { performanceNote } from "./performance"
import { isaBasicsNote } from "./isa-basics"
import { mipsProgrammingNote } from "./mips-programming"
import { addressingNote } from "./addressing"
import { syncLinkingNote } from "./sync-linking"
import { intArithmeticNote } from "./int-arithmetic"
import { floatingPointNote } from "./floating-point"
import { aluDesignNote } from "./alu-design"
import { singleCycleNote } from "./single-cycle"
import { multicycleControlNote } from "./multicycle-control"
import { pipeliningNote } from "./pipelining"
import { dataHazardsNote } from "./data-hazards"
import { branchHazardsNote } from "./branch-hazards"
import { multipleIssueNote } from "./multiple-issue"
import { memoryTechNote } from "./memory-tech"
import { cachesNote } from "./caches"
import { cachePerformanceNote } from "./cache-performance"
import { virtualMemoryNote } from "./virtual-memory"
import { gpuNote } from "./gpu"
import { coherenceNote } from "./coherence"

/** Notes are added topic by topic; a topic without one shows a short placeholder. */
export const notes: Partial<Record<TopicSlug, string>> = {
  coherence: coherenceNote,
  gpu: gpuNote,
  "virtual-memory": virtualMemoryNote,
  "cache-performance": cachePerformanceNote,
  caches: cachesNote,
  "memory-tech": memoryTechNote,
  "multiple-issue": multipleIssueNote,
  "branch-hazards": branchHazardsNote,
  "data-hazards": dataHazardsNote,
  pipelining: pipeliningNote,
  "multicycle-control": multicycleControlNote,
  "single-cycle": singleCycleNote,
  "alu-design": aluDesignNote,
  "floating-point": floatingPointNote,
  "int-arithmetic": intArithmeticNote,
  "sync-linking": syncLinkingNote,
  addressing: addressingNote,
  "mips-programming": mipsProgrammingNote,
  "isa-basics": isaBasicsNote,
  performance: performanceNote,
}

/** Level-2 headings, used for the "on this page" outline. */
export function outline(markdown: string) {
  return [...markdown.matchAll(/^## (.+)$/gm)].map((m) => ({
    title: m[1],
    id: slugify(m[1]),
  }))
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
}
