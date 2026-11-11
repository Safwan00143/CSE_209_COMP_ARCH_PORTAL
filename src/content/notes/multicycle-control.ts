import { md } from "../md"
import { STATES } from "@/lib/multicycle"

const stateTable = [
  "| State | Name | What happens | Signals asserted |",
  "|---|---|---|---|",
  ...STATES.map((s) => `| ${s.n} | ${s.name} | ${s.rtl} | ${s.signals.join(", ")} |`),
].join("\n")

export const multicycleControlNote = md`
## Where this topic fits

The single-cycle control unit is pure combinational logic: opcode in, control signals out. A **multicycle** implementation splits each instruction into steps of one clock cycle each, so its control must remember which step it is in. That makes it a **finite-state machine (FSM)**. Appendix D (Rifat Sir's handout) shows how to turn control, combinational or FSM, into hardware:

1. Implementing **combinational** control units (the ALU control and the single-cycle main control) with gates or a PLA.
2. Implementing **FSM control** with a ROM or a PLA.
3. Implementing the next-state function with a **sequencer** (a microprogram counter plus dispatch ROMs).
4. Writing the control as a **microprogram** and translating it to hardware.

## The multicycle datapath, briefly

The multicycle datapath reuses one memory (for instructions and data) and one ALU (for everything, including PC + 4 and the branch target) across cycles. Values that must survive to the next cycle are latched in internal registers:

| Register | Holds |
|---|---|
| IR | the instruction, read in the first cycle |
| MDR | data read from memory |
| A, B | the two register-file outputs |
| ALUOut | the ALU result |

Its 16 control bits:

| Signal | Width | Purpose |
|---|---|---|
| PCWrite | 1 | write the PC unconditionally |
| PCWriteCond | 1 | write the PC if the ALU's Zero output is 1 (branch) |
| IorD | 1 | memory address: PC (0) or ALUOut (1) |
| MemRead, MemWrite | 1 + 1 | read or write memory |
| IRWrite | 1 | load the instruction register |
| MemtoReg | 1 | register write data: ALUOut (0) or MDR (1) |
| PCSource | 2 | new PC: ALU output (00), ALUOut (01), jump address (10) |
| ALUOp | 2 | add (00), subtract (01), use funct (10) |
| ALUSrcB | 2 | second ALU input: B (00), 4 (01), sign-extended immediate (10), immediate shifted left 2 (11) |
| ALUSrcA | 1 | first ALU input: PC (0) or A (1) |
| RegWrite | 1 | write the register file |
| RegDst | 1 | write register: rt (0) or rd (1) |

## The control FSM

\`\`\`fig
ctl-fsm
\`\`\`

${stateTable}

Signals not listed in a state are 0, so no unit with state (memory, registers, PC, IR) changes by accident. The mux selects that are not listed are don't-cares in that state.

**Cycles per instruction class:**

| Class | States visited | Cycles |
|---|---|---|
| lw | 0, 1, 2, 3, 4 | 5 |
| sw | 0, 1, 2, 5 | 4 |
| R-type | 0, 1, 6, 7 | 4 |
| beq | 0, 1, 8 | 3 |
| j | 0, 1, 9 | 3 |

Note state 1: the ALU is idle while the instruction is decoded, so it computes the branch target **speculatively**, in case the instruction is a branch. Doing work that may be thrown away costs nothing here, and it saves a cycle for beq.

## Implementing the FSM with a ROM

The control unit is a state register plus a block of combinational "control logic". The inputs are the 6 opcode bits and the 4 state bits (10 states need 4 bits). The outputs are the 16 datapath control bits and the 4 next-state bits.

**One ROM.** The inputs are the address lines, so
$$
\text{entries} = 2^{10} = 1024,\qquad \text{width} = 16 + 4 = 20\ \text{bits}
$$
$$
\text{size} = 2^{10}\times20 = 20\ \text{Kbits}
$$

**Two ROMs.** The 16 datapath outputs depend only on the 4 state bits; only the 4 next-state bits need the opcode. So split it:
$$
2^{4}\times16 + 2^{10}\times4 = 256 + 4096 = 4352\ \text{bits} \approx 4.3\ \text{Kbits}
$$
about one-fifth of the single ROM.

A ROM cannot have don't-cares: every address must hold a word, so the same outputs are repeated many times (each state's control word appears 64 times in the single ROM, once per opcode).

## Implementing the FSM with a PLA

A **PLA** (programmable logic array) is a structured two-level AND–OR array. It needs only the product terms (minterms) that produce an active output, and each one only once, even if it contains don't-cares.

The control FSM needs **17 unique product terms**: 10 that depend only on the current state, and 7 that combine the opcode with the state.
$$
\text{PLA size} \propto (\#\text{inputs}\times\#\text{product terms}) + (\#\text{outputs}\times\#\text{product terms})
$$
$$
(10\times17) + (20\times17) = 510\ \text{PLA cells}
$$

Split into two PLAs, as with the ROM:
- 4 inputs, 10 product terms, 16 outputs: $(4\times10)+(16\times10) = 200$;
- 10 inputs, 7 product terms, 4 outputs: $(10\times7)+(4\times7) = 98$;
- total 298 cells, which is $298/510 \approx 58\%$ of the single PLA. (The appendix rounds this to "about 55%".)

A PLA cell is only slightly larger than a ROM bit, so the PLA is far more efficient here than either ROM.

**Simplifying the outputs.** PCWriteCond, PCSource0 and ALUOp0 are all asserted in exactly one state, **state 8**, and nowhere else. So these three signals could be replaced by a single signal: for example, PCWriteCond could drive PCSource0 (and ALUOp0) directly. That is the answer to "can PCWriteCond safely replace PCSource[0]?": yes, in this FSM they are 1 in exactly the same states.

## Implementing the next state with a sequencer

The next-state logic can be replaced by a counter, because most transitions are "go to the next state" or "go back to fetch". A **sequencer** has:
- a **state register** (the microprogram counter) with an incrementer;
- two **dispatch ROMs**, indexed by the opcode, for the two places where the next state depends on the instruction (after state 1 and after state 2);
- a 2-bit **address-control** field (AddrCtl) in each control word choosing the next state:

| AddrCtl | Next state |
|---|---|
| 00 | 0 (fetch) |
| 01 | dispatch ROM 1[opcode] |
| 10 | dispatch ROM 2[opcode] |
| 11 | current state + 1 (sequential) |

Each dispatch ROM has $2^6 = 64$ entries of 4 bits (the state width).

| Dispatch ROM 1 | Value | Dispatch ROM 2 | Value |
|---|---|---|---|
| R-format (000000) | 6 (0110) | lw (100011) | 3 (0011) |
| j (000010) | 9 (1001) | sw (101011) | 5 (0101) |
| beq (000100) | 8 (1000) | | |
| lw (100011) | 2 (0010) | | |
| sw (101011) | 2 (0010) | | |

## Microprogramming

When the control is complex, it can be written like a program. Each **microinstruction** says what the datapath does in one cycle, in named fields:

| Field | Values | Meaning |
|---|---|---|
| ALU control | Add, Subt, Func code | ALUOp = 00, 01, 10 |
| SRC1 | PC, A | ALUSrcA = 0, 1 |
| SRC2 | B, 4, Extend, Extshft | ALUSrcB = 00, 01, 10, 11 |
| Register control | Read; Write ALU; Write MDR | read rs, rt into A, B; write rd from ALUOut; write rt from MDR |
| Memory | Read PC; Read ALU; Write ALU | fetch into IR; read data into MDR; write B to memory |
| PC write control | ALU; ALUOut-cond; Jump address | PCSource = 00 + PCWrite; PCSource = 01 + PCWriteCond; PCSource = 10 + PCWrite |
| Sequencing | Seq, Fetch, Dispatch 1, Dispatch 2 | AddrCtl = 11, 00, 01, 10 |

**The microprogram for the MIPS subset**

| Label | ALU control | SRC1 | SRC2 | Register control | Memory | PC write control | Sequencing |
|---|---|---|---|---|---|---|---|
| Fetch | Add | PC | 4 | | Read PC | ALU | Seq |
| | Add | PC | Extshft | Read | | | Dispatch 1 |
| Mem1 | Add | A | Extend | | | | Dispatch 2 |
| LW2 | | | | | Read ALU | | Seq |
| | | | | Write MDR | | | Fetch |
| SW2 | | | | | Write ALU | | Fetch |
| Rformat1 | Func code | A | B | | | | Seq |
| | | | | Write ALU | | | Fetch |
| BEQ1 | Subt | A | B | | | ALUOut-cond | Fetch |
| JUMP1 | | | | | | Jump address | Fetch |

Each line is one state of the FSM: Fetch = state 0, the next line = 1, Mem1 = 2, LW2 = 3 and 4, SW2 = 5, Rformat1 = 6 and 7, BEQ1 = 8, JUMP1 = 9. Translating the microprogram to hardware means encoding each field as control bits and the labels as addresses, exactly like assembling a program.

## Horizontal and vertical microcode

- **Horizontal** (minimally encoded) microcode: wide microinstructions, roughly one bit per control signal. Any combination of operations can happen in one microinstruction, so programs are short and fast, but the control store is wide and often wasted.
- **Vertical** (maximally encoded) microcode: narrow, encoded microinstructions that need decoders. The control store is smaller, but each microinstruction can do less, so programs are longer and may take more cycles.

The appendix notes these terms have no universal definition; "maximally encoded" and "minimally encoded" are clearer.

## Hardwired versus microprogrammed control

| | Hardwired (FSM in logic, ROM or PLA) | Microprogrammed |
|---|---|---|
| How control is specified | a state diagram, implemented as gates/PLA | a microprogram in a control store |
| Speed | faster: no control-store access | slower: a microinstruction fetch per step |
| Changing it | redesign the logic | rewrite the microprogram |
| Suits | simple, regular ISAs such as MIPS | large, complex instruction sets |

Both describe the same FSM. A microprogram is simply a more readable notation for it, which pays off when there are many states.
`
