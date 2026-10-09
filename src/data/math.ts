import type { Difficulty, Question } from '../lib/types'
import { rng, type Rng } from '../lib/rng'

// Original SAT-style math questions generated from templates (placeholder content).
// Each template produces stable instances from a seed, so IDs and answers never change between visits.

export const MATH_DOMAINS: Record<string, string[]> = {
  Algebra: ['Linear equations in one variable', 'Linear functions', 'Linear equations in two variables', 'Systems of two linear equations', 'Linear inequalities'],
  'Advanced Math': ['Equivalent expressions', 'Nonlinear equations', 'Nonlinear functions'],
  'Problem-Solving and Data Analysis': ['Ratios, rates, and proportions', 'Percentages', 'One-variable data', 'Probability', 'Two-variable data'],
  'Geometry and Trigonometry': ['Area and volume', 'Lines, angles, and triangles', 'Right triangles and trigonometry', 'Circles'],
}

const domainOf = (skill: string) => Object.keys(MATH_DOMAINS).find((d) => MATH_DOMAINS[d].includes(skill)) ?? 'Algebra'

type Draft = {
  stem: string
  explanation: string
  /** multiple choice: correct + 3 distractors (raw values, formatted by fmt) */
  correct?: number | string
  wrong?: (number | string)[]
  /** grid-in */
  spr?: string
  accepted?: string[]
  fmt?: (v: number | string) => string
}

interface Template {
  key: string
  skill: string
  difficulty: Difficulty
  make: (r: Rng) => Draft
}

const m = (v: number | string) => `$${v}$`
const money = (v: number | string) => `$\\$${typeof v === 'number' ? v.toFixed(2).replace(/\.00$/, '') : v}$`
const sign = (v: number) => (v < 0 ? `- ${-v}` : `+ ${v}`)

