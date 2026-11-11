import { md } from "../md"

export const pipeliningNote = md`
## The idea: overlap

Pipelining is the laundry analogy (slide 2): wash, dry, fold and put away are four steps. Starting the next load as soon as the washer is free overlaps the loads. Each load still takes as long as before, but many more loads finish per hour. **Parallelism improves performance.**

## The five MIPS stages

\`\`\`fig
pipe-stages
\`\`\`

1. **IF:** instruction fetch from memory.
2. **ID:** instruction decode and register read.
3. **EX:** execute the operation or calculate an address.
4. **MEM:** access the memory operand.
5. **WB:** write the result back to a register.

One step per stage, one stage per clock cycle.

## Pipeline performance

Stage times (slide 5): 100 ps for register read or write, 200 ps for the other stages.

| Instruction | Instr fetch | Register read | ALU op | Memory access | Register write | Total |
|---|---|---|---|---|---|---|
| lw | 200 ps | 100 ps | 200 ps | 200 ps | 100 ps | 800 ps |
| sw | 200 ps | 100 ps | 200 ps | 200 ps | | 700 ps |
| R-format | 200 ps | 100 ps | 200 ps | | 100 ps | 600 ps |
| beq | 200 ps | 100 ps | 200 ps | | | 500 ps |

- **Single-cycle:** $T_c$ = 800 ps, the longest instruction.
- **Pipelined:** $T_c$ = 200 ps, the longest **stage**. Every stage takes one cycle, so the 100 ps register stages still take 200 ps.

$T_c$ here is the **time between instructions** finishing.

\`\`\`fig
pipe-three-lw
\`\`\`

## Pipeline speed-up

If all stages are balanced (all take the same time):
$$
\text{Time between instructions}_{\text{pipelined}} = \frac{\text{Time between instructions}_{\text{nonpipelined}}}{\text{Number of stages}}
$$
In the example that would be $800/5 = 160$ ps. The stages are not balanced (the longest is 200 ps), so the speed-up is less: $800/200 = 4$, not 5.

- The speed-up comes from **increased throughput**.
- **Latency** (the time for each instruction) does not decrease. With 200 ps stages a load takes $5\times200 = 1000$ ps, longer than its 800 ps single-cycle time.

**Example (slide 8): three loads.**

With $n$ instructions on a $k$-stage pipeline, the last one finishes after $k + (n-1)$ cycles: $k$ cycles to fill the pipeline, then one more per instruction.

**Step 1: pipelined time.**
$$
T_{\text{pipelined}} = (5 + 3 - 1)\times200\ \text{ps} = 7\times200 = 1400\ \text{ps}
$$

**Step 2: single-cycle time.**
$$
T_{\text{nonpipelined}} = 3\times800\ \text{ps} = 2400\ \text{ps}
$$

**Step 3: speed-up.**
$$
\text{Speed-up} = \frac{2400}{1400} \approx 1.714
$$

**Now add 1,000,000 more instructions.** Each extra instruction adds 200 ps pipelined and 800 ps single-cycle:
$$
T_{\text{pipelined}} = 1{,}000{,}000\times200 + 1400 = 200{,}001{,}400\ \text{ps}
$$
$$
T_{\text{nonpipelined}} = 1{,}000{,}000\times800 + 2400 = 800{,}002{,}400\ \text{ps}
$$
$$
\text{Speed-up} = \frac{800{,}002{,}400}{200{,}001{,}400} \approx 4.00
$$

With few instructions, filling the pipeline dominates. With many, the speed-up approaches the ratio of the clock periods, $800/200 = 4$.

## Pipelining and ISA design

The MIPS ISA was designed for pipelining (slide 9):
- **All instructions are 32 bits:** easy to fetch and decode in one cycle (x86 instructions are 1 to 17 bytes).
- **Few and regular formats:** decode and read registers in one step, because rs and rt are always in the same place.
- **Load/store addressing:** the address is calculated in the 3rd stage and memory accessed in the 4th.
- **Aligned memory operands:** a memory access takes only one cycle.

## Hazards

A **hazard** is a situation that prevents starting the next instruction in the next cycle.

| Hazard | Cause | Example |
|---|---|---|
| Structure | a required resource is busy | one memory for both instructions and data |
| Data | an instruction must wait for a previous one to complete its data read or write | \`add $s0, …\` then \`sub $t2, $s0, …\` |
| Control | the control action depends on a previous instruction | which instruction follows a branch |

**Structure hazards.** With a single memory, a load or store needs the memory for data in the same cycle another instruction is fetched. The fetch would have to stall for that cycle, causing a pipeline **bubble**. So pipelined datapaths need **separate instruction and data memories** (or separate instruction and data caches).

Data hazards and control hazards have their own topics next.

## The pipelined datapath

Information flows left to right through the stages, with two exceptions that flow right to left:
- **WB** writes the result back into the register file in the ID stage's hardware. This is the source of **data hazards**.
- **MEM** selects the next PC (branch target or PC + 4). This is the source of **control hazards**.

**Pipeline registers** between the stages hold everything produced in one cycle that a later stage needs. They are named for the two stages they separate. The slide works out their first sizes:

| Register | Holds | Size |
|---|---|---|
| IF/ID | instruction (32) + PC + 4 (32) | 64 bits |
| ID/EX | PC + 4, Read data 1, Read data 2, sign-extended immediate (4 × 32) | 128 bits |
| EX/MEM | branch target (32), Zero (1), ALU result (32), Read data 2 for a store (32) | 97 bits |
| MEM/WB | memory read data (32) + ALU result (32) | 64 bits |

These sizes grow as the design is completed: the control signals, and the destination register number for WB (see below), are also carried along.

## Following an instruction through the pipeline

**A load, stage by stage (slides 36–40):**
1. **IF:** read the instruction at PC from instruction memory into IF/ID; compute PC + 4 and save it in IF/ID.
2. **ID:** read rs (and rt) from the register file; sign-extend the immediate; put all of them (and PC + 4) into ID/EX.
3. **EX:** add the base register and the sign-extended offset in the ALU; put the address in EX/MEM.
4. **MEM:** read data memory at that address into MEM/WB.
5. **WB:** write the data from MEM/WB into the register file.

**A store** does the same in IF, ID and EX. In MEM it writes Read data 2 (carried along in ID/EX and EX/MEM) to memory, and in WB it does nothing.

**The corrected datapath for load (slides 44–45).** In WB, the register number used for the write must be the **load's** rt, but by then IF/ID holds a later instruction. So the destination register number is passed down through ID/EX, EX/MEM and MEM/WB with the instruction, and WB uses it from MEM/WB.

**What \`lw $6, 36($1)\` and \`add $5, $5, $5\` do in EX and MEM:**
- \`lw\`: EX adds \`$1\` + 36 to form the address; MEM reads the word at that address.
- \`add\`: EX adds \`$5\` + \`$5\`; MEM does nothing (the result just passes through to MEM/WB).

**What is stored in IF/ID and ID/EX:**
- IF/ID: the fetched instruction and PC + 4.
- ID/EX: PC + 4, the two register values read (Read data 1, Read data 2), the sign-extended immediate, the register numbers rt and rd (and rs, for forwarding), and the control signals for EX, MEM and WB.

## Pipeline diagrams

- A **multi-clock-cycle** pipeline diagram plots instructions (rows) against clock cycles (columns). The "traditional" form writes the stage name in each cell, as on this site. It shows resource use over time.
- A **single-clock-cycle** diagram shows the whole datapath in one cycle, with the instruction occupying each stage. It shows the state of the pipeline at one moment.

## Pipelined control

Control signals are derived from the instruction, as in the single-cycle implementation, in ID. They are then carried along in the pipeline registers and used in the stage that needs them:

| Stage | Control needed |
|---|---|
| IF, ID | none special (they do the same for every instruction) |
| EX | RegDst, ALUOp, ALUSrc |
| MEM | Branch, MemRead, MemWrite |
| WB | MemtoReg, RegWrite |

So ID/EX carries the EX, MEM and WB groups; EX/MEM carries MEM and WB; MEM/WB carries WB. RegWrite is generated in ID but used only in WB, with the instruction's own destination register number.

## Summary

- Pipelining improves performance by **increasing instruction throughput**: it executes several instructions in parallel, while each one has the same latency.
- It is subject to hazards: structure, data and control.
- Instruction-set design affects how complex the pipeline is.
`
