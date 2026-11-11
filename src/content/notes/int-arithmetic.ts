import { md } from "../md"
import { additionTable, mulTable } from "../render"
import { multiplyFirst, multiplyRefined } from "@/lib/multiply"

const add76 = additionTable("00000111", "00000110", 0, ["+7", "+6"])
const sub76 = additionTable("00000111", "11111001", 1, ["+7", "NOT(+6)"])
const ovf = additionTable("01111111", "00000001", 0, ["+127", "+1"])
const first = multiplyFirst("0010", "0011")
const refined = multiplyRefined("0010", "0011")
const slideRefined = multiplyRefined("1000", "1001")

export const intArithmeticNote = md`
## What Chapter 3 covers

Operations on integers: addition and subtraction, multiplication, and dealing with overflow. Then floating-point real numbers: their representation and operations (the next topic).

## Integer addition

Add bit by bit from the right, carrying into the next column, exactly as in decimal.

**Example (slide): 7 + 6**, shown on 8 bits:

${add76.table}

Result: 0000 1101 = 13. The carry into bit 7 and the carry out of bit 7 are both ${add76.carryIntoSign}, so there is no overflow.

**Overflow** happens when the result is out of range for the number of bits.
- Adding a positive and a negative operand: **never** overflows.
- Adding two positive operands: overflow if the result's sign bit is **1**.
- Adding two negative operands: overflow if the result's sign bit is **0**.

**Example: 127 + 1 on 8 bits.**

${ovf.table}

The sum 1000 0000 has sign bit 1 although both operands are positive: overflow (the true answer, 128, does not fit in 8-bit two's complement).

## Integer subtraction

Subtract by adding the negation of the second operand:
$$
a - b = a + (-b) = a + \overline{b} + 1
$$
In hardware, invert every bit of b and set the carry-in to 1.

**Example (slide): 7 − 6 = 7 + (−6).**
- +7 = 0000 0000 … 0000 0111
- −6 = 1111 1111 … 1111 1010
- sum = 0000 0000 … 0000 0001 = +1

The same on 8 bits, as the ALU does it (invert 6, carry-in 1):

${sub76.table}

Sum ${sub76.sum} = +1; the carry out of the top is ${sub76.carryOut} and is ignored.

**Overflow in subtraction** (slide):
- Subtracting two positive or two negative operands: **never** overflows.
- Subtracting a positive from a negative operand: overflow if the result's sign is **0**.
- Subtracting a negative from a positive operand: overflow if the result's sign is **1**.

## Overflow as a logic function

The rules above, as a table. Let $O$ = 0 for A + B and 1 for A − B, and let $S_A$, $S_B$, $S_R$ be the sign bits of A, B and the result (1 = negative).

| Operation | $S_A$ | $S_B$ | Overflow when |
|---|---|---|---|
| A + B | 0 | 0 | $S_R = 1$ |
| A + B | 1 | 1 | $S_R = 0$ |
| A + B | 0 | 1 | never |
| A + B | 1 | 0 | never |
| A − B | 0 | 1 | $S_R = 1$ |
| A − B | 1 | 0 | $S_R = 0$ |
| A − B | 0 | 0 | never |
| A − B | 1 | 1 | never |

Reading off the four overflow rows:
$$
V = \overline{O}\,\overline{S_A}\,\overline{S_B}\,S_R + \overline{O}\,S_A S_B\,\overline{S_R} + O\,\overline{S_A}\,S_B\,S_R + O\,S_A\,\overline{S_B}\,\overline{S_R}
$$

**The carry rule.** In the adder itself, overflow is simply
$$
V = C_{n} \oplus C_{n-1}
$$
the XOR of the carry **into** the sign bit and the carry **out of** it.

**Why this works.** The sign column adds $a_{n-1} + b_{n-1} + C_{n-1}$.
- If both signs are 0 (two positives), $C_n = 0$. The sum's sign is $C_{n-1}$, so overflow (sign 1) happens exactly when $C_{n-1} = 1 \ne C_n$.
- If both signs are 1 (two negatives), $C_n = 1$. The sign is $C_{n-1}$, so overflow (sign 0) happens exactly when $C_{n-1} = 0 \ne C_n$.
- If the signs differ, the column sum is $1 + C_{n-1}$, so $C_n = C_{n-1}$: no overflow, as the rules say.

So the two carries differ exactly when overflow happens. This is how the ALU's status bit V is generated (the ALU Design topic).

## Long multiplication

**Example (slide):** the multiplicand 1000 times the multiplier 1001.

\`\`\`
      1000      multiplicand
    × 1001      multiplier
    ------
      1000
     0000
    0000
   1000
   -------
   1001000      product
\`\`\`

For each multiplier bit from the right: if it is 1, add the multiplicand (shifted to that bit's position); if 0, add 0.

**The length of the product is the sum of the operand lengths**: an $n$-bit by $m$-bit product needs $n+m$ bits. Two 32-bit operands give a 64-bit product.

## The first multiplier hardware

\`\`\`fig
arith-mult-v1
arith-mult-v1-flow
\`\`\`

**Registers**
- Multiplicand: 64 bits. The 32-bit multiplicand starts in the right half and shifts left one bit per step.
- Multiplier: 32 bits, shifts right one bit per step.
- Product: 64 bits, initially 0.
- ALU: 64 bits.

**Algorithm**, repeated 32 times (n times for n-bit operands):
1. Test Multiplier₀ (the multiplier's rightmost bit). If it is 1, do **1a**: add the multiplicand to the product and put the result in the Product register.
2. Shift the Multiplicand register left 1 bit.
3. Shift the Multiplier register right 1 bit.

After 32 repetitions, the Product register holds the product.

**Example: 0010 × 0011 (2 × 3) with 4-bit operands.**

${mulTable(first.rows)}

Product: ${first.product} = 6.

**Why this hardware is inefficient**
- Half of the 64-bit Multiplicand register is always zeros, and half of the 64-bit ALU always adds zeros.
- Each bit takes three steps, so a 32-bit multiply takes about 32 × 3 ≈ 100 clock cycles.
- The Multiplier register and the empty right half of the Product register are separate, though the multiplier shrinks exactly as the product grows.

## The refined (optimised) multiplier

\`\`\`fig
arith-mult-v2
arith-mult-v2-flow
\`\`\`

The fixes (slide: "perform steps in parallel: add/shift"):
- **The multiplicand stays still** and the product shifts right instead. The Multiplicand register and the ALU shrink to **32 bits**.
- **The multiplier goes in the right half of the Product register**, which has a free bit for every bit the multiplier loses. The separate Multiplier register disappears.
- **The add and the shift happen in the same cycle**: one cycle per partial-product addition.

**Algorithm**, repeated 32 times:
1. Test Product₀. If it is 1, do **1a**: add the multiplicand to the **left half** of the product and put the result there.
2. Shift the Product register right 1 bit, taking in the adder's carry-out at the left.

**Example: 0010 × 0011 again.**

${mulTable(refined.rows, { gapProduct: true })}

Product: ${refined.product} = 6, the same as before, using half the hardware.

**The slide's example, 1000 × 1001:**

${mulTable(slideRefined.rows, { gapProduct: true })}

Product: ${slideRefined.product} = 72 = 8 × 9.

## MIPS multiplication

The product of two 32-bit registers is 64 bits, so MIPS has two 32-bit registers for it:
- **HI**: the most-significant 32 bits;
- **LO**: the least-significant 32 bits.

**Instructions (slide)**
- \`mult rs, rt\` / \`multu rs, rt\`: signed / unsigned; the 64-bit product goes to HI:LO.
- \`mul rd, rs, rt\`: the least-significant 32 bits of the product go to rd.

To read HI and LO into general registers, use \`mfhi rd\` and \`mflo rd\` (move from HI / LO). These two are from the book; the slide lists the three above.
`
