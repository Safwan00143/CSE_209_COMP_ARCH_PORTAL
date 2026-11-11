import { md } from "../md"
import { after, before } from "./compose"
import { b15Solutions } from "./b15-solutions"
import { b16Solutions } from "./b16-solutions"
import { b22Solutions } from "./b22-solutions"
import { multicycleControlNote } from "../notes/multicycle-control"
import { accessTable, simulateCache, type CacheConfig } from "@/lib/cache"
import { assemble, parse } from "@/lib/mips"

const fx = (x: number, k = 4) => String(Number(x.toFixed(k)))

/* ───── Q1(a) ───── */
export const SWITCH_SRC = `        slt  $t3, $s5, $zero      # k < 0 ?
        bne  $t3, $zero, Exit
        slti $t3, $s5, 4          # k < 4 ?
        beq  $t3, $zero, Exit
        sll  $t1, $s5, 2          # $t1 = 4 * k
        add  $t1, $t1, $t4        # $t1 = address of JumpTable[k]
        lw   $t0, 0($t1)          # $t0 = JumpTable[k], the address of case k
        jr   $t0                  # jump to case k
L0:     add  $s0, $s3, $s4        # case 0: f = i + j
        j    Exit
L1:     add  $s0, $s1, $s2        # case 1: f = g + h
        j    Exit
L2:     sub  $s0, $s1, $s2        # case 2: f = g - h
        j    Exit
L3:     sub  $s0, $s3, $s4        # case 3: f = i - j
Exit:`

/* ───── Q1(c) ───── */
export const Q1C_SRC = "Loop: sll $t1, $s3, 2\nadd $t1, $t2, $s6\nlw $t0, 0($t1)\nbne $t0, $s5, Exit\naddi $s3, $s3, 1\nj Loop\nExit: nop"
const q1c = assemble(parse(Q1C_SRC), 80000)

/* ───── Q6(d) ───── */
export const Q6D_SEQ = Array.from({ length: 200 }, (_, i) => (i % 2 ? 0x2000 : 0x1000))
export const Q6D_CFG: CacheConfig = { sets: 32, ways: 1, blockBytes: 32 }
const r6 = simulateCache(Q6D_CFG, Q6D_SEQ)
const r6short = simulateCache(Q6D_CFG, Q6D_SEQ.slice(0, 6))

/* ───── Q3(a) ───── */
const micro = before(after(multicycleControlNote, "| Field | Values | Meaning |"), "## Horizontal and vertical microcode")

