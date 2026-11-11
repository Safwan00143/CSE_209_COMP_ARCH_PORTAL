import { md } from "../md"
import { pageTableSize, traceVM } from "@/lib/vm"

export const VM_EXAMPLE = {
  pageBytes: 4096,
  tlb: [
    { valid: true, tag: 2, ppn: 7 },
    { valid: true, tag: 9, ppn: 1 },
    { valid: true, tag: 0, ppn: 4 },
    { valid: false, tag: 5, ppn: 3 },
  ],
  pageTable: [
    { valid: true, ppn: 4 },
    { valid: false, ppn: null },
    { valid: true, ppn: 7 },
    { valid: true, ppn: 6 },
    { valid: false, ppn: null },
    { valid: true, ppn: 3 },
    { valid: false, ppn: null },
    { valid: false, ppn: null },
    { valid: false, ppn: null },
    { valid: true, ppn: 1 },
  ],
  nextPpn: 8,
  addresses: [8200, 12500, 40000, 4100, 9000, 20480],
}
const run = traceVM(VM_EXAMPLE)
const traceTable = [
  "| Virtual address | VPN = ⌊VA / 4096⌋ | Offset | Result | Physical page | Physical address |",
  "|---|---|---|---|---|---|",
  ...run.steps.map((s) => `| ${s.va} | ${s.vpn} | ${s.offset} | ${s.result}${s.evictedTag !== undefined ? ` (replaces TLB tag ${s.evictedTag})` : ""} | ${s.ppn} | ${s.pa} |`),
].join("\n")
const tlbAfter = ["| Valid | Tag (VPN) | Physical page |", "|---|---|---|", ...run.tlb.map((e) => `| ${e.valid ? 1 : 0} | ${e.tag} | ${e.ppn} |`)].join("\n")
const pt = pageTableSize(32, 4096, 4)

