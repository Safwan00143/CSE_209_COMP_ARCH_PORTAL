/*
  Cache simulator and address arithmetic, as on Rifat Sir's Chapter 5 slides.

  A cache has `sets` sets of `ways` blocks each (direct-mapped: ways = 1; fully
  associative: sets = 1). Addresses may be given as block addresses (the slides'
  "block address" sequences) or as byte addresses with a block size in bytes.

    block address = floor(byte address / block bytes)
    index         = block address mod sets
    tag           = floor(block address / sets)

  Replacement is LRU (default) or FIFO. Writes can be write-through or write-back,
  with or without write allocation.
*/

export const log2 = (n: number) => {
  const l = Math.log2(n)
  if (!Number.isInteger(l)) throw new Error(`${n} is not a power of two`)
  return l
}

export type CacheConfig = {
  sets: number
  ways: number
  /** Block size in bytes when accesses are byte addresses. Omit when accesses are block addresses. */
  blockBytes?: number
  replacement?: "LRU" | "FIFO"
  write?: "through" | "back"
  allocateOnWrite?: boolean
}

export type Line = { valid: boolean; tag: number; block: number; dirty: boolean; lastUse: number; loaded: number }

export type Access = {
  addr: number
  write: boolean
  block: number
  index: number
  tag: number
  hit: boolean
  /** Block address evicted to make room, if any. */
  evicted?: number
  /** True when the evicted block was dirty (a write-back happens). */
  writeBack?: boolean
  /** 3C classification of a miss. */
  missKind?: "compulsory" | "capacity" | "conflict"
  /** Snapshot of every set after the access: lines in way order. */
  after: Line[][]
}

export type CacheRun = { accesses: Access[]; hits: number; misses: number; hitRate: number; final: Line[][] }

function blockOf(cfg: CacheConfig, addr: number) {
  return cfg.blockBytes ? Math.floor(addr / cfg.blockBytes) : addr
}

/** Runs a sequence of accesses. Each entry is an address, or { addr, write }. */
export function simulateCache(cfg: CacheConfig, refs: (number | { addr: number; write?: boolean })[]): CacheRun {
  const rep = cfg.replacement ?? "LRU"
  const sets: Line[][] = Array.from({ length: cfg.sets }, () =>
    Array.from({ length: cfg.ways }, () => ({ valid: false, tag: 0, block: -1, dirty: false, lastUse: -1, loaded: -1 })),
  )
  // For the 3C classification: blocks ever seen, and a fully associative LRU cache of the same capacity.
  const seen = new Set<number>()
  const capacity = cfg.sets * cfg.ways
  let fa: number[] = []
  const accesses: Access[] = []
  let time = 0
  for (const r of refs) {
    const addr = typeof r === "number" ? r : r.addr
    const write = typeof r === "number" ? false : !!r.write
    const block = blockOf(cfg, addr)
    const index = block % cfg.sets
    const tag = Math.floor(block / cfg.sets)
    const set = sets[index]
    time++
    const way = set.findIndex((l) => l.valid && l.tag === tag)
    const hit = way >= 0
    const a: Access = { addr, write, block, index, tag, hit, after: [] }
    // 3C: compulsory if never seen; capacity if a fully associative cache of the same size also misses; else conflict.
    const faHit = fa.includes(block)
    if (!hit) a.missKind = !seen.has(block) ? "compulsory" : faHit ? "conflict" : "capacity"
    fa = [block, ...fa.filter((b) => b !== block)].slice(0, capacity)
    seen.add(block)
    if (hit) {
      set[way].lastUse = time
      if (write && cfg.write === "back") set[way].dirty = true
    } else if (!write || cfg.allocateOnWrite !== false) {
      let victim = set.findIndex((l) => !l.valid)
      if (victim < 0) {
        const key = (l: Line) => (rep === "LRU" ? l.lastUse : l.loaded)
        victim = set.reduce((best, l, i) => (key(l) < key(set[best]) ? i : best), 0)
        a.evicted = set[victim].block
        a.writeBack = set[victim].dirty
      }
      set[victim] = { valid: true, tag, block, dirty: write && cfg.write === "back", lastUse: time, loaded: time }
    }
    a.after = sets.map((s) => s.map((l) => ({ ...l })))
    accesses.push(a)
  }
  const hits = accesses.filter((a) => a.hit).length
  return { accesses, hits, misses: accesses.length - hits, hitRate: accesses.length ? hits / accesses.length : 0, final: sets }
}

