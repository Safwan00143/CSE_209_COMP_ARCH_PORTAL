import { md } from "../md"
import { ipc, scheduleTable, type Packet } from "@/lib/dualissue"

export const LOOP = `Loop: lw   $t0, 0($s1)      # $t0 = array element
      addu $t0, $t0, $s2    # add scalar in $s2
      sw   $t0, 0($s1)      # store result
      addi $s1, $s1, -4     # decrement pointer
      bne  $s1, $zero, Loop # branch if $s1 != 0`

export const SCHED: Packet[] = [
  ["nop", "Loop: lw $t0, 0($s1)"],
  ["addi $s1, $s1, -4", "nop"],
  ["addu $t0, $t0, $s2", "nop"],
  ["bne $s1, $zero, Loop", "sw $t0, 4($s1)"],
]

export const UNROLLED: Packet[] = [
  ["Loop: addi $s1, $s1, -16", "lw $t0, 0($s1)"],
  ["nop", "lw $t1, 12($s1)"],
  ["addu $t0, $t0, $s2", "lw $t2, 8($s1)"],
  ["addu $t1, $t1, $s2", "lw $t3, 4($s1)"],
  ["addu $t2, $t2, $s2", "sw $t0, 16($s1)"],
  ["addu $t3, $t3, $s2", "sw $t1, 12($s1)"],
  ["nop", "sw $t2, 8($s1)"],
  ["bne $s1, $zero, Loop", "sw $t3, 4($s1)"],
]

const a = ipc(SCHED)
const b = ipc(UNROLLED)

