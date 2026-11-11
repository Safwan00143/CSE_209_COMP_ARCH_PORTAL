import { md } from "../md"

export const gpuNote = md`
## What a GPU is

A **graphics processing unit (GPU)** is a processor optimised for 2D and 3D graphics, video, visual computing and display (slide 2).

- Modern GPUs are **highly parallel, highly multithreaded multiprocessors** optimised for visual computing.
- **Visual computing** mixes graphics processing and computing, allowing real-time interaction with computed objects.
- GPUs provide **two to three orders of magnitude** more thread and data parallelism than traditional CPUs.

**Evolution (slide 3).**
- Before the 1990s: graphics were handled by simple **VGA (Video Graphics Array) controllers**, essentially memory controllers connected to DRAM.
- 1990s: 3D acceleration functions were added: triangle setup, rasterisation, texture mapping.
- 2000: the term "GPU" was coined for the single-chip graphics processor that incorporated nearly all of a high-end workstation's graphics pipeline.
- Today: massively parallel programmable processors with hundreds of cores and thousands of threads, able to run general-purpose languages such as C and C++.

## CPU and GPU together: heterogeneous systems

A **heterogeneous system** combines different processor types, such as a CPU and a GPU (slide 4). Their strengths complement each other:
- the **CPU** is multicore (soon manycore), primarily a **serial** processor;
- the **GPU** is a **massively parallel** manycore processor.

The best performance for many applications comes from using both, splitting the work according to their strengths.

## GPU system architectures

A CPU–GPU system is defined by its functional subsystems, its interconnection topology, and its memory subsystems (slide 11).

**The historical PC (circa 1990, slide 12).** The display was driven by a simple framebuffer subsystem, the **VGA controller**, attached to the low-bandwidth PCI bus. High-bandwidth interfaces (CPU and memory) were handled by the **North Bridge**, legacy interfaces (audio, LAN) by the **South Bridge**. There were no GPUs.

**Contemporary systems with a discrete GPU (slide 14).**
- The GPU and the CPU each have their **own dedicated memory** subsystem.
- The GPU typically attaches by a **16-lane PCI-Express (PCIe)** link: peak 16 GB/s (8 GB/s in each direction).
- **Both processors can access each other's memory, but with much less bandwidth** than their access to their own directly attached "local" memory.
- In some systems the memory controller (North Bridge) is integrated onto the CPU die.

\`\`\`fig
gpu-intel
gpu-amd
\`\`\`

| | (a) Intel | (b) AMD |
|---|---|---|
| CPU to North Bridge | front-side bus | internal bus (North Bridge on the CPU die) |
| Memory controller | in the North Bridge chip | on the CPU die |
| GPU attached to | North Bridge, x16 PCIe | chipset, x16 PCIe |
| CPU-side link to I/O | North Bridge to South Bridge (x4 PCIe derivative) | HyperTransport 1.03 to the chipset |
| GPU memory | its own GPU memory | its own GPU memory |

**Unified memory architecture (UMA, slide 16).** The CPU and GPU share a common system memory, with no dedicated GPU memory, to reduce cost. UMA systems generally perform worse, limited by system-memory bandwidth and increased latency.

## How the CPU and GPU access each other's memory

With CPUs and GPUs there are **multiple address spaces** (slide 17):
- The **GPU** accesses its own physical local memory and the CPU system's physical memory using **virtual addresses**, translated by an **MMU on the GPU**. The operating-system kernel manages the GPU's page tables.
- A system physical page can be accessed with **coherent or noncoherent** PCI-Express transactions, chosen by an attribute in the GPU's page table.
- The **CPU** accesses the GPU's local memory through an address range, the **aperture**, in the PCI-Express address space.

**Multi-GPU systems and consoles (slide 18).** Workstations and gaming systems may use two to four GPUs in parallel (e.g. NVIDIA SLI, Scalable Link Interconnect). Consoles (PS3, Xbox 360) resemble PCs but use customised internal buses; they are designed for a 5+ year life with constant capability, and are reimplemented on newer silicon to lower cost.

**Interfaces and drivers (slide 19).** Applications use the GPU as a coprocessor through standard APIs (OpenGL, Direct3D). The API sends commands, programs and data to the GPU through a graphics device driver optimised for that GPU. PCI-Express replaced the earlier AGP (Accelerated Graphics Port).

## The graphics pipeline

The **logical graphics pipeline** is a dataflow infrastructure that maps onto the GPU hardware (slides 5, 20, 26):

1. **Input assembler** (fixed function): collects vertices and groups them into primitives (triangles, polygons).
2. **Vertex shader** (programmable): per-vertex processing, e.g. transforming 3D positions to screen positions, lighting.
3. **Geometry shader** (programmable): processes primitives (lines, triangles); can add or drop them.
4. **Setup and rasteriser** (fixed function): generates pixel fragments.
5. **Pixel shader** (programmable): per-fragment processing, texturing and colouring.
6. **Output merger** (fixed function): Z-buffer depth testing and colour blending.

The logical pipeline's dataflow recirculates through the same physical processors.

**Shading languages (slide 6):** HLSL and Cg. They have C-like syntax but lack pointers, file I/O and recursion. Inputs are often interpolated by earlier stages. Many program instances run in parallel as independent threads, because they work on independent data and have no side effects.

## The unified GPU architecture

Modern GPUs **unify** vertex, geometry and pixel shading and parallel computing on the **same physical processors**: a parallel array of many programmable processors, not separate hardware for each shader type (slide 21). The array is tightly integrated with fixed-function processors for texture filtering, video decoding and anti-aliasing.

**NVIDIA GeForce 8800 (Tesla architecture, slide 22):**
- the array is organised into multithreaded **streaming multiprocessors (SMs)**;
- 112 **streaming processor (SP)** cores organised into **14 SMs**;
- each SM has **8 SP cores**, 2 **special function units (SFUs)**, shared memory, and instruction and constant caches;
- each SP core is highly multithreaded, managing **96 concurrent threads** and their hardware state.

**Design philosophy (slide 24):** execute many parallel threads efficiently on many simpler cores. More of the transistor budget goes to computation, and less to on-chip caches and overhead, than in multicore CPUs. The array scales to different market segments by changing the number of SMs and memory partitions.

## GPU computing and CUDA

- **GPGPU** (general-purpose computation on GPUs) was an earlier approach that used the graphics APIs and pipeline for non-graphics work: awkward and limiting (slide 7).
- **GPU computing** uses the GPU through a parallel programming language and API, without the graphics-pipeline model.
- **CUDA** (Compute Unified Device Architecture) is NVIDIA's scalable parallel programming model and platform: an extension of C/C++.

**The CUDA programming model (slides 8, 27, 28).** The programmer writes code for **one thread**, which is executed by many threads in parallel: the **SPMD** (single-program, multiple-data) style. Three key abstractions: a hierarchy of thread groups, shared memories, and barrier synchronisation.

| Term | Meaning |
|---|---|
| **Kernel** | a C function (program) for one sequential thread, executed in parallel by many threads |
| **Thread** | the finest unit of work; each has a unique ID (\`threadIdx\`) |
| **Thread block** | a group of concurrent threads that can cooperate through barrier synchronisation and shared memory |
| **Grid** | a set of independent thread blocks that all execute the same kernel |

\`\`\`fig
gpu-cuda
\`\`\`

**Memory levels (slides 32–33):**
- **local memory:** private to each thread;
- **shared memory:** fast on-chip RAM shared by the threads of one block;
- **global memory:** accessible by all threads of the application; in the DRAM on the graphics board.

**Synchronisation.** The \`__syncthreads()\` intrinsic is a barrier: all threads of a block reach it before any continues. Different blocks must be able to run **in any order** (parallel or serial), which gives scalability and avoids deadlock. A kernel can be followed by an interkernel barrier and another kernel on a grid of a different shape (slide 34).

## How CUDA maps to the hardware

| CUDA | Hardware |
|---|---|
| a **grid** (one kernel launch) | the whole GPU: its blocks are distributed over the SMs |
| a **thread block** | one **SM**: all its threads run on that SM, sharing its shared memory and synchronising there |
| a **thread** | one **SP** core, which interleaves many threads (96 each on the GeForce 8800) |

An SM can hold several blocks at once if it has the resources. Because blocks are independent, the same program runs on a GPU with 2 SMs or with 30, just faster: **transparent scalability**.

**Decomposing a problem (slides 9, 29).** Partition the result data into **blocks**, and each block into **elements**. Parallel multiprocessors compute result blocks; parallel threads compute result elements. The number of blocks follows the data size, not the number of processors.

## Example: SAXPY

Sequential C (slide 30): each loop iteration computes one result.

\`\`\`
void saxpy_serial(int n, float alpha, float *x, float *y) {
    for (int i = 0; i < n; ++i)
        y[i] = alpha * x[i] + y[i];
}
saxpy_serial(n, 2.0, x, y);
\`\`\`

Parallel CUDA: n threads in blocks of 256; each thread does what one iteration did.

\`\`\`
__global__ void saxpy_parallel(int n, float alpha, float *x, float *y) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < n) y[i] = alpha * x[i] + y[i];
}
int nblocks = (n + 255) / 256;
saxpy_parallel<<<nblocks, 256>>>(n, 2.0, x, y);
\`\`\`

- \`blockIdx.x * blockDim.x + threadIdx.x\` gives each thread a unique index $i$.
- $\lceil n/256\rceil$ blocks cover all n elements; \`if (i < n)\` stops the extra threads in the last block.

## Scalability and what drives GPU design

- GPU parallelism doubles about every 12 to 18 months (Moore's law and architectural efficiency).
- **Transparent scalability:** programs get faster on hardware with more processors, without recompiling.
- Arithmetic has moved from integer and fixed point to high-performance single- and double-precision floating point.

GPU design is driven by (slide 35): **fine-grained data parallelism** (one pixel, one vertex or one result per thread); **high throughput** (millions of threads per frame at 60 frames per second); **transparent scalability**; and **floating-point intensity** (lighting, high dynamic range).
`