const T: Template[] = [
  // ── Algebra ──
  {
    key: 'lin1', skill: 'Linear equations in one variable', difficulty: 'E',
    make: (r) => {
      const a = r.int(2, 9), x = r.int(2, 12), b = r.int(1, 20), c = a * x + b
      return {
        stem: `If $${a}x + ${b} = ${c}$, what is the value of $x$?`,
        correct: x, wrong: [x + 1, c - b, x - 2 === x ? x + 3 : x - 2], fmt: m,
        explanation: `Subtract ${b} from both sides: $${a}x = ${c - b}$. Divide by ${a}: $x = ${x}$.`,
      }
    },
  },
  {
    key: 'lin2', skill: 'Linear equations in one variable', difficulty: 'M',
    make: (r) => {
      const a = r.int(3, 7), b = r.int(1, 6), c = r.int(1, a - 1), x = r.int(2, 10)
      const d = a * (x + b) - c * x
      return {
        stem: `What value of $x$ satisfies the equation $${a}(x + ${b}) = ${c}x + ${d}$?`,
        spr: String(x),
        explanation: `Distribute: $${a}x + ${a * b} = ${c}x + ${d}$. Subtract $${c}x$ and ${a * b}: $${a - c}x = ${d - a * b}$, so $x = ${x}$.`,
      }
    },
  },
  {
    key: 'lf1', skill: 'Linear functions', difficulty: 'E',
    make: (r) => {
      const k = r.int(2, 9), b = r.int(-9, 9), x = r.int(2, 8), y = k * x + b
      return {
        stem: `The function $f$ is defined by $f(x) = ${k}x ${sign(b)}$. What is the value of $f(${x})$?`,
        correct: y, wrong: [y + k, k * x, y - 2 * b === y ? y + 5 : y - 2 * b], fmt: m,
        explanation: `Substitute $x = ${x}$: $f(${x}) = ${k}(${x}) ${sign(b)} = ${y}$.`,
      }
    },
  },
  {
    key: 'lf2', skill: 'Linear functions', difficulty: 'M',
    make: (r) => {
      const slope = r.pick([2, 3, 4, -2, -3, 5]), x1 = r.int(-3, 3), y1 = r.int(-5, 8), dx = r.int(2, 5)
      const x2 = x1 + dx, y2 = y1 + slope * dx
      return {
        stem: `A line in the $xy$-plane passes through the points $(${x1}, ${y1})$ and $(${x2}, ${y2})$. What is the slope of the line?`,
        correct: slope, wrong: [-slope, slope * 2, dx], fmt: m,
        explanation: `Slope $= \\dfrac{${y2} - (${y1})}{${x2} - (${x1})} = \\dfrac{${y2 - y1}}{${dx}} = ${slope}$.`,
      }
    },
  },
  {
    key: 'lf3', skill: 'Linear functions', difficulty: 'H',
    make: (r) => {
      const fee = r.int(15, 40), rate = r.pick([12, 15, 18, 20, 25]), h = r.int(3, 8)
      const total = fee + rate * h
      return {
        stem: `A plumber charges a fixed fee plus an hourly rate. ${h === 8 ? 'An' : 'A'} ${h}-hour job costs $\\$${total}$ and a ${h + 2}-hour job costs $\\$${total + 2 * rate}$. What is the fixed fee, in dollars?`,
        spr: String(fee),
        explanation: `The extra 2 hours cost $\\$${2 * rate}$, so the hourly rate is $\\$${rate}$. Then fee $= ${total} - ${rate}(${h}) = ${fee}$.`,
      }
    },
  },
  {
    key: 'l2v', skill: 'Linear equations in two variables', difficulty: 'M',
    make: (r) => {
      const p = r.pick([2, 3, 4, 5]), nb = r.pick([6, 7, 8, 9]), k = r.int(2, 6), pens = r.int(3, 12)
      const total = p * pens + nb * k
      return {
        stem: `A store sells pens for $\\$${p}$ each and notebooks for $\\$${nb}$ each. Aziz spent exactly $\\$${total}$ and bought ${k} notebooks. How many pens did he buy?`,
        correct: pens, wrong: [pens + k, Math.round(total / p), pens - 1], fmt: m,
        explanation: `$${p}p + ${nb}(${k}) = ${total}$, so $${p}p = ${total - nb * k}$ and $p = ${pens}$.`,
      }
    },
  },
  {
    key: 'sys1', skill: 'Systems of two linear equations', difficulty: 'M',
    make: (r) => {
      const x = r.int(3, 15), y = r.int(1, x - 1)
      return {
        stem: `$$x + y = ${x + y}$$ $$x - y = ${x - y}$$ What is the value of $x$ in the solution $(x, y)$ to the system of equations above?`,
        spr: String(x),
        explanation: `Add the equations: $2x = ${2 * x}$, so $x = ${x}$.`,
      }
    },
  },
  {
    key: 'sys2', skill: 'Systems of two linear equations', difficulty: 'H',
    make: (r) => {
      const a = r.int(2, 5), b = r.int(2, 7), c = r.int(3, 11), mlt = r.int(2, 4)
      const d = mlt * c + r.int(1, 4)
      return {
        stem: `In the system $${a}x + ky = ${c}$ and $${a * mlt}x + ${b * mlt}y = ${d}$, $k$ is a constant. For what value of $k$ does the system have no solution?`,
        correct: b, wrong: [b * mlt, a, -b], fmt: m,
        explanation: `No solution means the lines are parallel and distinct. The second equation is the first scaled by ${mlt} on the left, so $k \\cdot ${mlt} = ${b * mlt}$, giving $k = ${b}$. Since $${d} \\ne ${mlt}(${c})$, the lines are distinct.`,
      }
    },
  },
  {
    key: 'ineq', skill: 'Linear inequalities', difficulty: 'M',
    make: (r) => {
      const cap = r.pick([500, 600, 750, 800]), driver = r.int(60, 90), box = r.pick([12, 15, 20, 25])
      const max = Math.floor((cap - driver) / box)
      return {
        stem: `An elevator can carry at most ${cap} kilograms. A worker weighing ${driver} kilograms rides with boxes that each weigh ${box} kilograms. What is the maximum number of boxes the worker can bring in one trip?`,
        correct: max, wrong: [max + 1, Math.floor(cap / box), max - 2], fmt: m,
        explanation: `$${driver} + ${box}b \\le ${cap}$, so $b \\le ${((cap - driver) / box).toFixed(2)}$. The greatest whole number is $${max}$.`,
      }
    },
  },
  // ── Advanced Math ──
  {
    key: 'eq1', skill: 'Equivalent expressions', difficulty: 'M',
    make: (r) => {
      const a = r.int(1, 9), b = r.int(-8, 8) || 3
      return {
        stem: `Which expression is equivalent to $(x + ${a})(x ${sign(b)})$?`,
        correct: `x^2 ${sign(a + b)}x ${sign(a * b)}`.replace('+ 0x ', ''),
        wrong: [`x^2 ${sign(a * b)}x ${sign(a + b)}`, `x^2 ${sign(a * b)}`, `x^2 ${sign(a - b)}x ${sign(a * b)}`], fmt: m,
        explanation: `Use FOIL: $x^2 ${sign(b)}x ${sign(a)}x ${sign(a * b)} = x^2 ${sign(a + b)}x ${sign(a * b)}$.`,
      }
    },
  },
  {
    key: 'eq2', skill: 'Equivalent expressions', difficulty: 'H',
    make: (r) => {
      const k = r.int(2, 6), a = r.int(2, 5)
      return {
        stem: `The expression $${k * a}x^2 - ${k * a * a * a}$ can be written as $${k * a}(x - c)(x + c)$, where $c$ is a positive constant. What is the value of $c$?`,
        spr: String(a),
        explanation: `Factor: $${k * a}(x^2 - ${a * a}) = ${k * a}(x - ${a})(x + ${a})$, so $c = ${a}$.`,
      }
    },
  },
  {
    key: 'ne1', skill: 'Nonlinear equations', difficulty: 'M',
    make: (r) => {
      const p = r.int(1, 9), q = r.int(1, 9) + p
      return {
        stem: `What is the sum of the solutions to $x^2 - ${p + q}x + ${p * q} = 0$?`,
        correct: p + q, wrong: [p * q, q - p, -(p + q)], fmt: m,
        explanation: `Factor: $(x - ${p})(x - ${q}) = 0$, so $x = ${p}$ or $x = ${q}$. The sum is $${p + q}$.`,
      }
    },
  },
  {
    key: 'ne2', skill: 'Nonlinear equations', difficulty: 'H',
    make: (r) => {
      const b = 2 * r.int(2, 9)
      return {
        stem: `In the equation $x^2 + ${b}x + c = 0$, $c$ is a constant. If the equation has exactly one real solution, what is the value of $c$?`,
        spr: String((b * b) / 4),
        explanation: `Exactly one solution means the discriminant is zero: $${b}^2 - 4c = 0$, so $c = ${(b * b) / 4}$.`,
      }
    },
  },
  {
    key: 'nf1', skill: 'Nonlinear functions', difficulty: 'M',
    make: (r) => {
      const h = r.int(-6, 6), k = r.int(-9, 9)
      return {
        stem: `The function $g$ is defined by $g(x) = (x ${sign(-h)})^2 ${sign(k)}$. What is the minimum value of $g(x)$?`,
        correct: k, wrong: [h, -k === k ? k + 2 : -k, h + k === k ? k - 3 : h + k], fmt: m,
        explanation: `A squared term is never negative, so the minimum occurs when $x = ${h}$, giving $g(${h}) = ${k}$.`,
      }
    },
  },
  {
    key: 'nf2', skill: 'Nonlinear functions', difficulty: 'H',
    make: (r) => {
      const p0 = r.pick([200, 300, 500, 800, 1200]), d = r.pick([3, 4, 5, 6]), n = r.int(2, 4)
      return {
        stem: `A population of bacteria starts at ${p0} and doubles every ${d} hours. What will the population be after ${d * n} hours?`,
        correct: p0 * 2 ** n, wrong: [p0 * 2 * n, p0 * 2 ** (n + 1), p0 + 2 ** n], fmt: m,
        explanation: `${d * n} hours is ${n} doubling periods: $${p0} \\cdot 2^{${n}} = ${p0 * 2 ** n}$.`,
      }
    },
  },
  // ── Problem-Solving and Data Analysis ──
  {
    key: 'pct1', skill: 'Percentages', difficulty: 'E',
    make: (r) => {
      const p = r.pick([10, 15, 20, 25, 30, 40]), n = r.pick([80, 120, 160, 200, 240, 300])
      const v = (p * n) / 100
      return {
        stem: `What is ${p}% of ${n}?`,
        correct: v, wrong: [v * 2, n - v, v / 2], fmt: m,
        explanation: `$${p / 100} \\times ${n} = ${v}$.`,
      }
    },
  },
  {
    key: 'pct2', skill: 'Percentages', difficulty: 'H',
    make: (r) => {
      const price = r.pick([200, 400, 500, 800]), up = r.pick([20, 25, 50]), down = r.pick([10, 20, 25])
      const final = price * (1 + up / 100) * (1 - down / 100)
      return {
        stem: `A jacket originally priced at $\\$${price}$ is marked up by ${up}%. Later, the new price is discounted by ${down}%. What is the final price?`,
        correct: final, wrong: [price * (1 + (up - down) / 100), price * (1 + up / 100), price * (1 - down / 100)], fmt: money,
        explanation: `$${price} \\times ${1 + up / 100} = ${price * (1 + up / 100)}$; then $\\times ${1 - down / 100} = ${final}$.`,
      }
    },
  },
  {
    key: 'rate1', skill: 'Ratios, rates, and proportions', difficulty: 'E',
    make: (r) => {
      const speed = r.pick([45, 50, 60, 72, 80]), h = r.int(2, 5)
      return {
        stem: `A bus travels ${speed * h} kilometers in ${h} hours at a constant speed. What is its speed in kilometers per hour?`,
        correct: speed, wrong: [speed * h, speed + h, speed - 10], fmt: m,
        explanation: `$${speed * h} \\div ${h} = ${speed}$ km/h.`,
      }
    },
  },
  {
    key: 'rate2', skill: 'Ratios, rates, and proportions', difficulty: 'M',
    make: (r) => {
      const flour = r.int(2, 4), sugar = r.int(1, 3), batch = r.int(3, 6)
      return {
        stem: `A recipe uses flour and sugar in a ratio of $${flour}:${sugar}$ by weight. If a baker uses ${sugar * batch * 100} grams of sugar, how many grams of flour are needed?`,
        spr: String(flour * batch * 100),
        explanation: `Each "part" is $${sugar * batch * 100} \\div ${sugar} = ${batch * 100}$ g, so flour $= ${flour} \\times ${batch * 100} = ${flour * batch * 100}$ g.`,
      }
    },
  },
  {
    key: 'data1', skill: 'One-variable data', difficulty: 'M',
    make: (r) => {
      const vals = Array.from({ length: 5 }, () => r.int(60, 95))
      const sum = vals.reduce((a, b) => a + b, 0)
      const target = Math.ceil(sum / 5) + r.int(1, 4)
      const sixth = target * 6 - sum
      return {
        stem: `A student's scores on five quizzes were ${vals.join(', ')}. What score does the student need on a sixth quiz for the mean of all six scores to be exactly ${target}?`,
        spr: String(sixth),
        explanation: `Six scores with mean ${target} sum to $${target * 6}$. The first five sum to $${sum}$, so the sixth must be $${target * 6} - ${sum} = ${sixth}$.`,
      }
    },
  },
  {
    key: 'data2', skill: 'One-variable data', difficulty: 'E',
    make: (r) => {
      const vals = r.shuffle([r.int(2, 5), r.int(6, 9), r.int(10, 14), r.int(15, 19), r.int(20, 30)])
      const sorted = [...vals].sort((a, b) => a - b)
      return {
        stem: `What is the median of the data set ${vals.join(', ')}?`,
        correct: sorted[2], wrong: [vals[2] === sorted[2] ? sorted[1] : vals[2], sorted[4] - sorted[0], sorted[3]], fmt: m,
        explanation: `In order: ${sorted.join(', ')}. The middle value is $${sorted[2]}$.`,
      }
    },
  },
  {
    key: 'prob', skill: 'Probability', difficulty: 'M',
    make: (r) => {
      const a = r.int(8, 20), b = r.int(8, 20), c = r.int(8, 20)
      const total = a + b + c
      const g = gcd(b, total)
      return {
        stem: `A survey of ${total} students found that ${a} prefer math, ${b} prefer science, and ${c} prefer literature. If one of these students is chosen at random, what is the probability that the student prefers science?`,
        correct: `\\dfrac{${b / g}}{${total / g}}`, wrong: [`\\dfrac{${a}}{${total}}`, `\\dfrac{${b}}{${a + c}}`, `\\dfrac{${c}}{${total}}`].map((s, i) => (i === 0 && a === b ? `\\dfrac{${b}}{${a}}` : s)), fmt: m,
        explanation: `Probability $= \\dfrac{${b}}{${total}}${g > 1 ? ` = \\dfrac{${b / g}}{${total / g}}` : ''}$.`,
      }
    },
  },
  {
    key: 'tv', skill: 'Two-variable data', difficulty: 'M',
    make: (r) => {
      const slope = r.pick([1.5, 2.5, 3.2, 4]), b = r.int(5, 30), x = r.int(4, 12)
      const y = +(slope * x + b).toFixed(1)
      return {
        stem: `The line of best fit for a scatterplot of hours studied, $x$, and test score gain, $y$, is $y = ${slope}x + ${b}$. Based on the line of best fit, what is the predicted score gain for a student who studies ${x} hours?`,
        correct: y, wrong: [+(slope * x).toFixed(1), +(slope + b + x).toFixed(1), +(y + slope).toFixed(1)], fmt: m,
        explanation: `$y = ${slope}(${x}) + ${b} = ${y}$.`,
      }
    },
  },
  // ── Geometry and Trigonometry ──
  {
    key: 'vol1', skill: 'Area and volume', difficulty: 'E',
    make: (r) => {
      const l = r.int(3, 12), w = r.int(2, 9), h = r.int(2, 8)
      return {
        stem: `A rectangular box has length ${l} cm, width ${w} cm, and height ${h} cm. What is the volume of the box, in cubic centimeters?`,
        correct: l * w * h, wrong: [l + w + h, 2 * (l * w + w * h + l * h), l * w], fmt: m,
        explanation: `$V = ${l} \\times ${w} \\times ${h} = ${l * w * h}$ cm³.`,
      }
    },
  },
  {
    key: 'vol2', skill: 'Area and volume', difficulty: 'M',
    make: (r) => {
      const rad = r.int(2, 6), h = r.int(3, 10)
      return {
        stem: `A cylinder has a radius of ${rad} inches and a height of ${h} inches. Which expression gives the volume of the cylinder, in cubic inches?`,
        correct: `${rad * rad * h}\\pi`, wrong: [`${2 * rad * h}\\pi`, `${rad * h}\\pi`, `${rad * rad * h * 2}\\pi`], fmt: m,
        explanation: `$V = \\pi r^2 h = \\pi (${rad})^2 (${h}) = ${rad * rad * h}\\pi$.`,
      }
    },
  },
  {
    key: 'tri1', skill: 'Lines, angles, and triangles', difficulty: 'E',
    make: (r) => {
      const a = r.int(30, 80), b = r.int(30, 80)
      return {
        stem: `In triangle $ABC$, the measure of angle $A$ is $${a}^\\circ$ and the measure of angle $B$ is $${b}^\\circ$. What is the measure, in degrees, of angle $C$?`,
        spr: String(180 - a - b),
        explanation: `The angles of a triangle sum to $180^\\circ$: $180 - ${a} - ${b} = ${180 - a - b}$.`,
      }
    },
  },
  {
    key: 'tri2', skill: 'Lines, angles, and triangles', difficulty: 'M',
    make: (r) => {
      const x = r.int(35, 75)
      return {
        stem: `Two parallel lines are cut by a transversal. One of the angles formed measures $${x}^\\circ$. Which of the following could be the measure of another angle formed?`,
        correct: `${180 - x}^\\circ`, wrong: [`${90 - x > 0 ? 90 - x : x + 10}^\\circ`, `${2 * x}^\\circ`, `${x + 90}^\\circ`], fmt: m,
        explanation: `Angles formed by a transversal across parallel lines are either equal or supplementary: $${x}^\\circ$ or $${180 - x}^\\circ$.`,
      }
    },
  },
  {
    key: 'rt1', skill: 'Right triangles and trigonometry', difficulty: 'M',
    make: (r) => {
      const [a, b, c] = r.pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]]), k = r.int(1, 3)
      return {
        stem: `A right triangle has legs of length ${a * k} and ${b * k}. What is the length of the hypotenuse?`,
        correct: c * k, wrong: [(a + b) * k, c * k + 1, b * k + 1 === c * k ? c * k + 2 : b * k + 1], fmt: m,
        explanation: `$\\sqrt{${a * k}^2 + ${b * k}^2} = \\sqrt{${(c * k) ** 2}} = ${c * k}$.`,
      }
    },
  },
  {
    key: 'rt2', skill: 'Right triangles and trigonometry', difficulty: 'H',
    make: (r) => {
      const [a, b, c] = r.pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]])
      return {
        stem: `In right triangle $PQR$, angle $R$ is the right angle, $PR = ${b}$, $QR = ${a}$, and $PQ = ${c}$. What is the value of $\\sin P$?`,
        correct: `\\dfrac{${a}}{${c}}`, wrong: [`\\dfrac{${b}}{${c}}`, `\\dfrac{${a}}{${b}}`, `\\dfrac{${c}}{${a}}`], fmt: m,
        explanation: `$\\sin P = \\dfrac{\\text{opposite}}{\\text{hypotenuse}} = \\dfrac{QR}{PQ} = \\dfrac{${a}}{${c}}$.`,
      }
    },
  },
  {
    key: 'circ1', skill: 'Circles', difficulty: 'H',
    make: (r) => {
      const h = r.int(1, 6), k = r.int(1, 6), rad = r.int(2, 9)
      const c = rad * rad - h * h - k * k
      return {
        stem: `The equation $x^2 - ${2 * h}x + y^2 - ${2 * k}y = ${c}$ defines a circle in the $xy$-plane. What is the radius of the circle?`,
        spr: String(rad),
        explanation: `Complete the squares: $(x - ${h})^2 + (y - ${k})^2 = ${c} + ${h * h} + ${k * k} = ${rad * rad}$. The radius is $\\sqrt{${rad * rad}} = ${rad}$.`,
      }
    },
  },
  {
    key: 'circ2', skill: 'Circles', difficulty: 'M',
    make: (r) => {
      const rad = r.int(3, 12), deg = r.pick([60, 90, 120, 180])
      const num = (2 * rad * deg) / 360
      const arc = Number.isInteger(num) ? `${num}\\pi` : `\\dfrac{${2 * rad * deg / 60}}{6}\\pi`
      return {
        stem: `A circle has radius ${rad}. What is the length of an arc of the circle that is intercepted by a central angle of $${deg}^\\circ$?`,
        correct: arc, wrong: [`${2 * rad}\\pi`, `${rad * rad}\\pi`, `${deg / 10}\\pi`], fmt: m,
        explanation: `Arc length $= \\dfrac{${deg}}{360} \\cdot 2\\pi(${rad}) = ${arc}$.`,
      }
    },
  },
]

