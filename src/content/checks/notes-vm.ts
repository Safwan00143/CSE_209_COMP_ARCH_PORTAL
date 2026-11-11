import { all, expectEq, type Fact } from "./types"
import { pageTableSize, traceVM } from "@/lib/vm"
import { VM_EXAMPLE } from "../notes/virtual-memory"

export const vmNoteChecks: Fact[] = [
  { id: "note-vm-pt-size", claim: "32-bit VA, 4 KiB pages, 4 B PTE: 2^20 entries, 4 MiB", problem: () => all(expectEq("entries", pageTableSize(32, 4096, 4).entries, 2 ** 20), expectEq("bytes", pageTableSize(32, 4096, 4).bytes, 4 * 2 ** 20)) },
  {
    id: "note-vm-trace",
    claim: "worked TLB trace: results, physical addresses, LRU victims",
    problem: () => {
      const r = traceVM(VM_EXAMPLE)
      // Independent hand derivation for the first steps.
      // 8200: VPN 2 → TLB hit (ppn 7), PA = 7*4096 + 8 = 28680.
      // 12500: VPN 3 → not in TLB; PT valid ppn 6 → fills the invalid TLB entry; PA = 6*4096 + 212 = 24788.
      // 40000: VPN 9 → TLB hit (ppn 1), PA = 4096 + 3136 = 7232.
      // 4100: VPN 1 → PT disk → page fault, ppn 8; TLB full → evict LRU = tag 0 (used least recently); PA = 8*4096 + 4 = 32772.
      return all(
        expectEq("results", r.steps.map((s) => s.result), ["TLB hit", "page table hit", "TLB hit", "page fault", "TLB hit", "page table hit"]),
        expectEq("PA0", r.steps[0].pa, 28680),
        expectEq("PA1", r.steps[1].pa, 24788),
        expectEq("PA2", r.steps[2].pa, 7232),
        expectEq("PA3", r.steps[3].pa, 32772),
        expectEq("victim3", r.steps[3].evictedTag, 0),
      )
    },
  },
]
