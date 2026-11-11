import { all, expectEq, type Fact } from "./types"
import { fieldsOf, simulateCache, splitAddress, totalBits } from "@/lib/cache"
import { cachesNote } from "../notes/caches"

const close = (a: number, b: number, t = 1e-9) => Math.abs(a - b) <= t

export const memNoteChecks: Fact[] = [
  {
    id: "note-mem-disk",
    claim: "disk: 4 + 2 + 0.005 + 0.2 = 6.2 ms; with 1 ms seek ≈ 3.2 ms",
    problem: () => {
      const rot = (0.5 / (15000 / 60)) * 1000
      const xfer = (512 / 100e6) * 1000
      return all(expectEq("rot", rot, 2), close(xfer, 0.00512) ? null : "xfer", close(4 + rot + xfer + 0.2, 6.205, 1e-3) ? null : "total", close(1 + rot + xfer + 0.2, 3.205, 1e-3) ? null : "fast")
    },
  },
  {
    id: "note-cache-slide-dm",
    claim: "8-block DM trace: M M H H M M H M; 18 replaces 26",
    problem: () => {
      const r = simulateCache({ sets: 8, ways: 1 }, [22, 26, 22, 26, 16, 3, 16, 18])
      return all(expectEq("pattern", r.accesses.map((a) => (a.hit ? "H" : "M")).join(""), "MMHHMMHM"), expectEq("evicted", r.accesses[7].evicted, 26))
    },
  },
  { id: "note-cache-1200", claim: "byte 1200, 64 × 16 B: block 75, index 11; split 22/6/4", problem: () => all(expectEq("index", fieldsOf(1200, splitAddress(32, 16, 64)).index, 11), expectEq("block", Math.floor(1200 / 16), 75), expectEq("split", [splitAddress(32, 16, 64).tag, 6, 4], [22, 6, 4])) },
  {
    id: "note-cache-total-bits",
    claim: "16 KiB, 4-word blocks: 1024 × 147 = 150528 bits = 147 Kibits",
    problem: () => {
      const t = totalBits({ addressBits: 32, dataBytes: 16384, blockBytes: 16, ways: 1 })
      return all(expectEq("per block", t.perBlock, 147), expectEq("total", t.total, 150528), expectEq("Ki", t.total / 1024, 147))
    },
  },
  {
    id: "note-cache-assoc",
    claim: "0, 8, 0, 6, 8: DM 5 misses, 2-way 4, FA 3",
    problem: () =>
      all(
        expectEq("dm", simulateCache({ sets: 4, ways: 1 }, [0, 8, 0, 6, 8]).misses, 5),
        expectEq("2way", simulateCache({ sets: 2, ways: 2 }, [0, 8, 0, 6, 8]).misses, 4),
        expectEq("fa", simulateCache({ sets: 1, ways: 4 }, [0, 8, 0, 6, 8]).misses, 3),
        cachesNote.includes("5 misses.") && cachesNote.includes("4 misses.") && cachesNote.includes("3 misses.") ? null : "note counts changed",
      ),
  },
  {
    id: "note-cache-tag-bits",
    claim: "4096 × 16 B blocks: tag 16/17/18/28 bits → 64/68/72/112 Ki",
    problem: () => {
      const t = (w: number) => totalBits({ addressBits: 32, dataBytes: 4096 * 16, blockBytes: 16, ways: w }).tagBits / 1024
      return expectEq("tags", [t(1), t(2), t(4), t(4096)], [64, 68, 72, 112])
    },
  },
  { id: "note-cache-wt-cpi", claim: "write-through CPI 1 + 0.1 × 100 = 11", problem: () => expectEq("cpi", 1 + 0.1 * 100, 11) },
  {
    id: "note-cache-byte-word",
    claim: "32 B DM, 4 B blocks: byte 36 → block 1, word 36 → block 4",
    problem: () => all(expectEq("byte", simulateCache({ sets: 8, ways: 1, blockBytes: 4 }, [36]).accesses[0].index, 1), expectEq("word", simulateCache({ sets: 8, ways: 1 }, [36]).accesses[0].index, 4)),
  },
]
