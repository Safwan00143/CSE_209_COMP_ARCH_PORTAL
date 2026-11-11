import { all, expectEq, type Fact } from "./types"
import { decode, DOUBLE, encode, fpAddSteps, range, SINGLE } from "@/lib/ieee"
import { toHex } from "@/lib/numbers"

const close = (a: number, b: number, rel: number) => Math.abs(a - b) <= rel * Math.abs(b)

export const fpNoteChecks: Fact[] = [
  {
    id: "note-fp-minus075",
    claim: "−0.75: single BF400000, double BFE8000000000000, exponents 126 / 1022",
    problem: () => {
      const s = encode(-0.75, SINGLE)
      const d = encode(-0.75, DOUBLE)
      return all(expectEq("single", toHex(s.bits), "BF400000"), expectEq("double", toHex(d.bits), "BFE8000000000000"), expectEq("e1", s.exponent, "01111110"), expectEq("e2", d.exponent, "01111111110"))
    },
  },
  { id: "note-fp-minus5", claim: "C0A00000 = −5.0", problem: () => expectEq("value", decode("0xC0A00000", SINGLE).value, -5) },
  {
    id: "note-fp-ranges",
    claim: "single ≈1.2e−38…3.4e38; double ≈2.2e−308…1.8e308",
    problem: () => {
      const s = range(SINGLE)
      const d = range(DOUBLE)
      return all(
        close(s.smallest, 1.2e-38, 0.03) ? null : `single smallest ${s.smallest}`,
        close(s.largest, 3.4e38, 0.01) ? null : `single largest ${s.largest}`,
        close(d.smallest, 2.2e-308, 0.02) ? null : `double smallest ${d.smallest}`,
        close(d.largest, 1.8e308, 0.01) ? null : `double largest ${d.largest}`,
        expectEq("emin", s.emin, -126),
        expectEq("emax", s.emax, 127),
      )
    },
  },
  { id: "note-fp-precision", claim: "23·0.301 ≈ 6.9, 52·0.301 ≈ 15.7", problem: () => all(close(23 * Math.log10(2), 6.92, 0.01) ? null : "single", close(52 * Math.log10(2), 15.65, 0.01) ? null : "double") },
  {
    id: "note-fp-infinity",
    claim: "+∞ = 7F800000, −∞ = FF800000",
    problem: () => all(expectEq("+inf", decode("0x7F800000", SINGLE).kind, "infinity"), expectEq("-inf", decode("0xFF800000", SINGLE).value, -Infinity), expectEq("nan", decode("0x7F800005", SINGLE).kind, "nan")),
  },
  {
    id: "note-fp-5p5-custom",
    claim: "5.5 in 16 bits with 4-bit exponent = 4B00; range 255.9 / 0.015625",
    problem: () => {
      const f = { expBits: 4, fracBits: 11 }
      const r = range(f)
      return all(expectEq("hex", toHex(encode(5.5, f).bits), "4B00"), expectEq("emax", r.emax, 7), expectEq("emin", r.emin, -6), expectEq("small", r.smallest, 0.015625), close(r.largest, 255.9375, 1e-12) ? null : `largest ${r.largest}`)
    },
  },
  {
    id: "note-fp-add-binary",
    claim: "0.5 + (−0.4375) = 1.000 × 2^−4 = 0.0625",
    problem: () => {
      const r = fpAddSteps(0.5, -0.4375, { expBits: 8, fracBits: 3 })
      return all(expectEq("result", r.result, 0.0625), expectEq("exponent", r.encoded.e, -4))
    },
  },
  { id: "note-fp-add-decimal", claim: "9.999e1 + 1.610e−1 → 1.002e2 (4 digits)", problem: () => expectEq("rounded", Number((99.99 + 0.161).toPrecision(4)), 100.2) },
]
