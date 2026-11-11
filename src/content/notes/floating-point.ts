import { md } from "../md"

export const floatingPointNote = md`
## Why floating point

Integers cannot hold non-integral numbers, or very small and very large ones. Floating point represents them like **scientific notation**:
- $-2.34\times10^{56}$ (normalised);
- $+0.002\times10^{-4}$ (not normalised);
- $+987.02\times10^{9}$ (not normalised).

In binary, a **normalised** number has exactly one 1 before the binary point:
$$
\pm 1.xxxxxxx_2\times2^{yyyy}
$$
C's types \`float\` and \`double\` use this.

## The IEEE 754 standard

IEEE Std 754-1985 was developed because manufacturers' representations had diverged, which caused portability problems for scientific code. It is now almost universally adopted. It has two main representations:
- **single precision**: 32 bits;
- **double precision**: 64 bits.

\`\`\`fig
fp-single
fp-double
\`\`\`

The value of a normalised number is
$$
x = (-1)^{S}\times(1+\text{Fraction})\times2^{(\text{Exponent}-\text{Bias})}
$$

- **S**: the sign bit. 0 means non-negative, 1 means negative.
- **Significand**: normalised so that $1.0 \le |\text{significand}| < 2.0$. It always has a leading 1 before the binary point, so that 1 is **not stored** (the **hidden bit**). The significand is the Fraction with the "1." restored.
- **Exponent**: stored in **excess (biased) representation**: stored value = actual exponent + Bias. This makes the stored exponent unsigned.
- **Bias**: 127 for single, 1023 for double.

## Why a bias

The slide's reason: the bias **makes the exponent field unsigned**. Negative exponents (tiny numbers) still get non-negative bit patterns.

The consequence, which exam questions ask about: the exponent field sits right after the sign bit and before the fraction. So, for two non-negative floats, the larger number always has the larger bit pattern read as an unsigned integer. Floats can therefore be compared and sorted with **integer comparison hardware**. In two's complement, a negative exponent would look like a huge positive pattern and break this.

For a format with an $e$-bit exponent, the usual bias is
$$
\text{Bias} = 2^{e-1}-1
$$
which gives 127 for $e = 8$, 1023 for $e = 11$, and 7 for $e = 4$. This splits the usable exponents almost evenly between positive and negative.

## Single-precision range

The exponent patterns 0000 0000 and 1111 1111 are **reserved**.

**Smallest positive normalised value**
- Exponent field 0000 0001, so the actual exponent is $1-127 = -126$.
- Fraction 000…00, so the significand is 1.0.
- Value: $\pm1.0\times2^{-126} \approx \pm1.2\times10^{-38}$.

**Largest value**
- Exponent field 1111 1110, so the actual exponent is $254-127 = +127$.
- Fraction 111…11, so the significand is $2 - 2^{-23} \approx 2.0$.
- Value: $\pm(2-2^{-23})\times2^{127} \approx \pm3.4\times10^{38}$.

## Double-precision range

Exponents 000…00 and 111…11 are reserved.

- **Smallest:** exponent field 000 0000 0001, actual exponent $1-1023 = -1022$; value $\pm1.0\times2^{-1022} \approx \pm2.2\times10^{-308}$.
- **Largest:** exponent field 111 1111 1110, actual exponent $2046-1023 = +1023$; value $\pm(2-2^{-52})\times2^{1023} \approx \pm1.8\times10^{308}$.

## Precision

All fraction bits are significant, so the relative precision is about one unit in the last fraction bit:
- **Single:** about $2^{-23}$, equivalent to $23\times\log_{10}2 \approx 23\times0.3 \approx 6$ decimal digits.
- **Double:** about $2^{-52}$, equivalent to $52\times\log_{10}2 \approx 52\times0.3 \approx 16$ decimal digits.

## The reserved exponents

The slides only say the all-0s and all-1s exponents are reserved. What they encode (from the book):

| Exponent field | Fraction | Meaning |
|---|---|---|
| all 0s | 0 | ±0 |
| all 0s | ≠ 0 | denormalised numbers (not covered on the slides) |
| all 1s | 0 | ±infinity |
| all 1s | ≠ 0 | NaN (not a number), e.g. 0/0 |

So in single precision, $+\infty$ is 0 1111 1111 000…0 = 7F80 0000 (hex) and $-\infty$ is FF80 0000 (hex).

## Encoding a number: the method

1. **Sign:** S = 1 if negative, else 0.
2. **Binary:** write $|x|$ in binary. For the fraction part, multiply by 2 repeatedly and take the integer parts.
3. **Normalise:** shift the binary point to just after the leading 1: $1.f\times2^{E}$.
4. **Exponent field:** $E + \text{Bias}$, in binary at the exponent width.
5. **Fraction field:** the bits $f$ after the point, padded with 0s on the right to the fraction width (round if there are too many).
6. Write S | exponent | fraction, and group in fours for hex.

**Example (slide): −0.75.**
1. S = 1.
2. $0.75 = 0.11_2$ (0.75 × 2 = 1.5 → 1; 0.5 × 2 = 1.0 → 1).
3. $0.11_2 = 1.1_2\times2^{-1}$, so $-0.75 = (-1)^1\times1.1_2\times2^{-1}$.
4. Exponent: single $-1+127 = 126 = 0111\,1110_2$; double $-1+1023 = 1022 = 011\,1111\,1110_2$.
5. Fraction: $1000\ldots00_2$.
6. Single: 1 01111110 1000…00 = BF40 0000 (hex). Double: 1 01111111110 1000…00 = BFE8 0000 0000 0000 (hex).

## Decoding a number: the method

1. Split the bits into S, exponent field and fraction field.
2. Check for a reserved exponent (all 0s or all 1s); see the table above.
3. Actual exponent = field − Bias.
4. Significand = 1 + fraction (each fraction bit $i$ after the point is worth $2^{-i}$).
5. $x = (-1)^S\times\text{significand}\times2^{\text{actual exponent}}$.

**Example (slide): 1100 0000 1010 0000 … 00.**
1. S = 1; exponent field 1000 0001 = 129; fraction 0100…00.
2. Not reserved.
3. Actual exponent = 129 − 127 = 2.
4. Significand = $1 + 0.01_2 = 1.25$.
5. $x = (-1)^1\times1.25\times2^{2} = -5.0$.

## Formats other than single and double

Exams often invent a format, e.g. 16 bits with a 4-bit exponent. Everything carries over:
- fraction bits $f$ = total bits − 1 − exponent bits $e$;
- Bias = $2^{e-1}-1$ unless the question says otherwise;
- the all-0s and all-1s exponents are reserved, so the largest actual exponent is $(2^{e}-2)-\text{Bias}$ and the smallest is $1-\text{Bias}$;
- largest value $= (2-2^{-f})\times2^{E_{\max}}$; smallest normalised value $= 1.0\times2^{E_{\min}}$.

**Example: 5.5 in a 16-bit format with a 4-bit exponent.**
- $f = 16-1-4 = 11$ fraction bits; Bias = $2^{3}-1 = 7$.
- $5.5 = 101.1_2 = 1.011_2\times2^{2}$.
- S = 0; exponent field $2+7 = 9 = 1001$; fraction 011 0000 0000.
- Bits: 0 1001 01100000000 = 0100 1011 0000 0000 = 4B00 (hex).
- Range: $E_{\max} = 14-7 = 7$, $E_{\min} = 1-7 = -6$. Largest $(2-2^{-11})\times2^{7} \approx 255.9$; smallest normalised $2^{-6} = 0.015625$.

## Floating-point addition

**The four steps (slide, 4-digit decimal):** $9.999\times10^{1} + 1.610\times10^{-1}$.

1. **Align decimal points:** shift the number with the smaller exponent right until the exponents match.
   $9.999\times10^{1} + 0.016\times10^{1}$ (only 4 digits are kept)
2. **Add significands:**
   $9.999\times10^{1} + 0.016\times10^{1} = 10.015\times10^{1}$
3. **Normalise the result and check for over/underflow:**
   $1.0015\times10^{2}$
4. **Round and renormalise if necessary:**
   $1.002\times10^{2}$

**Now in binary (slide, 4-digit):** $1.000_2\times2^{-1} + (-1.110_2\times2^{-2})$, that is $0.5 + (-0.4375)$.

1. **Align binary points:** shift the smaller-exponent number right by $-1-(-2) = 1$ place.
   $1.000_2\times2^{-1} + (-0.111_2\times2^{-1})$
2. **Add significands:**
   $1.000_2\times2^{-1} + (-0.111_2\times2^{-1}) = 0.001_2\times2^{-1}$
3. **Normalise and check:** shift left 3 places, decreasing the exponent by 3.
   $1.000_2\times2^{-4}$. The exponent $-4$ is between $-126$ and $+127$: no overflow or underflow.
4. **Round:** $1.000_2\times2^{-4}$ fits in 4 digits, no change. Value $= 2^{-4} = 0.0625$, and indeed $0.5-0.4375 = 0.0625$.

**Overflow and underflow in step 3**
- **Overflow:** after normalising, the exponent is larger than the largest allowed (for single, the exponent field would reach 1111 1111, i.e. $E > 127$). The result is too large.
- **Underflow:** the exponent is smaller than the smallest allowed (for single, $E < -126$). The result is too small to normalise.

Step 4 can itself un-normalise the significand (e.g. rounding 1.111 up gives 10.000), which is why the slide says "round and **renormalise** if necessary", looping back to step 3.

## FP adder hardware

The FP adder is much more complex than an integer adder (slide):
- doing it in one clock cycle would take too long, much longer than integer operations;
- a slower clock would penalise **all** instructions;
- so the FP adder usually takes several cycles, and it can be pipelined.

\`\`\`fig
fp-adder
\`\`\`

| Step | Hardware (slide 22) |
|---|---|
| 1. Compare exponents, shift the smaller number right | Small ALU computes the exponent difference; Control picks the smaller number's significand and the shift amount; Shift right |
| 2. Add | Big ALU adds the significands |
| 3. Normalise | Shift left or right moves the significand; Increment or decrement adjusts the exponent |
| 4. Round | Rounding hardware; if the result is no longer normalised, back to step 3 |
`
