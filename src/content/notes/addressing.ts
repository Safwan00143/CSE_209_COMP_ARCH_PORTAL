import { md } from "../md"

export const addressingNote = md`
## 32-bit constants

Most constants are small, and a 16-bit immediate is enough for them. For the occasional 32-bit constant, MIPS has **load upper immediate**:

\`\`\`
lui rt, constant     # rt = constant << 16: upper half = constant, lower half cleared to 0
\`\`\`

**Method: load any 32-bit constant in two instructions.**
1. Split the constant into its upper 16 bits and lower 16 bits.
2. \`lui\` the upper half into the register.
3. \`ori\` the lower half into the same register (ori zero-extends its immediate, so the upper half is untouched).

**Example (slide).** Load 0000 0000 0111 1101 0000 1001 0000 0000 into \`$s0\`.
- Upper half: 0000 0000 0111 1101 = 61.
- Lower half: 0000 1001 0000 0000 = 2304.

\`\`\`
lui $s0, 61            # $s0 = 0000 0000 0111 1101 0000 0000 0000 0000
ori $s0, $s0, 2304     # $s0 = 0000 0000 0111 1101 0000 1001 0000 0000
\`\`\`

\`\`\`fig
isa-lui-ori
\`\`\`

Use \`ori\`, not \`addi\`, for the lower half. \`addi\` sign-extends: a lower half of 8000 (hex) or more would subtract from the upper half.

The assembler does this for you when an instruction uses a constant that does not fit in 16 bits. It builds the constant in \`$at\` (register 1, the assembler temporary). For example, \`if (x > y + 131075)\` needs 131075 = 0002 0003 (hex) in a register first: \`lui $at, 2\` then \`ori $at, $at, 3\`.

## Branch addressing (PC-relative)

\`\`\`fig
isa-i-format
\`\`\`

A branch instruction holds an opcode, two registers and a 16-bit target field. Most branch targets are near the branch, forward or backward, so the target is given **relative to the PC**:
$$
\text{Target address} = (\text{PC} + 4) + \text{offset}\times4
$$
The PC has already been incremented by 4 when the offset is added, so the offset counts **words** from the instruction after the branch.

**To encode a branch:**
$$
\text{offset} = \frac{\text{Target} - (\text{PC}_{\text{branch}} + 4)}{4}
$$

**Reach.** The offset is a signed 16-bit number, $-32768$ to $+32767$ words. So a branch reaches
$$
(\text{PC}+4) - 2^{17}\ \text{bytes} \quad\text{to}\quad (\text{PC}+4) + 2^{17} - 4\ \text{bytes}
$$
which is about ±128 KB around the branch.

## Jump addressing (pseudodirect)

\`\`\`fig
isa-j-format
\`\`\`

Jump targets (\`j\`, \`jal\`) could be anywhere in the text segment, so the instruction holds as much of the address as it can: a 26-bit word address.
$$
\text{Target address} = \text{PC}_{31\ldots28} : (\text{address}\times4)
$$
That is: the upper 4 bits of PC + 4, then the 26-bit field, then 00. (The slide writes $\text{PC}_{31\ldots28}$; it is the PC after the increment.)

- The 2 low bits are always 00 because instructions are word-aligned, so they need not be stored.
- The upper 4 bits come from the PC because 26 + 2 = 28 bits are all there is room for. So a jump reaches any word in the **same 256 MB block** ($2^{28}$ bytes) as PC + 4, and no further.

**To encode a jump:** address field = (Target ÷ 4) mod $2^{26}$, which is the same as Target bits 27–2. This is only valid if Target bits 31–28 equal (PC + 4) bits 31–28.

**Can one jump reach a target?** Compare the top hex digit of the target with that of PC + 4. Equal: yes. Different: no, use \`jr\` with the full address built in a register (\`lui\` / \`ori\`).

**Can one branch reach a target?** Compute $(\text{Target} - (\text{PC}+4))/4$. If it is an integer between $-32768$ and $32767$: yes. Otherwise: no.

## Target addressing example

The \`while (save[i] == k)\` loop from the previous topic, loaded at address 80000 (slide):

| Address | Instruction | op | rs | rt | rd | shamt | funct |
|---|---|---|---|---|---|---|---|
| 80000 | \`Loop: sll $t1, $s3, 2\` | 0 | 0 | 19 | 9 | 2 | 0 |
| 80004 | \`add $t1, $t1, $s6\` | 0 | 9 | 22 | 9 | 0 | 32 |
| 80008 | \`lw $t0, 0($t1)\` | 35 | 9 | 8 | 0 (constant) | | |
| 80012 | \`bne $t0, $s5, Exit\` | 5 | 8 | 21 | 2 (offset) | | |
| 80016 | \`addi $s3, $s3, 1\` | 8 | 19 | 19 | 1 (constant) | | |
| 80020 | \`j Loop\` | 2 | 20000 (address field) | | | | |
| 80024 | \`Exit:\` | | | | | | |

**The bne offset.** Exit is at 80024. The branch is at 80012, so PC + 4 = 80016.
$$
\text{offset} = \frac{80024 - 80016}{4} = 2
$$

**The j address field.** Loop is at 80000.
$$
\text{address} = \frac{80000}{4} = 20000
$$
The upper 4 bits of 80024 (PC + 4 of the jump) are 0, the same as for 80000, so the jump reaches it.

The R-type rows follow the field order op, rs, rt, rd, shamt, funct. For \`sll\`, rs is unused (0), rt is the source, rd the destination, and shamt = 2.

The slide prints 4 in the shamt column of the \`sll\` row. The instruction shifts by 2 (multiplying i by 4), and shamt holds the shift amount, so the field is 2.

## Branching far away

If a branch target is too far to encode in the 16-bit offset, the **assembler rewrites the code** with the opposite branch around a jump (slide):

\`\`\`
      beq $s0, $s1, L1
\`\`\`

becomes

\`\`\`
      bne $s0, $s1, L2     # opposite condition: skip the jump
      j   L1               # 26-bit jump reaches much further
L2:
\`\`\`

The pair behaves exactly like the original branch: if the registers are equal, \`bne\` falls through to \`j L1\`; if not, it skips to L2. The jump still has the 256 MB limit; beyond that the assembler would load the address into a register and use \`jr\`.

**Two exam variants.**
- *"\`beq $s0, $s1, 30500\` at address 005000: what is the problem?"* A branch's 16-bit field is a word offset from PC + 4, not an absolute address, and it only reaches about ±128 KB. The assembler must turn the target into an offset; if the target is out of range, it uses the bne/j rewrite. (The full answer, with the numbers, is in the 2018-19 paper's solution.)
- *"Branch at Here to there, where there is the next instruction"* is fine: offset 0.

## The five addressing modes

An **addressing mode** is a way an instruction finds its operands or target.

\`\`\`fig
isa-mode-immediate
isa-mode-register
isa-mode-base
isa-mode-pcrel
isa-mode-pseudo
\`\`\`

| Mode | Operand or target | Example |
|---|---|---|
| 1. Immediate | the 16-bit constant in the instruction | \`addi $s1, $s2, 100\` |
| 2. Register | a register named in the instruction | \`add $s1, $s2, $s3\` |
| 3. Base (displacement) | memory at register + 16-bit constant | \`lw $s1, 100($s2)\` |
| 4. PC-relative | (PC + 4) + 16-bit offset × 4 | \`beq $s1, $s2, L\` |
| 5. Pseudodirect | $\text{PC}_{31\ldots28}$ : 26-bit address : 00 | \`j L\`, \`jal L\` |

**The calculation for each mode:**
1. **Immediate:** operand = sign-extended constant (zero-extended for \`andi\`, \`ori\`).
2. **Register:** operand = Reg[rs] (and Reg[rt]).
3. **Base:** address = Reg[rs] + sign-extend(constant); the operand is memory at that address (a byte, halfword or word).
4. **PC-relative:** target = (PC + 4) + sign-extend(offset) × 4.
5. **Pseudodirect:** target = (PC + 4)[31:28] : address : 00.

A single instruction can use more than one mode: \`lw $s1, 100($s2)\` uses register addressing for \`$s1\` and base addressing for the memory operand.
`
