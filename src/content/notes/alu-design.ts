import { md } from "../md"

export const aluDesignNote = md`
## What an ALU is

An **arithmetic logic unit (ALU)** performs both arithmetic and logic operations on its inputs. Its operation is chosen by **selection variables** (selection bits) $s_2, s_1, s_0, \dots$.

This topic follows Tushar Sir's slides, which follow Mano, *Digital Logic and Computer Design*, §9.3–9.7. Notation:
- inputs $A = A_n\dots A_1$ and $B = B_n\dots B_1$ (bit $i$ written $A_i$, $B_i$);
- $X_i$, $Y_i$: the data inputs of the $i$-th full adder;
- $Z_i$: the carry input of the $i$-th full adder ($C_i$ when it is passed straight through);
- $C_{in}$: the carry into the first stage; $C_{out}$: the carry out of the last.

## Half adder and full adder

**Half adder:** adds two bits $x, y$.
$$
S = x\oplus y,\qquad C = xy
$$

**Full adder:** adds three bits $x, y, z$ (the third is the incoming carry).
$$
S = x\oplus y\oplus z,\qquad C = xy + xz + yz
$$

A **parallel adder** chains $n$ full adders: the carry out of stage $i$ is the carry into stage $i+1$. With inputs $X$, $Y$ and carry-in $C_{in}$, it computes
$$
F = X + Y + C_{in}
$$

## Arithmetic operations from one adder

Everything comes from choosing what goes into the adder:

| Adder inputs | $C_{in}$ | Output | Name |
|---|---|---|---|
| $A$, $B$ | 0 | $F = A + B$ | addition |
| $A$, $B$ | 1 | $F = A + B + 1$ | addition with carry |
| $A$, $\overline{B}$ | 0 | $F = A + \overline{B}$ | A plus 1's complement of B |
| $A$, $\overline{B}$ | 1 | $F = A + \overline{B} + 1 = A - B$ | subtraction |
| $A$, 0 | 0 | $F = A$ | transfer A |
| $A$, 0 | 1 | $F = A + 1$ | increment A |
| $A$, all 1s | 0 | $F = A - 1$ | decrement A |
| $A$, all 1s | 1 | $F = A$ | transfer A |

The key identities, for $n$-bit numbers (mod $2^n$):
- $\overline{B} = 2^n - 1 - B$, so $A + \overline{B} = A - B - 1$, and $A + \overline{B} + 1 = A - B$.
- all 1s $= 2^n - 1 = -1$, so $A + \text{all 1s} = A - 1$.

\`\`\`fig
alu-arith-structure
\`\`\`

So an arithmetic circuit is a **combinational circuit** in front of a parallel adder. It produces $X$ and $Y$ from $A$, $B$ and the selection variables.

## The slides' arithmetic circuit (Fig. 9-8)

Keep $X_i = A_i$ and choose $Y_i$ with two selection bits (the "true/complement, one/zero" circuit, Fig. 9-7):

| $s_1$ | $s_0$ | $Y_i$ |
|---|---|---|
| 0 | 0 | 0 |
| 0 | 1 | $B_i$ |
| 1 | 0 | $B_i'$ |
| 1 | 1 | 1 |

$$
X_i = A_i,\qquad Y_i = B_is_0 + B_i's_1
$$

With $C_{in}$ as a third control, this gives eight operations (Table 9-1):

| $s_1$ | $s_0$ | $C_{in}$ | Y equals | Output | Function |
|---|---|---|---|---|---|
| 0 | 0 | 0 | 0 | $F = A$ | transfer A |
| 0 | 0 | 1 | 0 | $F = A + 1$ | increment A |
| 0 | 1 | 0 | $B$ | $F = A + B$ | add B to A |
| 0 | 1 | 1 | $B$ | $F = A + B + 1$ | add B to A plus 1 |
| 1 | 0 | 0 | $\overline{B}$ | $F = A + \overline{B}$ | add 1's complement of B to A |
| 1 | 0 | 1 | $\overline{B}$ | $F = A + \overline{B} + 1$ | add 2's complement of B to A |
| 1 | 1 | 0 | all 1s | $F = A - 1$ | decrement A |
| 1 | 1 | 1 | all 1s | $F = A$ | transfer A |

## When the output carry is 1 (Table 9-2)

For $n$-bit unsigned A and B:

| $s_1$ | $s_0$ | $C_{in}$ | Function | $C_{out} = 1$ if | Comment |
|---|---|---|---|---|---|
| 0 | 0 | 0 | $F = A$ | never | $C_{out}$ is always 0 |
| 0 | 0 | 1 | $F = A + 1$ | $A = 2^n - 1$ | then $F = 0$ |
| 0 | 1 | 0 | $F = A + B$ | $A + B \ge 2^n$ | unsigned overflow |
| 0 | 1 | 1 | $F = A + B + 1$ | $A + B \ge 2^n - 1$ | unsigned overflow |
| 1 | 0 | 0 | $F = A - B - 1$ | $A > B$ | if $C_{out} = 0$, $A \le B$ and $F$ is the 1's complement of $B - A$ |
| 1 | 0 | 1 | $F = A - B$ | $A \ge B$ | if $C_{out} = 0$, $A < B$ and $F$ is the 2's complement of $B - A$ |
| 1 | 1 | 0 | $F = A - 1$ | $A \ne 0$ | $C_{out} = 1$ except when $A = 0$ |
| 1 | 1 | 1 | $F = A$ | always | $C_{out}$ is always 1 |

**Why, for subtraction:** $A + \overline{B} + 1 = A + (2^n - B)$. This reaches $2^n$ (a carry out) exactly when $A \ge B$.

## Design example: adder/subtractor

**Problem (slide).** One selection variable $s$. When $s = 0$, compute $A + B$; when $s = 1$, compute $A - B$ by taking the 2's complement of B.

**Step 1: function specification.**
- $s = 0$: $X = A$, $Y = B$, $C_{in} = 0$.
- $s = 1$: $X = A$, $Y = \overline{B}$, $C_{in} = 1$.

**Step 2: truth table for one stage.**

| $s$ | $A_i$ | $B_i$ | $X_i$ | $Y_i$ |
|---|---|---|---|---|
| 0 | 0 | 0 | 0 | 0 |
| 0 | 0 | 1 | 0 | 1 |
| 0 | 1 | 0 | 1 | 0 |
| 0 | 1 | 1 | 1 | 1 |
| 1 | 0 | 0 | 0 | 1 |
| 1 | 0 | 1 | 0 | 0 |
| 1 | 1 | 0 | 1 | 1 |
| 1 | 1 | 1 | 1 | 0 |

**Step 3: simplified equations.**
$$
X_i = A_i,\qquad Y_i = B_i\oplus s,\qquad C_{in} = s
$$

So each stage needs one XOR gate in front of its full adder (Fig. 9-10, the 4-bit adder/subtractor).

## The logic circuit

One stage of a logic circuit can pick among four operations with a 4-to-1 multiplexer (Fig. 9-11):

| $s_1$ | $s_0$ | Output | Operation |
|---|---|---|---|
| 0 | 0 | $F_i = A_i + B_i$ | OR |
| 0 | 1 | $F_i = A_i\oplus B_i$ | XOR |
| 1 | 0 | $F_i = A_iB_i$ | AND |
| 1 | 1 | $F_i = A_i'$ | NOT |

\`\`\`fig
alu-combine
\`\`\`

The simplest ALU puts one stage of each circuit side by side and lets $s_2$ choose with a 2-to-1 multiplexer (Fig. 9-12). It works, but it duplicates hardware.

## The more efficient design

**Method (slides):**
1. Design the **arithmetic section** on its own.
2. Find the logic operations the arithmetic circuit already gives when **all input carries are 0**: then each stage outputs $F_i = X_i\oplus Y_i$.
3. **Modify** the arithmetic circuit to get the required logic operations.

**Step 2 for the slides' circuit** (Table 9-3). With $X_i = A_i$, $Y_i = s_0B_i + s_1B_i'$ and $C_i = 0$:

| $s_2$ | $s_1$ | $s_0$ | $X_i$ | $Y_i$ | $C_i$ | $F_i = X_i\oplus Y_i$ | Operation | Required |
|---|---|---|---|---|---|---|---|---|
| 1 | 0 | 0 | $A_i$ | 0 | 0 | $A_i$ | transfer A | OR |
| 1 | 0 | 1 | $A_i$ | $B_i$ | 0 | $A_i\oplus B_i$ | XOR | XOR |
| 1 | 1 | 0 | $A_i$ | $B_i'$ | 0 | $A_i\odot B_i$ | equivalence | AND |
| 1 | 1 | 1 | $A_i$ | 1 | 0 | $A_i'$ | NOT | NOT |

XOR and NOT come for free. OR and AND need changes.

**Step 3: fix OR.** For $s_2s_1s_0 = 100$, $Y_i = 0$, so $F_i = X_i$. Make $X_i = A_i + B_i$ in that case: add the term $s_2s_1's_0'B_i$ to $X_i$.

**Step 3: fix AND.** For $s_2s_1s_0 = 110$, $Y_i = B_i'$, so $F_i = X_i\oplus B_i'$. Make $X_i = A_i + B_i'$ in that case: add the term $s_2s_1s_0'B_i'$. Then
- if $B_i = 1$: $F_i = A_i\oplus0 = A_i = A_iB_i$;
- if $B_i = 0$: $F_i = 1\oplus1 = 0 = A_iB_i$.

So $F_i = A_iB_i$, the AND.

**Step 3: force the carries to 0** for every logic operation ($s_2 = 1$) by gating each carry with $s_2'$.

**Result:**
$$
X_i = A_i + s_2s_1's_0'B_i + s_2s_1s_0'B_i'
$$
$$
Y_i = s_0B_i + s_1B_i'
$$
$$
Z_i = s_2'C_i
$$

\`\`\`fig
alu-stage
\`\`\`

With $s_2 = 0$, the extra $X_i$ terms vanish and $Z_i = C_i$, so the ALU does the eight arithmetic operations of Table 9-1 (with $C_{in}$). With $s_2 = 1$, it does OR, XOR, AND, NOT.

## A general method for exam ALU designs

Exam tables give several required functions per selection code. For each code:

1. **Arithmetic codes:** write the function as $X + Y + C_{in}$ with $X, Y \in \{A, B, \overline{A}, \overline{B}, 0, \text{all 1s}\}$ and $C_{in} \in \{0, 1\}$. Useful forms:
   - $A - B - 1 = A + \overline{B}$
   - $A - 1 = A + \text{all 1s}$
   - $-A - B - 2 = \overline{A} + \overline{B}$ (since $\overline{A} = -A - 1$)
   - $B - A = B + \overline{A} + 1$
2. **Logic codes:** carries are forced to 0, so $F_i = X_i\oplus Y_i$. Choose $X_i, Y_i$ to give the operation; keep $Y_i$ the same as some arithmetic code when possible, to save gates.
3. Fill a table of $X_i$, $Y_i$ and $C_{in}$ (or $Z_i$) against the selection code.
4. Simplify each with a Karnaugh map over the selection variables (and $A_i$, $B_i$), using any don't-care codes.
5. Gate the carry chain: $Z_i = (\text{arithmetic select})\cdot C_i$, and $C_{in}$ is a function of the selection bits.

Every design on this site is checked by simulating the 4-bit ALU on all $16\times16$ input pairs for every selection code.

## The status register

After an ALU operation, four **status bits** (condition codes) record facts about the result (Fig. 9-14, 8-bit ALU):

1. **C (carry):** set if the output carry of the ALU is 1, cleared if it is 0.
2. **S (sign):** set if the highest-order bit of the result (the sign bit) is 1, cleared if it is 0.
3. **Z (zero):** set if the ALU output is all 0s: Z = 1 if the result is zero, 0 otherwise. It is the NOR of all the output bits.
4. **V (overflow):** set if the exclusive-OR of carries $C_8$ and $C_9$ is 1. This is the overflow condition for signed two's-complement numbers. For an 8-bit ALU, V is set if the result is greater than 127 or less than −128.

\`\`\`fig
alu-status
\`\`\`

## Comparing two numbers with the status bits

Subtract, $F = A - B$ (as $A + \overline{B} + 1$), and read the status bits.

**Unsigned A and B** (from Table 9-2's subtraction row):

| Relation | Condition |
|---|---|
| $A = B$ | $Z = 1$ |
| $A \ne B$ | $Z = 0$ |
| $A \ge B$ | $C = 1$ |
| $A > B$ | $C = 1$ and $Z = 0$, i.e. $CZ'$ |
| $A < B$ | $C = 0$ |
| $A \le B$ | $C' + Z$ |

**Signed (two's-complement) A and B.** The sign of $A - B$ is correct unless the subtraction overflowed, so the true "negative" flag is $S\oplus V$:

| Relation | Condition |
|---|---|
| $A = B$ | $Z = 1$ |
| $A < B$ | $S\oplus V = 1$ |
| $A \ge B$ | $S\oplus V = 0$ |
| $A > B$ | $(S\oplus V)'\,Z'$ |
| $A \le B$ | $(S\oplus V) + Z$ |

A comparator for A > B, A = B, A < B is then the subtractor plus a few gates on V, Z, S, C. Use the unsigned or signed column according to how the question says the numbers are represented.
`
