/*
  Static dual-issue MIPS (Rifat Sir's slides 92-97): each packet holds one
  ALU/branch instruction and one load/store instruction ("nop" for an empty
  slot). A slot may start with a label ("Loop: lw $t0, 0($s1)"), which names
  the packet.

  Packet semantics, as in hardware: both instructions read their registers in
  the same cycle, so an instruction never sees a value written by the other
  instruction of its own packet.

  scheduleProblems() checks the slot kinds, write conflicts inside a packet
  and the one-cycle load-use latency; runPackets() executes a schedule;
  sameResult() compares it with the original loop on real data.
*/
import { deps, newMachine, parse, run, storeWord, loadWord, regNum, type Machine } from "./mips"

export type Packet = [alu: string, ls: string]

const LABEL = /^\s*([A-Za-z_]\w*):\s*/
const strip = (s: string) => s.replace(LABEL, "")
const labelOf = (s: string) => s.match(LABEL)?.[1]
const opOf = (s: string) => strip(s).trim().split(/\s+/)[0].toLowerCase()
const isLS = (op: string) => /^(lw|sw|lb|lbu|sb|lh|lhu|sh)$/.test(op)
const insOf = (s: string) => parse(strip(s)).instrs[0]

export function scheduleProblems(packets: Packet[]): string[] {
  const out: string[] = []
  packets.forEach(([a, l], p) => {
    if (a !== "nop" && isLS(opOf(a))) out.push(`packet ${p + 1}: ${strip(a)} is not an ALU/branch instruction`)
    if (l !== "nop" && !isLS(opOf(l))) out.push(`packet ${p + 1}: ${strip(l)} is not a load/store`)
    if (a === "nop" || l === "nop") return
    const wa = deps(insOf(a)).writes
    const wl = deps(insOf(l)).writes
    if (wa !== undefined && wa === wl) out.push(`packet ${p + 1}: both instructions write register ${wa}`)
  })
  for (let p = 0; p + 1 < packets.length; p++) {
    const l = packets[p][1]
    if (l === "nop" || !opOf(l).startsWith("l")) continue
    const r = deps(insOf(l)).writes
    for (const s of packets[p + 1]) if (s !== "nop" && r !== undefined && deps(insOf(s)).reads.includes(r)) out.push(`packet ${p + 2}: ${strip(s)} uses the load in packet ${p + 1} one cycle too early`)
  }
  return out
}

/** Executes a schedule packet by packet. Returns the machine and the number of packets issued. */
export function runPackets(packets: Packet[], m: Machine, maxPackets = 10_000) {
  const labels: Record<string, number> = {}
  packets.forEach((pk, i) => pk.forEach((s) => labelOf(s) && (labels[labelOf(s)!] = i)))
  let p = 0
  let issued = 0
  while (p < packets.length) {
    if (++issued > maxPackets) throw new Error("schedule does not terminate")
    const snapshot = Int32Array.from(m.regs)
    const writes: [number, number][] = []
    let next = p + 1
    for (const slot of packets[p]) {
      if (slot === "nop") continue
      const ins = insOf(slot)
      if (ins.op === "beq" || ins.op === "bne" || ins.op === "j") {
        const t = labels[ins.op === "j" ? ins.args[0] : ins.args[2]]
        if (t === undefined) throw new Error(`unknown label in ${slot}`)
        if (ins.op === "j") next = t
        else {
          const eq = snapshot[regNum(ins.args[0])] === snapshot[regNum(ins.args[1])]
          if ((ins.op === "beq") === eq) next = t
        }
        continue
      }
      // Execute against the packet-start registers, then collect the register write.
      const tmp: Machine = { ...m, regs: Int32Array.from(snapshot) }
      run(parse(strip(slot)), tmp, { stopAfter: 1 })
      const w = deps(ins).writes
      if (w !== undefined) writes.push([w, tmp.regs[w]])
    }
    for (const [r, v] of writes) m.regs[r] = v
    p = next
  }
  return { machine: m, packets: issued }
}

/** Runs the original loop and the schedule over an n-element array at addresses 4..4n ($s1 starts at 4n). */
export function sameResult(original: string, packets: Packet[], n: number): string | null {
  const a = newMachine({ s1: 4 * n, s2: 7 })
  const b = newMachine({ s1: 4 * n, s2: 7 })
  for (let i = 1; i <= n; i++) {
    storeWord(a.mem, 4 * i, 100 + i)
    storeWord(b.mem, 4 * i, 100 + i)
  }
  run(parse(original), a)
  runPackets(packets, b)
  for (let i = 1; i <= n; i++) if (loadWord(a.mem, 4 * i) !== loadWord(b.mem, 4 * i)) return `element ${i}: schedule gives ${loadWord(b.mem, 4 * i)}, original ${loadWord(a.mem, 4 * i)}`
  if (a.regs[17] !== b.regs[17]) return `$s1 ends at ${b.regs[17]}, original ${a.regs[17]}`
  return null
}

export function ipc(packets: Packet[]) {
  const real = packets.flat().filter((s) => s !== "nop").length
  return { instructions: real, cycles: packets.length, ipc: real / packets.length }
}

/** Markdown table of a schedule. */
export function scheduleTable(packets: Packet[]) {
  const code = (s: string) => (s === "nop" ? "nop" : `\`${strip(s)}\``)
  return [
    "| Cycle | Label | ALU/branch | Load/store |",
    "|---|---|---|---|",
    ...packets.map((pk, i) => `| ${i + 1} | ${pk.map(labelOf).find(Boolean) ?? ""} | ${code(pk[0])} | ${code(pk[1])} |`),
  ].join("\n")
}