/* ───────────── Address arithmetic ───────────── */

export type Split = { tag: number; index: number; offset: number; /** offset split for word-addressed blocks */ wordOffset?: number; byteOffset?: number }

/**
 * Bits of each address field: offset = log2(block bytes), index = log2(sets),
 * tag = address bits − index − offset. With wordBytes, the offset is also split
 * into word-in-block and byte-in-word, as on the slides.
 */
export function splitAddress(addressBits: number, blockBytes: number, sets: number, wordBytes = 4): Split {
  const offset = log2(blockBytes)
  const index = log2(sets)
  const tag = addressBits - index - offset
  if (tag < 0) throw new Error("address too short for this cache")
  const byteOffset = blockBytes >= wordBytes ? log2(wordBytes) : offset
  return { tag, index, offset, wordOffset: offset - byteOffset, byteOffset }
}

/** Fields of one address as numbers. */
export function fieldsOf(addr: number | bigint, s: Split) {
  const a = BigInt(addr)
  const off = a & ((1n << BigInt(s.offset)) - 1n)
  const idx = (a >> BigInt(s.offset)) & ((1n << BigInt(s.index)) - 1n)
  const tag = a >> BigInt(s.offset + s.index)
  return { tag: Number(tag), index: Number(idx), offset: Number(off) }
}

/**
 * Total storage of a cache in bits: per block, data + tag + valid (+ any extra
 * bits such as dirty, LRU or protection bits).
 */
export function totalBits(opts: { addressBits: number; dataBytes: number; blockBytes: number; ways: number; extraBitsPerBlock?: number; valid?: boolean }) {
  const blocks = opts.dataBytes / opts.blockBytes
  if (!Number.isInteger(blocks)) throw new Error("data size not a multiple of block size")
  const sets = blocks / opts.ways
  const s = splitAddress(opts.addressBits, opts.blockBytes, sets)
  const perBlock = opts.blockBytes * 8 + s.tag + (opts.valid === false ? 0 : 1) + (opts.extraBitsPerBlock ?? 0)
  return { blocks, sets, split: s, perBlock, total: blocks * perBlock, tagBits: blocks * s.tag }
}

/* ───────────── Markdown tables from a run (so text and check share one object) ───────────── */

/** "Block address | Index | Hit/miss | contents after" table, one row per access. */
export function accessTable(run: CacheRun, cfg: CacheConfig, opts: { show?: "block" | "tag"; byteAddresses?: boolean; label?: (block: number) => string } = {}) {
  const lab = opts.label ?? ((b: number) => `Mem[${b}]`)
  const head =
    cfg.ways === 1
      ? Array.from({ length: cfg.sets }, (_, i) => String(i))
      : cfg.sets === 1
        ? Array.from({ length: cfg.ways }, (_, i) => `Block ${i}`)
        : Array.from({ length: cfg.sets }, (_, s) => Array.from({ length: cfg.ways }, (_, w) => `Set ${s}${cfg.ways > 1 ? `.${w}` : ""}`)).flat()
  const first = opts.byteAddresses ? "Address | Block | Index" : cfg.sets === 1 ? "Block address" : "Block address | Index"
  const sep = first.split("|").map(() => "---").join("|")
  const lines = [`| ${first} | Hit or miss | ${head.join(" | ")} |`, `|${sep}|---|${head.map(() => "---").join("|")}|`]
  for (const a of run.accesses) {
    const cells = a.after.flat().map((l) => (l.valid ? lab(l.block) : ""))
    const pre = opts.byteAddresses ? `${a.addr} | ${a.block} | ${a.index}` : cfg.sets === 1 ? `${a.block}` : `${a.block} | ${a.index}`
    lines.push(`| ${pre} | ${a.hit ? "**hit**" : "miss"} | ${cells.map((c) => c || " ").join(" | ")} |`)
  }
  return lines.join("\n")
}
