import { all, expectEq, type Fact } from "./types"
import { CONTROL, aluControl, checkRow, type Controls } from "@/lib/datapath"

const init = { t1: 0, t2: 12, t3: 5, s0: 0x10010000, s1: 7, s2: 7 }
const mem = { [0x10010000 + 8]: 1234 }

export const singleCycleNoteChecks: Fact[] = [
  {
    id: "note-sc-control-rows",
    claim: "every control-table row executes its instruction correctly through the datapath (both values of every X)",
    problem: () =>
      all(
        checkRow("add $t1, $t2, $t3", CONTROL["R-format"], init),
        checkRow("sub $t1, $t2, $t3", CONTROL["R-format"], init),
        checkRow("and $t1, $t2, $t3", CONTROL["R-format"], init),
        checkRow("or $t1, $t2, $t3", CONTROL["R-format"], init),
        checkRow("slt $t1, $t3, $t2", CONTROL["R-format"], init),
        checkRow("lw $t1, 8($s0)", CONTROL.lw, init, mem),
        checkRow("sw $t2, 8($s0)", CONTROL.sw, init, mem),
        checkRow("beq $s1, $s2, T", CONTROL.beq, init),
        checkRow("beq $s1, $t2, T", CONTROL.beq, init),
        checkRow("j T", CONTROL.j, init),
      ),
  },
  {
    id: "note-sc-addi-row",
    claim: "addi needs no new hardware: RegDst 0, ALUSrc 1, MemtoReg 0, RegWrite 1, ALUOp 00",
    problem: () => {
      const addi: Controls = { RegDst: 0, ALUSrc: 1, MemtoReg: 0, RegWrite: 1, MemRead: 0, MemWrite: 0, Branch: 0, ALUOp1: 0, ALUOp0: 0, Jump: 0 }
      return checkRow("addi $t1, $t2, -3", addi, init)
    },
  },
  {
    id: "note-sc-wrong-row-caught",
    claim: "the datapath check rejects a wrong row (lw with MemtoReg = 0)",
    problem: () => (checkRow("lw $t1, 8($s0)", { ...CONTROL.lw, MemtoReg: 0 }, init, mem) ? null : "a wrong control row passed"),
  },
  {
    id: "note-sc-alu-control",
    claim: "ALU control table",
    problem: () =>
      all(
        expectEq("lw", aluControl(0b00, 0), 0b0010),
        expectEq("beq", aluControl(0b01, 0), 0b0110),
        expectEq("add", aluControl(0b10, 0b100000), 0b0010),
        expectEq("sub", aluControl(0b10, 0b100010), 0b0110),
        expectEq("and", aluControl(0b10, 0b100100), 0b0000),
        expectEq("or", aluControl(0b10, 0b100101), 0b0001),
        expectEq("slt", aluControl(0b10, 0b101010), 0b0111),
      ),
  },
  {
    id: "note-sc-timing",
    claim: "lw 800, sw 700, R 600, beq 500 ps",
    problem: () => all(expectEq("lw", 200 + 100 + 200 + 200 + 100, 800), expectEq("sw", 200 + 100 + 200 + 200, 700), expectEq("R", 200 + 100 + 200 + 100, 600), expectEq("beq", 200 + 100 + 200, 500)),
  },
]