export const multipleIssueNote = md`
## Instruction-level parallelism

Pipelining already executes several instructions in parallel. This is **instruction-level parallelism (ILP)**. Two ways to increase it (slide 86):

- **A deeper pipeline:** less work per stage, so a shorter clock cycle.
- **Multiple issue:** replicate the pipeline stages, giving multiple pipelines, and start several instructions per clock cycle.

With multiple issue, CPI < 1, so performance is quoted as **instructions per cycle (IPC)**:
$$
\text{IPC} = \frac{1}{\text{CPI}}
$$
Example: a 4 GHz, 4-way multiple-issue processor peaks at $4\times4 = 16$ billion instructions per second (16 BIPS), peak CPI = 0.25, peak IPC = 4. Dependencies reduce this in practice.

## Static and dynamic multiple issue

| | Static multiple issue | Dynamic multiple issue |
|---|---|---|
| Who groups instructions | the **compiler**, into "issue slots" | the **CPU**, which examines the instruction stream each cycle |
| Who handles hazards | the compiler detects and avoids them | the CPU resolves them at run time with advanced techniques |
| Compiler's role | essential | can help by reordering instructions |
| Usual name | VLIW (very long instruction word) | superscalar |

## Speculation

**Speculation** means guessing what to do with an instruction (slide 88):
1. Start the operation as soon as possible.
2. Check whether the guess was right.
3. If so, complete the operation. If not, roll back and do the right thing.

It is common to both static and dynamic multiple issue. Examples:
- speculate on a branch outcome; roll back if the path taken is different;
- speculate on a load (e.g. load early); roll back if the location is updated.

**Compiler vs hardware speculation (slide 89).**
- The compiler can reorder instructions, e.g. move a load before a branch, and include "fix-up" instructions to recover from an incorrect guess.
- The hardware can look ahead for instructions to execute, buffer their results until it knows they are actually needed, and flush the buffers on incorrect speculation.

## Static multiple issue

The compiler groups instructions into **issue packets**: groups of instructions that can be issued in a single cycle, determined by the pipeline resources they need. An issue packet is like one very long instruction specifying several concurrent operations: **VLIW**.

**Scheduling (slide 91).** The compiler must remove some or all hazards:
- reorder instructions into issue packets;
- no dependencies within a packet;
- possibly some dependencies between packets (this varies between ISAs, and the compiler must know);
- pad with nop if necessary.

## MIPS with static dual issue

**Two-issue packets (slide 92):**
- one ALU/branch instruction and one load/store instruction;
- 64-bit aligned: ALU/branch first, then load/store;
- an unused slot is padded with a nop.

| Address | Instruction type | Pipeline stages |
|---|---|---|
| n | ALU/branch | IF ID EX MEM WB |
| n + 4 | Load/store | IF ID EX MEM WB |
| n + 8 | ALU/branch | starts one cycle later |
| n + 12 | Load/store | starts one cycle later |

The hardware adds a second register-file read port pair and write port, and a separate adder for the load/store address, so both instructions can run at once.

**Hazards in the dual-issue MIPS (slide 94).** More instructions execute in parallel, so:
- **EX data hazard:** single issue avoided stalls by forwarding, but now an ALU result cannot be used by a load/store **in the same packet**:

  \`\`\`
  add  $t0, $s0, $s1
  lw   $s2, 0($t0)      # must go in the next packet: effectively a stall
  \`\`\`

- **Load-use hazard:** still one cycle of use latency, but that cycle now covers **two** instructions (the whole next packet). More aggressive scheduling is required.

**Rules for a correct schedule**
1. Each packet: at most one ALU/branch and one load/store.
2. Within a packet, both instructions read their registers in the same cycle, so neither sees the other's result.
3. A loaded register may not be used in the next packet (one-cycle load-use latency).
4. An ALU result may be used in the next packet (forwarding).
5. The branch is in the last packet of the loop; anything in the same packet still executes.

## Scheduling example

Schedule this loop for dual-issue MIPS (slide 95):

\`\`\`
${LOOP}
\`\`\`

${scheduleTable(SCHED)}

**How the schedule was built**
1. \`lw\` goes first (cycle 1); its result \`$t0\` can be used in cycle 3 at the earliest.
2. \`addi\` does not depend on anything pending, so it fills the ALU slot of cycle 2.
3. \`addu\` uses \`$t0\`: cycle 3.
4. \`sw\` needs \`addu\`'s result: cycle 4. \`bne\` needs \`addi\`'s result (ready), so it shares cycle 4.
5. Because \`addi\` has already subtracted 4 when \`sw\` runs, the store's offset changes from 0 to **4**: \`sw $t0, 4($s1)\` writes the same address as the original \`sw $t0, 0($s1)\`.

$$
\text{IPC} = \frac{${a.instructions}\ \text{instructions}}{${a.cycles}\ \text{cycles}} = ${a.ipc}
$$
compared with a peak IPC of 2.

## Loop unrolling

Replicate the loop body to expose more parallelism (slide 96):
- it reduces loop-control overhead (one \`addi\` and one \`bne\` per several elements);
- use **different registers** per replication, called **register renaming**, to avoid loop-carried **anti-dependencies**: a store followed by a load of the same register. These are also called **name dependences**: only the reuse of a register name links them, not a value.

**Unrolled four times** (slide 97):

${scheduleTable(UNROLLED)}

- \`addi\` moves to the first packet and subtracts 16 (four elements). The \`lw\` in the same packet still uses the old \`$s1\` (packet rule 2), so its offset is 0. Later loads and stores use the new \`$s1\` with offsets 12, 8, 4 (loads) and 16, 12, 8, 4 (stores).
- Each copy uses its own register: \`$t0\`, \`$t1\`, \`$t2\`, \`$t3\`.

$$
\text{IPC} = \frac{${b.instructions}}{${b.cycles}} = ${b.ipc}
$$
closer to 2, at the cost of registers and code size.

(The slide prints the sixth packet's \`addu\` as \`addu $t3, $t4, $s2\`; it is \`addu $t3, $t3, $s2\`, as the pattern of the other three copies shows.)

## Dynamic multiple issue: superscalar processors

"Superscalar" processors (slide 98):
- the CPU decides whether to issue 0, 1, 2, … instructions each cycle, avoiding structural and data hazards;
- this avoids the need for compiler scheduling, though scheduling may still help;
- the CPU ensures the code's meaning is preserved.

**Dynamic pipeline scheduling (slide 99).** Let the CPU execute instructions **out of order** to avoid stalls, but **commit** results to registers in order.

\`\`\`
lw    $t0, 20($s2)
addu  $t1, $t0, $t2     # waits for lw
sub   $s4, $s4, $t3     # independent: can start while addu waits
slti  $t5, $s4, 20
\`\`\`

## A dynamically scheduled CPU

The slide's block diagram has three parts:

1. **Instruction fetch and decode unit**, in order.
2. **Reservation stations**, one group per functional unit (integer, floating point, load/store). They **hold pending operands** until an instruction can execute. They also **preserve dependencies**.
3. **Functional units**, which execute out of order. Their results go to the commit unit and are **also sent to any waiting reservation stations**.
4. **Commit unit**, in order. Its **reorder buffer** holds register writes until they can be committed in program order. It can **supply operands for issued instructions**.

**Why dynamic scheduling? Why not just let the compiler schedule? (slide 101)**
- Not all stalls are predictable, e.g. cache misses.
- The compiler cannot always schedule around branches, because branch outcomes are decided dynamically.
- Different implementations of an ISA have different latencies and hazards.

## Does multiple issue work?

Yes, but not as much as we would like (slide 102):
- programs have real dependencies that limit ILP;
- some dependencies are hard to eliminate, e.g. pointer aliasing;
- some parallelism is hard to expose, given the limited window size during instruction issue;
- memory delays and limited bandwidth make it hard to keep pipelines full.

Speculation can help if done well.

## Power efficiency

The complexity of dynamic scheduling and speculation costs power, so **multiple simpler cores may be better** (slide 103):

| Microprocessor | Year | Clock rate | Pipeline stages | Issue width | Out-of-order / speculation | Cores | Power |
|---|---|---|---|---|---|---|---|
| i486 | 1989 | 25 MHz | 5 | 1 | No | 1 | 5 W |
| Pentium | 1993 | 66 MHz | 5 | 2 | No | 1 | 10 W |
| Pentium Pro | 1997 | 200 MHz | 10 | 3 | Yes | 1 | 29 W |
| P4 Willamette | 2001 | 2000 MHz | 22 | 3 | Yes | 1 | 75 W |
| P4 Prescott | 2004 | 3600 MHz | 31 | 3 | Yes | 1 | 103 W |
| Core | 2006 | 2930 MHz | 14 | 4 | Yes | 2 | 75 W |
| UltraSparc III | 2003 | 1950 MHz | 14 | 4 | No | 1 | 90 W |
| UltraSparc T1 | 2005 | 1200 MHz | 6 | 1 | No | 8 | 70 W |

## Fallacies, pitfalls and conclusions

**Fallacies.**
- *Pipelining is easy.* The basic idea is easy; the devil is in the details, e.g. detecting data hazards.
- *Pipelining is independent of technology.* More transistors make more advanced techniques feasible, so pipeline-related ISA design must take technology trends into account (e.g. predicated instructions).

**Pitfall: poor ISA design can make pipelining harder.**
- Complex instruction sets (VAX, IA-32) need significant overhead to pipeline, e.g. the IA-32 micro-op approach.
- Complex addressing modes, with register-update side effects and memory indirection.
- Delayed branches: advanced pipelines have long delay slots.

**Concluding remarks.**
- The ISA influences the design of the datapath and control, and vice versa.
- Pipelining improves instruction throughput using parallelism; the latency of each instruction is not reduced.
- Hazards: structural, data, control.
- Multiple issue and dynamic scheduling exploit ILP, but dependencies limit the achievable parallelism, and complexity leads to the power wall.
`
