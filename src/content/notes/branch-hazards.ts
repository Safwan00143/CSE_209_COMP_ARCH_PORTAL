import { md } from "../md"
import { oneBit, predictorTable, runPredictor, type Outcome } from "@/lib/predictor"

/* Inner loop of 4 iterations, run twice: the inner branch is taken 3 times then not taken. */
const innerTwice: Outcome[] = ["T", "T", "T", "N", "T", "T", "T", "N"]
const oneBitTrace = runPredictor(oneBit("T"), innerTwice)

export const branchHazardsNote = md`
## Control hazards

A branch decides the flow of control, so fetching the next instruction depends on the branch outcome. The pipeline cannot always fetch the correct instruction: when the next fetch happens, the branch is still in its ID stage.

In the MIPS pipeline the fix is to compare the registers and compute the target **early**: add hardware so that both happen in the ID stage.

## How much a branch costs

**Decided in MEM (the basic pipelined datapath, slide 77).** The branch outcome and target are known only at the end of MEM. By then three more instructions have been fetched (in IF, ID and EX). If the branch is taken, they must be **flushed**: their control values are set to 0 so they do nothing. Penalty: **3 cycles**.

**Decided in ID (slides 27 and 78).** With enough extra hardware to test the registers, calculate the branch address and update the PC during the second stage, only one instruction (the one in IF) has been fetched when the branch is decided. Penalty: **1 cycle** if the branch is taken.

\`\`\`fig
bh-taken
\`\`\`

**The hardware added to ID (slide 78, "reducing branch delay"):**
- the **branch target adder** (with its shift-left-2), moved from EX to ID;
- a **register comparator** (=), so equality is tested without the ALU;
- the **IF.Flush** control, which zeroes the instruction field of IF/ID, turning the wrongly fetched instruction into a nop;
- **forwarding into ID**, so the comparator can use values still in later pipeline registers (see "data hazards for branches").

## Branch prediction

Longer pipelines cannot readily decide the branch outcome early, and the stall penalty becomes unacceptable. So **predict** the outcome, and stall only if the prediction is wrong.

**MIPS: predict not taken.** Fetch the instruction after the branch with no delay.
- Prediction correct: no penalty.
- Prediction incorrect: flush the fetched instruction and fetch the target (1 cycle with the branch decided in ID).

**Static prediction** uses typical branch behaviour:
- loop branches (backward) are usually taken: **predict backward branches taken**;
- if-statement branches (forward) are often not: **predict forward branches not taken**.

**Dynamic prediction:** the hardware measures actual branch behaviour, e.g. records each branch's recent history, and assumes the trend continues. When wrong, it stalls while refetching and updates the history.

## Delayed branch

The MIPS solution in the original design (slide 31): **always execute the next sequential instruction** after a branch, the **branch delay slot**. A taken branch is always delayed by one instruction. The compiler (or assembler) hides the delay by moving an independent instruction into the slot, so the slot does useful work whether or not the branch is taken.

## Cycle counts with branches

For a branch decided in ID with predict not taken:
$$
\text{Total cycles} = n + 4 + \text{data stalls} + \text{taken branches}\times1
$$
where $n$ counts the instructions **actually executed** (on the path taken). For a branch decided in MEM, each taken branch costs 3.

## Data hazards for branches

Deciding the branch in ID moves the **use** of its registers earlier (to ID instead of EX), so it needs its operands earlier.

| The comparison register is written by | Stalls (branch in ID, with forwarding) |
|---|---|
| the 2nd or 3rd preceding ALU instruction | 0: forward to ID |
| the immediately preceding ALU instruction | 1 |
| the 2nd preceding load | 1 |
| the immediately preceding load | 2 |

\`\`\`fig
bh-alu-2nd
bh-alu-1st
bh-load-2nd
bh-load-1st
\`\`\`

**Why:** an ALU result exists at the end of the producer's EX; a load's data at the end of its MEM. The branch compares in ID, so its ID must come after that cycle.

**Examples for each case:**

\`\`\`
# no stall: $1 from the 2nd preceding ALU instruction, $4 from the 3rd
add  $4, $5, $6
add  $1, $2, $3
add  $7, $8, $9
beq  $1, $4, target

# one stall: $1 from the immediately preceding ALU instruction
add  $1, $2, $3
beq  $1, $4, target

# one stall: $1 from the 2nd preceding load
lw   $1, 0($2)
add  $4, $5, $6
beq  $1, $4, target

# two stalls: $1 from the immediately preceding load
lw   $1, 0($2)
beq  $1, $0, target
\`\`\`

## Dynamic branch prediction

In deeper and superscalar pipelines the branch penalty is more significant, so use dynamic prediction (slide 82):
- a **branch prediction buffer** (branch history table), indexed by recent branch instruction addresses, stores the outcome (taken or not taken);
- to execute a branch, check the table and expect the same outcome; start fetching from the fall-through or the target;
- if wrong, flush the pipeline and flip the prediction.

## The 1-bit predictor's shortcoming

A 1-bit predictor remembers only the last outcome. **Inner loop branches are mispredicted twice** (slide 83):

\`\`\`
outer: …
       …
inner: …
       …
       beq …, …, inner
       …
       beq …, …, outer
\`\`\`

1. On the **last iteration** of the inner loop, the branch falls through but was predicted taken (it was taken last time): **mispredict**.
2. The next time round the outer loop, on the **first iteration** of the inner loop, the branch is taken but is predicted not taken (it fell through last time): **mispredict** again.

**Trace:** an inner loop of 4 iterations, executed twice. The inner branch is taken 3 times, then not taken. Starting from "taken":

${predictorTable(oneBitTrace.steps)}

${oneBitTrace.correct} of ${innerTwice.length} correct. After the first pass, every pass through the inner loop costs **two** mispredictions, although the branch changes direction only once per pass.

**The fix:** a predictor that changes its prediction only after two mispredictions in a row: the 2-bit predictor.

## The 2-bit predictor

\`\`\`fig
bh-2bit
\`\`\`

Four states: two predict taken (strong ST, weak WT), two predict not taken (weak WN, strong SN). Each taken outcome moves one step towards ST; each not-taken outcome one step towards SN. A single unusual outcome (the loop exit) moves a strong state only to the weak state on the same side, so the prediction does not flip.

In the nested loop, the inner branch sits in ST; the exit moves it to WT, which still predicts taken, so the next pass's first iteration is predicted correctly. Only **one** misprediction per pass.

**Method for an accuracy question.**
1. Write the starting state.
2. For each outcome: write the prediction of the current state, compare with the outcome, then move to the next state.
3. Accuracy = correct predictions ÷ predictions.
4. For "steady state", keep repeating the pattern until the sequence of states at the start of each repetition repeats; the accuracy over one repetition from then on is the steady-state accuracy.

## Calculating the branch target

Even with a predictor, the target address still has to be calculated, which happens in ID. So a branch predicted taken still costs **1 cycle**: the instruction after it has already been fetched by the time the target is known (slide 85). This is the "even with a perfect predictor, a 1-cycle penalty for a taken branch".

The fix is a **branch target buffer**: a cache of target addresses, indexed by the PC when the instruction is fetched. If it hits and the instruction is a branch predicted taken, the target can be fetched immediately, in the next cycle, with no penalty.

## Jumps in the pipeline

A jump (\`j\`, \`jal\`) is recognised only when it is decoded in ID. By then the next sequential instruction has been fetched and must be flushed: a **1-cycle penalty** for every jump in this pipeline. The same branch target buffer idea removes it: an entry for the jump, found in IF, supplies the target immediately.
`
