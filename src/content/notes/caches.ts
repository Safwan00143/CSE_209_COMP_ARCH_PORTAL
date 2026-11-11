import { md } from "../md"
import { accessTable, simulateCache, totalBits, type CacheConfig } from "@/lib/cache"
import { toBits } from "@/lib/numbers"

/* Slides 20-25: 8 one-word blocks, direct mapped. */
const dm8: CacheConfig = { sets: 8, ways: 1 }
const slideSeq = [22, 26, 22, 26, 16, 3, 16, 18]
const slideRun = simulateCache(dm8, slideSeq)
const slideTrace = [
  "| Word address | Binary address | Hit/miss | Cache block (index) |",
  "|---|---|---|---|",
  ...slideRun.accesses.map((a) => {
    const b = toBits(a.block, 5)
    return `| ${a.block} | ${b.slice(0, 2)} ${b.slice(2)} | ${a.hit ? "hit" : "miss"} | ${b.slice(2)} |`
  }),
].join("\n")
const finalState = [
  "| Index | V | Tag | Data |",
  "|---|---|---|---|",
  ...slideRun.final.map((set, i) => {
    const l = set[0]
    return `| ${toBits(i, 3)} | ${l.valid ? "Y" : "N"} | ${l.valid ? toBits(l.tag, 2) : ""} | ${l.valid ? `Mem[${toBits(l.block, 5)}]` : ""} |`
  }),
].join("\n")

/* Slides 41-42: 4-block caches, sequence 0, 8, 0, 6, 8. */
const seq = [0, 8, 0, 6, 8]
const dm4: CacheConfig = { sets: 4, ways: 1 }
const sa2: CacheConfig = { sets: 2, ways: 2 }
const fa4: CacheConfig = { sets: 1, ways: 4 }
const rDm = simulateCache(dm4, seq)
const rSa = simulateCache(sa2, seq)
const rFa = simulateCache(fa4, seq)

/* Total bits: 16 KiB of data, 4-word blocks, 32-bit address. */
const tb = totalBits({ addressBits: 32, dataBytes: 16 * 1024, blockBytes: 16, ways: 1 })

/* Tag bits for 4096 blocks of 4 words at each associativity. */
const tagRows = [1, 2, 4, 4096].map((w) => {
  const t = totalBits({ addressBits: 32, dataBytes: 4096 * 16, blockBytes: 16, ways: w })
  return { ways: w, sets: t.sets, tag: t.split.tag, total: t.tagBits }
})
const tagTable = [
  "| Organisation | Sets | Index bits | Tag bits per block | Total tag bits |",
  "|---|---|---|---|---|",
  ...tagRows.map((r) => `| ${r.ways === 1 ? "direct mapped" : r.ways === 4096 ? "fully associative" : `${r.ways}-way`} | ${r.sets} | ${Math.log2(r.sets)} | ${r.tag} | ${r.tag} × 4096 = ${r.total} = ${r.total / 1024} Ki |`),
].join("\n")

