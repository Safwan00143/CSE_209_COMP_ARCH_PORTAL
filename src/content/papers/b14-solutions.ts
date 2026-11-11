import { md } from "../md"
import { mulTable } from "../render"
import { b16Solutions } from "./b16-solutions"
import { aluControl } from "@/lib/datapath"
import { fpAddSteps } from "@/lib/ieee"
import { assemble, parse } from "@/lib/mips"
import { multiplyRefined } from "@/lib/multiply"

/* ───── Q2(b) ───── */
export const Q2B_ROWS: [string, number, string, string, number][] = [
  ["lw", 0b00, "load word", "XXXXXX", 0b100000],
  ["sw", 0b00, "store word", "XXXXXX", 0b100000],
  ["beq", 0b01, "branch equal", "XXXXXX", 0b100000],
  ["R-type", 0b10, "add", "100000", 0b100000],
  ["R-type", 0b10, "subtract", "100010", 0b100010],
  ["R-type", 0b10, "AND", "100100", 0b100100],
  ["R-type", 0b10, "OR", "100101", 0b100101],
  ["R-type", 0b10, "set on less than", "101010", 0b101010],
]
const ALU_NAME: Record<number, string> = { 0b0000: "AND", 0b0001: "OR", 0b0010: "add", 0b0110: "subtract", 0b0111: "set on less than" }
const b4 = (x: number) => x.toString(2).padStart(4, "0")

/* ───── Q5(c) ───── */
export const Q5C = { FP: [40, 1], INT: [80, 1], LS: [90, 3], BR: [15, 2] } as Record<string, [number, number]>
const cyc = (cpi: Record<string, number> = {}) => Object.entries(Q5C).reduce((t, [k, [ic, c]]) => t + ic * (cpi[k] ?? c), 0)
const c0 = cyc()
const c3 = Number(cyc({ FP: 1.2, INT: 1.2, LS: 2.7, BR: 1.8 }).toFixed(3))
const fx = (x: number, k = 4) => String(Number(x.toFixed(k)))

/* ───── Q6(a) ───── */
export const Q6A_SRC = "Loop: sll $t7, $s0, 2\nadd $t7, $t7, $s1\nlw $t0, 0($t7)\nbne $t0, $s7, L1\naddi $s0, $s0, 1\nL1: j Loop"
export const Q6A_GIVEN = [
  "000000 00000 10000 01111 00010 000000",
  "000000 01111 10001 01111 00000 100000",
  "100011 01111 01000 00000 00000 000000",
  "000101 01000 10111 00000 00000 000001",
  "001000 10000 10000 00000 00000 000001",
  "000010 00000 00000 00000 00011 111010",
]
const q6 = assemble(parse(Q6A_SRC), 1000)

/* ───── Q7(b), Q8(c) ───── */
const fa = fpAddSteps(-0.25, 0.625, { expBits: 8, fracBits: 3 })
const mul = multiplyRefined("0110", "0110")

