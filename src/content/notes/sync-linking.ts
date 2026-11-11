import { md } from "../md"

export const syncLinkingNote = md`
## Synchronization

When two processors share an area of memory, and P1 writes it and then P2 reads it, they must synchronise. Without synchronisation there is a **data race**: the result depends on the order of the accesses.

This needs **hardware support**: an **atomic** read-and-write of a memory location, meaning no other access to that location can happen between the read and the write. It can be:
- a single instruction, e.g. an atomic swap of a register with memory; or
- an atomic **pair** of instructions. MIPS uses a pair.

## Load linked and store conditional

\`\`\`
ll rt, offset(rs)      # load linked: rt = Memory[rs + offset], and remember the location
sc rt, offset(rs)      # store conditional: store rt there only if unchanged since the ll
\`\`\`

- \`sc\` **succeeds** if the location has not changed since the \`ll\`. It stores rt and puts **1** in rt.
- \`sc\` **fails** if the location has changed (another processor wrote it in between). It stores nothing and puts **0** in rt.

Software retries until the \`sc\` succeeds, so the read-modify-write is atomic.

**Example (slide): atomic swap**, to test or set a lock variable at \`0($s1)\`. \`$s4\` holds the value to swap in.

\`\`\`
try: add $t0, $zero, $s4    # copy exchange value
     ll  $t1, 0($s1)        # load linked
     sc  $t0, 0($s1)        # store conditional
     beq $t0, $zero, try    # branch if store fails
     add $s4, $zero, $t1    # put the loaded value in $s4
\`\`\`

The copy into \`$t0\` is needed because \`sc\` overwrites its register with the success flag.

**Example: atomically set \`A[0] = X\`**, with the base of A in \`$s1\` and X in \`$s2\`:

\`\`\`
try: ll  $t1, 0($s1)        # load linked (value not needed, but starts the link)
     add $t0, $zero, $s2    # $t0 = X  (sc will overwrite $t0)
     sc  $t0, 0($s1)        # try A[0] = X
     beq $t0, $zero, try    # someone else wrote A[0] in between: retry
\`\`\`

## Translating and starting a program

A C program becomes a running process in four steps:

1. **Compiler:** C program → assembly language program.
2. **Assembler:** assembly → object module (machine language).
3. **Linker:** object modules + library routines → executable (machine language). This is **static linking**.
4. **Loader:** executable → memory, and start it.

Many compilers produce object modules directly.

## Pseudoinstructions

Most assembler instructions map one-to-one onto machine instructions. **Pseudoinstructions** are "figments of the assembler's imagination": the assembler accepts them and expands them into real instructions.

\`\`\`
move $t0, $t1           →   add $t0, $zero, $t1
blt  $t0, $t1, L        →   slt $at, $t0, $t1
                            bne $at, $zero, L
\`\`\`

\`$at\` (register 1) is reserved as the **assembler temporary** for these expansions.

Pseudoinstructions give a richer assembly language without adding hardware: \`blt\` costs no extra datapath, and the ISA stays simple. The cost is that one line of assembly may be two or more instructions, so counting instructions from the source can be wrong.

**Should you write performance-critical code in assembly yourself?** Usually not (slide fallacy):
- modern compilers are better than people at scheduling code for modern processors;
- more lines of code mean more errors and lower productivity, and the code is tied to one ISA.

## The object module

The assembler (or compiler) translates the program into machine instructions and records what the linker needs to build a complete program from the pieces.

| Part | Contents |
|---|---|
| Header | describes the contents of the object module (sizes of the segments) |
| Text segment | the translated instructions |
| Static data segment | data allocated for the life of the program |
| Relocation information | the instructions and data words that depend on absolute addresses |
| Symbol table | global definitions and external references (labels still to be resolved) |
| Debug information | for associating machine code with the source |

## Linking

The linker produces an executable image in three steps:
1. **Merge segments:** place all text segments one after another, then all data segments.
2. **Resolve labels:** work out the address of every label.
3. **Patch** the location-dependent and external references, using the relocation information and the symbol table.

The linker could leave location dependencies for a relocating loader to fix, but with virtual memory there is no need: the program can be loaded at an absolute location in its virtual address space.

**Method for a linking question.**
1. Use the MIPS memory layout: text starts at 0040 0000 (hex), static data at 1000 0000 (hex), and \`$gp\` = 1000 8000 (hex).
2. Place procedure A's text at 0040 0000 and procedure B's text right after it: B starts at 0040 0000 + (A's text size).
3. Place A's data at 1000 0000 and B's data right after it: B's data starts at 1000 0000 + (A's data size).
4. For each **jal** in the relocation table: the target is the start address of the called procedure. Its 26-bit field is that address ÷ 4.
5. For each **lw/sw** relative to \`$gp\`: offset = (address of the variable) − 1000 8000 (hex), as a 16-bit two's-complement value.
6. Write the patched instructions at their final addresses.

**Worked example.** A has 100 (hex) bytes of text and 20 (hex) of data; B has 200 (hex) of text and 30 (hex) of data. A's first instructions are \`lw $a0, X($gp)\` and \`jal B\`; B's are \`sw $a1, Y($gp)\` and \`jal A\`. X is A's first data word; Y is B's first data word.

**Step 1: text.** A at 0040 0000; B at 0040 0000 + 100 = 0040 0100 (hex).

**Step 2: data.** A's data at 1000 0000, so X = 1000 0000; B's data at 1000 0000 + 20 = 1000 0020 (hex), so Y = 1000 0020.

**Step 3: \`$gp\` offsets.**
- For X: 1000 0000 − 1000 8000 = −8000 (hex). As a 16-bit two's-complement field, −8000 (hex) is written 8000 (hex).
- For Y: 1000 0020 − 1000 8000 = −7FE0 (hex), written 8020 (hex).

**Step 4: the executable.**

| Address | Instruction |
|---|---|
| 0040 0000 | \`lw $a0, 8000hex($gp)\` |
| 0040 0004 | \`jal 40 0100hex\` (field = 0040 0100 ÷ 4 = 10 0040 hex) |
| … | |
| 0040 0100 | \`sw $a1, 8020hex($gp)\` |
| 0040 0104 | \`jal 40 0000hex\` (field = 0040 0000 ÷ 4 = 10 0000 hex) |

## Loading a program

The loader brings the image file from disk into memory:
1. Read the header to find the segment sizes.
2. Create a virtual address space.
3. Copy text and initialised data into memory (or set page-table entries so they are faulted in on demand).
4. Set up the program's arguments on the stack.
5. Initialise the registers, including \`$sp\`, \`$fp\` and \`$gp\`.
6. Jump to a startup routine, which copies the arguments into \`$a0\`, … and calls main. When main returns, the startup routine makes the exit system call.

## Dynamic linking

**Static linking** copies every library routine the program might use into the executable at link time.

**Dynamic linking** links and loads a library procedure only when it is called.
- It needs the procedure's code to be **relocatable**.
- It avoids the image bloat of statically linking all (transitively) referenced libraries.
- It automatically picks up new library versions: fixing a library fixes every program that uses it, without relinking.

**Lazy linkage** (slide figure). Each call to a DLL routine goes through an **indirection table**:
1. The first time, the table entry points to a **stub**. The stub loads an ID for the routine and jumps to the dynamic linker/loader.
2. The linker/loader finds the routine, maps it into memory, and changes the indirection-table entry to point at it.
3. It then jumps to the routine.
4. Every later call goes through the table straight to the routine, paying only one extra indirect jump.

| | Static linking | Dynamic linking |
|---|---|---|
| When library code is attached | at link time, before the program runs | at run time, when first called |
| Executable size | large (all library code copied in) | small |
| New library version | needs relinking | picked up automatically |
| Call cost | direct | an indirect jump (plus the first-call link) |

## Starting a Java program

Java takes a different path (slide figure):
1. The **compiler** translates Java into **bytecode**, a simple, portable instruction set for the **Java Virtual Machine (JVM)**. Class files hold the bytecode.
2. The **JVM** links in Java library routines and **interprets** the bytecodes. Interpretation is portable but slow.
3. A **Just-In-Time (JIT) compiler** compiles the bytecodes of **"hot" methods** (those that run often) into native code for the host machine while the program runs, and saves it. Later calls run the fast native code.

So JIT improves performance by paying the compile cost only for code that runs often, keeping portability for everything else.

## Fallacies and pitfalls

**Fallacy: a powerful instruction means higher performance.**
- Fewer instructions are needed, but complex instructions are hard to implement.
- They may slow down **all** instructions, including simple ones.
- Compilers are good at making fast code from simple instructions.

**Fallacy: use assembly code for high performance.** Modern compilers handle modern processors better, and more lines of code mean more errors and lower productivity.

**Fallacy: backward compatibility means the instruction set does not change.** It does: instruction sets accrete more instructions over time (the slide's chart of the x86 instruction count).

**Pitfall: sequential words are not at sequential addresses.** Increment by 4, not by 1.

**Pitfall: keeping a pointer to an automatic variable after its procedure returns.** The pointer becomes invalid when the stack frame is popped.

## Concluding remarks

The four design principles:
1. Simplicity favours regularity.
2. Smaller is faster.
3. Make the common case fast.
4. Good design demands good compromises.

There are layers of software and hardware: compiler, assembler, hardware. MIPS is typical of RISC ISAs.
`