export const virtualMemoryNote = md`
## Virtual memory

**Virtual memory** uses main memory as a "cache" for secondary (disk) storage (slide 56).

- It is managed jointly by the CPU hardware and the operating system (OS).
- Programs share main memory. Each gets a **private virtual address space** holding its frequently used code and data, **protected** from other programs.
- The CPU and OS **translate virtual addresses to physical addresses**.

The terms map onto cache terms:

| Cache | Virtual memory |
|---|---|
| block | **page** |
| miss | **page fault** |

## Address translation

Pages have a fixed size, e.g. 4 KiB (slide 57). An address splits into a **page number** and a **page offset**:
$$
\text{offset bits} = \log_2(\text{page size in bytes})
$$
$$
\text{virtual page number (VPN) bits} = \text{virtual address bits} - \text{offset bits}
$$
$$
\text{physical page number (PPN) bits} = \text{physical address bits} - \text{offset bits}
$$

\`\`\`fig
vm-split
\`\`\`

Translation replaces the VPN with a PPN. The **page offset is not changed**: a page is placed whole, so the byte's position inside it stays the same.

Equivalently, for a byte address: $\text{VPN} = \lfloor \text{VA} / \text{page size} \rfloor$ and $\text{offset} = \text{VA} \bmod \text{page size}$; then $\text{PA} = \text{PPN}\times\text{page size} + \text{offset}$.

## Page fault penalty

On a page fault, the page must be fetched from disk (slide 58):
- this takes **millions of clock cycles**;
- it is handled by OS code.

So the design tries hard to **minimise the page-fault rate**:
- **fully associative placement**: a page can go in any physical page;
- **smart replacement algorithms**;
- **never write-through, always write-back**.

## Page tables

The **page table** stores the placement information (slide 59).
- It is an array of **page table entries (PTEs)**, indexed by the virtual page number.
- The **page table register** in the CPU points to the page table in physical memory.
- If the page is present in memory, the PTE stores the **physical page number**, plus other status bits (referenced, dirty, …).
- If the page is not present, the PTE can refer to a location in the **swap space** on disk.

\`\`\`fig
vm-page-table
\`\`\`

**How the page table works, step by step:**
1. Split the virtual address into VPN and offset.
2. Use the page table register and the VPN to find the PTE.
3. If the PTE's valid bit is 1, the page is in memory: physical address = PTE's PPN joined with the offset.
4. If the valid bit is 0, the page is on disk: a **page fault**. The OS reads the page from disk into a physical page (replacing one if memory is full), updates the PTE, and the instruction is restarted.

## Page table size

A single-level page table has one entry per virtual page:
$$
\#\text{entries} = 2^{\text{VPN bits}},\qquad \text{size} = \#\text{entries}\times\text{PTE size}
$$

**Example.** 32-bit virtual address, 4 KiB pages, 4-byte PTEs.
- Offset bits = $\log_2 4096 = 12$; VPN bits = $32 - 12 = ${pt.vpnBits}$.
- Entries = $2^{${pt.vpnBits}}$ = ${pt.entries.toLocaleString("en-US")}.
- Size = $2^{20}\times4\ \text{B} = 2^{22}\ \text{B} = ${pt.bytes / 2 ** 20}$ MiB per process.

Each running program has its own page table, so this cost multiplies by the number of processes.

## Replacement and writes

To reduce the page-fault rate, prefer **least-recently used (LRU)** replacement (slide 62):
- a **reference bit** (use bit) in the PTE is set to 1 on any access to the page;
- the OS periodically clears it to 0;
- a page with reference bit 0 has not been used recently, so it is a candidate for replacement.

This is an approximation of LRU, cheap enough to do in software.

Disk writes take millions of cycles, and a whole block is written at once, not individual locations. Write-through is impractical; use **write-back**. A **dirty bit** in the PTE is set when the page is written, so only dirty pages are written back on replacement.

## Fast translation using a TLB

Address translation would seem to need **extra memory references**: one to read the PTE, then the actual memory access (slide 63). But accesses to the page table have good locality. So the CPU keeps a fast cache of PTEs: the **translation look-aside buffer (TLB)**.

Typical values: 16–512 PTEs, 0.5–1 cycle for a hit, 10–100 cycles for a miss, 0.01%–1% miss rate. Misses can be handled by hardware or software.

A TLB entry holds: a **valid** bit, a **tag** (the virtual page number, or its upper bits for a set-associative TLB), the **physical page number**, and copies of the dirty and reference bits.

- **Why a tag?** The TLB has far fewer entries than the page table, so an entry can hold the translation of many different virtual pages. The tag records which VPN the entry currently translates, exactly like a cache tag.
- **The TLB is a cache of the page table, for the entries that map to physical pages only**: a page that is on disk has no physical page number to cache.

## TLB misses

If the page **is in memory** (slide 65):
- load the PTE from memory into the TLB and retry;
- this could be handled in hardware (complex for complicated page-table structures), or in software: raise a special exception with an optimised handler.

If the page **is not in memory** (a page fault):
- the OS fetches the page and updates the page table;
- then the faulting instruction restarts.

**TLB miss handler (slide 66).** A TLB miss indicates either that the page is present but its PTE is not in the TLB, or that the page is not present. The handler copies the PTE from memory to the TLB and restarts the instruction. If the page is not present, a page fault will then occur.

**Page fault handler (slide 67):**
1. Use the faulting virtual address to find the PTE.
2. Locate the page on disk.
3. Choose a page to replace; if it is dirty, write it to disk first.
4. Read the page into memory and update the page table.
5. Make the process runnable again.
6. Restart from the faulting instruction.

**Without a TLB,** every memory access would need an extra memory access for the PTE first: at least doubling the time of every load, store and instruction fetch.

## Worked example: a TLB and page-table trace

4 KiB pages, a 4-entry fully associative TLB with LRU replacement. On a page fault, the page is placed in the next free physical page, starting at ${VM_EXAMPLE.nextPpn}. Initial TLB (valid, tag, physical page): (1, 2, 7), (1, 9, 1), (1, 0, 4), (0, 5, 3). Page table (VPN: physical page or disk): 0: 4, 1: disk, 2: 7, 3: 6, 4: disk, 5: 3, 6–8: disk, 9: 1.

${traceTable}

**How each row is decided:**
1. VPN = ⌊VA / 4096⌋.
2. If a valid TLB entry has that tag: **TLB hit**.
3. Otherwise look in the page table. Valid: **page table hit**; copy the entry into the TLB.
4. Not valid: **page fault**; bring the page into the next free physical page, update the page table, and copy the entry into the TLB.
5. When the TLB must load an entry, fill an invalid entry first, otherwise replace the least recently used one.

TLB afterwards:

${tlbAfter}

## Virtual memory, TLB and cache together

Virtual memory and caches work together as a hierarchy (slide 68). Data cannot be in the cache unless it is present in main memory. The OS keeps this true:
- it flushes the contents of a page from the cache when it migrates that page to disk;
- it modifies the page tables and TLB so that any access to data on the migrated page generates a page fault.

\`\`\`fig
vm-tlb-flow
\`\`\`

**How the TLB and the data cache differ**, although both are caches:

| | TLB | Data cache |
|---|---|---|
| Caches | page-table entries (translations) | memory data |
| Indexed/tagged by | virtual page number | physical address (in a physically addressed cache) |
| Entry holds | physical page number + status bits | a block of data |
| A miss means | translation not cached: walk the page table (maybe a page fault) | data not cached: fetch the block from memory |
| Typical size | 16–512 entries, often fully associative | KiB to MiB, direct mapped or set associative |

**Possible combinations of events (slide 71):**

| TLB | Page table | Cache | Possible? |
|---|---|---|---|
| hit | hit | miss | yes, although the page table is never checked after a TLB hit |
| miss | hit | hit | yes: TLB misses, the entry is found in the page table; after retry, the data is in the cache |
| miss | hit | miss | yes: TLB misses, the entry is found in the page table; after retry, the data misses in the cache |
| miss | miss | miss | yes: TLB misses and is followed by a page fault; after retry, the data must miss in the cache |
| hit | miss | miss | impossible: a translation cannot be in the TLB if the page is not in memory |
| hit | miss | hit | impossible: same reason |
| miss | miss | hit | impossible: data cannot be in the cache if the page is not in memory |

## Memory protection

Different tasks can share parts of their virtual address spaces, but they need protection against errant access (slide 72). This requires OS assistance, with hardware support:
- a privileged **supervisor mode** (kernel mode);
- **privileged instructions**;
- page tables and other state information accessible only in supervisor mode.

Each process has its own page table, so a process can only reach physical pages its own page table maps.

## The memory hierarchy: a common framework

The same four questions apply at every level of the hierarchy (slides 73–77):

| Question | Hardware caches | Virtual memory |
|---|---|---|
| **Block placement** | direct mapped (1 choice), n-way set associative (n choices), fully associative (any location). Higher associativity reduces the miss rate but increases complexity, cost and access time. | fully associative |
| **Finding a block** | index, then compare tags: 1 comparison (direct mapped), n (n-way), #entries (fully associative) | a full lookup table (the page table): 0 tag comparisons, which makes full associativity feasible |
| **Replacement** | LRU (costly for high associativity) or random (close to LRU, easier) | LRU approximation with hardware support (reference bits) |
| **Write policy** | write-through (simplifies replacement, may need a write buffer) or write-back (more state) | only write-back is feasible, given disk write latency |

## Pitfalls

- **Extending the address range with segments** (e.g. Intel 80286): a segment is not always big enough, and address arithmetic becomes complicated.
- **Implementing a virtual machine monitor on an ISA not designed for virtualisation**, e.g. one where non-privileged instructions can access hardware resources: either extend the ISA or require the guest OS not to use the problematic instructions.
`
