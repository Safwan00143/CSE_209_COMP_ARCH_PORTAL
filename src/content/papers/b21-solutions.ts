import { md } from "../md"
import { totalBits } from "@/lib/cache"

const c9b = totalBits({ addressBits: 48, dataBytes: 65536, blockBytes: 64, ways: 4, extraBitsPerBlock: 2 })

/* Q9(a): numbers computed here and re-derived in checks/b21.ts. */
const ACC = 1.3 // memory accesses per instruction: 1 instruction fetch + 0.3 data
export const Q9A = (() => {
  const tc1 = 27.5 / 20
  const tc2 = 30.5 / 20
  const mem1 = 100 / tc1
  const mem2 = 100 / tc2
  const l3 = 50.7 / tc2
  const cpi1 = 1 + ACC * 0.04 * (20 + 0.65 * mem1)
  const cpi2 = 1 + ACC * (0.03 * 20 + 0.03 * 0.5 * l3 + 0.01 * mem2)
  const t1 = cpi1 * tc1
  const t2 = cpi2 * tc2
  const need = ((t2 / tc1 - 1) / (ACC * 0.04) - 20) / mem1
  return { tc1, tc2, mem1, mem2, l3, cpi1, cpi2, t1, t2, need }
})()
const f = (x: number, d = 3) => x.toFixed(d)