export const b10Solutions: Record<string, string> = {
  "1a": md`**A jump address table** (jump table) is an array of words in memory, each holding the **address of a block of code** (an instruction sequence). The program loads the address it needs from the table and jumps to it with \`jr\` (jump register). It replaces a long chain of comparisons and branches with one indexed load and one jump.

**Implementing switch.** Example:

\`\`\`
switch (k) {
  case 0: f = i + j; break;
  case 1: f = g + h; break;
  case 2: f = g - h; break;
  case 3: f = i - j; break;
}
\`\`\`

**Register use:** f–j in \`$s0\`–\`$s4\`, k in \`$s5\`. \`$t4\` holds the base address of **JumpTable**, a 4-word array containing the addresses of the labels L0, L1, L2, L3.

\`\`\`
${SWITCH_SRC}
\`\`\`

**How it works:**
1. **Range check:** if k is not in 0…3, there is no matching case; go to Exit (so \`jr\` never jumps through a word outside the table).
2. **Index the table:** each entry is a word, so the byte offset is 4k; JumpTable[k] is loaded into \`$t0\`.
3. **\`jr $t0\`** jumps to the code for case k.
4. Each case ends with \`j Exit\`, which implements \`break\` (the last case falls through to Exit).`,

  "1b": md`An I-format instruction holds only a 16-bit immediate, so a 32-bit constant is built in **two steps**:
1. **\`lui\` (load upper immediate)** puts a 16-bit constant in the **upper 16 bits** of a register and clears the lower 16 bits.
2. **\`ori\` (or immediate)** ORs a 16-bit constant into the **lower 16 bits**. \`ori\` zero-extends its immediate, so the upper half is unchanged.

**Example:** load $\texttt{0x003D0900}$ ($0000\ 0000\ 0011\ 1101\ 0000\ 1001\ 0000\ 0000_{two}$) into \`$s0\`:

\`\`\`
lui $s0, 61            # 61 = 0x003D: $s0 = 0x003D 0000
ori $s0, $s0, 2304     # 2304 = 0x0900: $s0 = 0x003D 0900
\`\`\`

\`\`\`fig
isa-lui-ori
\`\`\`

(\`addi\` cannot be used for the lower half, because it sign-extends: a lower half with its top bit set would change the upper half.) The assembler pseudoinstruction \`li $s0, 4000000\` expands to the same pair.`,

  "1c": md`**Addresses:** the 6 instructions occupy 80000 to 80020; Exit is at 80024.

| Address | Instruction |
|---|---|
${q1c.slice(0, 6).map((x) => `| ${x.pc} | \`${x.ins.text}\` |`).join("\n")}
| 80024 | \`Exit:\` |

**bne immediate** (PC-relative, in words from PC + 4):
$$
\text{offset} = \frac{\text{Exit} - (\text{PC} + 4)}{4} = \frac{80024 - 80016}{4} = ${q1c[3].enc.fields[3][1]}
$$

**j immediate** (pseudodirect, the word address):
$$
\text{address field} = \frac{\text{Loop}}{4} = \frac{80000}{4} = ${q1c[5].enc.fields[1][1]}
$$

Full encodings: bne = ${q1c[3].enc.fields.map((f) => f[1]).join(" | ")} (op, rs = \`$t0\`, rt = \`$s5\`, offset); j = ${q1c[5].enc.fields.map((f) => f[1]).join(" | ")} (op, address).`,

  "1d": md`**The problem.** \`beq\` is an I-format instruction with a **16-bit signed offset**, counted in words from PC + 4. It can reach only about ±32K instructions (±128 KB) from the branch. The "..." between \`here\` and \`there\` may be too long: if \`there\` is farther away, the offset does not fit in 16 bits and the assembler cannot encode the branch.

**The fix.** Invert the condition and branch around an unconditional **jump**, which has a 26-bit word address (reach: anywhere in the current 256 MB region):

\`\`\`
here:  bne  $s0, $s2, skip     # condition false: skip the jump
       j    there              # condition true: jump to the far target
skip:  ...
       ...
there: add  $s0, $s0, $s0
\`\`\`

The assembler does this rewriting automatically. (If \`there\` were even farther, outside the 256 MB region, it would load the address into a register with \`lui\`/\`ori\` and use \`jr\`.)`,

  "2": md`The four instructions need the changes numbered 2–5 below, which are the same as in the 2018-19 question (which also asked for slt and lui, steps 1 and 6). For this question only the rows for bne, j, jr and jal of the final table are needed.

${b16Solutions["1a"]}`,

  "3a": md`A **microprogram** describes the multicycle control as a program: each **microinstruction** specifies, in named fields, what the datapath does in one clock cycle, and a **sequencing** field says which microinstruction comes next. It is a readable notation for the same control FSM.

**Microinstruction fields:**

${micro.trim()}

**Explanation, line by line:**
- **Fetch** (state 0): read the instruction at PC into IR (Read PC) and compute PC + 4 in the ALU (Add, PC, 4), writing it to PC (PC write control = ALU). Seq: go to the next line.
- **Decode** (state 1): read rs and rt into A and B (Read), and compute the branch target PC + (offset × 4) into ALUOut (Add, PC, Extshft) in case it is a branch. Dispatch 1 on the opcode: lw/sw → Mem1, R-type → Rformat1, beq → BEQ1, j → JUMP1.
- **Mem1** (state 2): address = A + sign-extended offset (Add, A, Extend). Dispatch 2: lw → LW2, sw → SW2.
- **LW2** (states 3, 4): read memory at ALUOut into MDR (Read ALU), then write MDR to register rt (Write MDR); back to Fetch.
- **SW2** (state 5): write B to memory at ALUOut (Write ALU); back to Fetch.
- **Rformat1** (states 6, 7): compute A op B with the funct code (Func code, A, B), then write ALUOut to register rd (Write ALU); back to Fetch.
- **BEQ1** (state 8): subtract A − B (Subt) and, if Zero, load the PC from ALUOut, the target computed during decode (ALUOut-cond); back to Fetch.
- **JUMP1** (state 9): load the PC with the jump address (PC[31:28] : IR[25:0] : 00); back to Fetch.

\`\`\`fig
ctl-fsm
\`\`\``,

  "3d": md`**Yes, the claim is correct for this control unit.**

PCSource selects the next-PC source: 00 = ALU result (PC + 4), 01 = ALUOut (branch target), 10 = jump address. Look at where each signal is 1:

| State | PCWrite | PCWriteCond | PCSource | PCSource[0] |
|---|---|---|---|---|
| 0 (fetch) | 1 | 0 | 00 | 0 |
| 8 (beq) | 0 | 1 | 01 | **1** |
| 9 (jump) | 1 | 0 | 10 | 0 |
| all others | 0 | 0 | XX (unused) | 0 |

- **PCWriteCond is 1 only in state 8**, and **PCSource[0] is 1 only in state 8** (the only state that selects 01).
- In every state where the PC is written (0, 8, 9), PCSource[0] equals PCWriteCond. In the states where the PC is not written, PCSource is don't care, so setting PCSource[0] = PCWriteCond = 0 there changes nothing.

So the two are the same signal: one control output can drive both, saving a control line (the appendix makes the same observation, and ALUOp[0] is also 1 only in state 8). This holds only for this instruction set: adding an instruction that uses PCSource = 01 or 11 without a conditional write would break it.`,

  "4a": md`**Detecting data hazards.** A data hazard occurs when an instruction in EX needs a register that an earlier instruction, still in the pipeline (in MEM or WB), will write but has not yet written. The hazard is detected by **comparing register numbers carried in the pipeline registers**:
- **EX hazard:** the instruction one ahead (now in MEM) writes the register: EX/MEM.RegisterRd = ID/EX.RegisterRs (or Rt).
- **MEM hazard:** the instruction two ahead (now in WB) writes it: MEM/WB.RegisterRd = ID/EX.RegisterRs (or Rt).

Each check also requires that the earlier instruction **really writes a register** (RegWrite = 1) and that the register is **not \`$zero\`**.

**Solving them with a forwarding unit.**

${b22Solutions["1a"]}`,

  "4b": md`**The scenario: a load followed by an instruction that uses the loaded register (load-use hazard).**

\`\`\`
lw  $s2, 20($s1)
and $s4, $s2, $s5     # uses $s2 in the very next instruction
\`\`\`

\`\`\`fig
dh-load-use
\`\`\`

The loaded value exists only at the **end of the lw's MEM stage**. The \`and\` needs it at the **start of its EX stage**, which is the same clock cycle. Forwarding can only send a value **forward in time**, from a pipeline register to a later stage; it cannot deliver a value before it has been read from memory. So forwarding alone cannot solve this hazard.

**What to do.**

${after(b15Solutions["2a"], "**Detecting the load-use hazard.**")}

**Avoiding the stall:** the compiler can **reorder** the code so that an independent instruction sits between the load and its use (code scheduling); then forwarding from MEM/WB is enough and no bubble is needed.`,

  "4c": md`A **branch hazard** (control hazard) occurs because the processor must fetch the next instruction **before it knows** which instruction comes next: whether a branch is taken and its target are decided only in a later stage (MEM in the basic pipeline, ID with early-branch hardware), while fetching continues every cycle.

- If the branch is taken, the instructions already fetched after it are on the wrong path and must be **flushed**, wasting cycles (the branch penalty).
- **Solutions:** stall until the branch is resolved (slow); decide the branch earlier, in ID, with a comparator and target adder, so only 1 instruction is wasted; **predict** the outcome (predict not taken, or dynamic 1-bit/2-bit predictors with a branch target buffer) and flush only on a misprediction; or fill the slot after the branch with a useful instruction (delayed branch).`,

  "5a": md`**Average read or write time** = seek + rotational latency + transfer + controller overhead (no queuing delay: the disk is idle).
- **Seek:** 4 ms.
- **Rotational latency:** on average half a rotation:
$$
\frac{0.5\ \text{rotation}}{15{,}000/60\ \text{rotations per s}} = \frac{0.5}{250}\ \text{s} = 2\ \text{ms}
$$
- **Transfer:**
$$
\frac{512\ \text{B}}{100\ \text{MB/s}} = \frac{512}{100\times10^{6}}\ \text{s} = 0.005\ \text{ms}
$$
- **Controller overhead:** 0.2 ms.

$$
T = 4 + 2 + 0.005 + 0.2 = 6.205\ \text{ms} \approx 6.2\ \text{ms}
$$

The seek and rotational latency dominate. If the actual average seek is shorter (locality and OS scheduling often make it about a quarter of the quoted average), e.g. 1 ms, the time drops to about 3.2 ms.`,

  "5c": md`| | NOR flash | NAND flash |
|---|---|---|
| Bit cell | like a **NOR** gate | like a **NAND** gate |
| Access | **random** read/write access to individual words | read and written a **block (page) at a time** |
| Density | lower | **denser** (more bits per area) |
| Cost per GB | higher | **cheaper** |
| Typical use | **instruction memory** in embedded systems (code can run directly from it) | **USB keys, media storage**, SSDs |

Both are nonvolatile, and in both the bits **wear out** after thousands of writes, so controllers use **wear leveling** (remapping data to less-used blocks).`,

  "6a": md`Total time = 50 + 80 + 50 + 30 = 210 s.

**(i) FP time reduced by 20%:** FP becomes $50\times0.8 = 40$ s.
$$
T = 40 + 80 + 50 + 30 = 200\ \text{s},\qquad \text{reduction} = \frac{10}{210} \approx ${fx((10 / 210) * 100, 2)}\%
$$

**(ii) Total reduced by 20% by improving INT only.** The target is $210\times0.8 = 168$ s; the other operations still take $50 + 50 + 30 = 130$ s, so INT may take only
$$
168 - 130 = 38\ \text{s}
$$
INT time must fall from 80 s to 38 s: a reduction of $42/80 = 52.5\%$.

**(iii) Branch only: no.** A 20% reduction needs 42 s to be saved, but branch instructions take only 30 s in total. Even reducing branch time to 0 saves only 30 s (14.3%). (Amdahl's Law: the improvement is limited by the fraction of time the improved part takes.)`,

  "6c": md`**Agree.**

The TLB caches **page-table entries** to speed up address translation. A valid TLB entry holds a **physical page number**, so it can only describe a virtual page that is currently **in physical memory**. A page that is on disk has no physical page number, so there is nothing to put in the TLB for it; its page-table entry has the valid bit off (and the OS keeps its disk location elsewhere).

So on every access:
- **TLB hit:** the page is in memory; the translation is used directly.
- **TLB miss:** the page table is checked. If the page-table entry is valid (the page is in memory), the translation is loaded into the TLB and the access is retried. If it is not valid, it is a **page fault**: the OS brings the page in from disk, updates the page table, and only then can the translation enter the TLB.

That is why the TLB is described as a cache of the page table for **only** the entries that map to physical pages.`,

  "6d": md`**Cache geometry.** 1 KB with 32 blocks: each block is $1024/32 = 32$ bytes, so the offset is 5 bits and the index is 5 bits:
$$
\text{index} = \left\lfloor\frac{\text{address}}{32}\right\rfloor \bmod 32
$$
- $\texttt{0x1000} = 4096$: block 128, index $128 \bmod 32 = 0$, tag $4$.
- $\texttt{0x2000} = 8192$: block 256, index $256 \bmod 32 = 0$, tag $8$.

**Both blocks map to index 0**, the same cache block. Since accesses alternate, every access replaces the other block.

First accesses (the pattern then repeats):

${accessTable(r6short, Q6D_CFG, { byteAddresses: true })}

**Result:** all ${r6.accesses.length} accesses miss: **${r6.misses} misses** (hit rate ${r6.hitRate * 100}%).
- **Compulsory misses: 2.** The first access to each block: the block has never been in the cache, so it would miss in any cache.
- **Conflict misses: ${r6.misses - 2}.** Every other miss. The block had been in the cache and was evicted only because the other block maps to the same index. A fully associative cache (or a 2-way one) would hold both blocks and hit on all of these. They are not capacity misses: the two blocks (64 bytes) fit easily in 1 KB.`,

  "7a": md`**Write-back:** a write updates only the cache block and sets its **dirty bit**; the block is written to memory only when it is **replaced**.

**Advantages:**
1. **Writes run at cache speed**: the processor does not wait for slow memory on every store.
2. **Less memory traffic:** many writes to the same block (e.g. a loop updating a variable or an array in one block) cost **one** write-back when the block leaves the cache, not one memory write each. This saves memory bandwidth, which matters most in multiprocessors and with high store rates.
3. **Whole blocks are written** at once, which suits DRAM and buses better than single words.
4. **Clean blocks are never written back**: a block that was only read is simply discarded on replacement.

(Write-through instead needs a write buffer and still stalls when stores arrive faster than memory can accept them.)`,

  "7b": md`**Number of lines (blocks):**
$$
\frac{16\ \text{KB}}{128\ \text{B}} = \frac{2^{14}}{2^{7}} = 2^{7} = 128\ \text{lines}
$$

**Sets = lines / associativity:**

| Associativity | Sets |
|---|---|
| 2-way | $128/2 = 64$ |
| 4-way | $128/4 = 32$ |
| 8-way | $128/8 = 16$ |`,

  "7c": md`**Miss penalty to main memory:** $100\ \text{ns}\times1\ \text{GHz} = 100$ cycles.

**(i) First-level cache only:**
$$
\text{CPI} = 2.0 + 0.04\times100 = 2.0 + 4.0 = 6.0
$$

**(ii) With a direct-mapped L2** (10 cycles; global miss rate to memory 4%). Every L1 miss pays the L2 access; misses in L2 also pay main memory:
$$
\text{CPI} = 2.0 + 0.04\times10 + 0.04\times100 = 2.0 + 0.4 + 4.0 = 6.4
$$

**(iii) With an eight-way L2** (20 cycles; global miss rate 1.6%):
$$
\text{CPI} = 2.0 + 0.04\times20 + 0.016\times100 = 2.0 + 0.8 + 1.6 = 4.4
$$

**Comparison:** with the given numbers, the direct-mapped L2 has the same global miss rate as L1 alone (4%): it removes no main-memory accesses and only adds its own 10-cycle access, so the CPI gets **worse** (6.0 → 6.4). The eight-way L2 is slower per access but cuts the global miss rate to 1.6%, giving the best CPI, **4.4** (${fx(6 / 4.4, 3)} times faster than L1 alone).`,

  "7d": md`**Interleaved memory** organises the main memory (DRAM) as several independent **banks**, with consecutive words placed in **different banks** (word $i$ goes to bank $i \bmod n$).

- To read a multi-word cache block, the address is sent to **all banks at once**; each bank accesses its word **in parallel**, and the words are then transferred one after another over a normal one-word-wide bus.
- The long DRAM access time is paid **once** per block instead of once per word, which raises the memory bandwidth and cuts the miss penalty.
- It achieves most of the benefit of a wider memory without widening the bus.

**Example** (a common textbook illustration, with assumed timings: 1 bus cycle to send the address, 15 bus cycles per DRAM access, 1 bus cycle per word transferred), for a 4-word block:
- one-word-wide memory: $1 + 4\times15 + 4\times1 = 65$ bus cycles;
- 4-bank interleaved memory: $1 + 15 + 4\times1 = 20$ bus cycles.`,

  "8a": before(b16Solutions["7c"], "**Encoding of infinity:**").trimEnd(),
}
