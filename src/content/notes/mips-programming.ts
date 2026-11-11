import { md } from "../md"

export const mipsProgrammingNote = md`
## Branches and jumps

A conditional branch goes to a labelled instruction if a condition holds; otherwise execution continues with the next instruction.

\`\`\`
beq rs, rt, L1     # if (rs == rt) go to L1
bne rs, rt, L1     # if (rs != rt) go to L1
j   L1             # always go to L1
\`\`\`

The assembler works out the addresses of labels.

## Compiling an if statement

**C code (slide):**

\`\`\`
if (i == j) f = g + h;
else        f = g - h;
\`\`\`

with f, g, h, i, j in \`$s0\`, \`$s1\`, \`$s2\`, \`$s3\`, \`$s4\`.

**MIPS:**

\`\`\`
      bne $s3, $s4, Else    # i != j: skip the then-part
      add $s0, $s1, $s2     # f = g + h
      j   Exit              # skip the else-part
Else: sub $s0, $s1, $s2     # f = g - h
Exit:
\`\`\`

**The method:**
1. Branch on the **opposite** condition to the else-part, so the then-part falls through.
2. End the then-part with \`j Exit\`.
3. Put the else-part after it, then the \`Exit\` label.

## Compiling a loop

**C code (slide):** \`while (save[i] == k) i += 1;\` with i in \`$s3\`, k in \`$s5\`, base of save in \`$s6\`.

\`\`\`
Loop: sll  $t1, $s3, 2      # $t1 = 4 * i
      add  $t1, $t1, $s6    # $t1 = address of save[i]
      lw   $t0, 0($t1)      # $t0 = save[i]
      bne  $t0, $s5, Exit   # leave if save[i] != k
      addi $s3, $s3, 1      # i += 1
      j    Loop
Exit:
\`\`\`

Note the array indexing: multiply the index by 4 (\`sll\` by 2) because each word is 4 bytes, then add the base address.

**Patterns for other loops**

| C | MIPS shape |
|---|---|
| \`while (cond) body\` | test at the top with the opposite condition jumping to Exit; body; \`j\` back to the test |
| \`do body while (cond)\` | body; test at the bottom with the condition itself branching back to the top |
| \`for (init; cond; step) body\` | init; then a while loop whose body ends with step |

A **basic block** is a sequence of instructions with no embedded branches (except at the end) and no branch targets (except at the beginning). Compilers identify basic blocks for optimisation, and an advanced processor can speed up their execution.

## Less-than: slt and slti

\`\`\`
slt  rd, rs, rt          # rd = (rs < rt) ? 1 : 0
slti rt, rs, constant    # rt = (rs < constant) ? 1 : 0
\`\`\`

Use them with \`beq\` and \`bne\` against \`$zero\`:

\`\`\`
slt $t0, $s1, $s2        # if ($s1 < $s2)
bne $t0, $zero, L        #   branch to L
\`\`\`

**All four comparisons from slt**

| Branch to L if | Code |
|---|---|
| a < b | \`slt $t0, a, b\` then \`bne $t0, $zero, L\` |
| a ≥ b | \`slt $t0, a, b\` then \`beq $t0, $zero, L\` |
| a > b | \`slt $t0, b, a\` then \`bne $t0, $zero, L\` |
| a ≤ b | \`slt $t0, b, a\` then \`beq $t0, $zero, L\` |

**Why no blt, bge? (slide)**
- Hardware for <, ≥ is slower than for =, ≠.
- Combining a comparison with a branch needs more work per instruction, so it would need a slower clock, and **every** instruction would pay.
- beq and bne are the common case.

This is a good design compromise. (The assembler accepts \`blt\` and friends as pseudoinstructions and expands them into slt plus a branch.)

**Signed versus unsigned comparison.** \`slt\`, \`slti\` compare as two's complement; \`sltu\`, \`sltiu\` compare as unsigned.

Example (slide): \`$s0\` = 1111 … 1111, \`$s1\` = 0000 … 0001.
- \`slt $t0, $s0, $s1\` gives 1, since signed $-1 < +1$.
- \`sltu $t0, $s0, $s1\` gives 0, since unsigned $4{,}294{,}967{,}295 > 1$.

## Procedure calls: the six steps

1. Place the parameters where the procedure can find them (registers).
2. Transfer control to the procedure.
3. Acquire the storage the procedure needs.
4. Perform the procedure's task.
5. Place the result where the caller can find it.
6. Return control to the point of call.

## Register usage

| Registers | Use | Preserved across a call? |
|---|---|---|
| \`$a0\`–\`$a3\` (4–7) | arguments | no |
| \`$v0\`, \`$v1\` (2, 3) | result values | no |
| \`$t0\`–\`$t9\` | temporaries: the callee may overwrite them | no |
| \`$s0\`–\`$s7\` | saved: the callee must save and restore them if it uses them | yes |
| \`$gp\` (28) | global pointer for static data | yes |
| \`$sp\` (29) | stack pointer | yes |
| \`$fp\` (30) | frame pointer | yes |
| \`$ra\` (31) | return address | yes |

**Instructions.**

\`\`\`
jal ProcedureLabel     # $ra = address of the next instruction (PC + 4); jump to the procedure
jr  $ra                # PC = $ra: return
\`\`\`

\`jr\` can jump to any address held in a register, so it is also used for computed jumps, e.g. case/switch statements.

**How \`jal\` differs from \`j\`.** Both jump to a 26-bit pseudodirect target. \`jal\` also **links**: it saves the return address PC + 4 in \`$ra\`, so the procedure can come back with \`jr $ra\`. \`j\` saves nothing.

## A leaf procedure

A **leaf** procedure calls no other procedure.

**C code (slide):**

\`\`\`
int leaf_example (int g, int h, int i, int j) {
    int f;
    f = (g + h) - (i + j);
    return f;
}
\`\`\`

g, …, j arrive in \`$a0\`–\`$a3\`. f goes in \`$s0\`, so \`$s0\` must be saved on the stack. The result goes in \`$v0\`.

\`\`\`
leaf_example:
      addi $sp, $sp, -4     # make room for one word
      sw   $s0, 0($sp)      # save $s0
      add  $t0, $a0, $a1    # $t0 = g + h
      add  $t1, $a2, $a3    # $t1 = i + j
      sub  $s0, $t0, $t1    # f = $t0 - $t1
      add  $v0, $s0, $zero  # return value f
      lw   $s0, 0($sp)      # restore $s0
      addi $sp, $sp, 4      # pop
      jr   $ra              # return
\`\`\`

The stack grows **down**: push by subtracting from \`$sp\`, pop by adding.

## Non-leaf procedures and recursion

A procedure that calls another must save on the stack, before the call:
- its **return address** \`$ra\` (the inner \`jal\` will overwrite it);
- any **arguments and temporaries** it still needs after the call.

It restores them after the call.

**C code (slide):**

\`\`\`
int fact (int n) {
    if (n < 1) return 1;
    else return n * fact(n - 1);
}
\`\`\`

n arrives in \`$a0\`; the result goes in \`$v0\`.

\`\`\`
fact:
      addi $sp, $sp, -8     # room for 2 items
      sw   $ra, 4($sp)      # save return address
      sw   $a0, 0($sp)      # save argument n
      slti $t0, $a0, 1      # n < 1 ?
      beq  $t0, $zero, L1   # no: go to the recursive case
      addi $v0, $zero, 1    # yes: result is 1
      addi $sp, $sp, 8      # pop 2 items
      jr   $ra              # and return
L1:   addi $a0, $a0, -1     # n - 1
      jal  fact             # recursive call: $v0 = fact(n - 1)
      lw   $a0, 0($sp)      # restore original n
      lw   $ra, 4($sp)      # and return address
      addi $sp, $sp, 8      # pop 2 items
      mul  $v0, $a0, $v0    # n * fact(n - 1)
      jr   $ra              # return
\`\`\`

\`\`\`fig
isa-fact-stack
\`\`\`

**Trace for n = 3.**

| Call | n | Returns |
|---|---|---|
| fact(3) | 3 | 3 × fact(2) = 3 × 2 = 6 |
| fact(2) | 2 | 2 × fact(1) = 2 × 1 = 2 |
| fact(1) | 1 | 1 × fact(0) = 1 × 1 = 1 |
| fact(0) | 0 | 1 (base case) |

\`mul\` writes the low 32 bits of the product to a register. The slides' multiply section uses \`mult\` with \`mflo\`, which does the same thing in two instructions:

\`\`\`
mult $a0, $v0          # HI:LO = n * fact(n - 1)
mflo $v0               # $v0 = low 32 bits
\`\`\`

**A recipe for any recursive procedure**
1. Push a frame: \`$ra\` plus every argument or value needed after a recursive call.
2. Test the base case; if it holds, set \`$v0\`, pop the frame and \`jr $ra\`.
3. Set up the arguments in \`$a0\`, …; \`jal\` the procedure.
4. If you need a second recursive call (Fibonacci), save the first result on the stack, or in an \`$s\` register that you also saved, before the second \`jal\`.
5. Restore everything, combine the results into \`$v0\`, pop the frame, \`jr $ra\`.

## Local data and memory layout

Local data (C automatic variables) is allocated by the callee on the stack. The block of stack a procedure uses (saved registers and locals) is its **procedure frame** or activation record; some compilers point \`$fp\` at it.

\`\`\`fig
isa-memory-layout
\`\`\`

- **Text:** program code.
- **Static data:** global variables (C static variables, constant arrays and strings). \`$gp\` is set to an address that allows ± offsets into this segment.
- **Dynamic data:** the heap (malloc in C, new in Java).
- **Stack:** automatic storage, growing down towards the heap.

## Characters and byte operations

- **ASCII:** 128 characters (95 graphic, 33 control).
- **Latin-1:** 256 characters (ASCII plus 96 more graphic characters).
- **Unicode:** a 32-bit character set used by Java and C++ wide characters, covering most of the world's alphabets. UTF-8 and UTF-16 are variable-length encodings of it.

Strings are common, so MIPS has byte and halfword loads and stores:

\`\`\`
lb  rt, offset(rs)     lh  rt, offset(rs)    # sign-extend to 32 bits
lbu rt, offset(rs)     lhu rt, offset(rs)    # zero-extend to 32 bits
sb  rt, offset(rs)     sh  rt, offset(rs)    # store just the rightmost byte/halfword
\`\`\`

The stores need no signed/unsigned pair: they only write the low byte or halfword, so there is nothing to extend. That is why \`lh\`, \`lhu\` and \`sh\` are enough for halfword data, and a separate "store halfword unsigned" would add nothing.

## String copy

**C code (slide):** a null-terminated string copy, with the addresses of x and y in \`$a0\`, \`$a1\` and i in \`$s0\`.

\`\`\`
void strcpy (char x[], char y[]) {
    int i;
    i = 0;
    while ((x[i] = y[i]) != '\0')
        i += 1;
}
\`\`\`

\`\`\`
strcpy:
      addi $sp, $sp, -4      # room for 1 item
      sw   $s0, 0($sp)       # save $s0
      add  $s0, $zero, $zero # i = 0
L1:   add  $t1, $s0, $a1     # address of y[i]
      lbu  $t2, 0($t1)       # $t2 = y[i]
      add  $t3, $s0, $a0     # address of x[i]
      sb   $t2, 0($t3)       # x[i] = y[i]
      beq  $t2, $zero, L2    # exit after copying the '\0'
      addi $s0, $s0, 1       # i = i + 1
      j    L1                # next character
L2:   lw   $s0, 0($sp)       # restore $s0
      addi $sp, $sp, 4       # pop 1 item
      jr   $ra               # return
\`\`\`

Characters are bytes, so the index is **not** multiplied by 4 here.

## A jump table for switch

\`jr\` jumps to an address in a register, so a switch can index a table of label addresses:

\`\`\`
# switch (k) { case 0: ...; case 1: ...; case 2: ...; case 3: ... }, k in $s5,
# JumpTable = base of a word array holding the addresses of L0, L1, L2, L3, in $t4
      slt  $t3, $s5, $zero   # k < 0 ?
      bne  $t3, $zero, Exit
      slti $t3, $s5, 4       # k < 4 ?
      beq  $t3, $zero, Exit
      sll  $t1, $s5, 2       # 4 * k
      add  $t1, $t1, $t4     # address of JumpTable[k]
      lw   $t0, 0($t1)       # $t0 = address of case k
      jr   $t0               # jump to it
\`\`\`

Each case ends with \`j Exit\`. Checking the bounds first keeps \`jr\` from jumping through a word outside the table.

## Pitfalls from the slides

- **Sequential words are not at sequential addresses.** Increment a word pointer or index by 4, not by 1.
- **A pointer to an automatic variable is invalid after the procedure returns,** e.g. a pointer passed back through an argument: the variable lived in the popped stack frame.
`