export const cachesNote = md`
## Cache memory

The **cache** is the level of the memory hierarchy closest to the CPU. Given a sequence of accesses $X_1, \dots, X_{n-1}, X_n$, two questions:
- How do we know whether the data is present?
- Where do we look?

## Direct-mapped cache

In a **direct-mapped** cache, the location is determined by the address: only one choice.
$$
\text{Cache index} = (\text{Block address}) \bmod (\#\text{Blocks in cache})
$$
The number of blocks is a power of 2, so the index is just the **low-order bits** of the block address.

**Tags and valid bits.**
- Which block is stored in a location? Store the block address as well as the data. Only the high-order bits are needed (the low-order bits are the index): they are the **tag**.
- What if there is no data in a location? A **valid bit**: 1 = present, 0 = not present. Initially 0.

## Worked example: 8 blocks, 1 word per block

The slides' example: a direct-mapped cache of 8 one-word blocks, initially empty, accessed with word addresses ${slideSeq.join(", ")}. With 8 blocks, the index is the low 3 bits of the address and the tag the remaining 2.

${slideTrace}

Final state:

${finalState}

The last access, 18 = 10 010, maps to index 010 and replaces \`Mem[11010]\` (26), which had the same index but tag 11. Hits: ${slideRun.hits} of ${slideSeq.length}.

## Address subdivision

\`\`\`fig
cache-dm-1024
cache-split-1024
\`\`\`

For a byte address split for a cache:
$$
\text{offset bits} = \log_2(\text{block size in bytes}),\qquad \text{index bits} = \log_2(\#\text{sets})
$$
$$
\text{tag bits} = \text{address bits} - \text{index bits} - \text{offset bits}
$$
For a direct-mapped cache, #sets = #blocks. With word-sized blocks the offset is the 2-bit **byte offset**; with bigger blocks it splits into a **block (word) offset** and the byte offset.

**Example (slide 27): larger block size.** 64 blocks, 16 bytes per block. To what block number does byte address 1200 map?
$$
\text{Block address} = \lfloor 1200/16 \rfloor = 75
$$
$$
\text{Block number} = 75 \bmod 64 = 11
$$

\`\`\`fig
cache-split-64x16
\`\`\`

## Total bits in a cache

Each block stores its data, its tag and a valid bit (plus a dirty bit for write-back, and any other status bits the question lists):
$$
\text{bits per block} = \text{data bits} + \text{tag bits} + 1\ (\text{valid}) + \text{other status bits}
$$
$$
\text{total bits} = \#\text{blocks}\times\text{bits per block}
$$

**Example.** A direct-mapped cache with 16 KiB of data and 4-word blocks, 32-bit address.

**Step 1: blocks.** A block is 4 words = 16 bytes.
$$
\#\text{blocks} = \frac{16\ \text{KiB}}{16\ \text{B}} = \frac{2^{14}}{2^{4}} = 2^{10} = ${tb.blocks}
$$

**Step 2: address split.** Offset = $\log_2 16 = 4$ bits (2 word + 2 byte); index = $\log_2 1024 = 10$ bits; tag = $32 - 10 - 4 = ${tb.split.tag}$ bits.

**Step 3: bits per block.**
$$
128\ (\text{data}) + ${tb.split.tag}\ (\text{tag}) + 1\ (\text{valid}) = ${tb.perBlock}\ \text{bits}
$$

**Step 4: total.**
$$
2^{10}\times${tb.perBlock} = ${tb.total}\ \text{bits} = ${tb.total / 1024}\ \text{Kibits}
$$
about 1.15 times the 128 Kibits of data alone.

## Block size considerations

- Larger blocks should reduce the miss rate, thanks to spatial locality.
- But in a fixed-size cache, larger blocks mean **fewer** blocks: more competition, so a higher miss rate. Larger blocks also cause **pollution** (bringing in words that are never used).
- Larger blocks mean a **larger miss penalty**, which can override the benefit of the reduced miss rate.
- **Early restart** (resume as soon as the requested word arrives, without waiting for the whole block) and **critical-word-first** (fetch the requested word first, then the rest) can help by cutting the effective miss penalty.

## Handling cache misses

- On a cache **hit**, the CPU proceeds normally.
- On a cache **miss**:
  1. stall the CPU pipeline;
  2. fetch the block from the next level of the hierarchy;
  3. for an **instruction** cache miss, restart the instruction fetch;
  4. for a **data** cache miss, complete the data access.

## Write policies

**Write-through.** On a data-write hit, the cache could just update the block, but then the cache and memory would be inconsistent. Write-through **also updates memory**. But this makes writes take longer.

Example (slide 30): base CPI = 1, 10% of instructions are stores, a write to memory takes 100 cycles.
$$
\text{Effective CPI} = 1 + 0.1\times100 = 11
$$

**The solution: a write buffer.** It holds data waiting to be written to memory, so the CPU continues immediately. The CPU stalls on a write only if the write buffer is already full.

**Write-back.** On a data-write hit, just update the block in the cache. Keep track of whether each block is **dirty** (changed). When a dirty block is replaced, write it back to memory. A write buffer can be used here too: it holds the dirty block so the replacing block can be read first.

**Write allocation: what happens on a write miss?**
- For write-through, two alternatives:
  - **allocate on miss** (write allocate): fetch the block;
  - **write around** (no write allocate): do not fetch the block. This suits programs that write a whole block before reading it (e.g. initialisation).
- For write-back: usually fetch the block.

| | Write-through | Write-back |
|---|---|---|
| Write hit | update cache and memory | update cache only; set dirty bit |
| Write miss | write allocate, or write around | usually fetch the block (write allocate) |
| On replacement | nothing to do | write the block back if dirty |
| Memory traffic | every write | only replaced dirty blocks |
| Advantage | simple; memory always up to date | fewer, faster writes; many writes to a block cost one write-back |

## Associative caches

- **Fully associative:** a block can go in **any** cache entry. All entries must be searched at once: a comparator per entry (expensive).
- **n-way set associative:** each set contains $n$ entries. The block number determines the set:
  $$
  \text{Set} = (\text{Block number}) \bmod (\#\text{Sets in cache})
  $$
  All entries in that set are searched at once: $n$ comparators (less expensive).

For a cache of 8 entries (slide 40): 1-way (direct mapped) has 8 sets of 1, 2-way has 4 sets of 2, 4-way has 2 sets of 4, 8-way (fully associative) has 1 set of 8.

## Associativity example

Compare three 4-block caches on the block sequence ${seq.join(", ")} (slides 41–42), with LRU replacement.

**Direct mapped** (index = block mod 4):

${accessTable(rDm, dm4)}

${rDm.misses} misses.

**2-way set associative** (set = block mod 2; every block here is even, so all go to set 0):

${accessTable(rSa, sa2)}

${rSa.misses} misses. When 6 arrives, set 0 holds 0 and 8; 8 was used less recently, so 8 is replaced.

**Fully associative:**

${accessTable(rFa, fa4)}

${rFa.misses} misses.

**How much associativity? (slide 43)** Increased associativity decreases the miss rate, with diminishing returns. A 64 KB data cache with 16-word blocks on SPEC2000: 1-way 10.3%, 2-way 8.6%, 4-way 8.3%, 8-way 8.1%.

## Set-associative address split and tag bits

For a set-associative cache, the index selects a **set**:
$$
\#\text{sets} = \frac{\#\text{blocks}}{n},\qquad \text{index bits} = \log_2(\#\text{sets})
$$
Doubling the associativity halves the number of sets: one fewer index bit and one more tag bit. A fully associative cache has no index.

**Example.** 4096 blocks, 4-word (16-byte) blocks, 32-bit address. Offset = 4 bits.

${tagTable}

## Replacement policy

- **Direct mapped:** no choice.
- **Set associative:** prefer a non-valid entry, if there is one; otherwise choose among the entries in the set:
  - **least recently used (LRU):** choose the one unused for the longest time. Simple for 2-way, manageable for 4-way, too hard beyond that;
  - **random:** gives approximately the same performance as LRU for high associativity.

## Sources of misses: the three Cs

- **Compulsory** (cold-start) misses: the first access to a block.
- **Capacity** misses: due to the finite cache size; a replaced block is later accessed again.
- **Conflict** (collision) misses: in a non-fully associative cache, due to competition for the entries in a set. They would not occur in a fully associative cache of the same total size.

**To classify a miss:** never seen before → compulsory; else, would a fully associative LRU cache of the same size also miss? yes → capacity; no → conflict.

## Cache design trade-offs

| Design change | Effect on miss rate | Negative performance effect |
|---|---|---|
| Increase cache size | decreases capacity misses | may increase access time |
| Increase associativity | decreases conflict misses | may increase access time |
| Increase block size | decreases compulsory misses | increases miss penalty; for very large blocks, may increase the miss rate due to pollution |

## Pitfall: byte versus word addressing

A 32-byte direct-mapped cache with 4-byte blocks has 8 blocks (slide 90).
- **Byte** address 36: block address $\lfloor 36/4\rfloor = 9$, and $9 \bmod 8 = 1$: block 1.
- **Word** address 36: block address 36 (one word per block), and $36 \bmod 8 = 4$: block 4.

Always check whether a question's addresses are byte addresses or block (word) addresses.
`