export const b14Solutions: Record<string, string> = {
  "1d": md`A microinstruction holds the control signals for one step. The two formats differ in how much the signals are **encoded**.

**Horizontal microinstructions:** one bit for **every** control signal (no encoding).
- **Merits:** maximum parallelism, since any combination of signals can be active in the same step; no decoding, so the signals are available at once and the control is fast; flexible.
- **Drawbacks:** very wide words (one bit per signal, often 100 or more bits), and most bits are 0 in most microinstructions, so control memory is wasted.

**Vertical microinstructions:** signals are **encoded** into fields. Mutually exclusive signals (e.g. which register drives the bus, which ALU operation) share one field of $\lceil\log_2 k\rceil$ bits for $k$ choices, and a decoder expands each field.
- **Merits:** much narrower words, so a smaller and cheaper control memory; the format reads like simple instructions, easier to write.
- **Drawbacks:** decoders add delay; fewer operations can be specified at once (only one choice per field), so more microinstructions and steps may be needed.

| | Horizontal | Vertical |
|---|---|---|
| Word length | long (one bit per signal) | short (encoded fields) |
| Decoding | none | needed (slower) |
| Parallelism | high | limited |
| Control store size | large | small |

The MIPS microprogram in Appendix D uses **field-encoded** microinstructions (ALU control, SRC1, SRC2, register control, memory, PCWrite control, sequencing): a compromise between the two, with a short word and only simple decoding.`,

  "2a": md`| Signal | Function |
|---|---|
| **ALUSrc** | selects the ALU's second operand: 0 = Read data 2 (register rt), for R-type and beq; 1 = the sign-extended 16-bit immediate, for lw, sw, addi |
| **ALUOp** (2 bits) | tells the ALU control what to do: 00 = add (lw, sw address), 01 = subtract (beq comparison), 10 = look at the funct field (R-type) |
| **RegDst** | selects the destination register number: 0 = rt (bits 20–16), for lw; 1 = rd (bits 15–11), for R-type |
| **MemWrite** | 1 = write the data on the Write data input into data memory at the given address (sw) |
| **RegWrite** | 1 = write the Write data value into the register selected by the Write register input (R-type, lw) |`,

  "2b": md`**Two-level decoding.** The main control produces a 2-bit **ALUOp** from the opcode. The **ALU control** unit combines ALUOp with the 6-bit **funct** field (instruction bits 5–0) to produce the 4-bit ALU control input.

- ALUOp = **00** (lw, sw): the ALU must **add** (base + offset); funct is ignored.
- ALUOp = **01** (beq): the ALU must **subtract** (rs − rt, to test Zero); funct is ignored.
- ALUOp = **10** (R-type): the operation is given by the **funct** field.

| Opcode | ALUOp | Operation | funct | ALU action | ALU control |
|---|---|---|---|---|---|
${Q2B_ROWS.map(([op, aluOp, name, funct, f]) => `| ${op} | ${aluOp.toString(2).padStart(2, "0")} | ${name} | ${funct} | ${ALU_NAME[aluControl(aluOp, f)]} | ${b4(aluControl(aluOp, f))} |`).join("\n")}

**Why two levels:** the main control does not need to know every R-type function, and the ALU control is a small, fast circuit. Its truth table needs only ALUOp1, ALUOp0 and funct bits F3–F0 (the upper funct bits are the same for all these instructions).`,

  "2c": md`R-type instructions (\`add\`, \`sub\`, \`and\`, \`or\`, \`slt\`) read two registers, operate on them in the ALU, and write the result to a third register: \`add $t1, $t2, $t3\`.

\`\`\`fig
dp-r
\`\`\`

**The path, step by step:**
1. **Fetch:** the PC addresses the instruction memory; PC + 4 is computed by the adder and becomes the next PC (PCSrc = 0).
2. **Register read:** bits 25–21 (rs) and 20–16 (rt) select two registers; Read data 1 and Read data 2 come out.
3. **ALU:** ALUSrc = 0, so the ALU gets Read data 1 and Read data 2. ALUOp = 10, so the ALU control uses funct (bits 5–0) to choose the operation.
4. **Write back:** MemtoReg = 0 sends the ALU result to the register file's Write data; RegDst = 1 selects rd (bits 15–11) as the write register; RegWrite = 1.

Data memory is not used (MemRead = MemWrite = 0), and Branch = 0.`,

  "2d": md`For \`beq rs, rt, offset\`:

\`\`\`fig
dp-beq
\`\`\`

1. **PC + 4** is computed by the PC adder, as for every instruction.
2. The **branch target** is computed in parallel: the 16-bit offset is **sign-extended** to 32 bits, **shifted left 2** (word offset → byte offset), and added to PC + 4 by the branch adder:
$$
\text{target} = (\text{PC} + 4) + \text{sign-extend}(\text{offset})\times4
$$
3. The **ALU subtracts** rs − rt (ALUSrc = 0, ALUOp = 01). If they are equal the result is 0 and the **Zero** output is 1.
4. **PCSrc = Branch AND Zero** controls the mux in front of the PC: if 1, PC ← branch target; if 0, PC ← PC + 4.`,

  "2e": md`The mux in front of the ALU's second input (controlled by **ALUSrc**) chooses between:
1. **Read data 2** of the register file, the value of register rt (ALUSrc = 0). Used by R-type instructions and beq, which operate on two registers.
2. The **sign-extended 16-bit immediate** (instruction bits 15–0 extended to 32 bits) (ALUSrc = 1). Used by lw and sw, where the ALU adds the base register and the offset to form the memory address (and by addi).

The ALU's first input always comes from Read data 1 (register rs).`,

  "3a": md`**Principle of locality:** programs access a relatively small portion of their address space at any instant.
- **Temporal locality:** an item referenced now is likely to be referenced again soon (loop instructions, loop variables).
- **Spatial locality:** items whose addresses are near a referenced item are likely to be referenced soon (sequential instructions, array elements).

**Its role in the memory hierarchy.** Fast memory (SRAM) is expensive and small; large memory (DRAM, disk) is cheap but slow. Locality makes a **hierarchy** work:
- Keep the items used **recently** in the small, fast level close to the CPU (temporal locality).
- Move data between levels in **blocks** of adjacent words, so neighbours come along (spatial locality).
- Then most accesses hit in the fast level, and the memory appears **as fast as the top level and as large as the bottom level**, at close to the cost per bit of the bottom level.

\`\`\`fig
mem-pyramid
\`\`\``,

  "3b": md`**Common facts:** 32-bit byte addresses, so the number of addressable units is $2^{32}$ bytes. A line (block) is 64 bytes $= 2^{6}$, so the **word/byte offset is 6 bits**, and main memory has $2^{32}/2^{6} = 2^{26}$ **blocks**.

**(i) Direct mapped, tag 20 bits.**
$$
\text{line field} = 32 - 20 - 6 = 6\ \text{bits}
$$

| Tag | Line | Offset |
|---|---|---|
| 20 bits | 6 bits | 6 bits |

- Addressable units: $2^{32}$ bytes.
- Blocks in main memory: $2^{26}$.
- Lines in the cache: $2^{6} = 64$ (a 4 KB cache).

**(ii) Fully associative.** There is no line field: every bit above the offset is the tag.

| Tag | Offset |
|---|---|
| 26 bits | 6 bits |

- Addressable units: $2^{32}$ bytes.
- Blocks in main memory: $2^{26}$.
- Tag size: **26 bits**.
- Lines in the cache: **not determined by the address format** (any line can hold any block). For the same 4 KB cache as in (i), it would be 64 lines.

**(iii) Four-way set associative, tag 9 bits.**
$$
\text{set field} = 32 - 9 - 6 = 17\ \text{bits}
$$

| Tag | Set | Offset |
|---|---|---|
| 9 bits | 17 bits | 6 bits |

- Addressable units: $2^{32}$ bytes.
- Blocks in main memory: $2^{26}$.
- Lines in a set: **4**.
- Sets in the cache: $2^{17} = 131{,}072$.
- Lines in the cache: $4\times2^{17} = 2^{19} = 524{,}288$ (a 32 MB cache).`,

  "4a": md`**Pipeline hazards** are situations that prevent the next instruction from starting in the next cycle:
- **Structural hazard:** a required resource is busy (two instructions need the same hardware in the same cycle).
- **Data hazard:** an instruction needs data that a previous instruction has not yet produced.
- **Control hazard:** the next instruction to fetch depends on a branch outcome not yet known.

**Structural hazard, time-space diagram.** Suppose there is a **single memory** for instructions and data:

| Cycle | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| lw | **IF (mem)** | ID | EX | **MEM (mem)** | WB |
| instr 2 | | IF | ID | EX | MEM |
| instr 3 | | | IF | ID | EX |
| instr 4 | | | | **IF (mem)** | ID |

In cycle 4, \`lw\` reads data from memory while instruction 4 must be fetched from the same memory: a conflict. Instruction 4 must wait a cycle (a bubble). MIPS avoids this with **separate instruction and data memories** (split caches).

**The code segment: data hazards (load-use).**
- \`add $t3, $t1, $t2\` uses \`$t2\` loaded by the instruction just before it.
- \`add $t5, $t1, $t4\` uses \`$t4\` loaded just before it.

A loaded value is available only at the end of MEM, too late for the next instruction's EX even with forwarding: **one stall each**.

\`\`\`fig
dh-sched-before
\`\`\`

With forwarding: 2 stalls, $5 + 6 + 2 = 13$ cycles. (Other dependences, e.g. \`add $t3\` → \`sw $t3\`, are covered by forwarding.)

**Overcoming it:**
1. **Forwarding** plus a **hazard detection unit** that inserts the one-cycle stalls.
2. **Code scheduling** to remove the stalls: move \`lw $t4, 8($t0)\` up, so no instruction uses a load result in the next cycle.

\`\`\`
lw  $t1, 0($t0)
lw  $t2, 4($t0)
lw  $t4, 8($t0)     # moved up
add $t3, $t1, $t2
sw  $t3, 12($t0)
add $t5, $t1, $t4
sw  $t5, 16($t0)
\`\`\`

\`\`\`fig
dh-sched-after
\`\`\`

No stalls: $5 + 6 = 11$ cycles.`,

  "4b": md`**Step 1: pipeline registers.** Insert four registers between the five stages: **IF/ID**, **ID/EX**, **EX/MEM**, **MEM/WB**. Each holds everything the later stages of that instruction need (instruction fields, register values, the sign-extended immediate, PC + 4, ALU result, memory data).

**Step 2: carry the write register number along.** The destination register number (rt or rd, chosen by the RegDst mux, which moves to EX) travels through ID/EX, EX/MEM and MEM/WB, so that WB writes the correct register (not the one of the instruction now in ID).

**Step 3: pipelined control.** The main control decodes the opcode in **ID**; its signals are stored in ID/EX and passed along, grouped by the stage that uses them:
- **EX:** RegDst, ALUOp, ALUSrc;
- **MEM:** Branch, MemRead, MemWrite;
- **WB:** MemtoReg, RegWrite.

**Step 4: forwarding unit (in EX).** Add 3-input muxes in front of both ALU inputs (ForwardA, ForwardB), selecting the register file value (00), the EX/MEM ALU result (10) or the MEM/WB value (01). The forwarding unit compares ID/EX.RegisterRs and ID/EX.RegisterRt with EX/MEM.RegisterRd and MEM/WB.RegisterRd (with RegWrite and ≠ 0 checks, and EX/MEM priority for double data hazards).

\`\`\`fig
dh-forwarding-unit
\`\`\`

**Step 5: hazard detection unit (in ID).** It detects load-use hazards:
- condition: ID/EX.MemRead and (ID/EX.RegisterRt = IF/ID.RegisterRs or IF/ID.RegisterRt);
- action: hold the PC and IF/ID (PCWrite = 0, IF/IDWrite = 0) and select 0 for all control signals into ID/EX (a mux after the control unit), inserting a bubble.

\`\`\`fig
dh-hazard-unit
\`\`\`

The final datapath is the second figure: pipeline registers, pipelined control, forwarding unit with the ALU input muxes, and hazard detection unit with the PC/IF-ID write enables and the control-zeroing mux.`,

  "5a": md`**(i) Not using a single-cycle design → Performance via pipelining** (and **make the common case fast**).

In a single-cycle design the clock period is set by the slowest instruction (\`lw\`), so the common, faster instructions waste most of the cycle. Modern designs instead split instruction execution into short stages and **overlap** the stages of successive instructions (pipelining), with a short clock period set by the slowest stage. Throughput approaches one instruction per short cycle. Not slowing every instruction down to the rarest, longest one is also an application of making the common case fast.

**(ii) Prefetching → Performance via prediction** (applied to the **hierarchy of memories**).

The hardware **guesses** which block will be needed next (e.g. the next sequential block) and brings it into the cache before it is referenced. When the guess is right, the miss is avoided; when wrong, little is lost (some bandwidth and cache space). It is prediction used to make the memory hierarchy look faster.`,

  "5c": md`**(i) Execution time.**
$$
\text{cycles} = 40\times1 + 80\times1 + 90\times3 + 15\times2 = 40 + 80 + 270 + 30 = ${c0}\ \text{million}
$$
$$
T = \frac{${c0}\times10^{6}}{3\times10^{9}\ \text{Hz}} = ${fx(c0 / 3000)}\ \text{s} = ${fx(c0 / 3)}\ \text{ms}
$$

**(ii) Twice as fast by improving FP only.** The target is ${c0 / 2} million cycles. Without FP, the program already takes
$$
80 + 270 + 30 = ${c0 - 40}\ \text{million cycles} > ${c0 / 2}\ \text{million}
$$
Even with an FP CPI of 0, the time would be $${c0 - 40}/3000 = ${fx((c0 - 40) / 3000)}$ s, a speed-up of at most $${c0}/${c0 - 40} \approx ${fx(c0 / (c0 - 40), 3)}$. **It is impossible**: FP instructions take only $40/${c0} \approx ${fx((40 / c0) * 100, 1)}\%$ of the cycles (Amdahl's Law).

**(iii) New CPIs:** INT and FP $1\times1.2 = 1.2$; L/S $3\times0.9 = 2.7$; Branch $2\times0.9 = 1.8$.
$$
\text{cycles} = 40\times1.2 + 80\times1.2 + 90\times2.7 + 15\times1.8 = 48 + 96 + 243 + 27 = ${c3}\ \text{million}
$$
$$
T = \frac{${c3}\times10^{6}}{3\times10^{9}} = ${fx(c3 / 3000)}\ \text{s}
$$
The execution time is **improved** (reduced) by $${fx(c0 / 3000)} - ${fx(c3 / 3000)} = ${fx((c0 - c3) / 3000)}$ s, i.e. **${fx(((c0 - c3) / c0) * 100, 2)}%** (speed-up $${c0}/${c3} \approx ${fx(c0 / c3, 4)}$). The 10% gain on L/S, which dominates the time, outweighs the 20% loss on INT and FP.`,

  "6a": md`**Step 1: decode each word** (R-format: op rs rt rd shamt funct; I-format: op rs rt immediate; J-format: op address).

| Address | Fields (binary) | Decoded |
|---|---|---|
| 1000 | ${Q6A_GIVEN[0]} | R: rs 0, rt 16 (\`$s0\`), rd 15 (\`$t7\`), shamt 2, funct 0 = sll |
| 1004 | ${Q6A_GIVEN[1]} | R: rs 15 (\`$t7\`), rt 17 (\`$s1\`), rd 15 (\`$t7\`), funct 32 = add |
| 1008 | ${Q6A_GIVEN[2]} | I: op 35 = lw, rs 15 (\`$t7\`), rt 8 (\`$t0\`), offset 0 |
| 1012 | ${Q6A_GIVEN[3]} | I: op 5 = bne, rs 8 (\`$t0\`), rt 23 (\`$s7\`), offset 1 |
| 1016 | ${Q6A_GIVEN[4]} | I: op 8 = addi, rs 16 (\`$s0\`), rt 16 (\`$s0\`), immediate 1 |
| 1020 | ${Q6A_GIVEN[5]} | J: op 2 = j, address 250 |

**Step 2: branch and jump targets.**
- bne at 1012: target $= (1012 + 4) + 1\times4 = 1020$.
- j at 1020: target $= 250\times4 = 1000$ (the top 4 bits of PC + 4 are 0).

**Step 3: the completed code.**

\`\`\`
Loop: sll  $t7, $s0, 2        # 1000: $t7 = i * 4
      add  $t7, $t7, $s1      # 1004: $t7 = address of A[i]
      lw   $t0, 0($t7)        # 1008: $t0 = A[i]
      bne  $t0, $s7, L1       # 1012: if A[i] != k, go to 1020
      addi $s0, $s0, 1        # 1016: i = i + 1
L1:   j    Loop               # 1020: back to 1000
\`\`\`

Assembling this code at 1000 gives exactly the six given machine words.

(The pattern is the textbook loop \`while (A[i] == k) i += 1\`, but there the \`bne\` exits the loop with offset 2, to the instruction after \`j\`. With the given offset 1, it goes to the \`j\` instead.)`,

  "6b": md`**The problem.** Processes or threads that share data need **synchronisation**: e.g. a lock, so only one of them enters a critical section. That requires reading and writing a memory location **atomically** (no other access in between). A normal \`lw\` followed by \`sw\` is not atomic: another processor can write in between.

**MIPS support: a pair of instructions, load linked and store conditional.**
- \`ll rt, offset(rs)\` (**load linked**): loads the word and remembers (links) its address.
- \`sc rt, offset(rs)\` (**store conditional**): stores rt to the address **only if the location has not changed since the \`ll\`**. It then sets rt to **1** (success) or **0** (failure: someone else wrote it in between; nothing is stored).

Together they give an atomic read-modify-write, built from simple instructions (no special memory-to-memory instruction needed).

**Example: atomic swap** of \`$s4\` with the memory word at \`0($s1)\`:

\`\`\`
try:  add  $t0, $zero, $s4   # copy the exchange value
      ll   $t1, 0($s1)       # load linked
      sc   $t0, 0($s1)       # store conditional
      beq  $t0, $zero, try   # sc failed: retry
      add  $s4, $zero, $t1   # put the loaded value in $s4
\`\`\`

**Using it as a lock:** with 1 in \`$s4\`, the swap writes 1 (locked) and returns the old value. If the old value was 0, the lock was free and is now ours; if it was 1, someone else holds it, so try again. Unlocking is a plain \`sw $zero, 0($s1)\`.`,

  "6c": md`| Design feature | Principle | Why |
|---|---|---|
| (i) immediate values limited to 16 bits | **Good design demands good compromise** (also: make the common case fast) | all instructions are kept 32 bits long; an I-format instruction then has room for only 16 bits after op, rs and rt. Most constants are small, so 16 bits covers the common case; large ones use \`lui\` + \`ori\` |
| (ii) always three register operands in arithmetic | **Simplicity favours regularity** | every arithmetic instruction has the same form (two sources, one destination), so one format and simple hardware handle all of them |
| (iii) PC-relative addressing for conditional branches | **Make the common case fast** | most branch targets are near the branch (loops, if-else), so a 16-bit offset from PC + 4 reaches them in a single instruction, without a full 32-bit address |
| (iv) 32 registers rather than many more | **Smaller is faster** | a larger register file is slower (longer wires, more decoding) and needs wider register fields in the instruction |
| (v) register fields in the same place in every format | **Simplicity favours regularity** | rs and rt are always bits 25–21 and 20–16, so registers can be read in parallel with decoding, keeping the hardware simple |`,

  "7a": b16Solutions["6a"],

  "7b": md`Use 4 significant bits (1 + 3 fraction bits), as on the slides.

**Binary.**
- $-0.25 = -0.01_{two} = -1.000_{two}\times2^{-2}$.
- $0.625 = 0.101_{two} = 1.010_{two}\times2^{-1}$.

| | $-(0.25)_{10}$ | $(0.625)_{10}$ |
|---|---|---|
| Binary | $-1.000_{two}\times2^{-2}$ | $1.010_{two}\times2^{-1}$ |
| Step 1: Exponent matching | $-0.100_{two}\times2^{-1}$ (shifted right 1) | $1.010_{two}\times2^{-1}$ (unchanged) |
| Step 2: Significand addition | $1.010_{two} + (-0.100_{two}) = 0.110_{two}$, so the sum is $0.110_{two}\times2^{-1}$ | |
| Step 3: Normalization | $0.110_{two}\times2^{-1}$ | $= 1.100_{two}\times2^{-2}$ |
| Step 4: Rounding | $1.100_{two}\times2^{-2}$ (fits in 4 bits: no change) | |

**How the hardware does it:**
1. **Compare exponents:** the small ALU computes $-2 - (-1) = -1$; the control selects the larger exponent ($-1$) and the significand of the smaller number to shift.
2. **Shift smaller number right:** $-1.000$ is shifted right by 1: $-0.100$.
3. **Add:** the big ALU adds the significands: $1.010 - 0.100 = 0.110$.
4. **Normalise:** shift left by 1 and decrement the exponent: $1.100\times2^{-2}$; check: $-2$ is within the exponent range (no underflow).
5. **Round:** no bits are lost, so no rounding.

**Result:**
$$
1.100_{two}\times2^{-2} = 0.011_{two} = ${fa.result} = -0.25 + 0.625
$$`,

  "8a": md`**Overflow rules.**
- **Addition** (O = 0): overflow is possible only when both operands have the **same sign**; it occurred if the result's sign differs from theirs.
- **Subtraction** (O = 1): $A - B = A + (-B)$, so overflow is possible only when A and B have **different signs**; it occurred if the result's sign differs from A's.

| O | $S_A$ | $S_B$ | Case | $S_R$ meaning overflow | V |
|---|---|---|---|---|---|
| 0 | 0 | 0 | $A\ge0 + B\ge0$ | 1 (sum looks negative) | $S_R$ |
| 0 | 0 | 1 | $A\ge0 + B<0$ | none: no overflow possible | 0 |
| 0 | 1 | 0 | $A<0 + B\ge0$ | none: no overflow possible | 0 |
| 0 | 1 | 1 | $A<0 + B<0$ | 0 (sum looks non-negative) | $S_R'$ |
| 1 | 0 | 0 | $A\ge0 - B\ge0$ | none: no overflow possible | 0 |
| 1 | 0 | 1 | $A\ge0 - B<0$ | 1 (difference looks negative) | $S_R$ |
| 1 | 1 | 0 | $A<0 - B\ge0$ | 0 (difference looks non-negative) | $S_R'$ |
| 1 | 1 | 1 | $A<0 - B<0$ | none: no overflow possible | 0 |

**Overflow as a logical function** (one product term for each overflow row):
$$
V = O'S_A'S_B'S_R + O'S_AS_BS_R' + OS_A'S_BS_R + OS_AS_B'S_R'
$$
It was checked on every pair of 4-bit two's-complement operands, for both operations.`,

  "8c": md`This is the **refined** multiplier: the 4-bit multiplicand stays fixed, the ALU is 4 bits wide, and the multiplier starts in the right half of the 8-bit Product register, which shifts right.

**Algorithm (4 iterations):**
1. Test Product0. If 1, add the Multiplicand to the **left half** of the Product.
2. Shift the Product register right 1 bit (the ALU's carry-out shifts into the leftmost bit).

**Multiplicand = 0110, Multiplier = 0110:**

${mulTable(mul.rows, { gapProduct: true })}

**Result:** Product $= ${mul.product.slice(0, 4)}\ ${mul.product.slice(4)}_{two} = ${parseInt(mul.product, 2)}$, which is $6\times6$.`,
}

/** Q6(a) words, as assembled, for the check. */
export const q6Words = q6.map((x) => x.enc.word.toString(2).padStart(32, "0"))
