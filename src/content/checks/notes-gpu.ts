import { all, expectEq, type Fact } from "./types"

export const gpuNoteChecks: Fact[] = [
  { id: "note-gpu-8800", claim: "14 SMs × 8 SPs = 112 SPs", problem: () => expectEq("sps", 14 * 8, 112) },
  { id: "note-gpu-pcie", claim: "x16 PCIe: 8 GB/s each way = 16 GB/s", problem: () => expectEq("bw", 8 * 2, 16) },
  {
    id: "note-gpu-saxpy-blocks",
    claim: "nblocks = (n + 255) / 256 covers n exactly with < 256 spare threads",
    problem: () => {
      for (const n of [1, 255, 256, 257, 1000, 4096]) {
        const nb = Math.floor((n + 255) / 256)
        if (nb * 256 < n || nb * 256 - n >= 256) return `n=${n}: ${nb} blocks`
      }
      return all(expectEq("1000", Math.floor((1000 + 255) / 256), 4))
    },
  },
]
