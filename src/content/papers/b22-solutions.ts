import { md } from "../md"
import { mulTable } from "../render"
import { simulateCache } from "@/lib/cache"
import { traceVM } from "@/lib/vm"
import { multiplyFirst, multiplyRefined } from "@/lib/multiply"
import { encode, DOUBLE, SINGLE, range } from "@/lib/ieee"
import { toBits, toHex } from "@/lib/numbers"
import { scheduleTable, ipc } from "@/lib/dualissue"
import { SCHED, UNROLLED } from "../notes/multiple-issue"

/* ───── Q2(b) ───── */
export const Q2B_REFS = [0, 4, 16, 132, 232, 160, 1024, 30, 140, 3100, 180, 2180]
const q2b = simulateCache({ sets: 32, ways: 1, blockBytes: 32 }, Q2B_REFS)
const q2bTable = [
  "| Byte address | Block address = ⌊addr/32⌋ | Index = block mod 32 | Tag = ⌊block/32⌋ | Hit/miss | Replaces |",
  "|---|---|---|---|---|---|",
  ...q2b.accesses.map((a) => `| ${a.addr} | ${a.block} | ${a.index} | ${a.tag} | ${a.hit ? "**hit**" : "miss"} | ${a.evicted !== undefined ? `block ${a.evicted}` : ""} |`),
].join("\n")
const q2bFinal = q2b.final
  .map((s, i) => (s[0].valid ? `- <${i}, ${s[0].tag}, Mem[${s[0].block * 32}–${s[0].block * 32 + 31}]>` : ""))
  .filter(Boolean)
  .join("\n")
const q2bReplaced = q2b.accesses.filter((a) => a.evicted !== undefined).length

/* ───── Q3(b) ───── */
export const Q3B = {
  pageBytes: 4096,
  tlb: [
    { valid: true, tag: 11, ppn: 12 },
    { valid: true, tag: 7, ppn: 4 },
    { valid: true, tag: 3, ppn: 6 },
    { valid: false, tag: 4, ppn: 9 },
  ],
  pageTable: ([[1, 5], [0, null], [0, null], [1, 6], [1, 9], [1, 11], [0, null], [1, 4], [0, null], [0, null], [1, 3], [1, 12]] as const).map(([v, p]) => ({ valid: v === 1, ppn: p as number | null })),
  nextPpn: 13,
  addresses: [4669, 2227, 13916, 34587, 48870, 12608, 49225],
}
const q3b = traceVM(Q3B)
const q3bTable = [
  "| Address | VPN = ⌊addr/4096⌋ | Offset | TLB | Page table | Result | Physical page | TLB entry replaced |",
  "|---|---|---|---|---|---|---|---|",
  ...q3b.steps.map((s) => `| ${s.va} | ${s.vpn} | ${s.offset} | ${s.result === "TLB hit" ? "hit" : "miss"} | ${s.result === "TLB hit" ? "(not needed)" : s.result === "page table hit" ? "hit" : "miss (on disk)"} | **${s.result}** | ${s.ppn} | ${s.evictedTag !== undefined ? `tag ${s.evictedTag}` : s.result === "TLB hit" ? "" : "the invalid entry"} |`),
].join("\n")
const q3bTlb = ["| Valid | Tag | Physical page |", "|---|---|---|", ...q3b.tlb.map((e) => `| ${e.valid ? 1 : 0} | ${e.tag} | ${e.ppn} |`)].join("\n")
const q3bPt = ["| VPN | Valid | Physical page or disk |", "|---|---|---|", ...q3b.pageTable.map((p, i) => `| ${i} | ${p.valid ? 1 : 0} | ${p.valid ? p.ppn : "Disk"} |`)].join("\n")

/* ───── Q5(a)(ii): MIPS-v22 encodings ───── */
const R = { t0: 2, t1: 3, t2: 4 }
export const Q5A = {
  add: [toBits(0, 6), toBits(R.t2, 5), toBits(R.t0, 5), toBits(R.t1, 5), toBits(0, 5), toBits(0, 6)],
  addi: [toBits(6, 6), toBits(R.t2, 5), toBits(R.t0, 5), toBits(1, 16)],
  lw: [toBits(5, 6), toBits(R.t1, 5), toBits(R.t0, 5), toBits(4, 16)],
}
const hexOf = (fields: string[]) => toHex(fields.join(""))
const grp = (fields: string[]) => fields.join(" ")

/* ───── Q7 ───── */
const m1 = multiplyFirst("1000", "1011")
const m2 = multiplyRefined("1000", "1011")
const rs = range(SINGLE)
const rd = range(DOUBLE)
const sMin = encode(rs.smallest, SINGLE)
const sMax = encode(rs.largest, SINGLE)
const dMin = encode(rd.smallest, DOUBLE)
const dMax = encode(rd.largest, DOUBLE)

const a = ipc(SCHED)
const b = ipc(UNROLLED)

