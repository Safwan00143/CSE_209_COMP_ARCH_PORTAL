import { md } from "../md"

export const isaBasicsNote = md`
## The instruction set

An **instruction set** is the repertoire of instructions a computer understands. Different computers have different instruction sets, but with many aspects in common. Early computers had very simple instruction sets, which simplified the implementation; many modern computers keep them simple for the same reason.

The course uses **MIPS** (Stanford MIPS, commercialised by MIPS Technologies). It has a large share of the embedded-core market and is typical of many modern ISAs.

Throughout, \`#\` starts a comment, registers are written \`$t0\`, \`$s1\`, and every instruction is one 32-bit word.

## Arithmetic: three operands

Add and subtract take **three operands**: two sources and one destination.

\`\`\`
add a, b, c      # a gets b + c
\`\`\`

Every arithmetic operation has this form.

**Design Principle 1: Simplicity favours regularity.** Regularity makes the implementation simpler, and simplicity enables higher performance at lower cost.

This is why MIPS arithmetic "always demands three operands". A fixed number of operands means every arithmetic instruction is decoded the same way and uses the same datapath; a variable number would need more complex hardware for every instruction.

**Example (slide).** \`f = (g + h) - (i + j);\` with temporaries:

\`\`\`
add t0, g, h     # temp t0 = g + h
add t1, i, j     # temp t1 = i + j
sub f, t0, t1    # f = t0 - t1
\`\`\`

## Register operands

Arithmetic instructions use **register operands** only.

- MIPS has a **32 × 32-bit register file**, numbered 0 to 31, used for frequently accessed data.
- 32-bit data is called a **word**.
- Assembler names: \`$t0\`–\`$t9\` for temporaries, \`$s0\`–\`$s7\` for saved variables.

**Design Principle 2: Smaller is faster.** Main memory has millions of locations; a small register file is fast.

Why only 32 registers?
- **Speed.** More registers make the register file larger and slower, which would lengthen the clock cycle for every instruction.
- **Encoding.** 32 registers need 5-bit register fields; three of them already take 15 of the 32 instruction bits. 64 registers would need 6-bit fields, leaving fewer bits for the opcode and constants.

**Example (slide).** \`f = (g + h) - (i + j);\` with f, …, j in \`$s0\`, …, \`$s4\`:

\`\`\`
add $t0, $s1, $s2
add $t1, $s3, $s4
sub $s0, $t0, $t1
\`\`\`

## Memory operands

Main memory holds composite data: arrays, structures and dynamic data. To do arithmetic on it, **load** values into registers and **store** results back.

- Memory is **byte addressed**: each address names one 8-bit byte.
- Words are **aligned**: a word's address must be a multiple of 4.
- MIPS is **big endian**: the most-significant byte of a word is at the word's lowest address. (Little endian puts the least-significant byte there.)

Because a word is 4 bytes, array element \`A[i]\` of a word array is at byte offset \`4 × i\` from the base address.

**Example 1 (slide).** \`g = h + A[8];\` with g in \`$s1\`, h in \`$s2\`, base of A in \`$s3\`. Index 8 needs offset $8\times4 = 32$:

\`\`\`
lw  $t0, 32($s3)    # load word A[8]
add $s1, $s2, $t0
\`\`\`

In \`lw $t0, 32($s3)\`, 32 is the **offset** and \`$s3\` is the **base register**.

**Example 2 (slide).** \`A[12] = h + A[8];\`:

\`\`\`
lw  $t0, 32($s3)    # load word A[8]
add $t0, $s2, $t0
sw  $t0, 48($s3)    # store word into A[12]
\`\`\`

## Registers versus memory

- Registers are faster to access than memory.
- Operating on memory data needs loads and stores, so more instructions execute.
- The compiler keeps variables in registers as much as possible and **spills** to memory only the less frequently used ones. Register optimisation is important.

So when a program has more variables (say 40) than registers (32), the compiler keeps the most frequently used ones in registers and keeps the rest in memory, loading each one when it is needed and storing it back afterwards.

## Immediate operands and the constant zero

A constant can sit inside the instruction:

\`\`\`
addi $s3, $s3, 4       # $s3 = $s3 + 4
addi $s2, $s1, -1      # no subtract-immediate: use a negative constant
\`\`\`

**Design Principle 3: Make the common case fast.** Small constants are common, and an immediate operand avoids a load instruction.

Register 0, \`$zero\`, always reads as 0 and cannot be overwritten. It makes common operations cheap, e.g. a register-to-register move:

\`\`\`
add $t2, $s1, $zero    # $t2 = $s1
\`\`\`

## Unsigned and two's-complement integers

**Unsigned.** An $n$-bit number $x_{n-1}\dots x_1x_0$ has value
$$
x = x_{n-1}2^{n-1} + \dots + x_12^1 + x_02^0
$$
Its range is $0$ to $2^{n}-1$; with 32 bits, 0 to 4,294,967,295.

Example: $0000\ \dots\ 1011_2 = 8 + 0 + 2 + 1 = 11_{10}$.

**Two's complement.** The top bit has negative weight:
$$
x = -x_{n-1}2^{n-1} + x_{n-2}2^{n-2} + \dots + x_02^0
$$
Its range is $-2^{n-1}$ to $2^{n-1}-1$; with 32 bits, $-2{,}147{,}483{,}648$ to $+2{,}147{,}483{,}647$.

Example (slide): $1111\ 1111\ \dots\ 1111\ 1100_2 = -2^{31} + (2^{31}-4) = -4$.

- Bit 31 is the sign bit: 1 for negative, 0 for non-negative.
- $-(-2^{n-1})$ cannot be represented.
- Non-negative numbers look the same in unsigned and two's complement.

| Value | 32-bit pattern |
|---|---|
| 0 | 0000 0000 … 0000 |
| −1 | 1111 1111 … 1111 |
| Most negative | 1000 0000 … 0000 |
| Most positive | 0111 1111 … 1111 |

## Negation and sign extension

**Negate:** complement every bit (0 ↔ 1), then add 1.

Example: $+2 = 0000\ \dots\ 0010$. Complement: $1111\ \dots\ 1101$. Add 1: $1111\ \dots\ 1110 = -2$.

**Sign extension** represents a number with more bits while keeping its value: copy the sign bit into the new bits on the left. Unsigned values are extended with 0s instead.

| 8-bit | 16-bit |
|---|---|
| +2 = 0000 0010 | 0000 0000 0000 0010 |
| −2 = 1111 1110 | 1111 1111 1111 1110 |

MIPS sign-extends in three places:
- \`addi\` extends its 16-bit immediate;
- \`lb\` and \`lh\` extend the loaded byte or halfword (\`lbu\`, \`lhu\` zero-extend);
- \`beq\` and \`bne\` extend the 16-bit displacement.

## Representing instructions

Instructions are encoded in binary as **machine code**. Every MIPS instruction is one 32-bit word, using a small number of formats that hold an opcode, register numbers and constants. The few, similar formats are another case of regularity.

**Register numbers**

| Registers | Numbers |
|---|---|
| \`$zero\` | 0 |
| \`$at\` (assembler temporary) | 1 |
| \`$v0\`–\`$v1\` | 2–3 |
| \`$a0\`–\`$a3\` | 4–7 |
| \`$t0\`–\`$t7\` | 8–15 |
| \`$s0\`–\`$s7\` | 16–23 |
| \`$t8\`–\`$t9\` | 24–25 |
| \`$gp\`, \`$sp\`, \`$fp\`, \`$ra\` | 28, 29, 30, 31 |

## The R-format

\`\`\`fig
isa-r-format
\`\`\`

| Field | Bits | Meaning |
|---|---|---|
| op | 6 | operation code (opcode); 0 for every R-type instruction |
| rs | 5 | first source register number |
| rt | 5 | second source register number |
| rd | 5 | destination register number |
| shamt | 5 | shift amount (0 except for shifts) |
| funct | 6 | function code: extends the opcode, picks the operation |

Note the **assembly order differs from the field order**: \`add rd, rs, rt\` is written destination first, but rd comes third in the word.

**How to encode an R-type instruction**

1. Look up op and funct (\`add\`: 0, 32; \`sub\`: 0, 34; \`and\`: 0, 36; \`or\`: 0, 37; \`slt\`: 0, 42; \`sll\`: 0, 0; \`srl\`: 0, 2).
2. Put the destination register's number in rd and the two sources in rs and rt, in that order.
3. Set shamt (0 unless it is a shift).
4. Write each field in binary at its width, join them, and group in fours for hex.

**Example (slide): \`add $t0, $s1, $s2\`.**

| op | rs | rt | rd | shamt | funct |
|---|---|---|---|---|---|
| 0 | 17 | 18 | 8 | 0 | 32 |
| 000000 | 10001 | 10010 | 01000 | 00000 | 100000 |

Joined: 0000 0010 0011 0010 0100 0000 0010 0000 = $\texttt{0x02324020}$.

## Hexadecimal

Hex is base 16: four bits per digit, a compact way to write bit strings.

| Hex | Bits | Hex | Bits | Hex | Bits | Hex | Bits |
|---|---|---|---|---|---|---|---|
| 0 | 0000 | 4 | 0100 | 8 | 1000 | c | 1100 |
| 1 | 0001 | 5 | 0101 | 9 | 1001 | d | 1101 |
| 2 | 0010 | 6 | 0110 | a | 1010 | e | 1110 |
| 3 | 0011 | 7 | 0111 | b | 1011 | f | 1111 |

Example (slide): eca8 6420 = 1110 1100 1010 1000 0110 0100 0010 0000.

## The I-format

\`\`\`fig
isa-i-format
\`\`\`

Used by immediate arithmetic and by loads and stores.

- **rt** is the destination register (for \`addi\`, \`lw\`) or the source (for \`sw\`).
- **constant**: $-2^{15}$ to $+2^{15}-1$.
- **address**: an offset added to the base address in rs.

Example: \`lw $t0, 32($s3)\` encodes as op = 35, rs = 19 (\`$s3\`), rt = 8 (\`$t0\`), constant = 32. Opcodes on the slides' card: \`lw\` 35, \`sw\` 43, \`addi\` 8, \`beq\` 4, \`bne\` 5, \`j\` 2, \`jal\` 3.

**Design Principle 4: Good design demands good compromises.** Different formats complicate decoding, but they let every instruction be 32 bits. The formats are kept as similar as possible: op is always the first 6 bits, and rs and rt are always in the same places, so registers can be read before the instruction is fully decoded.

## The four design principles, with examples

| Principle | Example in MIPS |
|---|---|
| 1. Simplicity favours regularity | every arithmetic instruction has exactly three register operands; all instructions are 32 bits; register fields stay in the same place in every format |
| 2. Smaller is faster | only 32 registers |
| 3. Make the common case fast | immediate operands for small constants; PC-relative branches (targets are usually near); beq/bne in hardware but not blt/bge |
| 4. Good design demands good compromises | three formats instead of one, so that all instructions stay 32 bits; 16-bit immediates and branch offsets |

A design feature can involve more than one principle. Name the one that matches the reason, in one line.

## Logical operations

| Operation | C | Java | MIPS |
|---|---|---|---|
| Shift left | \`<<\` | \`<<\` | \`sll\` |
| Shift right | \`>>\` | \`>>>\` | \`srl\` |
| Bitwise AND | \`&\` | \`&\` | \`and\`, \`andi\` |
| Bitwise OR | \`\|\` | \`\|\` | \`or\`, \`ori\` |
| Bitwise NOT | \`~\` | \`~\` | \`nor\` |

They extract and insert groups of bits in a word.

**Shifts** use the shamt field (how many positions to shift).
- \`sll\` shifts left and fills with 0s; shifting left by $i$ multiplies by $2^i$.
- \`srl\` shifts right and fills with 0s; shifting right by $i$ divides by $2^i$ (unsigned only).

**AND** masks bits: it keeps some bits and clears the others to 0.

**OR** includes bits: it sets some bits to 1 and leaves the others unchanged.

Slide example, with \`$t2\` = 0000 … 0000 1101 1100 0000 and \`$t1\` = 0000 … 0011 1100 0000 0000:
- \`and $t0, $t1, $t2\` gives 0000 … 0000 1100 0000 0000;
- \`or $t0, $t1, $t2\` gives 0000 … 0011 1101 1100 0000.

**NOT.** MIPS has no NOT instruction. It uses the three-operand NOR, because
$$
a\ \text{NOR}\ b = \text{NOT}(a\ \text{OR}\ b)
$$
and NOR with \`$zero\` is NOT:

\`\`\`
nor $t0, $t1, $zero    # $t0 = NOT $t1
\`\`\`

With \`$t1\` = 0000 … 0011 1100 0000 0000, this gives \`$t0\` = 1111 … 1100 0011 1111 1111. Keeping NOR (and not adding a separate NOT) keeps every logical instruction in the three-operand R-format.
`
