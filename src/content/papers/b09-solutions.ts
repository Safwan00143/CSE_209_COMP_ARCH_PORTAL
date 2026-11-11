import { md } from "../md"
import { after, before } from "./compose"
import { b11Solutions } from "./b11-solutions"
import { b14Solutions } from "./b14-solutions"
import { b15Solutions } from "./b15-solutions"
import { b16Solutions } from "./b16-solutions"
import { b17Solutions } from "./b17-solutions"
import { multicycleControlNote } from "../notes/multicycle-control"
import { accessTable, simulateCache, totalBits, type CacheConfig } from "@/lib/cache"
import { predictorTable, runPredictor, twoBitPredictor, type Outcome } from "@/lib/predictor"

const fx = (x: number, k = 4) => String(Number(x.toFixed(k)))

/* ───── Q4(e) ───── */
export const Q4E: Outcome[] = ["T", "T", "N", "T"]
export const q4e = (() => {
  const p = twoBitPredictor("SN")
  const runs = []
  let start = p.start
  for (let k = 0; k < 4; k++) {
    const r = runPredictor({ ...p, start }, Q4E)
    runs.push(r)
    start = r.final
  }
  return runs
})()

/* ───── Q5(c) ───── */
export const Q5C_SEQ = [0, 4, 0, 2, 6, 8]
export const Q5C_CFG: Record<"fa" | "two" | "dm", CacheConfig> = { fa: { sets: 1, ways: 4 }, two: { sets: 2, ways: 2 }, dm: { sets: 4, ways: 1 } }
const r5 = { fa: simulateCache(Q5C_CFG.fa, Q5C_SEQ), two: simulateCache(Q5C_CFG.two, Q5C_SEQ), dm: simulateCache(Q5C_CFG.dm, Q5C_SEQ) }

/* ───── Q6(b) ───── */
export const Q6B = { i: 0.02, d: 0.04, cpi: 6, penalty: 400, ls: 0.36 }
const st6 = Q6B.i * Q6B.penalty + Q6B.ls * Q6B.d * Q6B.penalty

/* ───── Q8(a) ───── */
const t8 = totalBits({ addressBits: 32, dataBytes: 16 * 1024 * 16, blockBytes: 16, ways: 4 })