export const b21Solutions: Record<string, string> = {
  "1a": md`**The flowchart (the slides' four steps):**

\`\`\`fig
b21-1a-flow
\`\`\`

1. **Align:** compare the exponents and shift the significand of the number with the smaller exponent right by the difference.
2. **Add** the significands (subtract if the signs differ).
3. **Normalise:** shift the sum right and increment the exponent, or shift it left and decrement the exponent, until it has the form $1.f$. Check for overflow or underflow; if either occurs, raise an exception.
4. **Round** the significand to the available number of bits. If rounding makes it unnormalised (e.g. $1.111 \to 10.000$), go back to step 3.

**Conditions** (for single precision; double is the same with its own limits):

| Condition | When it happens in an addition | Result |
|---|---|---|
| **Overflow** | after normalising, the exponent exceeds the largest normal exponent ($E > 127$: the exponent field would reach 1111 1111) | too large to represent; IEEE 754 gives ±infinity |
| **Underflow** | after normalising (typically after a large left shift when nearly equal numbers are subtracted), the exponent is below the smallest normal exponent ($E < -126$) | too small to normalise; the result is a denormal or 0 |
| **Infinity** | an operand is ±infinity (exponent all 1s, fraction 0), or the sum overflows | ±infinity (e.g. $\infty + x = \infty$) |
| **NaN** | an operand is NaN (exponent all 1s, fraction ≠ 0), or the operation is $(+\infty) + (-\infty)$ | NaN (not a number) |

The slides list the all-1s exponent as reserved; its use for infinity and NaN is from the book.`,

  "1c": md`**Step 1: MIPS code.** Offsets: A 0, B 4, C 8, D 12, E 16 from \`$t0\`.

\`\`\`
lw  $t1, 4($t0)      # $t1 = B
lw  $t2, 8($t0)      # $t2 = C
add $t3, $t1, $t2    # $t3 = A = B + C   (needs $t2, loaded just before: stall)
sw  $t3, 0($t0)      # A
lw  $t4, 16($t0)     # $t4 = E
add $t5, $t3, $t4    # $t5 = D = A + E   (needs $t4, loaded just before: stall)
sw  $t5, 12($t0)     # D
\`\`\`

**Step 2: count the cycles.** Assume the 5-stage MIPS pipeline with forwarding (and a hazard detection unit), as on the slides.
- \`add $t3\` uses \`$t2\` right after its load: a load-use hazard, 1 stall.
- \`add $t5\` uses \`$t4\` right after its load: 1 stall.
- \`sw $t3\` (after \`add $t3\`) and \`sw $t5\` get their data by forwarding: no stall.

$$
\text{cycles} = n + 4 + \text{stalls} = 7 + 4 + 2 = 13
$$

\`\`\`fig
b21-1c-before
\`\`\`

**Step 3: reschedule.** Yes: move \`lw $t4, 16($t0)\` (E) up, before the first add. It does not depend on anything above it, and nothing above it uses \`$t4\`.

\`\`\`
lw  $t1, 4($t0)      # B
lw  $t2, 8($t0)      # C
lw  $t4, 16($t0)     # E  (moved up)
add $t3, $t1, $t2    # $t2 loaded 2 instructions earlier: forwarded, no stall
sw  $t3, 0($t0)      # A
add $t5, $t3, $t4    # $t4 loaded 3 instructions earlier: no stall
sw  $t5, 12($t0)     # D
\`\`\`

$$
\text{cycles} = 7 + 4 + 0 = 11
$$

\`\`\`fig
b21-1c-after
\`\`\`

Rescheduling saves 2 cycles (13 → 11). (Without forwarding the same two programs would take 19 and 16 cycles.)`,

  "2": md`**Step 1: the hazards.**

| Instructions | Register | Hazard | Resolved by |
|---|---|---|---|
| \`lw $t0, 55($t1)\` → \`addi $t1, $t0, 1\` | \`$t0\` | **load-use**: addi needs \`$t0\` in its EX, but the load has it only at the end of MEM | 1 stall, then forward from MEM/WB |
| \`addi $t1\` → \`lw $t0, 57($t1)\` | \`$t1\` | data hazard on the base register (ALU result) | forwarding from EX/MEM, no stall |
| \`lw $t0, 57($t1)\` → \`sw $t0, 32($t4)\` | \`$t0\` | **load-use**: the store's data register is the loaded register | the hazard detection unit stalls 1 cycle (it compares rt too) |

(\`$t0\` and \`$t1\` are also rewritten later, but in a 5-stage in-order pipeline reads happen in ID before later writes in WB, so these write-after-read and write-after-write pairs cause no hazard.)

**Step 2: detection conditions.**

The load-use hazards are detected in ID, when the using instruction is in IF/ID and the load is in ID/EX:

\`\`\`
if (ID/EX.MemRead and
    ((ID/EX.RegisterRt = IF/ID.RegisterRs) or
     (ID/EX.RegisterRt = IF/ID.RegisterRt)))
  stall
\`\`\`
- For \`lw\` → \`addi\`: ID/EX.RegisterRt = \`$t0\` = IF/ID.RegisterRs.
- For \`lw\` → \`sw\`: ID/EX.RegisterRt = \`$t0\` = IF/ID.RegisterRt.

The \`addi\` → \`lw\` hazard is handled by the forwarding unit in EX:

\`\`\`
if (EX/MEM.RegWrite and (EX/MEM.RegisterRd ≠ 0)
    and (EX/MEM.RegisterRd = ID/EX.RegisterRs))  ForwardA = 10
\`\`\`
(for addi, RegisterRd means its destination, rt).

**Step 3: completing the hazard detection unit.**

\`\`\`fig
dh-hazard-unit
\`\`\`

- **Inputs:** \`ID/EX.MemRead\` and \`ID/EX.RegisterRt\` (from the ID/EX register), \`IF/ID.RegisterRs\` and \`IF/ID.RegisterRt\` (instruction bits 25–21 and 20–16 from the IF/ID register).
- **Outputs:**
  - **PCWrite** = 0 on a stall: the PC is not updated, so the next instruction is fetched again;
  - **IF/IDWrite** = 0 on a stall: the IF/ID register keeps the instruction in ID, which is decoded again;
  - the **select of the mux** in front of the control signals going into ID/EX: on a stall it chooses 0, so all EX, MEM and WB control bits become 0, inserting a bubble (nop).

**Step 4: timing.** Two stalls: $4 + 4 + 2 = 10$ cycles.

\`\`\`fig
b21-2-pipe
\`\`\``,

  "3": md`The given datapath has no PC logic, so add it, then extend it for the four instructions with 2-to-1 muxes only.

**What each instruction needs.**
- **beq rs, rt, L:** the ALU subtracts (Zero = 1 if equal). Target = (PC + 4) + sign-extend(imm) × 4.
- **bneq rs, rt, L:** the same comparison, but taken when Zero = 0.
- **j L:** target = (PC + 4)[31–28] : instruction[25–0] : 00.
- **jr rs:** target = the value of register rs, which comes out of Read data 1.

**The additions** (figure below):
1. **PC** register and an **adder** computing PC + 4.
2. **Branch target:** a **shift-left-2** on the existing sign-extend output and a second **adder** computing (PC + 4) + (offset × 4).
3. **Mux 1** (2-to-1, select **PCSrc**): PC + 4 or the branch target.
   PCSrc = (Branch · Zero) + (BranchNE · Zero′), using the two new control signals Branch (beq) and BranchNE (bneq), two AND gates, an inverter on Zero and an OR gate. One mux serves both branches.
4. **Jump address:** a **shift-left-2** on instruction[25–0] (26 → 28 bits), concatenated with (PC + 4)[31–28].
5. **Mux 2** (2-to-1, select **Jump**): the output of mux 1, or the jump address.
6. **Mux 3** (2-to-1, select **JumpReg**): the output of mux 2, or **Read data 1** (the value of rs) for \`jr\`. Its output goes to the PC.

\`\`\`fig
b21-3-pc
\`\`\`

**Control values** (new signals Branch, BranchNE, Jump, JumpReg; RegWrite = MemWrite = 0 for all four):

| Instruction | Branch | BranchNE | Jump | JumpReg | ALU operation |
|---|---|---|---|---|---|
| beq | 1 | 0 | 0 | 0 | subtract |
| bneq | 0 | 1 | 0 | 0 | subtract |
| j | 0 | 0 | 1 | 0 | X |
| jr | 0 | 0 | X | 1 | X |

That is **three** 2-to-1 muxes in total: one for both branches, one for the jump, one for jr. (jr is R-type, funct 8, so JumpReg is decoded from the opcode together with funct.)`,

  "4": md`**Sequential (first) version.**

\`\`\`fig
arith-mult-v1
arith-mult-v1-flow
\`\`\`

- **Hardware:** a 64-bit Multiplicand register (the multiplicand starts in the right half and shifts left), a 32-bit Multiplier register (shifts right), a 64-bit ALU and a 64-bit Product register (initially 0). A control unit tests the multiplier's rightmost bit.
- **Algorithm**, repeated 32 times:
  1. Test Multiplier₀. If it is 1: **1a.** add the multiplicand to the product and place the result in the Product register.
  2. Shift the Multiplicand register left 1 bit.
  3. Shift the Multiplier register right 1 bit.
  After the 32nd repetition, done.

**Refined version.**

\`\`\`fig
arith-mult-v2
arith-mult-v2-flow
\`\`\`

- **Hardware:** a 32-bit Multiplicand register (it no longer shifts), a **32-bit** ALU, and a 64-bit Product register that holds the **multiplier in its right half** at the start (the separate Multiplier register is removed).
- **Algorithm**, repeated 32 times:
  1. Test Product₀. If it is 1: **1a.** add the multiplicand to the **left half** of the product and place the result there.
  2. Shift the Product register right 1 bit (taking in the adder's carry-out).
  After the 32nd repetition, done.

**Why the refined version is better:** the ALU and multiplicand register are half the width, one register is gone, and the add and shift happen in the same cycle (one cycle per bit instead of three steps).`,

  "5": md`**Yes**, they can occur in the same cycle.

**Setting.** With the branch decided by the ALU's Zero output (no early-branch hardware), the decision is made by the AND of Branch and Zero, which is applied from the EX/MEM register: the branch is resolved when it is in **MEM**, and the three instructions behind it are flushed if it is taken.

**Cycle by cycle.**

| Cycle | IF | ID | EX | MEM |
|---|---|---|---|---|
| 1 | beq | | | |
| 2 | lw | beq | | |
| 3 | add | lw | beq | |
| 4 | sw | add | lw | beq |

In **cycle 4** (the single-cycle illustration of the pipeline):
- **beq** is in MEM and is taken: the control asserts **flush** (zero the IF/ID, ID/EX and EX/MEM contents of the three wrong-path instructions) and loads the PC with TARGET.
- **lw \`$3\`** is in EX and **add \`$2, $3, $4\`** is in ID: the hazard detection unit sees ID/EX.MemRead = 1 and ID/EX.RegisterRt = \`$3\` = IF/ID.RegisterRs, so it asserts **stall**: PCWrite = 0, IF/IDWrite = 0, and zeroes the controls into ID/EX.

**The issue.** The two requests conflict over the PC:
- the flush wants the PC **written** with the branch target TARGET;
- the stall wants the PC **held** (PCWrite = 0).

If the stall wins, the branch target is never loaded into the PC: the processor keeps fetching the wrong path (\`sw\`, …), and the taken branch is lost. The program executes incorrectly.

**The solution: flush has priority over stall.** The stall was requested by \`add\`, an instruction that is about to be flushed anyway, so it is meaningless. Gate the hazard detection unit's stall with the flush signal:
$$
\text{PCWrite} = \overline{\text{stall}} + \text{flush},\qquad \text{IF/IDWrite} = \overline{\text{stall}} + \text{flush}
$$
or, equivalently, $\text{stall}_{\text{effective}} = \text{stall}\cdot\overline{\text{flush}}$. On a taken branch, the PC is loaded with TARGET and all wrong-path instructions (including the stalling \`add\`) become bubbles; the next instruction fetched is \`or $1, $1, $2\` at TARGET.`,

  "6": md`There is no single correct design; this is one that works, with its reasons.

**The M-type format.** Operation: rd = rs ± Memory[rb + offset].

| Field | Bits | Width | Meaning |
|---|---|---|---|
| op | 31–26 | 6 | a **new opcode** (e.g. 48 for \`madd\`, 49 for \`msub\`), unused by R, I and J |
| rs | 25–21 | 5 | register operand |
| rb | 20–16 | 5 | base register of the memory operand |
| rd | 15–11 | 5 | destination register |
| offset | 10–0 | 11 | signed byte offset of the memory operand |

**Justification.**
- A new opcode keeps the three original formats untouched: the decoder recognises M-type only by these opcodes.
- op, rs and the 5-bit fields sit where R- and I-type already put op, rs, rt and rd. So the register file can be read with the existing wiring: Read register 1 = bits 25–21 (rs), Read register 2 = bits 20–16 (rb), and the destination is bits 15–11, like R-type.
- Two opcodes (add and subtract) need no funct field, which frees 11 bits for the offset (±1 KiB, enough for local variables and structure fields).

**Assembly to machine code.**
- Syntax: \`madd rd, rs, offset(rb)\` and \`msub rd, rs, offset(rb)\`.
- Example: \`madd $t0, $s1, 8($s2)\` → op = 48, rs = 17, rb = 18, rd = 8, offset = 8:
  110000 10001 10010 01000 00000001000.
- Rules: the offset must fit in 11 signed bits (−1024 to 1023); otherwise the assembler uses \`lw\` into \`$at\` plus a normal \`add\`/\`sub\`.

**Hardware changes (single-cycle datapath).**
1. **An address adder.** The memory address (rb + offset) is needed before the ALU can do the add/subtract, and the ALU is busy with that operation. Add a separate adder: Read data 2 (rb) + sign-extend(offset).
2. **An 11-bit sign extender** for the offset (or a mux in front of the existing 16-bit one).
3. **Data memory read with that address:** a mux on the data-memory address input, choosing the ALU result (lw/sw) or the new adder's output (M-type).
4. **Memory data into the ALU:** a new input on the ALUSrc mux (now 3-input) feeding Read data from memory to the ALU's second operand.
5. **Write-back:** the ALU result to rd, with RegDst = 1 (rd) and MemtoReg = 0 (ALU result).
6. **Control:** new signals for the address mux and the 3-input ALUSrc; for M-type, MemRead = 1, RegWrite = 1, MemWrite = 0, ALUOp = add or subtract by opcode.

**The cost.** The critical path becomes register read → address adder → data memory → ALU → register write: longer than \`lw\`. Every instruction's clock cycle gets longer in the single-cycle design. In a pipeline it would need a memory access *before* EX, i.e. a reorganised pipeline. This is why MIPS keeps arithmetic register-only (load/store architecture).`,

  "7": md`**(i) Chandler: agree** (for the slides' 5-stage pipeline with no prediction).
A jump is recognised only when it is **decoded in ID**. During that cycle, the next sequential instruction (PC + 4) has already been **fetched in IF**. That instruction is wrong and must be flushed, and the target is fetched in the next cycle: one cycle is lost per jump.

| Cycle | 1 | 2 | 3 |
|---|---|---|---|
| \`j L\` | IF | ID (target known) | |
| next sequential | | IF (wrong; flushed) | |
| target | | | IF |

**(ii) Joey's solution and its problem.** Moving the control unit (and the jump-target logic) into IF means the instruction must be **fetched and decoded in the same stage**. Instruction-memory access is already one of the longest stages; adding decoding and the target computation after it makes **IF much longer**. The clock period is set by the slowest stage, so **every instruction** becomes slower to save one cycle on jumps only. It also breaks the balance of the pipeline stages.

**(iii) Ross's solution: a branch target buffer (BTB).** Keep the control unit in ID, and add a small cache in IF, **indexed by the PC** of the instruction being fetched:
- each entry holds the **target address** of a jump (or a predicted-taken branch) seen before;
- in IF, the PC is looked up in the BTB **in parallel** with the instruction fetch; if it hits, the next PC is the stored target, so the target is fetched in the very next cycle;
- no decoding is done in IF (the BTB is just a lookup by address), so the cycle time does not grow.

Stalls happen only on a BTB miss (the first time a jump is seen, or after it is evicted), so "most of the time" there is no penalty. (The original MIPS alternative is a **delay slot**: always execute the instruction after the jump, and let the compiler put a useful instruction there.)`,

  "9a": md`**Assumptions.**
- Every instruction makes one instruction access, and 30% also make a data access: **1.3 memory accesses per instruction**. The L1 miss rates apply to every access.
- An L1 hit is covered by the base CPI of 1.
- An L1 miss goes to L2 (20 cycles, by definition); an L2 miss goes to main memory (P1) or to L3 (P2).
- P2's L3 miss rate (1%) is **global**: 1% of all accesses go to DRAM.

**Step 1: cycle times.** The L2 hit time is 20 cycles.
$$
T_{c1} = \frac{27.5}{20} = ${f(Q9A.tc1)}\ \text{ns},\qquad T_{c2} = \frac{30.5}{20} = ${f(Q9A.tc2)}\ \text{ns}
$$

**Step 2: penalties in cycles.**
- P1: DRAM $= 100/${f(Q9A.tc1)} = ${f(Q9A.mem1, 2)}$ cycles.
- P2: L3 $= 50.7/${f(Q9A.tc2)} = ${f(Q9A.l3, 2)}$ cycles; DRAM $= 100/${f(Q9A.tc2)} = ${f(Q9A.mem2, 2)}$ cycles.

**Step 3: P1's effective CPI.** Misses per access: 4% reach L2; 65% of those miss L2 (local miss rate) and reach DRAM.
$$
\text{CPI}_1 = 1 + 1.3\times0.04\times(20 + 0.65\times${f(Q9A.mem1, 2)}) = ${f(Q9A.cpi1)}
$$

**Step 4: P2's effective CPI.** 3% of accesses reach L2; $0.03\times0.5 = 1.5\%$ reach L3; 1% (global) reach DRAM.
$$
\text{CPI}_2 = 1 + 1.3\times(0.03\times20 + 0.015\times${f(Q9A.l3, 2)} + 0.01\times${f(Q9A.mem2, 2)}) = ${f(Q9A.cpi2)}
$$

**Step 5: compare time per instruction** (the clocks differ, so CPI alone is not enough):
$$
\text{P1: } ${f(Q9A.cpi1)}\times${f(Q9A.tc1)}\ \text{ns} = ${f(Q9A.t1)}\ \text{ns}
$$
$$
\text{P2: } ${f(Q9A.cpi2)}\times${f(Q9A.tc2)}\ \text{ns} = ${f(Q9A.t2)}\ \text{ns}
$$
**(i) P2 is faster**, by $${f(Q9A.t1)}/${f(Q9A.t2)} \approx ${f(Q9A.t1 / Q9A.t2, 2)}$ times.

**(ii) P1's L2 miss rate needed to match P2.** Set P1's time per instruction equal to P2's, with unknown local L2 miss rate $m$:
$$
${f(Q9A.tc1)}\times\left[1 + 1.3\times0.04\times(20 + m\times${f(Q9A.mem1, 2)})\right] = ${f(Q9A.t2)}
$$
$$
1 + 0.052\times(20 + ${f(Q9A.mem1, 2)}m) = ${f(Q9A.t2 / Q9A.tc1)}
$$
$$
m = \frac{(${f(Q9A.t2 / Q9A.tc1)} - 1)/0.052 - 20}{${f(Q9A.mem1, 2)}} \approx ${f(Q9A.need)}
$$
P1 would need an L2 local miss rate of about **${f(Q9A.need * 100, 1)}%** (instead of 65%).

(If only the 30% data accesses are counted as memory accesses, all the miss terms shrink by the factor 0.3/1.3, but the method is the same.)`,

  "9b": md`**Step 1: block and offset.** A block is 16 words = 64 bytes. Because the cache supports \`lb\`, addresses are **byte** addresses, so the offset must select a byte:
$$
\text{offset} = \log_2 64 = 6\ \text{bits}\ (4\ \text{word} + 2\ \text{byte})
$$

**Step 2: blocks and sets.**
$$
\#\text{blocks} = \frac{64\ \text{KB}}{64\ \text{B}} = ${c9b.blocks},\qquad \#\text{sets} = \frac{${c9b.blocks}}{4} = ${c9b.sets}
$$
$$
\text{index} = \log_2 ${c9b.sets} = ${c9b.split.index}\ \text{bits}
$$

**Step 3: tag.**
$$
\text{tag} = 48 - ${c9b.split.index} - 6 = ${c9b.split.tag}\ \text{bits}
$$

**Step 4: bits per block.**
$$
512\ (\text{data} = 64\times8) + ${c9b.split.tag}\ (\text{tag}) + 1\ (\text{valid}) + 1\ (\text{dirty}) + 1\ (\text{protection}) = ${c9b.perBlock}\ \text{bits}
$$

**Step 5: total.**
$$
${c9b.blocks}\times${c9b.perBlock} = ${c9b.total.toLocaleString("en-US")}\ \text{bits} = ${c9b.total / 1024}\ \text{Kibits} \approx ${f(c9b.total / 8 / 1024, 2)}\ \text{KiB}
$$`,

  "9c": md`**Register use:** a in \`$a0\`, b in \`$a1\`, result in \`$v0\`. The frame saves \`$ra\` and \`$a0\` (a is needed after the second recursive call). C's \`/\` truncates towards zero, so the code uses \`div\` (quotient in LO), not a shift, which would round negative numbers the other way.

\`\`\`
fun:    addi $sp, $sp, -8
        sw   $ra, 4($sp)          # save return address
        sw   $a0, 0($sp)          # save a
        bne  $a1, $zero, L1       # b != 0 ?
        add  $v0, $zero, $zero    # b == 0: return 0
        j    Ret
L1:     addi $t0, $zero, 2
        div  $a1, $t0             # LO = b / 2
        mflo $t1
        bne  $t1, $zero, L2       # b/2 != 0 ?
        sll  $a0, $a0, 2          # a * 4
        addi $t0, $zero, 8
        div  $a1, $t0
        mflo $a1                  # b / 8
        jal  fun                  # $v0 = fun(a*4, b/8)
        j    Ret
L2:     add  $a0, $a0, $a0        # a + a
        addi $t0, $zero, 4
        div  $a1, $t0
        mflo $a1                  # b / 4
        jal  fun                  # $v0 = fun(a+a, b/4)
        lw   $a0, 0($sp)          # restore a
        add  $v0, $v0, $a0        # fun(a+a, b/4) + a
Ret:    lw   $ra, 4($sp)
        addi $sp, $sp, 8
        jr   $ra
\`\`\`

**Trace: fun(3, 20).**

| Call | b == 0? | b/2 | Calls | Returns |
|---|---|---|---|---|
| fun(3, 20) | no | 10 (≠ 0) | fun(6, 5), then adds a = 3 | 6 + 3 = 9 |
| fun(6, 5) | no | 2 (≠ 0) | fun(12, 1), then adds a = 6 | 0 + 6 = 6 |
| fun(12, 1) | no | 0 | fun(48, 0) | 0 |
| fun(48, 0) | yes | | | 0 |

The code returns 9 for fun(3, 20), the same as the C function.`,

  "10a": md`**(i) Single-level page tables.**

**Step 1: split the virtual address.** Page size 16 KB = $2^{14}$ bytes, so the offset is 14 bits and the VPN is $38 - 14 = 24$ bits.

**Step 2: one page table.**
$$
2^{24}\ \text{entries}\times4\ \text{B} = 2^{26}\ \text{B} = 64\ \text{MiB}
$$

**Step 3: all processes.** Each of the 75 processes has its own page table:
$$
75\times64\ \text{MiB} = 4800\ \text{MiB} = 4.6875\ \text{GiB}
$$
That is more than half of the 8 GB of physical memory, which is why multi-level and inverted page tables are used. (The 8-bit PID is not needed for single-level tables: each process's table is separate.)

Parts (ii) and (iii), on multi-level and inverted page tables, are not covered in the lecture slides.`,

  "10b": md`**Step 1: virtual address.** Page size 32 KB = $2^{15}$ B: page offset = 15 bits; VPN = $64 - 15 = 49$ bits.

**Step 2: physical address.** 64 GB = $2^{36}$ B: physical address = 36 bits; PPN = $36 - 15 = 21$ bits.

**Step 3: the TLB.** 32 entries, fully associative, so there is no index: the whole VPN is the tag, compared in all 32 entries at once.
$$
\text{entry} = \underbrace{49}_{\text{tag (VPN)}} + \underbrace{1}_{\text{valid}} + \underbrace{1}_{\text{dirty}} + \underbrace{24}_{\text{bookkeeping}} + \underbrace{21}_{\text{PPN (data)}} = 96\ \text{bits}
$$
TLB size: $32\times96 = 3072$ bits.

**Step 4: the data cache.** 64 words per block = 256 bytes: offset = 8 bits (6 word + 2 byte). Blocks $= 64\ \text{KB} / 256\ \text{B} = 256$: index = 8 bits. Physically tagged: tag $= 36 - 8 - 8 = 20$ bits.

**Step 5: the diagram.**

\`\`\`fig
b21-10b
\`\`\`

1. The 49-bit VPN is compared with all 32 TLB tags. On a hit, the TLB supplies the 21-bit PPN; on a miss, a TLB-miss exception loads the entry from the page table.
2. PPN (21) + page offset (15) = the 36-bit physical address.
3. The cache uses physical address bits 15–8 as the index (one of 256 blocks) and compares bits 35–16 with that block's 20-bit tag; a match with valid = 1 is a hit, and bits 7–2 select the word.`,

  "10c": md`**Why flush.** Every process uses the **same virtual addresses** (e.g. its code starts at the same virtual address), mapped by its own page table to **different physical pages**.
- **TLB:** its entries translate the *old* process's virtual pages. After a context switch, the new process could hit on such an entry and get the old process's physical page: wrong data, and a **protection** violation (one process could read or write another's memory).
- **Virtually addressed (virtually tagged) data cache:** the same problem: a line tagged with a virtual address of the old process would hit for the new process's identical virtual address. (A physically indexed, physically tagged cache does not have this problem, since physical addresses are unique.)

So without extra support, the OS must invalidate the TLB (and any virtually tagged cache) on every switch, which makes each switch followed by many misses.

**How to avoid flushing: add a process identifier.** Extend each TLB entry (and each virtual cache tag) with a **process ID** (address-space ID; e.g. the 8-bit PID). The OS loads the running process's PID into a CPU register on a context switch, and a hit requires both the tag **and** the PID to match. Entries of different processes can then coexist, and nothing needs to be flushed.`,

  "11a": md`**Overflow happens exactly when the carry into the sign bit differs from the carry out of it.** Let $C_{n-1}$ be the carry into the sign column and $C_n$ the carry out. The sign column adds $a_{n-1} + b_{n-1} + C_{n-1}$:

| Signs of the operands | $C_n$ | Sign of the result | Overflow? |
|---|---|---|---|
| both 0 (two positives) | 0 | $C_{n-1}$ | when the sign becomes 1, i.e. $C_{n-1} = 1 \ne C_n$ |
| both 1 (two negatives) | 1 | $C_{n-1}$ | when the sign becomes 0, i.e. $C_{n-1} = 0 \ne C_n$ |
| different | $C_{n-1}$ (since $1 + C_{n-1}$ carries out iff $C_{n-1} = 1$) | | never, and indeed $C_n = C_{n-1}$ |

So overflow ⟺ $C_n \ne C_{n-1}$ ⟺ $V = C_n\oplus C_{n-1}$. For an 8-bit ALU this is the slides' $V = C_8\oplus C_9$ (carries numbered from 1).

**Example (4 bits):** $0111 + 0001$ (7 + 1). The carry into the sign column is 1 and the carry out is 0, so $V = 1\oplus0 = 1$: the sum 1000 = −8 is wrong. Compare $1111 + 0001$ (−1 + 1): carries into and out of the sign are both 1, $V = 0$, sum 0000 is right.`,

  "11b": md`**jal versus j.** Both are J-format (6-bit opcode, 26-bit address) and jump to the same kind of target, (PC + 4)[31–28] : address : 00.
- \`j L\` only jumps.
- \`jal L\` ("jump and link") also **saves the return address**: it writes PC + 4 (the address of the next instruction) into \`$ra\` (register 31). This is how a procedure is called: the procedure returns with \`jr $ra\`.

| | \`j\` | \`jal\` |
|---|---|---|
| Opcode | 2 | 3 |
| Writes a register | no | \`$ra\` ← PC + 4 |
| Use | loops, goto | procedure call |

**NOT in MIPS.** There is no NOT instruction. MIPS uses the three-operand **NOR** with \`$zero\`, since $a\ \text{NOR}\ 0 = \text{NOT}(a + 0) = \text{NOT}\ a$:

\`\`\`
nor $t0, $t1, $zero    # $t0 = NOT $t1
\`\`\`

Example: \`$t1\` = 0000 … 0011 1100 0000 0000 gives \`$t0\` = 1111 … 1100 0011 1111 1111. Using NOR keeps every logic instruction in the regular three-register format.`,

  "11c": md`MIPS has **five** addressing modes:

\`\`\`fig
isa-mode-immediate
isa-mode-register
isa-mode-base
isa-mode-pcrel
isa-mode-pseudo
\`\`\`

| Mode | Calculation | Example |
|---|---|---|
| 1. Immediate | operand = sign-extended 16-bit constant in the instruction | \`addi $s1, $s2, 100\` |
| 2. Register | operand = Reg[rs] (and Reg[rt]) | \`add $s1, $s2, $s3\` |
| 3. Base (displacement) | address = Reg[rs] + sign-extend(constant); operand = Memory[address] | \`lw $s1, 100($s2)\` |
| 4. PC-relative | target = (PC + 4) + sign-extend(offset) × 4 | \`beq $s1, $s2, L\` |
| 5. Pseudodirect | target = (PC + 4)[31–28] : address[25–0] : 00 | \`j L\` |

**Worked calculations.**
- Base: if \`$s2\` = 1000, \`lw $s1, 100($s2)\` reads the word at 1100.
- PC-relative: a branch at 80012 with offset 2 goes to $80016 + 2\times4 = 80024$.
- Pseudodirect: \`j\` with address field 20000, at PC 80020, goes to $0000 : (20000\times4) = 80000$.`,

  "11d": md`Each stage's full adder computes $F_i = X_i\oplus Y_i\oplus Z_i$, where $Z_i$ is its carry input; for the logic operations the carries are forced to 0, so $F_i = X_i\oplus Y_i$.

**Step 1: write each arithmetic operation as $X + Y + C_{in}$.** Use $\overline{A} = -A - 1$ and $\overline{B} = -B - 1$ (mod $2^4$):

| $S_2S_1S_0$ | Operation | $X_i$ | $Y_i$ | $C_{in}$ | Why |
|---|---|---|---|---|---|
| 000 | $-A - B - 2$ | $A_i'$ | $B_i'$ | 0 | $\overline{A} + \overline{B} = (-A-1) + (-B-1)$ |
| 001 | $B + \overline{A}$ | $A_i'$ | $B_i$ | 0 | add 1's complement of A to B |
| 010 | $A + B$ | $A_i$ | $B_i$ | 0 | |
| 011 | $A - B$ | $A_i$ | $B_i'$ | 1 | $A + \overline{B} + 1$ |

**Step 2: logic operations** ($S_2 = 1$, carries 0):
- AND ($S_2S_1 = 10$): take $Y_i = B_i'$ and $X_i = A_i + B_i'$. Then $F_i = (A_i + B_i')\oplus B_i'$: if $B_i = 1$, $F_i = A_i$; if $B_i = 0$, $F_i = 1\oplus1 = 0$. So $F_i = A_iB_i$.
- XOR ($S_2S_1 = 11$): take $X_i = A_i$, $Y_i = B_i$, so $F_i = A_i\oplus B_i$.

**Step 3: $X_i$.**
- $S_2 = 0$: $A_i'$ when $S_1 = 0$, $A_i$ when $S_1 = 1$, i.e. $A_i\oplus S_1'$.
- $S_2 = 1$: $A_i + B_i'$ when $S_1 = 0$, $A_i$ when $S_1 = 1$, i.e. $A_i + S_1'B_i'$.
$$
X_i = S_2'(A_i\oplus S_1') + S_2(A_i + S_1'B_i')
$$

**Step 4: $Y_i$.** It is always $B_i$ or $B_i'$, so write $Y_i = B_i\oplus K$:

| $S_2S_1S_0$ | 000 | 001 | 010 | 011 | 10x | 11x |
|---|---|---|---|---|---|---|
| $Y_i$ | $B_i'$ | $B_i$ | $B_i$ | $B_i'$ | $B_i'$ | $B_i$ |
| $K$ | 1 | 0 | 0 | 1 | 1 | 0 |

$K = 1$ for 000, 011, 10x: $K = S_2'S_1'S_0' + S_2'S_1S_0 + S_2S_1' = S_2'(S_1\odot S_0) + S_2S_1'$.
$$
Y_i = B_i\oplus\left[S_2'(S_1\odot S_0) + S_2S_1'\right]
$$

**Step 5: carries.** Only 011 needs a carry in; logic operations cut the chain:
$$
C_{in} = Z_1 = S_2'S_1S_0,\qquad Z_i = S_2'C_i
$$

**Check, $S_2S_1S_0 = 000$, $A = 0011$ (3), $B = 0001$ (1):** $X = 1100$, $Y = 1110$, $C_{in} = 0$: $1100 + 1110 = 1\,1010$, i.e. $1010 = -6 = -3 - 1 - 2$. These equations were verified on all $16\times16$ input pairs for every selection code.`,

  "12a": md`Java is compiled to **bytecode** for the Java Virtual Machine, which is portable but, when **interpreted**, slow: every bytecode is decoded and executed by software each time it runs.

A **Just-In-Time (JIT) compiler** improves this while the program runs:
1. The JVM profiles the program and finds the **"hot" methods**, the ones executed often.
2. The JIT compiles the bytecode of those methods into **native machine code** for the host processor, and saves it.
3. Later calls run the native code directly, at roughly compiled-program speed.

Rarely used code stays interpreted, so the compile cost is paid only where it pays off, and portability is kept (the class files are still bytecode).`,

  "12b": md`**The main difference: when library code is attached to the program.**

| | Static linking | Dynamic linking |
|---|---|---|
| When | at link time, before the program runs | at run time, when a library routine is first called |
| Executable | contains copies of all library routines it might use | contains only stubs and an indirection table |
| Library update | needs relinking to pick it up | picked up automatically |
| Call cost | direct call | an indirect jump (plus the first-call linking) |

**How a dynamically linked library call works (lazy linkage):** the call goes through an indirection table. The first time, the table points to a stub that loads the routine's ID and jumps to the dynamic linker/loader, which finds and maps the routine and patches the table. Later calls jump through the table straight to the routine.

**Advantages of dynamic linking.**
- **No image bloat:** the executable does not carry every (transitively) referenced library routine, so it is smaller on disk and in memory.
- **Automatic library updates:** a new library version (e.g. a bug fix) is used by every program without relinking.
- **Only what is used is loaded:** routines are linked and loaded only when actually called.
- **Sharing:** one copy of a library in memory can serve many programs.

(It requires the library code to be relocatable.)`,

  "12c": md`**(i) Building the constant.**
- Upper 16 bits: 0010 0000 0000 0001 = 2001 (hex) = 8193.
- Lower 16 bits: 0100 1001 0010 0100 = 4924 (hex) = 18724.

\`\`\`
lui $t1, 8193          # $t1 = 0x2001 0000
ori $t1, $t1, 18724    # $t1 = 0x2001 4924
\`\`\`

\`ori\` (not \`addi\`) is used for the lower half, because it zero-extends.

**(ii) A single jump from PC = 0x00000000 to 0x20014924? No.**
A jump's target is (PC + 4)[31–28] : address[25–0] : 00. Here PC + 4 = 0x00000004, so the top 4 bits of any jump target are 0000. The target 0x20014924 has top 4 bits 0010: it is in a different 256 MB region. A single \`j\` cannot reach it. (Use the constant from (i) and \`jr $t1\`.)

**(iii) A single branch from PC = 0x1FFFF000 to 0x20014924? Yes.**
A branch target is (PC + 4) + offset × 4, with a 16-bit signed offset (−32768 to 32767 words).
$$
\text{offset} = \frac{\texttt{0x20014924} - \texttt{0x1FFFF004}}{4} = \frac{\texttt{0x15920}}{4} = \frac{88352}{4} = 22088
$$
22088 is a whole number of words and lies within −32768 … 32767, so a single branch, e.g. \`beq $zero, $zero, target\`, reaches it.`,

  "12d": md`**Figure 12.2 counts time, not work.** A clock-cycle count includes the cycles lost to **memory stalls**, mostly cache misses, and an instruction count does not.

- For small arrays, everything fits in the cache, so cycles track instructions: both figures start on the same trajectory.
- Radix Sort scatters its accesses: each pass reads the input sequentially but writes each element into one of many buckets, at addresses spread across a large array. Its **memory access pattern has poor locality**.
- As the data grows beyond the cache, Radix Sort's accesses miss in the cache much more often (the slides' third graph shows its cache misses per item rising sharply above about 64K items, while Quicksort's stay low). Each miss costs many cycles.
- Quicksort works on contiguous sub-arrays that soon fit in the cache, so it keeps good locality and few misses.

So although Radix Sort executes fewer **instructions** per item for large arrays, its extra **cache misses** cost more cycles than it saves, and its clock-cycle line diverges upward. Misses depend on memory access patterns: algorithm behaviour, not just instruction count, decides performance.`,
}