export const b22Solutions: Record<string, string> = {
  "1a": md`The forwarding unit sits in the EX stage. It compares the source register numbers of the instruction in EX with the destination register numbers of the two instructions ahead of it, and steers the two ALU input multiplexers.

\`\`\`fig
dh-forwarding-unit
\`\`\`

**Step 1: inputs and outputs.**
- Inputs: \`ID/EX.RegisterRs\`, \`ID/EX.RegisterRt\` (the sources of the instruction in EX); \`EX/MEM.RegisterRd\`, \`EX/MEM.RegWrite\` (the instruction one ahead); \`MEM/WB.RegisterRd\`, \`MEM/WB.RegWrite\` (two ahead).
- Outputs: **ForwardA** (first ALU operand mux) and **ForwardB** (second ALU operand mux), 2 bits each.

**Step 2: the multiplexers.** Each ALU input gets a 3-input mux:

| Mux control | Source | Meaning |
|---|---|---|
| 00 | ID/EX | operand from the register file (no forwarding) |
| 10 | EX/MEM | ALU result of the previous instruction |
| 01 | MEM/WB | result two instructions back (ALU result or loaded data, after the MemtoReg mux) |

**Step 3: EX hazard (forward from EX/MEM).**

\`\`\`
if (EX/MEM.RegWrite and (EX/MEM.RegisterRd ≠ 0)
    and (EX/MEM.RegisterRd = ID/EX.RegisterRs))  ForwardA = 10
if (EX/MEM.RegWrite and (EX/MEM.RegisterRd ≠ 0)
    and (EX/MEM.RegisterRd = ID/EX.RegisterRt))  ForwardB = 10
\`\`\`

**Step 4: MEM hazard (forward from MEM/WB), revised for the double data hazard.** When both EX/MEM and MEM/WB hold a new value of the same register (e.g. \`add $1,$1,$2\`; \`add $1,$1,$3\`; \`add $1,$1,$4\`), the most recent one, in EX/MEM, must win. So forward from MEM/WB only if the EX-hazard condition for that operand is false:

\`\`\`
if (MEM/WB.RegWrite and (MEM/WB.RegisterRd ≠ 0)
    and not (EX/MEM.RegWrite and (EX/MEM.RegisterRd ≠ 0)
             and (EX/MEM.RegisterRd = ID/EX.RegisterRs))
    and (MEM/WB.RegisterRd = ID/EX.RegisterRs))  ForwardA = 01
if (MEM/WB.RegWrite and (MEM/WB.RegisterRd ≠ 0)
    and not (EX/MEM.RegWrite and (EX/MEM.RegisterRd ≠ 0)
             and (EX/MEM.RegisterRd = ID/EX.RegisterRt))
    and (MEM/WB.RegisterRd = ID/EX.RegisterRt))  ForwardB = 01
\`\`\`

Otherwise ForwardA = ForwardB = 00.

**Why each test is there.**
- \`RegWrite\`: only an instruction that will write a register can supply a value (not \`sw\`, \`beq\`).
- \`RegisterRd ≠ 0\`: \`$zero\` is never really written, so a "result" for \`$0\` must not be forwarded.
- The \`not (…)\` clause: the double data hazard, where EX/MEM has priority.

The figure for Q1(a) is not in the scanned paper; this is the standard forwarding unit from the slides (Figure 4.56).`,

  "1b": md`**Step 1: the hazards.** Forwarding everywhere; branches are decided in ID; a taken branch costs 1 cycle (predict not taken).

| Pair | Register | Kind | Stall |
|---|---|---|---|
| \`lw\` → \`add $t1, $t0, $s1\` | \`$t0\` | load-use data hazard | 1 |
| \`add $t1\` → \`beq $t1, $zero, L1\` | \`$t1\` | data hazard for a branch: the branch compares in ID, but \`$t1\` exists only at the end of add's EX | 1 |
| \`add $t2\` → \`bne $t2, $zero, L2\` | \`$t2\` | same, data hazard for a branch | 1 |
| \`add $t1\` → \`add $t2\`, \`sub\`, \`and\` | \`$t1\` | forwarded (or read after write-back) | 0 |
| \`add $t2\` → \`sub\`, \`and\` | \`$t2\` | forwarded | 0 |
| \`sub $t3\`, \`and $t4\` → \`or\` | \`$t3\`, \`$t4\` | forwarded | 0 |
| \`beq\` | | control hazard: if taken, the instruction fetched after it is flushed | 1 if taken |
| \`bne\` | | control hazard | 1 if taken |

**Step 2: (i) total stall cycles.** The three data-hazard stalls happen whenever their instructions execute. Each taken branch adds 1 control stall.

| Case | Data stalls | Control stalls | Total stalls |
|---|---|---|---|
| both branches not taken | 3 | 0 | 3 |
| first branch taken (bne never executes) | 2 | 1 | 3 |
| first not taken, second taken | 3 | 1 | 4 |

So with both branches not taken (the full code), there are **3 stall cycles**.

**Step 3: the cycle formula.** With $n$ instructions executed:
$$
\text{cycles} = n + 4 + \text{stalls}
$$

**Step 4: (ii) both branches not taken.** All 8 instructions execute.
$$
8 + 4 + 3 = 15\ \text{cycles}
$$

\`\`\`fig
b22-1b-nt
\`\`\`

**Step 5: (iii) the first branch taken.** Executed: \`lw\`, \`add\`, \`beq\`, \`and\`, \`or\` (5 instructions). Stalls: 1 (load-use) + 1 (beq waits for \`$t1\`) + 1 (taken penalty).
$$
5 + 4 + 3 = 12\ \text{cycles}
$$

\`\`\`fig
b22-1b-t1
\`\`\`

**Step 6: (iv) first not taken, second taken.** Executed: \`lw\`, \`add\`, \`beq\`, \`add\`, \`bne\`, \`or\` (6 instructions). Stalls: 3 data + 1 taken penalty.
$$
6 + 4 + 4 = 14\ \text{cycles}
$$

\`\`\`fig
b22-1b-t2
\`\`\``,

  "1c": md`**Part 1: the 1-bit predictor and nested loops.**

A 1-bit predictor remembers only the last outcome of each branch.

1. The inner branch \`beq $t0, $zero, inner\` is taken on every inner iteration except the last. On the **last iteration** it falls through, but it was predicted taken (it was taken last time): **mispredict**. The bit flips to "not taken".
2. The next time the outer loop runs the inner loop, the **first iteration**'s branch is taken, but it is predicted not taken: **mispredict** again. The bit flips back to "taken".

So the inner branch is mispredicted **twice** per execution of the inner loop, although its behaviour changes only once (at the exit). The outer branch has the same problem.

**The solution: a 2-bit predictor.** It changes its prediction only after **two mispredictions in a row**.

\`\`\`fig
bh-2bit
\`\`\`

The inner branch sits in the strongly-taken state. At the loop exit it moves to the weakly-taken state, which still predicts taken, so the first iteration of the next inner loop is predicted correctly. Only one misprediction per inner loop remains.

**Part 2: "even with a perfect predictor, 1-cycle penalty for a taken branch".**

- **Why.** A predictor only says *whether* the branch is taken. The *target address* must still be calculated, by the adder in the ID stage. While the branch is in ID, the next sequential instruction has already been fetched in IF. If the branch is taken, that fetched instruction is useless: one cycle is lost even though the prediction was right.
- **How to eliminate it: a branch target buffer (BTB).** It is a cache of branch target addresses, indexed by the PC of the branch, and looked up during IF. If the PC hits in the BTB and the branch is predicted taken, the next fetch uses the stored target immediately, in the very next cycle, so there is no penalty.`,

  "2a": md`**Step 1: clock period and memory penalty.**
$$
T_c = \frac{1}{4\ \text{GHz}} = 0.25\ \text{ns}
$$
$$
\text{Main-memory penalty} = \frac{200\ \text{ns}}{0.25\ \text{ns}} = 800\ \text{cycles}
$$

**Step 2: CPI with only the primary cache.**
$$
\text{CPI}_1 = 1 + 0.05\times800 = 1 + 40 = 41
$$

**Step 3: (i) add an L2 cache.** Access time 10 ns:
$$
\text{L2 penalty} = \frac{10\ \text{ns}}{0.25\ \text{ns}} = 40\ \text{cycles}
$$
Every primary miss (5%) pays 40 cycles; the misses that also miss in L2 (2% of instructions, the miss rate to main memory) pay 800 more.
$$
\text{CPI}_2 = 1 + 0.05\times40 + 0.02\times800 = 1 + 2 + 16 = 19
$$
$$
\text{Speed-up} = \frac{\text{CPI}_1}{\text{CPI}_2} = \frac{41}{19} \approx 2.16
$$
With L2, the processor is about **2.16 times faster**.

**Step 4: (ii) add an L3 cache as well.** Access time 40 ns:
$$
\text{L3 penalty} = \frac{40\ \text{ns}}{0.25\ \text{ns}} = 160\ \text{cycles}
$$
Now the 2% that miss in L2 pay 160 cycles for L3, and only 1% go on to main memory:
$$
\text{CPI}_3 = 1 + 0.05\times40 + 0.02\times160 + 0.01\times800 = 1 + 2 + 3.2 + 8 = 14.2
$$
$$
\text{Speed-up over L1 + L2} = \frac{19}{14.2} \approx 1.34
$$
$$
\text{Speed-up over L1 only} = \frac{41}{14.2} \approx 2.89
$$
Adding L3 makes it about **1.34 times faster** than with L2 alone (2.89 times faster than with the primary cache alone).`,

  "2b": md`**Step 1: read the address split.**
- Offset: bits 4–0, so 5 bits.
- Index: bits 9–5, so 5 bits.
- Tag: bits 31–10, so 22 bits.

**(i) Block size.** $2^{5} = 32$ bytes $= 32/4 =$ **8 words**.

**(ii) Entries.** $2^{5} =$ **32 entries** (blocks).

**Step 2: trace the references.** Block address = ⌊byte address / 32⌋, index = block mod 32, tag = ⌊block / 32⌋. The cache starts empty (power on).

${q2bTable}

**(iii) Blocks replaced: ${q2bReplaced}.**
- 1024 (index 0, tag 1) replaces block 0.
- 30 (index 0, tag 0) replaces block 32 (the 1024 block).
- 3100 (index 0, tag 3) replaces block 0.
- 2180 (index 4, tag 2) replaces block 4.

**(iv) Hit ratio.** Hits: 4, 16, 140, 180, so
$$
\text{hit ratio} = \frac{${q2b.hits}}{${Q2B_REFS.length}} = \frac{1}{3} \approx 0.33
$$

**(v) Final state** (valid entries; data shown as the byte range of the block held):

${q2bFinal}

All other entries are invalid.`,

  "2c": md`**Larger cache blocks**

| Advantages | Disadvantages |
|---|---|
| Lower miss rate, thanks to **spatial locality**: one miss brings in the neighbouring words too | In a fixed-size cache, fewer blocks: more competition for entries, so the miss rate can rise again |
| Fewer compulsory misses | **Pollution**: words that are never used are brought in |
| Less tag storage per byte of data | Larger **miss penalty**: more words to transfer per miss, which can cancel out the lower miss rate |

**Early restart.** Do not wait for the whole block: fetch the words in normal order, and restart the processor as soon as the **requested word** arrives. The rest of the block keeps arriving in the background.

**Critical-word-first.** Fetch the **requested word first**, then the rest of the block (wrapping around). The processor restarts after the first word arrives. Both cut the effective miss penalty of large blocks.

**The write buffer**
- **Write-through:** every write must also go to memory, which is slow (e.g. CPI 1 + 0.1 × 100 = 11 with 10% stores and 100-cycle writes). The write buffer holds the data (and address) waiting to be written to memory, so the CPU continues immediately. It stalls only if the buffer is full.
- **Write-back:** when a dirty block is replaced, it must be written back. The write buffer holds the dirty block, so the new block can be **read first** and the CPU restarts sooner; the dirty block is written back from the buffer afterwards.`,

  "3a": md`**How the TLB and the data cache differ**, although both are caches:

| | TLB | Data cache |
|---|---|---|
| What it caches | page-table entries: **translations** from virtual page number to physical page number | **memory data** (blocks of words) |
| Looked up with | the virtual page number | the physical address (physically indexed and tagged cache) |
| An entry holds | tag (VPN), physical page number, valid, dirty and reference bits | tag, valid (and dirty) bits, a data block |
| On a miss | the translation is fetched from the page table (or a page fault occurs if the page is not in memory) | the data block is fetched from main memory |
| Typical size | 16–512 entries, often fully associative | KiB to MiB, direct mapped or set associative |
| Order of use | first: produces the physical address | second: uses the physical address |

**The flow for a read or a write:**

\`\`\`fig
vm-tlb-flow
\`\`\`

1. The virtual address goes to the TLB.
2. **TLB miss:** a TLB-miss exception; the handler loads the PTE from the page table (or a page fault occurs) and the access is retried.
3. **TLB hit:** the physical address is formed (physical page number + page offset).
4. **Read:** try to read the data from the cache. Hit: deliver the data to the CPU. Miss: stall while the block is read from memory, then deliver.
5. **Write:** first check the page's write-access bit. If it is off: write-protection exception. If on: try to write the data to the cache. Hit: write the data into the cache, update the dirty bit, and put the data and address into the write buffer. Miss: stall while the block is read, then write.`,

  "3b": md`**Assumptions.**
- VPN = ⌊address / 4096⌋, page offset = address mod 4096.
- New pages from disk get physical page numbers 13, 14, 15, … in order.
- The TLB is fully associative with LRU replacement. When it must take a new entry, it fills the invalid entry first; otherwise it replaces the least recently used one. The initial three valid entries have no use history; they are taken as used in table order (the top entry is the least recently used). The paper does not state this, so other orders give different victims.
- The page table has entries for VPN 0–11; VPN 12 has no entry yet, so it is not in memory.

**(i) Each reference.**

${q3bTable}

Working for each row:
1. **4669:** VPN 1, not in the TLB. The page table says disk: **page fault**. The page goes to physical page 13; the PTE becomes valid; the TLB's invalid entry is filled with (1, 1, 13).
2. **2227:** VPN 0, not in the TLB. The page table has it in physical page 5: **page-table hit**. The TLB is full, so the LRU entry (tag 11) is replaced by (1, 0, 5).
3. **13916:** VPN 3, in the TLB: **TLB hit** (physical page 6).
4. **34587:** VPN 8, not in the TLB; on disk: **page fault**. Page 14. The LRU entry is now tag 7 (never used), replaced by (1, 8, 14).
5. **48870:** VPN 11, no longer in the TLB (evicted in step 2); the page table has physical page 12: **page-table hit**. LRU entry: tag 1 (last used in step 1), replaced by (1, 11, 12).
6. **12608:** VPN 3, in the TLB: **TLB hit**.
7. **49225:** VPN 12, not in the TLB and not in memory: **page fault**. Page 15. LRU entry: tag 0 (last used in step 2), replaced by (1, 12, 15).

**(ii) Final state.**

TLB:

${q3bTlb}

Page table:

${q3bPt}`,

  "3c": md`**The problem.** In a multiprocessor, each core has its own cache, and the caches can hold copies of the same memory location. When one core writes its copy, the others still hold the old value, so different cores can read different values for the same address.

Example with write-through caches, X = 0 in memory:

| Time | Event | CPU A's cache | CPU B's cache | Memory |
|---|---|---|---|---|
| 1 | CPU A reads X | 0 | | 0 |
| 2 | CPU B reads X | 0 | 0 | 0 |
| 3 | CPU A writes 1 to X | 1 | 0 | 1 |

After step 3, CPU B's cache still has 0: a read by B now returns a stale value. The caches are **incoherent**.

A coherent memory system guarantees: a processor reads its own latest write; a read by another processor sufficiently later returns the written value; and all processors see writes to a location in the same order.

**How a snooping protocol solves it.** Every cache controller monitors ("snoops on") the shared bus and sees every read and write of the other processors. In the common **write-invalidate** protocol:
1. Before a processor writes a block, it gets **exclusive access**: it broadcasts an **invalidate** for that address on the bus.
2. Every other cache holding that block marks its copy **invalid**.
3. A later read by another processor therefore **misses**, and the up-to-date value is supplied by the cache that wrote it (or by memory).

The same example with snooping (write-back caches):

| CPU activity | Bus activity | CPU A's cache | CPU B's cache | Memory |
|---|---|---|---|---|
| CPU A reads X | cache miss for X | 0 | | 0 |
| CPU B reads X | cache miss for X | 0 | 0 | 0 |
| CPU A writes 1 to X | invalidate for X | 1 | (invalid) | 0 |
| CPU B reads X | cache miss for X | 1 | 1 | 1 |

B's stale copy was invalidated when A wrote, so B's next read misses and gets the new value 1, supplied by A's cache (memory is updated too). Snooping suits small systems with a shared bus, where every cache can see every transaction.`,

  "4a": md`**The two systems (Appendix C slides):**

\`\`\`fig
gpu-intel
gpu-amd
\`\`\`

- **(a) Intel CPU.** The CPU connects to the **North Bridge** over the **front-side bus**. The North Bridge holds the memory controller for the DDR2 system memory (128-bit, 667 MT/s) and connects the **GPU** through a **x16 PCI-Express link**. The South Bridge hangs off the North Bridge (x4 PCIe derivative). The GPU has its own **GPU memory** and drives the display.
- **(b) AMD CPU.** The **North Bridge (memory controller) is on the CPU die**, linked to the CPU core by an internal bus, with the DDR2 memory attached directly. A **HyperTransport** link connects the CPU to the **chipset**, and the GPU attaches to the chipset through a **x16 PCI-Express link**. Again the GPU has its own memory.

A x16 PCIe link gives a peak of 16 GB/s (8 GB/s in each direction).

**How the CPU and GPU access each other's memory.**
- There are **multiple address spaces**.
- The **GPU** reaches both its own local memory and the CPU's system memory with **virtual addresses**, translated by an **MMU on the GPU**. The operating-system kernel manages the GPU's page tables. A system-memory page is accessed with coherent or noncoherent PCI-Express transactions, chosen by an attribute in the GPU's page-table entry.
- The **CPU** reaches the GPU's local memory through an address range called the **aperture** in the PCI-Express address space.
- Either can access the other's memory, but with **much less bandwidth** than its own directly attached local memory.

(In a unified memory architecture, there is no separate GPU memory: the GPU uses part of system memory, which is cheaper but slower.)`,

  "4b": md`**Step 1: dependences in the loop.**
- \`addu\` needs \`$t0\` from \`lw\`: a load-use dependence, so it cannot be in the packet right after \`lw\`'s.
- \`sw\` needs \`$t0\` from \`addu\`.
- \`bne\` needs \`$s1\` from \`addi\`.
- \`addi\` changes \`$s1\`, which \`lw\` and \`sw\` use as their base.

**Step 2: the schedule** (one ALU/branch and one load/store per packet; ALU/branch slot first):

${scheduleTable(SCHED)}

How it was built:
1. \`lw\` must come first; its result is usable two cycles later (cycle 3).
2. \`addi\` is independent of the load, so it fills cycle 2's ALU slot.
3. \`addu\` goes in cycle 3, when \`$t0\` is ready.
4. \`sw\` needs \`addu\`'s result (ready for cycle 4) and \`bne\` needs \`addi\`'s (ready): both fit in cycle 4.
5. \`addi\` has already subtracted 4 from \`$s1\` when \`sw\` runs, so the store uses offset **4** to reach the same address as the original \`0($s1)\`.

**Step 3: IPC.**
$$
\text{IPC} = \frac{${a.instructions}\ \text{instructions}}{${a.cycles}\ \text{cycles}} = ${a.ipc}
$$
against a peak of 2.

**Step 4: a technique for higher IPC: loop unrolling** (with register renaming). Replicate the loop body several times, using a different register for each copy (\`$t0\`, \`$t1\`, \`$t2\`, \`$t3\`) so the copies are independent, and do the loop overhead (\`addi\`, \`bne\`) once per 4 elements. The compiler can then pack the copies into the empty slots:

${scheduleTable(UNROLLED)}

$$
\text{IPC} = \frac{${b.instructions}}{${b.cycles}} = ${b.ipc}
$$
closer to 2, at the cost of more registers and larger code. (Dynamic multiple issue, i.e. a superscalar processor that schedules at run time, is the hardware alternative.)`,

  "4c": md`**The CUDA terms.**
- **Kernel:** a C/C++ function written for **one thread**. When launched, it runs on many threads in parallel (the SPMD style: single program, multiple data).
- **Thread:** one instance of the kernel, with its own ID (\`threadIdx\`) and private local memory.
- **Thread block:** a group of concurrent threads that can **cooperate**: they share fast on-chip **shared memory** and can synchronise with a barrier (\`__syncthreads()\`).
- **Grid:** the set of all thread blocks launched for one kernel. The blocks are **independent** and must be able to run in any order; they all share global memory.

\`\`\`fig
gpu-cuda
\`\`\`

**Mapping onto the unified GPU architecture** (e.g. the GeForce 8800: 14 SMs × 8 SPs = 112 SP cores):

| CUDA | Hardware |
|---|---|
| Grid | the whole GPU: the grid's blocks are distributed across the streaming multiprocessors |
| Thread block | one **streaming multiprocessor (SM)**. All threads of a block run on the same SM, use that SM's shared memory, and synchronise there. An SM can hold several blocks at once if resources allow. |
| Thread | executed by an **SP core** of the SM. Each SP is highly multithreaded (96 threads on the GeForce 8800), so an SM interleaves hundreds of threads to hide latency. |

Because blocks are independent, the same program runs on a GPU with few SMs (blocks run one after another) or many (blocks run in parallel): **transparent scalability**, with no recompilation.`,

  "5a": md`**MIPS-v22 fields** (from the figure):
- R-type: opcode [31–26], **rt** [25–21], **rd** [20–16], **rs** [15–11], shamt [10–6], funct [5–0].
- I-type: opcode [31–26], **rt** [25–21] (destination or source), **rs** [20–16] (source), constant [15–0].

**(i) Connections to the register file.**

Work out, for each register-file input, which field supplies it in each format:

| Register-file input | R-type | I-type | Connection |
|---|---|---|---|
| Read register 1 (first source, rs) | bits 15–11 | bits 20–16 | **mux** (RegSrc) |
| Read register 2 (rt) | bits 25–21 | bits 25–21 (the source for \`sw\`) | **direct**, no mux |
| Write register (destination) | rd: bits 20–16 | rt: bits 25–21 (for \`lw\`, \`addi\`) | **mux** (RegDst) |

\`\`\`fig
b22-5a-regfile
\`\`\`

- The 32-bit instruction leaves the instruction memory and is split into 5-bit fields.
- **Read register 1** gets a 2-to-1 mux: input 0 = bits 15–11, input 1 = bits 20–16. Its select (call it RegSrc) is 0 for R-type and 1 for I-type.
- **Read register 2** is wired straight to bits 25–21, because rt is in the same place in both formats.
- **Write register** gets a 2-to-1 mux: input 0 = bits 25–21 (rt, I-type), input 1 = bits 20–16 (rd, R-type). Its select is RegDst (1 for R-type).
- Every connection into the register file is **5 bits** wide.

**(ii) Translation.** Registers: \`$t0\` = 2, \`$t1\` = 3, \`$t2\` = 4.

**\`add $t0, $t1, $t2\`** (R-type): rd = \`$t0\` = 2, rs = \`$t1\` = 3, rt = \`$t2\` = 4, opcode 0, shamt 0, funct 0.

| opcode | rt | rd | rs | shamt | funct |
|---|---|---|---|---|---|
| 0 | 4 | 2 | 3 | 0 | 0 |
| ${Q5A.add.join(" | ")} |

Binary: ${grp(Q5A.add)} = 0x${hexOf(Q5A.add)}.

**\`addi $t2, $t0, 1\`** (I-type): rt = destination \`$t2\` = 4, rs = \`$t0\` = 2, constant 1, opcode 6.

| opcode | rt | rs | constant |
|---|---|---|---|
| 6 | 4 | 2 | 1 |
| ${Q5A.addi.join(" | ")} |

Binary: ${grp(Q5A.addi)} = 0x${hexOf(Q5A.addi)}.

**\`lw $t1, 4($t0)\`** (I-type): rt = destination \`$t1\` = 3, rs = base \`$t0\` = 2, constant 4, opcode 5.

| opcode | rt | rs | constant |
|---|---|---|---|
| 5 | 3 | 2 | 4 |
| ${Q5A.lw.join(" | ")} |

Binary: ${grp(Q5A.lw)} = 0x${hexOf(Q5A.lw)}.`,

  "5b": md`Each stage's full adder computes $F_i = X_i\oplus Y_i\oplus Z_i$, where $Z_i$ is its carry input.

**Step 1: write each arithmetic function as $X + Y + C_{in}$** (with $X = A$):

| $S_2S_1S_0$ | Function | $X_i$ | $Y_i$ | $C_{in}$ | Why |
|---|---|---|---|---|---|
| 000 | $A - B - 1$ | $A_i$ | $B_i'$ | 0 | $A + \overline{B} = A + (2^n - 1 - B) = A - B - 1$ |
| 001 | $A + B + 1$ | $A_i$ | $B_i$ | 1 | |
| 010 | transfer A | $A_i$ | 0 | 0 | |
| 011 | decrement A | $A_i$ | 1 (all 1s) | 0 | all 1s $= -1$ |

**Step 2: the logic functions.** For $S_2 = 1$ the carries are forced to 0, so $F_i = X_i\oplus Y_i$.
- OR ($S_2S_1 = 10$): take $Y_i = 0$ and $X_i = A_i + B_i$, so $F_i = A_i + B_i$.
- NOT ($S_2S_1 = 11$): take $Y_i = 1$ and $X_i = A_i$, so $F_i = A_i\oplus1 = A_i'$.

**Step 3: $X_i$.** It is $A_i$ everywhere except OR, which adds $B_i$:
$$
X_i = A_i + S_2S_1'B_i
$$

**Step 4: $Y_i$.** The table over $S_2, S_1, S_0$:

| $S_2S_1S_0$ | 000 | 001 | 010 | 011 | 10x | 11x |
|---|---|---|---|---|---|---|
| $Y_i$ | $B_i'$ | $B_i$ | 0 | 1 | 0 | 1 |

$$
Y_i = S_2'S_1'S_0'B_i' + S_2'S_1'S_0B_i + S_2'S_1S_0 + S_2S_1
$$
The last two terms combine: $S_2'S_1S_0 + S_2S_1 = S_1(S_0 + S_2)$. So
$$
Y_i = S_2'S_1'(S_0\odot B_i) + S_1S_0 + S_1S_2
$$
where $S_0\odot B_i = S_0'B_i' + S_0B_i$ (XNOR).

**Step 5: the carries.** Only code 001 needs a carry in:
$$
C_{in} = Z_1 = S_2'S_1'S_0
$$
and the carry chain is cut for the logic operations:
$$
Z_i = S_2'C_i\quad(i > 1)
$$

**Result:**
$$
X_i = A_i + S_2S_1'B_i
$$
$$
Y_i = S_2'S_1'S_0'B_i' + S_2'S_1'S_0B_i + S_1S_0 + S_1S_2
$$
$$
Z_i = S_2'C_i,\qquad C_{in} = S_2'S_1'S_0
$$

**Check (one stage, $S_2S_1S_0 = 000$, $A = 0101$, $B = 0011$):** $Y = \overline{B} = 1100$, $C_{in} = 0$, so $F = 0101 + 1100 = 1\,0001$, i.e. $0001 = 5 - 3 - 1$. These equations were verified on all $16\times16$ input pairs for every selection code.`,

  "6a": md`**Step 1: clock cycles on A.**
$$
\text{Cycles}_A = \text{CPU time}_A\times\text{Clock rate}_A = 10\ \text{s}\times4\times10^{9}\ \text{Hz} = 40\times10^{9}
$$

**Step 2: clock cycles on B** (1.2 times as many):
$$
\text{Cycles}_B = 1.2\times40\times10^{9} = 48\times10^{9}
$$

**Step 3: clock rate needed for 6 s.**
$$
\text{Clock rate}_B = \frac{\text{Cycles}_B}{\text{CPU time}_B} = \frac{48\times10^{9}}{6\ \text{s}} = 8\times10^{9}\ \text{Hz} = 8\ \text{GHz}
$$

Tell the designer to target **8 GHz**: twice A's clock rate, to run the program 10/6 ≈ 1.67 times faster despite needing 20% more cycles.`,

  "6b": md`**Register use:** \`$t0\` = a, \`$t1\` = b, \`$t2\` = c, \`$t3\` = N (as given); \`$t4\`, \`$t5\` temporaries; \`$v0\` = return value.

\`\`\`
main:
        addi $t0, $zero, 5       # a = 5
        addi $t1, $zero, 10      # b = 10
        addi $t2, $zero, 2       # c = 2
        addi $t3, $zero, 30      # N = 30
Loop:                            # do {
        sll  $t4, $t0, 2         #   $t4 = a << 2
        slt  $t5, $t1, $t4       #   $t5 = (b < (a << 2)), i.e. (a << 2) > b
        beq  $t5, $zero, Else    #   if not, go to else
        addi $t0, $t0, 2         #   a += 2
        add  $t1, $t1, $t0       #   b += a
        j    Cond
Else:   add  $t0, $t0, $t2       #   a += c
        add  $t1, $t1, $t2       #   b += c
Cond:   slt  $t5, $t0, $t3       # } while (a < N)
        bne  $t5, $zero, Loop
        add  $v0, $zero, $zero   # return 0
        jr   $ra
\`\`\`

**How the condition is coded.** MIPS has no "branch if greater than", so $(a \ll 2) > b$ is computed as $b < (a \ll 2)$ with \`slt\`, and the else-part is taken when the result is 0. The do-while tests at the **bottom** and branches back while $a < N$.

**Trace** (values after each iteration):

| Iteration | a << 2 | > b? | a | b |
|---|---|---|---|---|
| 1 | 20 | 20 > 10 yes | 7 | 17 |
| 2 | 28 | 28 > 17 yes | 9 | 26 |
| 3 | 36 | 36 > 26 yes | 11 | 37 |
| 4 | 44 | 44 > 37 yes | 13 | 50 |
| 5 | 52 | 52 > 50 yes | 15 | 65 |
| 6 | 60 | 60 > 65 no | 17 | 67 |
| 7 | 68 | 68 > 67 yes | 19 | 86 |
| 8 | 76 | 76 > 86 no | 21 | 88 |
| 9 | 84 | 84 > 88 no | 23 | 90 |
| 10 | 92 | 92 > 90 yes | 25 | 115 |
| 11 | 100 | 100 > 115 no | 27 | 117 |
| 12 | 108 | 108 > 117 no | 29 | 119 |
| 13 | 116 | 116 > 119 no | 31 | 121 |

After iteration 13, a = 31 is not less than 30, so the loop ends with a = 31, b = 121, and \`$v0\` = 0.`,

  "6c": md`**PC-relative addressing.** The target is the PC (already incremented, PC + 4) plus the 16-bit constant in the instruction, multiplied by 4:
$$
\text{Target} = (\text{PC} + 4) + \text{offset}\times4
$$
Used by conditional branches, because most branch targets are near the branch.

Example: \`beq $s1, $s2, L\` at address 80012, with L at 80024: offset $= (80024 - 80016)/4 = 2$, so the instruction stores 2.

\`\`\`fig
isa-mode-pcrel
\`\`\`

**Immediate addressing.** The operand is a 16-bit constant inside the instruction itself; no register or memory access is needed for it.

Example: \`addi $s1, $s2, 100\`: \`$s1\` = \`$s2\` + 100. The 100 is in the instruction's constant field (sign-extended to 32 bits).

\`\`\`fig
isa-mode-immediate
\`\`\`

**Base (displacement) addressing.** The memory operand is at the address formed by adding a register (the base) and the 16-bit sign-extended constant (the displacement):
$$
\text{Address} = \text{Reg[rs]} + \text{sign-extend(constant)}
$$
Used by loads and stores.

Example: \`lw $s1, 100($s2)\`: \`$s1\` = Memory[\`$s2\` + 100]. If \`$s2\` = 1000, the word at address 1100 is loaded.

\`\`\`fig
isa-mode-base
\`\`\``,

  "7a": md`**(i) Long-multiplication approach (the first multiplier hardware).**

\`\`\`fig
arith-mult-v1
arith-mult-v1-flow
\`\`\`

- 64-bit Multiplicand register (the 32-bit multiplicand starts in its right half), shifting left one bit per step.
- 32-bit Multiplier register, shifting right one bit per step.
- 64-bit ALU and 64-bit Product register (initially 0).
- Each of the 32 repetitions: (1) if Multiplier₀ = 1, add the multiplicand to the product; (2) shift the multiplicand left 1; (3) shift the multiplier right 1.

**Simulation: 1000 × 1011** (4-bit operands, so 4 repetitions; the multiplicand and product registers are 8 bits):

${mulTable(m1.rows)}

Product: ${m1.product} = 88 = 8 × 11.

**(ii) Parallel add/shift approach (the refined multiplier).**

\`\`\`fig
arith-mult-v2
arith-mult-v2-flow
\`\`\`

- 32-bit Multiplicand register (it does not shift) and 32-bit ALU.
- 64-bit Product register that starts with the **multiplier in its right half** (the separate Multiplier register is gone).
- The add and the shift are done in parallel, in one cycle per bit: (1) if Product₀ = 1, add the multiplicand to the left half of the product; (2) shift the whole product (with the adder's carry-out) right 1.

**Simulation: 1000 × 1011:**

${mulTable(m2.rows, { gapProduct: true })}

Product: ${m2.product} = 88, the same result with half the hardware and one cycle per step.`,

  "7b": md`**Purpose of the bias.** The exponent field is stored as **actual exponent + bias** (127 for single, 1023 for double), which makes the field **unsigned**: negative exponents (small numbers) get small positive codes, positive exponents large codes.

Because the exponent field comes right after the sign bit and before the fraction, a larger (non-negative) floating-point number then always has a larger bit pattern read as an unsigned integer. So floats can be **compared and sorted with integer comparison hardware**. With two's-complement exponents, a negative exponent would look like a large number and break this.

The all-0s and all-1s exponent fields are reserved (zero/denormals and infinity/NaN), so normalised numbers use fields 1 to 254 (single) or 1 to 2046 (double).

**(i) Single precision** (1 sign, 8 exponent, 23 fraction bits, bias 127).
- **Smallest** positive normalised value: exponent field 0000 0001, so actual exponent $1 - 127 = -126$; fraction all 0s, so significand 1.0.
  $$
  1.0\times2^{-126} \approx 1.2\times10^{-38}
  $$
  Bits: ${sMin.sign} ${sMin.exponent} ${sMin.fraction.slice(0, 4)}…0 = 0x${toHex(sMin.bits)}.
- **Largest** value: exponent field 1111 1110, so actual exponent $254 - 127 = 127$; fraction all 1s, so significand $2 - 2^{-23}$.
  $$
  (2 - 2^{-23})\times2^{127} \approx 3.4\times10^{38}
  $$
  Bits: ${sMax.sign} ${sMax.exponent} 1111…1 = 0x${toHex(sMax.bits)}.
- Negative values mirror these with sign bit 1: from $-3.4\times10^{38}$ to $-1.2\times10^{-38}$.

**(ii) Double precision** (1 sign, 11 exponent, 52 fraction bits, bias 1023).
- **Smallest:** exponent field 000 0000 0001, actual exponent $1 - 1023 = -1022$:
  $$
  1.0\times2^{-1022} \approx 2.2\times10^{-308}
  $$
  Bits: 0x${toHex(dMin.bits)}.
- **Largest:** exponent field 111 1111 1110, actual exponent $2046 - 1023 = 1023$, fraction all 1s:
  $$
  (2 - 2^{-52})\times2^{1023} \approx 1.8\times10^{308}
  $$
  Bits: 0x${toHex(dMax.bits)}.`,

  "8a": md`**(i) Why is PC incremented by 4?** Memory is **byte-addressed**, and every MIPS instruction is one 32-bit word = 4 bytes, stored at word-aligned addresses. So the next instruction in sequence is at PC + 4, not PC + 1.

**(ii) How is the clock-cycle length set in a single-cycle design?** Every instruction must finish in **one** clock cycle, and the cycle is the same for all instructions. So the clock period must be at least the delay of the **longest path** through the datapath, the critical path of the slowest instruction: the load, instruction memory → register file → ALU → data memory → register file (e.g. 200 + 100 + 200 + 200 + 100 = 800 ps). Faster instructions waste the rest of the cycle.

**(iii) Why the upper 4 bits of PC + 4 in the jump address?** The J-format has room for only 26 address bits. Instructions are word-aligned, so the two low bits are always 00 and need not be stored; that gives 28 bits. The **remaining top 4 bits** are taken from the current PC + 4:
$$
\text{Target} = (\text{PC} + 4)[31{:}28] : \text{address}[25{:}0] : 00
$$
So a jump reaches any word within the same 256 MB ($2^{28}$-byte) region as the jump itself.

**(iv) One memory for both instructions and data?** **Disagree.** In a single-cycle datapath, a load or store must **fetch its instruction and access its data in the same clock cycle**. One (single-ported) memory can do only one access per cycle, so the two accesses would conflict: a structural hazard. Each datapath element can do only one function per cycle, which is exactly why the single-cycle design uses **separate instruction and data memories**. (A multicycle design can share one memory, because fetch and data access happen in different cycles.)`,

  "8b": md`**Components to add:**
1. A **shift-left-2** unit on instruction bits [25–0], giving a 28-bit word address times 4.
2. **Concatenation** of the upper 4 bits of PC + 4 [31–28] with those 28 bits, giving the 32-bit jump address. (Just wiring, no gates.)
3. A **2-to-1 multiplexer** in front of the PC, choosing between the existing next-PC value (the branch mux's output, PC + 4 or the branch target) and the jump address.
4. A new control signal, **Jump**, decoded from the opcode (\`j\` has opcode 2), driving that mux. For \`j\`: Jump = 1, RegWrite = 0, MemWrite = 0 (no state is changed except the PC).

\`\`\`fig
dp-j
\`\`\`

In the figure, the jump path is highlighted: Instruction [25–0] → shift left 2 (26 → 28 bits) → joined with PC + 4 [31–28] → "Jump address [31–0]" → the Jump mux → PC.`,

  "8c": md`A \`beq\` can only reach targets within about ±128 KB: its 16-bit field is a word offset from PC + 4. A \`j\` has a 26-bit field and reaches anywhere in the current 256 MB region. So replace the far branch with the **opposite** branch around a jump:

\`\`\`
        bne $s0, $s1, L2     # not equal: skip the jump (the original beq would not branch)
        j   L1               # equal: jump to the far target L1
L2:     ...                  # code that followed the original beq
\`\`\`

Since \`$s0\` = \`$s1\` here, \`bne\` falls through and \`j L1\` is executed, reaching L1 exactly as the original \`beq\` intended. If they had been unequal, \`bne\` would skip the jump and execution would continue at L2, as with the original \`beq\` not taken.`,
}
