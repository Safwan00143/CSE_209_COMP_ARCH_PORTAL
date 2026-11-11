import { md } from "../md"
import { CONTROL, type Controls } from "@/lib/datapath"

const SIGNALS: (keyof Controls)[] = ["RegDst", "ALUSrc", "MemtoReg", "RegWrite", "MemRead", "MemWrite", "Branch", "ALUOp1", "ALUOp0", "Jump"]
const controlTable = [
  `| Instruction | ${SIGNALS.join(" | ")} |`,
  `|---|${SIGNALS.map(() => "---").join("|")}|`,
  ...(Object.keys(CONTROL) as (keyof typeof CONTROL)[]).map((k) => `| ${k} | ${SIGNALS.map((s) => CONTROL[k][s]).join(" | ")} |`),
].join("\n")

export const singleCycleNote = md`
## Two implementations of MIPS

CPU performance depends on:
- **instruction count**, fixed by the ISA and the compiler;
- **CPI and cycle time**, fixed by the CPU hardware.

Chapter 4 builds two MIPS implementations: a simplified **single-cycle** version, then a more realistic **pipelined** one. Both handle a simple subset that shows most aspects:
- memory reference: \`lw\`, \`sw\`;
- arithmetic/logical: \`add\`, \`sub\`, \`and\`, \`or\`, \`slt\`;
- control transfer: \`beq\`, \`j\`.

## How an instruction executes

1. PC → instruction memory: fetch the instruction.
2. Register numbers → register file: read the registers.
3. Depending on the instruction class, use the ALU to calculate:
   - the arithmetic result;
   - the memory address, for a load or store;
   - the comparison, for a branch.
4. Access data memory, for a load or store.
5. PC ← the target address, or PC + 4.

Multiplexers are needed wherever two sources meet: wires cannot just be joined together.

## Logic design basics

- Information is binary: low voltage = 0, high voltage = 1, one wire per bit; multi-bit values travel on multi-wire buses.
- **Combinational elements** operate on data; the output is a function of the input only.
  - AND gate: $Y = A \cdot B$.
  - Multiplexer: $Y = S\ ?\ I_1 : I_0$.
  - Adder: $Y = A + B$.
  - ALU: $Y = F(A, B)$.
- **State (sequential) elements** store information.
  - A **register** uses the clock to decide when to update. It is **edge-triggered**: it updates when Clk changes from 0 to 1.
  - A register with a **write control** updates on the clock edge only when Write is 1. It is used when the stored value is needed later.

**Clocking methodology.** Combinational logic transforms data during a clock cycle, between clock edges: its input comes from state elements and its output goes to state elements. The **longest delay determines the clock period**.

## Building the datapath

The **datapath** is the set of elements that process data and addresses in the CPU: registers, ALUs, muxes, memories. It is built up piece by piece.

**Instruction fetch.** The 32-bit PC register addresses the instruction memory. An adder increments the PC by 4 for the next instruction.

**R-format instructions.** Read two register operands (rs, rt), perform the arithmetic/logical operation, write the register result (rd).

**Load/store instructions.**
- Read the register operands.
- Calculate the address from the 16-bit offset: use the ALU, but sign-extend the offset first.
- Load: read memory and update a register.
- Store: write a register value to memory.

**Branch instructions.**
- Read the register operands.
- Compare them: use the ALU to subtract and check its **Zero** output.
- Calculate the target address:
  - sign-extend the displacement;
  - shift left 2 places (it is a word displacement);
  - add to PC + 4, which instruction fetch has already calculated.

"Shift left 2" needs no logic gates: it just re-routes wires. Sign extension just replicates the sign-bit wire.

**Composing the elements.** The first-cut datapath does an instruction in **one clock cycle**.
- Each datapath element can only do one function per cycle. So it needs **separate instruction and data memories**: an instruction is read and data are accessed in the same cycle. It also needs separate adders for PC + 4 and the branch target, besides the ALU.
- Use multiplexers where alternate data sources are used for different instructions.

## The full datapath

\`\`\`fig
dp-full
\`\`\`

The multiplexers and what selects them:

| Mux | Input 0 | Input 1 | Select |
|---|---|---|---|
| Write register | rt (bits 20–16) | rd (bits 15–11) | RegDst |
| Second ALU operand | Read data 2 | sign-extended bits 15–0 | ALUSrc |
| Register write data | ALU result | memory Read data | MemtoReg |
| Next PC (branch) | PC + 4 | branch target | PCSrc = Branch AND Zero |
| Next PC (jump) | output of the branch mux | jump address | Jump |

## ALU control

The ALU is used for:
- load/store: F = add (the address);
- branch: F = subtract (the comparison);
- R-type: F depends on the funct field.

| ALU control | Function |
|---|---|
| 0000 | AND |
| 0001 | OR |
| 0010 | add |
| 0110 | subtract |
| 0111 | set on less than |
| 1100 | NOR |

The main control produces a 2-bit **ALUOp** from the opcode. Combinational logic (the ALU control unit) then derives the 4-bit ALU control from ALUOp and funct:

| Opcode | ALUOp | Operation | funct | ALU function | ALU control |
|---|---|---|---|---|---|
| lw | 00 | load word | XXXXXX | add | 0010 |
| sw | 00 | store word | XXXXXX | add | 0010 |
| beq | 01 | branch equal | XXXXXX | subtract | 0110 |
| R-type | 10 | add | 100000 | add | 0010 |
| R-type | 10 | subtract | 100010 | subtract | 0110 |
| R-type | 10 | AND | 100100 | AND | 0000 |
| R-type | 10 | OR | 100101 | OR | 0001 |
| R-type | 10 | set on less than | 101010 | set on less than | 0111 |

This two-level decoding (main control, then ALU control) keeps the main control small and fast.

## The main control unit

Control signals are derived from the instruction. The fields are in the same place in every format:

| Format | 31:26 | 25:21 | 20:16 | 15:11 | 10:6 | 5:0 |
|---|---|---|---|---|---|---|
| R-type | 0 | rs | rt | rd | shamt | funct |
| Load/Store | 35 or 43 | rs | rt | address (15:0) | | |
| Branch | 4 | rs | rt | address (15:0) | | |

- The opcode (31:26) always goes to the control unit.
- rs (25:21) is always read.
- rt (20:16) is read, except for a load.
- The register written is rt for a load and rd for an R-type.
- The 16-bit address is sign-extended and added (load/store), or sign-extended, shifted and added to PC + 4 (branch).

**The seven control signals (slide 27)**

| Signal | Effect when deasserted (0) | Effect when asserted (1) |
|---|---|---|
| RegDst | the Write register number comes from rt (bits 20–16) | it comes from rd (bits 15–11) |
| RegWrite | none | the register on the Write register input is written with the Write data |
| ALUSrc | the second ALU operand is Read data 2 | it is the sign-extended lower 16 bits of the instruction |
| PCSrc | PC = PC + 4 | PC = the branch target |
| MemRead | none | data memory at the address is put on Read data |
| MemWrite | none | data memory at the address is replaced by Write data |
| MemtoReg | the register Write data comes from the ALU | it comes from data memory |

PCSrc is not a direct output of the control unit: it is **Branch AND Zero**.

**Control values for each instruction**

${controlTable}

X means "don't care": the value does not matter because nothing uses it. For \`sw\` and \`beq\`, RegWrite = 0, so the write-register number (RegDst) and write data (MemtoReg) are never used. Don't-cares let the control logic be smaller, but a signal that **writes state** (RegWrite, MemWrite) must never be X.

ALUOp is two bits, ALUOp1 ALUOp0: 10 for R-type, 00 for lw/sw, 01 for beq.

## Instruction by instruction

\`\`\`fig
dp-r
dp-lw
dp-sw
dp-beq
\`\`\`

| Unit | R-type | lw | sw | beq | j |
|---|---|---|---|---|---|
| Instruction memory | ✓ | ✓ | ✓ | ✓ | ✓ |
| Register file read | rs, rt | rs | rs, rt | rs, rt | |
| Sign-extend | | ✓ | ✓ | ✓ | |
| ALU | funct op | add | add | subtract | |
| Data memory | | read | write | | |
| Register file write | rd | rt | | | |
| PC + 4 adder | ✓ | ✓ | ✓ | ✓ | ✓ |
| Branch adder, shift left 2 | | | | ✓ | |
| Jump shift left 2 | | | | | ✓ |

## Implementing jumps

The jump format is opcode 2 in bits 31:26 and a 26-bit address in bits 25:0. A jump uses a **word address**, so it updates the PC with the concatenation of:
- the top 4 bits of the old PC (PC + 4);
- the 26-bit jump address;
- 00.

It needs an extra control signal, **Jump**, decoded from the opcode, and one more multiplexer in front of the PC.

\`\`\`fig
dp-j
\`\`\`

**Why upper 4 bits of PC + 4.** 26 address bits + 2 zero bits make only 28 bits. The missing top 4 come from the current PC, so a jump stays within the same 256 MB region.

**Why PC + 4, not PC + 1.** Memory is byte-addressed and every instruction is 4 bytes, so the next instruction is 4 addresses on.

## Performance issues

- The **longest delay determines the clock period**.
- The critical path is the load instruction: instruction memory → register file → ALU → data memory → register file.
- It is not feasible to vary the period for different instructions.
- This violates the design principle **make the common case fast**: every instruction takes as long as the slowest one.
- Pipelining will improve performance.

**Example (stage times from the slides' pipelining section).** Instruction fetch 200 ps, register read 100 ps, ALU operation 200 ps, memory access 200 ps, register write 100 ps.

| Instruction | Fetch | Reg read | ALU | Memory | Reg write | Total |
|---|---|---|---|---|---|---|
| lw | 200 | 100 | 200 | 200 | 100 | 800 ps |
| sw | 200 | 100 | 200 | 200 | | 700 ps |
| R-format | 200 | 100 | 200 | | 100 | 600 ps |
| beq | 200 | 100 | 200 | | | 500 ps |

The single-cycle clock must be 800 ps, set by \`lw\`, even though \`beq\` needs only 500 ps.

## Adding instructions to the datapath

A common exam task: extend the datapath for more instructions. For each one, ask four questions:
1. Which **registers** does it read, and which does it write?
2. What does the **ALU** do?
3. What does it do with **memory**?
4. What is the **next PC**?

Then add the smallest set of muxes, wires and control signals, and give the control values.

| Instruction | What it needs |
|---|---|
| \`addi rt, rs, imm\` | Nothing new: RegDst = 0, ALUSrc = 1, MemtoReg = 0, RegWrite = 1, ALUOp = 00 (add), Branch = MemRead = MemWrite = Jump = 0. |
| \`slt rd, rs, rt\` | Nothing new: it is an R-type with funct 101010, and the ALU control already gives 0111. |
| \`bne rs, rt, L\` | A new control signal BNE. The branch is taken when Branch·Zero + BNE·Zero′ = 1, so add an inverter on Zero, a second AND gate and an OR gate feeding PCSrc. ALUOp = 01 (subtract). |
| \`jr rs\` | A new 2-to-1 mux in front of the PC selecting Read data 1, with a control signal JumpReg. jr is R-type (funct 8), so JumpReg comes from the opcode-and-funct decoding. RegWrite = 0. |
| \`jal L\` | Jump = 1 as for j. It must also write PC + 4 into \`$ra\` (31): widen the RegDst mux with a third input, the constant 31, and the MemtoReg mux with a third input, PC + 4. RegWrite = 1. |
| \`lui rt, imm\` | The register must get imm shifted left 16 with 0s below: add a "shift left 16" unit on the immediate and a new input on the MemtoReg mux (or a new ALU operation). RegDst = 0, RegWrite = 1. |
| \`ori rt, rs, imm\` | The immediate must be zero-extended, not sign-extended: add a zero-extend path selected by a new signal. The ALU must OR, so ALUOp needs a new code (a third ALUOp bit, e.g. 11 → OR). |

## Why the single-cycle design is inefficient

- The clock cycle must fit the slowest instruction (\`lw\`), so the fast ones (R-type, \`beq\`) waste most of their cycle.
- Each unit can be used only once per cycle, so hardware is duplicated: two memories and three adders.
- Long instructions, such as floating-point multiply, would stretch the clock for everything.

Pipelining, the next topic, fixes the first two.
`