export const b09Solutions: Record<string, string> = {
  "1a": md`The **five classic components** of a computer:

| Component | Task |
|---|---|
| **Input** | brings data and programs into the computer (keyboard, mouse, network, disk read) |
| **Output** | sends results out of the computer (display, printer, network, disk write) |
| **Memory** | stores the programs while they run and the data they need (DRAM main memory, caches) |
| **Datapath** | performs the arithmetic and logic operations on the data (ALU, registers, buses) |
| **Control** | tells the datapath, memory and I/O devices what to do, according to the program's instructions (sends control signals, sequences the steps) |

The **datapath and control together form the processor** (CPU). Input and output devices are often grouped as **I/O**, and secondary storage (disk, flash) holds programs and data between runs.`,

  "1c": md`**CPU time per instruction** = CPI × clock cycle time (the instruction count I is the same, since both run the same program on the same ISA).
$$
\text{CPU time}_A = I\times2.0\times250\ \text{ps} = 500\,I\ \text{ps}
$$
$$
\text{CPU time}_B = I\times1.2\times500\ \text{ps} = 600\,I\ \text{ps}
$$
$$
\frac{\text{Performance}_A}{\text{Performance}_B} = \frac{\text{CPU time}_B}{\text{CPU time}_A} = \frac{600\,I}{500\,I} = 1.2
$$
**Computer A is 1.2 times faster** for this program, despite its higher CPI: its clock is twice as fast.`,

  "1d": md`**Amdahl's Law:**
$$
T_{\text{improved}} = \frac{T_{\text{affected}}}{\text{improvement}} + T_{\text{unaffected}}
$$
- Floating point: $50\%\times10 = 5$ s, made 5 times faster: $5/5 = 1$ s.
- The rest: 5 s, unchanged.

$$
T_{\text{improved}} = 1 + 5 = 6\ \text{s},\qquad \text{speed-up} = \frac{10}{6} \approx 1.67
$$
Even an infinitely fast FP unit would give at most $10/5 = 2$.`,

  "1e": md`$$
\text{MIPS} = \frac{\text{instruction count}}{\text{execution time}\times10^{6}} = \frac{\text{clock rate}}{\text{CPI}\times10^{6}}
$$

**Problems:**
1. **It ignores the instruction count.** Computers with different instruction sets need different numbers of instructions for the same program, so their MIPS ratings cannot be compared: a machine with simpler instructions can have a higher MIPS rating but be slower.
2. **It varies between programs on the same computer,** because CPI depends on the instruction mix. A computer has no single MIPS rating.
3. **It can vary inversely with performance.** Example: A runs 10 billion instructions at 4 GHz with CPI 1 (4000 MIPS, 2.5 s); B runs 8 billion at 4 GHz with CPI 1.1 (about 3636 MIPS, 2.2 s). A has the higher MIPS rating, but B is faster.

The only reliable measure is execution time.`,

  "2a": before(b11Solutions["6a"], "**Starting a Java application:**").trimEnd(),

  "2b": md`**Instructions:**
- **\`jal ProcedureAddress\` (jump and link):** jumps to the procedure **and** saves the return address (PC + 4, the instruction after the call) in register \`$ra\`.
- **\`jr $ra\` (jump register):** returns: jumps to the address in \`$ra\`.
- \`addi $sp, $sp, ±k\`, \`sw\`, \`lw\`: push registers on the stack and pop them, to save values across calls.

**Registers:**

| Register | Number | Purpose |
|---|---|---|
| \`$a0\`–\`$a3\` | 4–7 | the first four **arguments** passed to the procedure |
| \`$v0\`, \`$v1\` | 2–3 | **return values** |
| \`$ra\` | 31 | **return address**, written by \`jal\` |
| \`$sp\` | 29 | **stack pointer**: top of the stack, used to save and restore registers (and for extra arguments) |
| \`$fp\` | 30 | frame pointer: start of the procedure's frame (optional) |
| \`$s0\`–\`$s7\` | 16–23 | **saved** registers: the callee must preserve them (save and restore if it uses them) |
| \`$t0\`–\`$t9\` | 8–15, 24–25 | **temporary** registers: not preserved by the callee |
| \`$gp\` | 28 | global pointer to static data |

**The steps of a call:** the caller puts the arguments in \`$a0\`–\`$a3\` and executes \`jal\`; the callee saves the registers it must preserve on the stack, does its work, puts the result in \`$v0\`, restores the registers and \`$sp\`, and executes \`jr $ra\`. A non-leaf procedure must also save \`$ra\` (and any arguments it still needs) before its own \`jal\`.`,

  "2c": b11Solutions["6d"],

  "2d": b16Solutions["6a"],

  "3a": md`**Observations that minimise the hardware:**
- \`add\` and \`sw\` both use the ALU only to **add** (for \`sw\`, the address = base + offset), so the "ALU" is a plain **adder**: no ALU control and no ALUOp.
- Only \`add\` writes a register, and always to **rd**: no RegDst mux. It always writes the ALU result: no MemtoReg mux, and the data memory needs **no read port**.
- \`sw\` uses the sign-extended offset, \`add\` uses rt: one **ALUSrc mux** is needed.
- There is no branch: no branch adder, no shift for the branch, no Zero output.
- \`j\` needs the jump target and a **Jump mux** choosing between PC + 4 and the target.

**The datapath:**

| Element | Connections |
|---|---|
| PC | → instruction memory address; → adder (+4) |
| PC + 4 adder | → Jump mux input 0; its top 4 bits → jump target |
| Instruction memory | bits 25–21 → Read register 1; bits 20–16 → Read register 2; bits 15–11 → Write register; bits 15–0 → sign-extend; bits 25–0 → shift-left-2 |
| Shift-left-2 (26 → 28 bits) + PC+4[31:28] | → jump target → Jump mux input 1 |
| Jump mux | → PC |
| Register file | Read data 1 → adder input A; Read data 2 → ALUSrc mux input 0 and → data memory Write data |
| Sign-extend | → ALUSrc mux input 1 |
| ALUSrc mux | → adder input B |
| Adder (the ALU) | → register file Write data; → data memory Address |
| Data memory (write only) | Address, Write data, MemWrite |

**Control** (4 signals, decoded from the opcode):

| Instruction | RegWrite | ALUSrc | MemWrite | Jump |
|---|---|---|---|---|
| add | 1 | 0 | 0 | 0 |
| sw | 0 | 1 | 1 | 0 |
| j | 0 | X | 0 | 1 |

For comparison, the full single-cycle datapath, from which the unused parts (data-memory read, MemtoReg and RegDst muxes, ALU control, branch logic) are removed:

\`\`\`fig
dp-full
\`\`\``,

  "3b": md`The same ALU is used by all instruction classes, for different purposes:

| Class | Purpose of the ALU | ALU operation |
|---|---|---|
| **R-type** (\`add\`, \`sub\`, \`and\`, \`or\`, \`slt\`) | perform the instruction's **operation** on two registers | given by the **funct** field (ALUOp = 10) |
| **Load/store** (\`lw\`, \`sw\`) | compute the **memory address** = base register + sign-extended offset | **add** (ALUOp = 00) |
| **Branch** (\`beq\`) | **compare** the two registers: subtract them; Zero = 1 means equal | **subtract** (ALUOp = 01) |

(The branch target address itself is computed by a separate adder, not by the ALU, in the single-cycle datapath.)`,

  "3c": md`${after(multicycleControlNote, "## Hardwired versus microprogrammed control").replace(/^## Hardwired versus microprogrammed control\s*/, "").trim()}

**Properties in short:**
- **Hardwired:** the control is a finite-state machine built from gates, a ROM or a PLA. Fast and compact, but hard to change; preferred for simple, regular instruction sets (RISC) and high clock rates.
- **Microprogrammed:** each control step is a microinstruction stored in a control memory (control store), sequenced by a microprogram counter. Easy to design, modify and extend (change the microcode), suits large, complex instruction sets, but slower because a microinstruction must be fetched in every step.`,

  "3d": md`**(i) \`lw $6, 36($1)\`:**
- **EX:** the ALU computes the **memory address**: register \`$1\` (from ID/EX) + the sign-extended offset 36 (ALUSrc = 1, ALU adds). The address goes into EX/MEM.
- **MEM:** **reads data memory** at that address (MemRead = 1). The loaded word goes into MEM/WB, to be written to \`$6\` in WB.

**(ii) \`add $5, $5, $5\`:**
- **EX:** the ALU **adds** the two register values read in ID (\`$5\` + \`$5\`; ALUSrc = 0, ALU control from funct = 32). The sum goes into EX/MEM.
- **MEM:** **nothing**: \`add\` does not access memory (MemRead = MemWrite = 0). The ALU result simply passes from EX/MEM to MEM/WB, to be written to \`$5\` in WB.`,

  "4a": md`**IF/ID** (written at the end of IF):
- the fetched **instruction** (32 bits);
- **PC + 4** (needed later for the branch target and \`jal\`).

**ID/EX** (written at the end of ID):
- **PC + 4**;
- **Read data 1** and **Read data 2** (the values of registers rs and rt);
- the **sign-extended 16-bit immediate** (32 bits);
- the register numbers **rt** and **rd** (for choosing the destination with RegDst in EX), and **rs** (for the forwarding unit);
- the **control signals** for the later stages, generated in ID: EX (RegDst, ALUOp, ALUSrc), MEM (Branch, MemRead, MemWrite) and WB (MemtoReg, RegWrite).`,

  "4b": md`${before(b14Solutions["4a"], "**Structural hazard, time-space diagram.**").trimEnd()}

**Examples:**
- **Structural:** with a single memory, a load's data access and a later instruction's fetch would need the memory in the same cycle. MIPS avoids it with separate instruction and data memories.
- **Data:** \`add $s0, $t0, $t1\` followed by \`sub $t2, $s0, $t3\`: \`sub\` needs \`$s0\` before \`add\` has written it. Solved by forwarding (and a stall for load-use).
- **Control (branch):** after \`beq\`, the next instruction is fetched before the branch outcome is known. Solved by stalling, early branch decision, or prediction.`,

  "4c": before(after(b15Solutions["2a"], "**Double data hazard.**"), "**Detecting the load-use hazard.**").trimEnd(),

  "4d": md`**Dependences:**
- \`sw $6, 50($1)\` uses **\`$6\`**, written by \`add\` just before it (distance 1);
- and **\`$1\`**, written by \`lw\` two instructions before it (distance 2).
- (\`add\` overwrites \`$6\`, which \`lw\` reads as its base; \`lw\` reads it in ID, before \`add\` writes it, so this causes no hazard in the in-order pipeline.)

**Without forwarding,** a value can be read in ID only in the same cycle as its WB (written in the first half of the cycle, read in the second half).
- \`add\` is in WB in cycle 6, so \`sw\` must be in ID no earlier than cycle 6: it would normally be in ID in cycle 4, so it must be delayed by **2 cycles**.
- \`lw\` is in WB in cycle 5, so \`$1\` is then also ready.

**Code with nops:**

\`\`\`
lw  $1, 40($6)
add $6, $2, $2
nop
nop
sw  $6, 50($1)
\`\`\`

**2 nops** are needed. Reordering cannot remove them: \`add\` cannot move above \`lw\` (it would change \`lw\`'s base register \`$6\`), and \`sw\` needs both results.`,

  "4e": md`**States:** SN (strongly not taken, the bottom-left start state), WN, WT, ST. A taken branch moves one step towards ST; a not-taken one towards SN.

**First pass of the pattern** (T, T, NT, T) from SN:

${predictorTable(q4e[0].steps)}

Accuracy of the first pass: **${q4e[0].correct}/4 = ${q4e[0].correct * 25}%**.

**Second pass** (continuing from ${q4e[0].final}):

${predictorTable(q4e[1].steps)}

**Steady state:** from the second pass on, every pass starts in ${q4e[1].final} and repeats the same trace: T and T predicted correctly (state ST), NT mispredicted (ST → WT), the final T predicted correctly (WT predicts taken; WT → ST). Accuracy **${q4e[2].correct}/4 = ${q4e[2].correct * 25}%**.

The 2-bit hysteresis is what helps: the single NT moves the state only to WT, which still predicts taken, so the next T is predicted correctly.`,

  "5a": b16Solutions["8b"],

  "5b": md`They differ in **where a memory block may be placed** in the cache.

- **Direct mapped:** each block has exactly **one** possible location: index = (block address) mod (number of blocks). Lookup checks one tag: simple and fast, but blocks that map to the same index evict each other (conflict misses) even when the cache has free space.
- **Set associative (n-way):** the cache is divided into **sets** of n blocks. A block maps to one set, index = (block address) mod (number of sets), and may go in **any of the n blocks** of that set. Lookup compares n tags in parallel. Fewer conflict misses than direct mapped, at the cost of more comparators and a replacement policy (e.g. LRU).
- **Fully associative:** a block can go **anywhere** in the cache (a single set). Every tag must be compared (all in parallel), so it is expensive and used only for small caches (e.g. TLBs). No conflict misses.

Direct mapped is 1-way set associative; fully associative is m-way set associative for a cache of m blocks.`,

  "5c": md`Each cache has four one-word blocks; LRU replacement.

**Fully associative** (one set of 4):

${accessTable(r5.fa, Q5C_CFG.fa)}

**Two-way set associative** (2 sets; all addresses are even, so all map to set 0):

${accessTable(r5.two, Q5C_CFG.two)}

**Direct mapped** (index = address mod 4: 0, 4, 8 → 0; 2, 6 → 2):

${accessTable(r5.dm, Q5C_CFG.dm)}

| Organisation | Misses | Hits |
|---|---|---|
| Fully associative | ${r5.fa.misses} | ${r5.fa.hits} |
| Two-way set associative | ${r5.two.misses} | ${r5.two.hits} |
| Direct mapped | ${r5.dm.misses} | ${r5.dm.hits} |

The second access to 0 hits in the associative caches, but in the direct-mapped cache block 4 has already evicted block 0 from index 0.`,

  "5d": md`**Split cache:** the first-level cache is divided into two separate caches at the **same level**: an **instruction cache** and a **data cache**. An instruction fetch and a load/store can then be served **in the same cycle** (doubling the bandwidth, as the pipeline needs), and each cache can be organised for its own access pattern.

**Multilevel cache:** caches at **different levels** of the hierarchy: a small, fast L1 close to the processor, backed by a larger, slower L2 (and L3). An L1 miss is served by L2 instead of main memory, which cuts the **miss penalty**.

**The difference:** splitting divides one level by **content** (instructions versus data) to increase bandwidth; multilevel adds **levels** to reduce the miss penalty. They are used together: typically split L1 caches with a unified L2.`,

  "6a": md`**First version:**

\`\`\`fig
arith-mult-v1
\`\`\`

${b17Solutions["4b"]}`,

  "6b": md`**Missing information.** The question does not give the fraction of instructions that are loads or stores. **Assume 36%**, the value of the textbook example (P&H, SPECint2000).

**Step 1: miss penalty in cycles.** Clock period $= 1/4\ \text{GHz} = 0.25$ ns:
$$
\text{penalty} = \frac{100\ \text{ns}}{0.25\ \text{ns}} = ${Q6B.penalty}\ \text{cycles}
$$

**Step 2: memory stall cycles per instruction.**
$$
\text{I-cache: } 0.02\times${Q6B.penalty} = ${fx(Q6B.i * Q6B.penalty)}
$$
$$
\text{D-cache: } 0.36\times0.04\times${Q6B.penalty} = ${fx(Q6B.ls * Q6B.d * Q6B.penalty)}
$$
$$
\text{total} = ${fx(st6)}
$$

**Step 3: CPI and speed-up.**
$$
\text{CPI} = 6 + ${fx(st6)} = ${fx(6 + st6)},\qquad \frac{\text{CPI}_{\text{stalls}}}{\text{CPI}_{\text{perfect}}} = \frac{${fx(6 + st6)}}{6} \approx ${fx((6 + st6) / 6, 3)}
$$
With a perfect cache the processor is about **${fx((6 + st6) / 6, 2)} times faster**.

(If every instruction made a data access, the D-cache stalls would be $0.04\times400 = 16$, CPI $= 6 + 8 + 16 = 30$, and the speed-up 5.)`,

  "6c": md`**Steps on an instruction cache miss:**
1. Send the original PC value (the current PC − 4, since PC was already incremented) to the memory.
2. Instruct main memory to perform a **read** and **wait** for it to complete its access.
3. **Write the cache entry:** put the data from memory in the data portion of the entry, write the upper bits of the address (from the ALU) into the **tag** field, and turn the **valid** bit on.
4. **Restart the instruction** execution at the first step, which refetches the instruction, this time finding it in the cache.

During the miss the processor **stalls**: the pipeline (or the whole processor) is frozen, keeping the contents of the registers, until memory responds.

**A data cache miss** is handled the same way: the processor stalls until the block is read from memory and written into the cache (replacing the old block, which is first written back if it is dirty in a write-back cache), then the load completes.`,

  "6d": md`Accessing a sector of a disk takes:
1. **Queuing delay:** waiting if other accesses to the disk are pending (0 for an idle disk).
2. **Seek time:** moving the read/write heads to the right track. Manufacturers quote the average over all possible seeks (a few ms); locality and OS scheduling make the actual average smaller.
3. **Rotational latency:** waiting for the right sector to rotate under the head; on average **half a rotation**: $0.5/(\text{RPM}/60)$ seconds.
4. **Transfer time:** reading or writing the sector: sector size / transfer rate.
5. **Controller overhead:** time spent by the disk controller handling the request.

**Example (slides):** 512 B sector, 15,000 rpm, 4 ms average seek, 100 MB/s, 0.2 ms controller overhead, idle disk:
$$
4 + \frac{0.5}{15{,}000/60}\ \text{s} + \frac{512\ \text{B}}{100\ \text{MB/s}} + 0.2 = 4 + 2 + 0.005 + 0.2 \approx 6.2\ \text{ms}
$$
Seek and rotational latency dominate for small transfers.`,

  "7a": md`**(i) Virtual memory** uses main memory as a "cache" for secondary storage (disk), managed jointly by the CPU hardware and the operating system.
- Each program gets its own large **virtual address space**; the hardware translates virtual addresses to physical addresses.
- Programs can share the physical memory safely (**protection**: each process can access only its own pages), and a program can be larger than physical memory (only the pages in use need to be in memory).
- The unit is a **page** (e.g. 4 KB); a miss is a **page fault**, handled by the OS, which reads the page from disk.

**(ii) Page table and page table register.**
- The **page table** is a table in main memory, one per process, **indexed by the virtual page number**. Each entry holds a **valid bit** and the **physical page number** of the page if it is in memory (plus status bits such as dirty and reference). It performs the virtual-to-physical translation, and a valid bit of 0 signals a page fault.
- The **page table register** is a hardware register in the CPU that holds the **starting physical address of the page table** of the running process. Switching processes only requires changing this register (the OS saves and loads it).

**(iii) 32-bit virtual address → 30-bit physical address** (4 KB pages):
- page offset: 12 bits, copied unchanged;
- virtual page number: $32 - 12 = 20$ bits, the index into the page table ($2^{20}$ entries);
- physical page number: $30 - 12 = 18$ bits, read from the page table entry.

\`\`\`fig
vm-split
\`\`\`

\`\`\`fig
vm-page-table
\`\`\`

The physical address is the 18-bit physical page number followed by the 12-bit page offset (1 GB of physical memory, 4 GB of virtual memory).

**(iv) Page table size** (32-bit VA, 4 KB pages, 4 B per entry):
$$
\text{entries} = \frac{2^{32}}{2^{12}} = 2^{20}
$$
$$
\text{size} = 2^{20}\times4\ \text{B} = 2^{22}\ \text{B} = 4\ \text{MB}
$$
This is per process, which is why page tables are large.`,

  "8a": md`**Step 1: address fields.**
- Block = 4 words = 16 bytes: offset = **4 bits** (2 word + 2 byte).
- Sets $= 16\text{K}/4 = 4\text{K} = 2^{12}$: index = **12 bits**.
- Tag $= 32 - 12 - 4 =$ **${t8.split.tag} bits**.

**Step 2: total tag bits.**
$$
${t8.split.tag}\times16\text{K} = ${t8.split.tag}\times2^{14} = ${t8.tagBits.toLocaleString("en-US")}\ \text{bits} = 256\ \text{Kibit}
$$

**Step 3: total cache size.** Each block has 128 data bits, a ${t8.split.tag}-bit tag and a valid bit:
$$
128 + ${t8.split.tag} + 1 = ${t8.perBlock}\ \text{bits per block}
$$
$$
2^{14}\times${t8.perBlock} = ${t8.total.toLocaleString("en-US")}\ \text{bits} = ${t8.total / 8 / 1024}\ \text{KiB}
$$
(The cache holds 256 KiB of data; tags and valid bits add ${fx(((t8.total / 8 / 1024 - 256) / 256) * 100, 2)}%. With LRU bits, a few more bits per set would be added.)`,
}