function gcd(a: number, b: number): number {
  return b ? gcd(b, a % b) : a
}

function build(t: Template, i: number): Question {
  const seed = 1000 * (T.indexOf(t) + 1) + i * 7919
  const r = rng(seed)
  const d = t.make(r)
  const id = `m-${t.key}-${i + 1}`
  const base = { id, section: 'math' as const, domain: domainOf(t.skill), skill: t.skill, difficulty: t.difficulty }
  if (d.spr !== undefined) {
    return { ...base, type: 'spr', stem: d.stem, answer: d.spr, accepted: d.accepted, explanation: d.explanation }
  }
  const fmt = d.fmt ?? m
  const correct = fmt(d.correct!)
  // De-duplicate distractors so all four choices are distinct.
  const wrong: string[] = []
  let bump = 1
  for (const w of d.wrong!) {
    let s = fmt(w)
    while (s === correct || wrong.includes(s)) s = fmt(typeof w === 'number' ? w + bump++ : `${w}+${bump++}`)
    wrong.push(s)
  }
  const choices = r.shuffle([correct, ...wrong])
  return { ...base, type: 'mcq', stem: d.stem, choices, answer: 'ABCD'[choices.indexOf(correct)], explanation: d.explanation }
}

/** Number of distinct instances generated per template. */
const PER_TEMPLATE = 4

export const MATH_QUESTIONS: Question[] = T.flatMap((t) => Array.from({ length: PER_TEMPLATE }, (_, i) => build(t, i)))

/** Extra instances reserved for full-length tests, so tests don't simply repeat the Question Bank. */
export function mathTestPool(testIndex: number): Question[] {
  return T.flatMap((t) =>
    Array.from({ length: 3 }, (_, i) => {
      const q = build(t, 100 + testIndex * 10 + i)
      return { ...q, id: `t${testIndex}-${q.id}` }
    }),
  )
}
