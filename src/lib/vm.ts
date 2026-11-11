/*
  Virtual memory: page-table size arithmetic and a TLB + page-table simulator.

  traceVM() follows each virtual address through a fully associative TLB with
  LRU replacement, then the page table, then (on a page fault) brings the page
  in at the next free physical page number. It records whether each access is
  a TLB hit, a page-table hit, or a page fault, and the states afterwards.
*/

export const log2 = (n: number) => {
  const l = Math.log2(n)
  if (!Number.isInteger(l)) throw new Error(`${n} is not a power of two`)
  return l
}

/** Single-level page table size: entries = 2^(VA bits − offset bits); bytes = entries × PTE size. */
export function pageTableSize(vaBits: number, pageBytes: number, pteBytes: number) {
  const offset = log2(pageBytes)
  const vpnBits = vaBits - offset
  const entries = 2 ** vpnBits
  return { offset, vpnBits, entries, bytes: entries * pteBytes }
}

export type TlbEntry = { valid: boolean; tag: number; ppn: number; lastUse: number }
export type PteEntry = { valid: boolean; ppn: number | null } // ppn null = on disk

export type VmStep = {
  va: number
  vpn: number
  offset: number
  result: "TLB hit" | "page table hit" | "page fault"
  ppn: number
  pa: number
  /** TLB entry replaced (its tag), if any. */
  evictedTag?: number
}

export function traceVM(opts: { pageBytes: number; tlb: { valid: boolean; tag: number; ppn: number }[]; pageTable: PteEntry[]; nextPpn: number; addresses: number[] }) {
  const tlb: TlbEntry[] = opts.tlb.map((e) => ({ ...e, lastUse: 0 }))
  const pt: PteEntry[] = opts.pageTable.map((e) => ({ ...e }))
  let next = opts.nextPpn
  let time = 0
  // Entries listed first count as least recently used first, so the initial order breaks LRU ties.
  tlb.forEach((e, i) => (e.lastUse = -(tlb.length - i)))
  const steps: VmStep[] = []
  for (const va of opts.addresses) {
    time++
    const vpn = Math.floor(va / opts.pageBytes)
    const offset = va % opts.pageBytes
    const hit = tlb.find((e) => e.valid && e.tag === vpn)
    let result: VmStep["result"]
    let ppn: number
    let evictedTag: number | undefined
    if (hit) {
      hit.lastUse = time
      result = "TLB hit"
      ppn = hit.ppn
    } else {
      while (pt.length <= vpn) pt.push({ valid: false, ppn: null })
      if (pt[vpn].valid && pt[vpn].ppn !== null) {
        result = "page table hit"
        ppn = pt[vpn].ppn!
      } else {
        result = "page fault"
        ppn = next++
        pt[vpn] = { valid: true, ppn }
      }
      // Load the translation into the TLB: an invalid entry if there is one, else the LRU entry.
      let victim = tlb.findIndex((e) => !e.valid)
      if (victim < 0) {
        victim = tlb.reduce((b, e, i) => (e.lastUse < tlb[b].lastUse ? i : b), 0)
        evictedTag = tlb[victim].tag
      }
      tlb[victim] = { valid: true, tag: vpn, ppn, lastUse: time }
    }
    steps.push({ va, vpn, offset, result, ppn, pa: ppn * opts.pageBytes + offset, evictedTag })
  }
  return { steps, tlb, pageTable: pt }
}
