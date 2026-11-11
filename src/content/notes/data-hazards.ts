import { md } from "../md"

export const dataHazardsNote = md`
## The problem

An instruction depends on a previous instruction's result before that result is written back (slide 12):

\`\`\`
add $s0, $t0, $t1
sub $t2, $s0, $t3     # needs $s0, which add writes only in WB
\`\`\`

\`add\` writes \`$s0\` in WB (cycle 5). \`sub\` reads it in ID (cycle 3). Without help, \`sub\` must wait.

**The register file trick.** A register written in a cycle is written in the **first half** of the cycle and read in the **second half**. So an instruction in ID can read a value that WB writes in the same cycle. Without forwarding, the consumer's ID must be no earlier than the producer's WB.

\`\`\`fig
dh-add-sub-nofwd
\`\`\`

Here \`sub\` stalls two cycles: its ID moves from cycle 3 to cycle 5, the cycle \`add\` writes back.

## Forwarding (bypassing)

Use the result as soon as it is **computed**, without waiting for it to be stored in a register. This needs extra connections in the datapath.

\`add\`'s result exists at the end of its EX stage. Send it from the EX/MEM pipeline register straight to the ALU input in \`sub\`'s EX stage:

\`\`\`fig
dh-add-sub-fwd
\`\`\`

No stall.

## Load-use hazards

Forwarding cannot always avoid a stall: a value cannot be forwarded **backward in time**. A load's data exists only at the end of its MEM stage, but the next instruction wants it at the start of its EX stage, which is the same cycle.

\`\`\`fig
dh-load-use
\`\`\`

One stall cycle is unavoidable. After it, the value is forwarded from MEM/WB.

## When a hazard needs a stall: the rules

Let the producer be the latest earlier instruction writing a register the consumer reads.

| Producer | Distance (consumer is the k-th after it) | Without forwarding | With forwarding |
|---|---|---|---|
| ALU instruction | 1st | 2 stalls | 0 (EX/MEM → EX) |
| ALU instruction | 2nd | 1 stall | 0 (MEM/WB → EX) |
| ALU instruction | 3rd | 0 (register file, write/read in one cycle) | 0 |
| Load | 1st | 2 stalls | **1 stall**, then MEM/WB → EX |
| Load | 2nd | 1 stall | 0 (MEM/WB → EX) |
| Load | 3rd | 0 | 0 |

"Distance" counts instructions as issued, so stalls already inserted earlier can increase it.

**Counting cycles.** For $n$ instructions in a 5-stage pipeline with no stalls, the last finishes in cycle $5 + (n-1) = n + 4$. Each stall cycle adds one:
$$
\text{Total cycles} = n + 4 + \text{stalls}
$$
$$
\text{CPI} = \frac{\text{Total cycles}}{n}\quad\text{(or }\approx 1 + \text{stalls}/n\text{ for long programs)}
$$

## Code scheduling to avoid stalls

Reorder the code so that a load's result is not used by the next instruction (slide 22). C code: \`A = B + E; C = B + F;\` with offsets A(12), B(0), E(4), C(16), F(8) from \`$t0\`.

\`\`\`
lw  $t1, 0($t0)      # B
lw  $t2, 4($t0)      # E
add $t3, $t1, $t2    # stall: uses $t2 from the previous load
sw  $t3, 12($t0)     # A
lw  $t4, 8($t0)      # F
add $t5, $t1, $t4    # stall: uses $t4 from the previous load
sw  $t5, 16($t0)     # C
\`\`\`

\`\`\`fig
dh-sched-before
\`\`\`

7 instructions, 2 stalls: $7 + 4 + 2 = 13$ cycles.

Move the third load up, before the first add:

\`\`\`
lw  $t1, 0($t0)
lw  $t2, 4($t0)
lw  $t4, 8($t0)      # moved up
add $t3, $t1, $t2    # $t2 is now 2 instructions after its load: forwarded, no stall
sw  $t3, 12($t0)
add $t5, $t1, $t4    # $t4 is 3 after its load: no stall
sw  $t5, 16($t0)
\`\`\`

\`\`\`fig
dh-sched-after
\`\`\`

No stalls: $7 + 4 = 11$ cycles.

**Rules for legal reordering.** A move is allowed only if it keeps every true dependence: an instruction must stay after the instructions whose results it reads, a register must not be overwritten before its old value has been read, and loads and stores to the same address keep their order.

## Detecting the need to forward

Pass the register numbers along the pipeline. In EX, the ALU's operand register numbers are \`ID/EX.RegisterRs\` and \`ID/EX.RegisterRt\`. A data hazard exists when:

| Case | Condition | Forward from |
|---|---|---|
| 1a | EX/MEM.RegisterRd = ID/EX.RegisterRs | EX/MEM |
| 1b | EX/MEM.RegisterRd = ID/EX.RegisterRt | EX/MEM |
| 2a | MEM/WB.RegisterRd = ID/EX.RegisterRs | MEM/WB |
| 2b | MEM/WB.RegisterRd = ID/EX.RegisterRt | MEM/WB |

But only if:
- the forwarding instruction **will write a register**: \`EX/MEM.RegWrite\`, \`MEM/WB.RegWrite\`;
- its Rd is **not** \`$zero\`: \`EX/MEM.RegisterRd ≠ 0\`, \`MEM/WB.RegisterRd ≠ 0\`.

(RegisterRd here means the instruction's destination register number, whichever field it came from.)

**Example (slide 53):**

\`\`\`
sub $2, $1, $3
and $12, $2, $5     # 1a: EX/MEM.RegisterRd = ID/EX.RegisterRs = $2
or  $13, $6, $2     # 2b: MEM/WB.RegisterRd = ID/EX.RegisterRt = $2
add $14, $2, $2     # no hazard: reads $2 in the cycle sub writes it
sw  $15, 100($2)    # no hazard
\`\`\`

\`\`\`fig
dh-alu-seq
\`\`\`

## The forwarding unit

\`\`\`fig
dh-forwarding-unit
\`\`\`

Two 3-input multiplexers in front of the ALU, controlled by **ForwardA** (first operand) and **ForwardB** (second operand):

| Mux control | Source | Meaning |
|---|---|---|
| ForwardA = 00 | ID/EX | first ALU operand comes from the register file |
| ForwardA = 10 | EX/MEM | forwarded from the prior ALU result |
| ForwardA = 01 | MEM/WB | forwarded from data memory or an earlier ALU result |
| ForwardB = 00, 10, 01 | (same) | second ALU operand |

**Forwarding conditions (slide 61).**

EX hazard:

\`\`\`
if (EX/MEM.RegWrite and (EX/MEM.RegisterRd ≠ 0)
    and (EX/MEM.RegisterRd = ID/EX.RegisterRs))  ForwardA = 10
if (EX/MEM.RegWrite and (EX/MEM.RegisterRd ≠ 0)
    and (EX/MEM.RegisterRd = ID/EX.RegisterRt))  ForwardB = 10
\`\`\`

MEM hazard (first version):

\`\`\`
if (MEM/WB.RegWrite and (MEM/WB.RegisterRd ≠ 0)
    and (MEM/WB.RegisterRd = ID/EX.RegisterRs))  ForwardA = 01
if (MEM/WB.RegWrite and (MEM/WB.RegisterRd ≠ 0)
    and (MEM/WB.RegisterRd = ID/EX.RegisterRt))  ForwardB = 01
\`\`\`

## The double data hazard

Consider (slide 62):

\`\`\`
add $1, $1, $2
add $1, $1, $3
add $1, $1, $4
\`\`\`

\`\`\`fig
dh-double
\`\`\`

When the third add is in EX, **both** hazards occur: EX/MEM holds the second add's \`$1\` and MEM/WB holds the first add's \`$1\`. The **most recent** value is wanted, the one in EX/MEM.

With slide 63's values (\`$1\` = 10, \`$2\` = 30, \`$3\` = 20, \`$4\` = 4): the first add gives 40, the second 60, and the third must give 64. Taking the older 40 from MEM/WB would give 44: **wrong**.

**Revised MEM hazard condition (slide 64):** forward from MEM/WB only if the EX hazard condition is **not** true.

\`\`\`
if (MEM/WB.RegWrite and (MEM/WB.RegisterRd ≠ 0)
    and not (EX/MEM.RegWrite and (EX/MEM.RegisterRd ≠ 0)
             and (EX/MEM.RegisterRd = ID/EX.RegisterRs))
    and (MEM/WB.RegisterRd = ID/EX.RegisterRs))  ForwardA = 01
if (MEM/WB.RegWrite and (MEM/WB.RegisterRd ≠ 0)
    and not (EX/MEM.RegWrite and (EX/MEM.RegisterRd ≠ 0)
             and (EX/MEM.RegisterRd = ID/EX.RegisterRt))
    and (MEM/WB.RegisterRd = ID/EX.RegisterRt))  ForwardB = 01
\`\`\`

The EX-hazard conditions are unchanged. These four conditions are the complete forwarding unit.

## Load followed by store

\`\`\`
lw $2, 20($1)
sw $2, 15($3)
\`\`\`

The store needs \`$2\` only as **data to write**, in its MEM stage, and the load has it at the end of its own MEM stage, one cycle earlier. Forwarding from MEM/WB into the store's memory-write input would avoid any stall (slide 66: "when is data ready, when is data needed?"). The standard forwarding unit forwards only to the ALU inputs, so it treats this like any load-use hazard and stalls one cycle.

## Detecting load-use hazards

Check when the using instruction is decoded, in ID. Its operand register numbers there are \`IF/ID.RegisterRs\` and \`IF/ID.RegisterRt\` (slide 69):

\`\`\`
if (ID/EX.MemRead and
    ((ID/EX.RegisterRt = IF/ID.RegisterRs) or
     (ID/EX.RegisterRt = IF/ID.RegisterRt)))
  stall the pipeline
\`\`\`

- \`ID/EX.MemRead\` is 1 only for a load, so the instruction in EX is a load.
- A load's destination is its **rt**, so compare \`ID/EX.RegisterRt\` with both sources of the instruction in ID.

## How to stall

\`\`\`fig
dh-hazard-unit
\`\`\`

1. **Force the control values in ID/EX to 0.** EX, MEM and WB then do nothing (a nop): a **bubble**.
2. **Prevent the PC and the IF/ID register from updating** (PCWrite = 0, IF/IDWrite = 0):
   - the using instruction is decoded again;
   - the following instruction is fetched again.
3. The 1-cycle stall lets MEM read the data for the load; it can then be forwarded to the EX stage.

\`\`\`fig
dh-stall-seq
\`\`\`

Slide 74: in cycle 4, \`and\` repeats what it did in cycle 3 (decodes and reads registers again) and \`or\` is refetched.

## Stalls and performance

- Stalls reduce performance, but they are required to get correct results.
- The compiler can arrange code to avoid hazards and stalls, which requires knowledge of the pipeline structure.

## Without forwarding: inserting nops

If the processor has no forwarding (and no hazard detection), the **compiler** must separate dependent instructions with nops so that every consumer's ID comes no earlier than its producer's WB:
- an ALU or load producer needs **2** instructions between it and its consumer;
- so insert $2 - (\text{instructions already between})$ nops.

**Example:**

\`\`\`
lw  $1, 40($6)
add $6, $2, $2
sw  $6, 50($1)
\`\`\`

\`sw\` reads \`$1\` (from the load, 2 instructions back: one instruction in between, so 1 nop needed) and \`$6\` (from the add, immediately before: 2 nops needed). Two nops between \`add\` and \`sw\` satisfy both:

\`\`\`
lw  $1, 40($6)
add $6, $2, $2
nop
nop
sw  $6, 50($1)
\`\`\`

Note that \`add\` overwrites \`$6\` after \`lw\` has already read it in ID, so that order is safe.
`
