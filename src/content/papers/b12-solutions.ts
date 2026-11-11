import { md } from "../md"
import { before } from "./compose"
import { b14Solutions } from "./b14-solutions"
import { b16Solutions } from "./b16-solutions"
import { assemble, parse } from "@/lib/mips"

/* ───── Q5(b) ───── */
const c0 = 160 * 2 + 110 * 1 + 10 * 5 + 16 * 2

/* ───── Q6(c) ───── */
export const Q6C_SRC = "Loop: sll $t1, $s2, 2\nadd $t1, $t1, $s6\nlw $t0, 0($t1)\nbeq $t0, $s5, L1\nj Exit\nL1: addi $s2, $s2, 1\nj Loop\nExit: nop"
const q6 = assemble(parse(Q6C_SRC), 6000).slice(0, 7)

export const b12Solutions: Record<string, string> = {
  "1d": md`**Time-space diagram.** A superscalar processor fetches and issues **several instructions per cycle** (here 2) into parallel pipelines, so up to 2 instructions complete each cycle (ideal CPI 0.5).

| Instruction | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|
| i | IF | ID | EX | MEM | WB | | |
| i + 1 | IF | ID | EX | MEM | WB | | |
| i + 2 | | IF | ID | EX | MEM | WB | |
| i + 3 | | IF | ID | EX | MEM | WB | |
| i + 4 | | | IF | ID | EX | MEM | WB |
| i + 5 | | | IF | ID | EX | MEM | WB |

(Compare: a scalar pipeline starts one instruction per cycle.)

**Architecture of a typical superscalar RISC processor** (dynamically scheduled):

\`\`\`fig
b19-2b
\`\`\`

1. **Instruction fetch and decode unit:** fetches several instructions per cycle, decodes them, renames registers, and issues them **in order** to the reservation stations. Branch prediction keeps the fetch going past branches.
2. **Reservation stations:** buffers in front of each functional unit that hold issued instructions and their operands until all operands are available.
3. **Functional units:** several integer units, floating-point units and a load/store unit, which **execute out of order** as soon as an instruction's operands are ready. Results are forwarded directly to the reservation stations that wait for them.
4. **Commit unit with a reorder buffer:** holds results until it is safe to update registers and memory, then **commits them in order**, so exceptions and mispredicted branches can be handled precisely (speculation).

**Superscalar versus VLIW:**

| | Superscalar (dynamic multiple issue) | VLIW (static multiple issue) |
|---|---|---|
| Who decides which instructions issue together | the **hardware**, at run time | the **compiler**, at compile time |
| Instruction format | ordinary instructions | one very long instruction (issue packet) holding several operations |
| Hazard handling | hardware detects hazards, schedules dynamically, can execute out of order | compiler removes hazards; packets with no independent work get nops |
| Hardware complexity | high (dependence checking, reservation stations, reorder buffer) | low |
| Code compatibility | old code runs unchanged and benefits | code is tied to the machine's issue width |`,

  "2a": md`**(Key characteristics of computer systems is not covered in the lecture slides.)**

${b14Solutions["3a"]}`,

  "2b": md`**(i) Flash storage.**
- **Nonvolatile semiconductor storage:** keeps data without power, like disk, but with no moving parts.
- **100× to 1000× faster than disk**, smaller, lower power and more robust (no mechanical parts to fail when dropped).
- **More expensive per GB** than disk (between disk and DRAM).
- **Two types:**
  - **NOR flash:** each bit cell is like a NOR gate; random read/write access; used for instruction memory in embedded systems.
  - **NAND flash:** each bit cell is like a NAND gate; denser and cheaper per GB, but read and written a block at a time; used in USB keys, media storage, SSDs.
- **Wear-out:** flash bits wear out after thousands of writes, so flash is not suitable as a direct replacement for RAM. Controllers use **wear leveling**: they remap data to less-used blocks, spreading the writes.

**(ii) Holographic data storage:** not covered in the lecture slides.`,

  "2c": b14Solutions["3b"],

  "3a": b14Solutions["4a"],

  "3b": md`**Dynamic branch prediction** predicts each branch from its **recent run-time behaviour**, stored in hardware. Fetching then continues along the predicted path; on a misprediction the wrongly fetched instructions are flushed and fetching restarts on the correct path.

**1. Branch prediction buffer (branch history table), 1-bit.**
- A small memory indexed by the low bits of the branch address. Each entry holds one bit: was the branch taken last time?
- Predict what happened last time; on a misprediction, flip the bit.
- Weakness: a loop branch is mispredicted **twice** per loop execution (on the exit, and again on the first iteration of the next execution of the loop).

**2. 2-bit predictor (saturating counter).**
- Each entry has four states; the prediction changes only after **two mispredictions in a row**.
- A loop branch is then mispredicted only once per loop execution.

\`\`\`fig
bh-2bit
\`\`\`

**3. Branch target buffer (BTB).** A cache of **branch target addresses**, indexed by the PC of the branch and looked up during IF. If a predicted-taken branch hits in the BTB, the next fetch uses the stored target at once, avoiding even the one-cycle penalty of computing the target in ID.

**4. More advanced predictors** (correlating and tournament predictors) use the behaviour of other recent branches (global history) as well as the branch's own history, or choose between a local and a global predictor per branch, for higher accuracy.`,

  "3c": md`${before(b14Solutions["4b"], "**Step 5: hazard detection unit")}The final datapath has the four pipeline registers, the control signals carried in ID/EX, EX/MEM and MEM/WB, the destination register number carried to WB, and the forwarding unit with the two 3-input muxes at the ALU inputs. (A hazard detection unit for load-use stalls would be added in ID, but the question asks only for forwarding.)`,

  "5a": md`| Design feature | Great idea | Why |
|---|---|---|
| 1. A PC + 4 adder; branches relative to PC + 4 | **Make the common case fast** | the next sequential instruction is the common case, so PC + 4 is computed at once for every instruction; branches reuse this value as their base instead of needing a separate PC copy, and most branch targets are near (PC-relative reaches them in one instruction) |
| 2. All levels of cache integrated onto the processor chip | **Design for Moore's Law** (and **hierarchy of memories**) | rising transistor counts made it possible to move whole cache levels onto the processor chip; the caches themselves are levels of the memory hierarchy |
| 3. Fast multiplier with 31 adders instead of one adder used 31 times | **Performance via parallelism** | the partial-product additions happen at the same time in parallel hardware (an adder tree) instead of one after another |
| 4. Procedures with parameters | **Use abstraction to simplify design** | a procedure hides its details behind an interface (its parameters and results), so the programmer handles one part at a time |
| 5. Hardware prefetching | **Performance via prediction** | the hardware guesses which block will be needed and fetches it early; a right guess hides the miss, a wrong one costs little |`,

  "5b": md`**(i) Execution time.**
$$
\text{cycles} = 160\times2 + 110\times1 + 10\times5 + 16\times2 = 320 + 110 + 50 + 32 = ${c0}\ \text{million}
$$
$$
T = \frac{${c0}\times10^{6}}{2\times10^{9}\ \text{Hz}} = ${c0 / 2000}\ \text{s}
$$

**(ii) Twice as fast by improving FP only.** Target: ${c0 / 2} million cycles. The non-FP instructions take $${c0} - 320 = ${c0 - 320}$ million, so FP may take $${c0 / 2} - ${c0 - 320} = ${c0 / 2 - (c0 - 320)}$ million:
$$
\text{CPI}_{FP} = \frac{${c0 / 2 - (c0 - 320)}}{160} = ${(c0 / 2 - (c0 - 320)) / 160}
$$
The FP CPI must fall from 2 to **${(c0 / 2 - (c0 - 320)) / 160}**: **5 times smaller**.

**(iii) Twice as fast by improving L/S only.** The other instructions take $${c0} - 50 = ${c0 - 50}$ million cycles, already more than the ${c0 / 2} million target. Even with an L/S CPI of 0 the speed-up is at most $${c0}/${c0 - 50} \approx ${Number((c0 / (c0 - 50)).toFixed(3))}$. **It is impossible.**

(The clock rate does not affect the answers to (ii) and (iii), which depend only on cycle counts.)`,

  "6a": md`**Register use:** n in \`$a0\`, result in \`$v0\`. n must survive the recursive call, so it is saved on the stack with \`$ra\`.

\`\`\`
recurseSum:
        slti  $t0, $a0, 1          # $t0 = 1 if n < 1
        beq   $t0, $zero, Recurse  # n >= 1: recursive case
        add   $v0, $zero, $zero    # return 0
        jr    $ra
Recurse:
        addi  $sp, $sp, -8         # room for 2 words
        sw    $ra, 4($sp)          # save return address
        sw    $a0, 0($sp)          # save n
        addi  $a0, $a0, -1         # argument n - 1
        jal   recurseSum           # $v0 = recurseSum(n - 1)
        lw    $a0, 0($sp)          # restore n
        lw    $ra, 4($sp)          # restore return address
        addi  $sp, $sp, 8          # pop the frame
        add   $v0, $a0, $v0        # return n + recurseSum(n - 1)
        jr    $ra
\`\`\`

**The blanks, in order:** \`slti\`; \`$ra\`; \`-8\`; \`4($sp)\`; \`$a0\`; \`$a0\`; \`4($sp)\`; \`addi $sp, $sp, 8\`; \`$v0\`; \`$ra\`.

**Trace:** recurseSum(4) = 4 + 3 + 2 + 1 + 0 = 10.`,

  "6b": b14Solutions["6b"],

  "6c": md`**Addresses:** 6000 to 6024, then Exit at 6028.

- **beq** at 6012 to L1 = 6020: offset $= (6020 - (6012 + 4))/4 = 1$.
- **j Exit**: address field $= 6028/4 = 1507$.
- **j Loop**: address field $= 6000/4 = 1500$.
- Registers: \`$t0\` = 8, \`$t1\` = 9, \`$s2\` = 18, \`$s5\` = 21, \`$s6\` = 22.

**The completed machine code** (decimal fields):

| Address | Instruction | Fields |
|---|---|---|
${q6.map((x) => `| ${x.pc} | \`${x.ins.text}\` | ${x.enc.fields.map((f) => f[1]).join(", ")} |`).join("\n")}
| 6028 | \`Exit:\` | |

The filled blanks: sll shamt **2**; add rs **9**, rt **22**, rd **9**; lw rs **9**, rt **8**; beq offset **1**; j Exit **2, 1507**; j Loop address **1500**.`,

  "7a": b16Solutions["6a"],

  "7b": md`**Why only beq and bne.** Comparing for less-than (or greater-or-equal) needs a subtraction or magnitude comparison, which is slower than testing for equality. If a single instruction had to compare for < **and** branch, it would do more work per instruction, which would lengthen the clock cycle (or add a pipeline stage), slowing **every** instruction. Equality tests (beq, bne) are the common case. So MIPS keeps the fast, common beq and bne, and builds the others from **slt** (set on less than) plus beq/bne. This is a **good design compromise** (and an instance of "make the common case fast").

**Programming them with slt** (\`$at\` is the assembler's temporary; the assembler does this for the pseudoinstructions):

| Pseudoinstruction | MIPS instructions |
|---|---|
| \`blt $s0, $s1, L\` (branch if $s_0 < s_1$) | \`slt $at, $s0, $s1\` then \`bne $at, $zero, L\` |
| \`bge $s0, $s1, L\` (branch if $s_0 \ge s_1$) | \`slt $at, $s0, $s1\` then \`beq $at, $zero, L\` |
| \`bgt $s0, $s1, L\` (branch if $s_0 > s_1$) | \`slt $at, $s1, $s0\` then \`bne $at, $zero, L\` |
| \`ble $s0, $s1, L\` (branch if $s_0 \le s_1$) | \`slt $at, $s1, $s0\` then \`beq $at, $zero, L\` |

(For unsigned comparisons, use \`sltu\` instead of \`slt\`.)`,

  "7c": b16Solutions["8c"],

  "8a": md`${b14Solutions["8a"]}

**With the printed convention** (V = 0 for overflow, 1 for no overflow), every V in the table is complemented, and the function becomes the complement:
$$
V_{\text{printed}} = \left(O'S_A'S_B'S_R + O'S_AS_BS_R' + OS_A'S_BS_R + OS_AS_B'S_R'\right)'
$$`,

  "8b": b16Solutions["5a"],

  "8c": md`For \`beq rs, rt, address\`: the ALU **subtracts** the two registers to compare them; nothing is written to a register or memory; the PC gets the branch target if they are equal.

| Control signal | Value | Why |
|---|---|---|
| RegDst | X | no register is written, so the write register does not matter |
| RegWrite | 0 | beq writes no register |
| ALUSrc | 0 | the ALU compares Read data 1 and Read data 2 (both registers) |
| MemRead | 0 | no memory read |
| MemWrite | 0 | no memory write |
| MemtoReg | X | nothing is written back |
| PCSrc | Zero | 1 (PC = branch target) when the ALU's Zero output is 1, i.e. rs = rt; otherwise 0 (PC = PC + 4). In the slides' datapath, PCSrc = Branch AND Zero, with Branch = 1 for beq |
| ALUOp1 | 0 | the operation does not depend on the funct field |
| ALUOp0 | 1 | subtraction |

(X = don't care; 0 is a safe choice.)`,
}
