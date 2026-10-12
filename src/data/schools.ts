import type { Org, SchoolClass, Teacher } from '../lib/types'
import { hashString, rng } from '../lib/rng'
import { MATH_DOMAINS } from './math'
import { RW_DOMAINS } from './rw'

// Fabricated school network for the demo. Everything here is deterministic, so the same
// schools, students and scores appear on every device and after every reload.

export const DOMAINS = [...Object.keys(RW_DOMAINS), ...Object.keys(MATH_DOMAINS)]
export const DOMAIN_SHORT: Record<string, string> = {
  'Information and Ideas': 'Info & Ideas',
  'Craft and Structure': 'Craft',
  'Expression of Ideas': 'Expression',
  'Standard English Conventions': 'Conventions',
  Algebra: 'Algebra',
  'Advanced Math': 'Adv. Math',
  'Problem-Solving and Data Analysis': 'Data Analysis',
  'Geometry and Trigonometry': 'Geometry',
}

/** The 14 regions of Uzbekistan, with an approximate tile-map position (col, row) and a demo baseline. */
export const REGIONS: { name: string; city: string; col: number; row: number; base: number }[] = [
  { name: 'Republic of Karakalpakstan', city: 'Nukus', col: 0, row: 0, base: 0.4 },
  { name: 'Khorezm', city: 'Urgench', col: 0, row: 1, base: 0.44 },
  { name: 'Navoi', city: 'Navoi', col: 1, row: 0, base: 0.46 },
  { name: 'Bukhara', city: 'Bukhara', col: 1, row: 1, base: 0.5 },
  { name: 'Samarkand', city: 'Samarkand', col: 2, row: 1, base: 0.55 },
  { name: 'Kashkadarya', city: 'Karshi', col: 2, row: 2, base: 0.43 },
  { name: 'Surkhandarya', city: 'Termez', col: 3, row: 2, base: 0.41 },
  { name: 'Jizzakh', city: 'Jizzakh', col: 3, row: 1, base: 0.45 },
  { name: 'Syrdarya', city: 'Gulistan', col: 3, row: 0, base: 0.44 },
  { name: 'Tashkent Region', city: 'Nurafshon', col: 4, row: 0, base: 0.53 },
  { name: 'Tashkent City', city: 'Tashkent', col: 4, row: 1, base: 0.64 },
  { name: 'Namangan', city: 'Namangan', col: 5, row: 0, base: 0.52 },
  { name: 'Fergana', city: 'Fergana', col: 5, row: 1, base: 0.51 },
  { name: 'Andijan', city: 'Andijan', col: 6, row: 1, base: 0.5 },
]

const FIRST_F = ['Dilnoza', 'Madina', 'Sevara', 'Malika', 'Nilufar', 'Zarina', 'Shahzoda', 'Gulnora', 'Kamola', 'Mohinur', 'Aziza', 'Feruza', 'Laylo', 'Nodira', 'Sabina', 'Mehribon', 'Ozoda', 'Barno', 'Durdona', 'Charos']
const FIRST_M = ['Jasur', 'Bekzod', 'Sardor', 'Javohir', 'Otabek', 'Aziz', 'Diyorbek', 'Shohruh', 'Islom', 'Jahongir', 'Abdulloh', 'Bobur', 'Temur', 'Sanjar', 'Doniyor', 'Asadbek', 'Muhammadali', 'Ulugbek', 'Farrux', 'Behruz']
const LAST = ['Karimov', 'Rahimov', 'Tursunov', 'Yusupov', 'Abdullayev', 'Ergashev', 'Nazarov', 'Saidov', 'Qodirov', 'Mirzayev', 'Xolmatov', 'Hasanov', 'Ismoilov', 'Raximov', 'Sobirov', 'Toshmatov', 'Umarov', 'Valiyev', 'Zokirov', 'Normatov', 'Aliyev', 'Jurayev', 'Sharipov', 'Mamatov']
const TEACHERS = ['Nargiza Usmonova', 'Rustam Aliyev', 'Dilfuza Karimova', 'Anvar Rashidov', 'Gulchehra Saidova', 'Botir Ergashev', 'Shoira Nazarova', 'Kamol Yusupov', 'Lola Mirzayeva', 'Farhod Tursunov']

export function studentName(seed: number) {
  const r = rng(seed)
  const female = r.next() < 0.5
  const first = female ? r.pick(FIRST_F) : r.pick(FIRST_M)
  const last = r.pick(LAST)
  return `${first} ${female ? `${last}a` : last}`
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '')

export function loginFor(name: string, org: Org) {
  const domain = slug(org.city) + '.horizonsat.uz'
  return `${slug(name)}@${domain}`
}

export function tempPassword(seed?: number) {
  const r = seed == null ? null : rng(seed)
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor((r ? r.next() : Math.random()) * chars.length)]).join('')
}

export const NETWORK_ID = 'org-network'
export const PRIVATE_ID = 'org-registan'
export const GOV_DEMO_ID = 'org-gov-tashkent-city-p'

const inMonths = (n: number) => {
  const d = new Date()
  d.setMonth(d.getMonth() + n)
  return d.toISOString().slice(0, 10)
}

/** Builds the fabricated organizations, classes and teachers used to seed the demo. */
export function seedOrgs(now: string) {
  const orgs: Org[] = []
  const classes: SchoolClass[] = []
  const teachers: Teacher[] = []

  orgs.push({ id: NETWORK_ID, name: 'State Specialized Schools Network', kind: 'network', tier: 'network', region: 'Tashkent City', city: 'Tashkent', seats: 8000, licenseUntil: inMonths(14), createdAt: now, generated: 0, seed: 1, level: 0.5 })
  orgs.push({ id: PRIVATE_ID, name: 'Registan Private School', kind: 'private', tier: 'private', region: 'Samarkand', city: 'Samarkand', seats: 200, licenseUntil: inMonths(9), createdAt: now, generated: 142, seed: 9001, level: 0.6 })

  REGIONS.forEach((reg, ri) => {
    const kinds: { tier: 'presidential' | 'specialized'; label: string; bonus: number }[] = [
      { tier: 'presidential', label: `${reg.city} Presidential School`, bonus: 0.14 },
      { tier: 'specialized', label: `${reg.city} Specialized School No. 1`, bonus: 0.03 },
      { tier: 'specialized', label: `${reg.city} Specialized School No. 2`, bonus: -0.02 },
    ]
    kinds.forEach((k, ki) => {
      const id = ri === 10 && ki === 0 ? GOV_DEMO_ID : `org-gov-${slug(reg.name)}-${ki}`
      const seed = hashString(id)
      const r = rng(seed)
      orgs.push({
        id, name: k.label, kind: 'government', tier: k.tier, region: reg.name, city: reg.city, parentId: NETWORK_ID,
        seats: k.tier === 'presidential' ? 240 : 180, licenseUntil: inMonths(14), createdAt: now,
        generated: k.tier === 'presidential' ? r.int(110, 150) : r.int(70, 130), seed, level: Math.min(0.85, reg.base + k.bonus),
      })
    })
  })

  for (const o of orgs) {
    if (o.kind === 'network') continue
    const r = rng(o.seed + 7)
    const names = r.shuffle(TEACHERS)
    const t: Teacher[] = [0, 1, 2, 3].map((i) => ({
      id: `${o.id}-t${i}`,
      orgId: o.id,
      name: names[i],
      email: loginFor(names[i], o),
      subject: i % 2 === 0 ? 'Reading and Writing' : 'Math',
    }))
    teachers.push(...t)
    const groups = o.kind === 'private' ? ['9-A', '10-A', '10-B', '11-A', '11-B'] : ['9-A', '10-A', '10-B', '11-A', '11-B', '11-C']
    groups.forEach((g, i) => classes.push({ id: `${o.id}-c${i}`, orgId: o.id, name: g, grade: g.split('-')[0], teacherId: t[i % t.length].id }))
  }
  return { orgs, classes, teachers }
}

/** National pattern: students are typically stronger in some domains than others (percentage points). */
const DOMAIN_BIAS: Record<string, number> = {
  'Information and Ideas': 3,
  'Craft and Structure': -5,
  'Expression of Ideas': 6,
  'Standard English Conventions': -2,
  Algebra: 7,
  'Advanced Math': -7,
  'Problem-Solving and Data Analysis': 2,
  'Geometry and Trigonometry': -6,
}

export interface RosterStudent {
  id: string
  name: string
  grade: string
  classId: string | undefined
  orgId: string
  real: boolean
  userId?: string
  email?: string
  predicted: number | null
  rw: number | null
  math: number | null
  /** Full-length exam totals over time, oldest first. */
  history: { date: string; total: number }[]
  /** Accuracy (0–100) per SAT domain. */
  domains: Record<string, number>
  lastActiveDays: number | null
  examsTaken: number
  examsThisMonth: number
  questionsAnswered: number
  targetScore: number
}

const round10 = (n: number) => Math.round(n / 10) * 10
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n))

const rosterCache = new Map<string, RosterStudent[]>()

/** Fabricated students for a school, generated from the school's seed. */
export function generatedRoster(org: Org, classes: SchoolClass[]): RosterStudent[] {
  const key = `${org.id}:${org.generated}:${classes.map((c) => c.id).join(',')}`
  const hit = rosterCache.get(key)
  if (hit) return hit
  const orgClasses = classes.filter((c) => c.orgId === org.id)
  // Each school has its own strengths and weaknesses on top of the national pattern.
  const br = rng(org.seed + 99)
  const schoolBias: Record<string, number> = Object.fromEntries(DOMAINS.map((d) => [d, Math.round((br.next() - 0.5) * 14)]))
  const out: RosterStudent[] = []
  for (let i = 0; i < org.generated; i++) {
    const seed = org.seed * 31 + i * 7919
    const r = rng(seed)
    const cls = orgClasses.length ? orgClasses[i % orgClasses.length] : undefined
    const gradeBonus = cls ? (Number(cls.grade) - 10) * 0.03 : 0
    const ability = clamp(org.level + gradeBonus + (r.next() + r.next() + r.next() - 1.5) * 0.22, 0.05, 0.98)
    const total = clamp(round10(620 + 920 * ability), 560, 1570)
    const split = 0.5 + (r.next() - 0.5) * 0.08
    const rw = clamp(round10(total * split), 200, 800)
    const math = clamp(total - rw, 200, 800)
    const exams = r.int(1, 5)
    const growth = r.int(20, 160)
    const history = Array.from({ length: exams }, (_, k) => {
      const d = new Date()
      d.setMonth(d.getMonth() - (exams - 1 - k), r.int(3, 26))
      const t = exams === 1 ? total : round10(total - growth * (1 - k / (exams - 1)) + (r.next() - 0.5) * 30)
      return { date: d.toISOString(), total: clamp(k === exams - 1 ? total : t, 400, 1600) }
    })
    const domains: Record<string, number> = {}
    for (const d of DOMAINS) domains[d] = clamp(Math.round(100 * (0.12 + ability * 0.85 + (r.next() - 0.5) * 0.22) + (DOMAIN_BIAS[d] ?? 0) + schoolBias[d]), 8, 99)
    const roll = r.next()
    const lastActiveDays = roll < 0.05 ? null : Math.floor(Math.pow(r.next(), 2.2) * 40)
    out.push({
      id: `g-${org.id}-${i}`,
      name: studentName(seed),
      grade: cls?.grade ?? '11',
      classId: cls?.id,
      orgId: org.id,
      real: false,
      predicted: lastActiveDays == null ? null : total,
      rw: lastActiveDays == null ? null : rw,
      math: lastActiveDays == null ? null : math,
      history: lastActiveDays == null ? [] : history,
      domains,
      lastActiveDays,
      examsTaken: lastActiveDays == null ? 0 : exams,
      examsThisMonth: lastActiveDays != null && lastActiveDays < 25 && r.next() < 0.7 ? 1 : 0,
      questionsAnswered: lastActiveDays == null ? 0 : r.int(40, 900),
      targetScore: clamp(round10(total + r.int(60, 220)), 1000, 1600),
    })
  }
  rosterCache.set(key, out)
  return out
}

export interface SchoolSummary {
  students: number
  tested: number
  avg: number | null
  median: number | null
  avgRw: number | null
  avgMath: number | null
  active7: number
  inactive14: number
  participation: number
  growth: number | null
  above1400: number
  domains: Record<string, number>
}

export function summarize(roster: RosterStudent[]): SchoolSummary {
  const tested = roster.filter((s) => s.predicted != null)
  const scores = tested.map((s) => s.predicted!).sort((a, b) => a - b)
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)
  const growthVals = tested.filter((s) => s.history.length > 1).map((s) => s.history[s.history.length - 1].total - s.history[0].total)
  const domains: Record<string, number> = {}
  for (const d of DOMAINS) domains[d] = avg(tested.map((s) => s.domains[d] ?? 0)) ?? 0
  return {
    students: roster.length,
    tested: tested.length,
    avg: scores.length ? round10(avg(scores)!) : null,
    median: scores.length ? scores[Math.floor(scores.length / 2)] : null,
    avgRw: tested.length ? round10(avg(tested.map((s) => s.rw!))!) : null,
    avgMath: tested.length ? round10(avg(tested.map((s) => s.math!))!) : null,
    active7: roster.filter((s) => s.lastActiveDays != null && s.lastActiveDays <= 7).length,
    inactive14: roster.filter((s) => s.lastActiveDays == null || s.lastActiveDays > 14).length,
    participation: roster.length ? roster.filter((s) => s.examsThisMonth > 0).length / roster.length : 0,
    growth: growthVals.length ? Math.round(avg(growthVals)!) : null,
    above1400: scores.filter((x) => x >= 1400).length,
    domains,
  }
}

/** Monthly average total for the last `months` months, from students' exam histories. */
export function monthlyTrend(roster: RosterStudent[], months = 6) {
  const out: { label: string; value: number | null }[] = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i, 1)
    const y = d.getFullYear()
    const m = d.getMonth()
    const vals: number[] = []
    for (const s of roster) {
      // Most recent exam at or before the end of that month.
      const upto = s.history.filter((h) => {
        const hd = new Date(h.date)
        return hd.getFullYear() < y || (hd.getFullYear() === y && hd.getMonth() <= m)
      })
      if (upto.length) vals.push(upto[upto.length - 1].total)
    }
    out.push({ label: d.toLocaleDateString('en-US', { month: 'short' }), value: vals.length ? round10(vals.reduce((a, b) => a + b, 0) / vals.length) : null })
  }
  return out
}

export function histogram(roster: RosterStudent[], step = 100) {
  const bins: { from: number; to: number; count: number }[] = []
  for (let f = 400; f < 1600; f += step) bins.push({ from: f, to: f + step, count: 0 })
  for (const s of roster) {
    if (s.predicted == null) continue
    const b = bins.find((x) => s.predicted! >= x.from && s.predicted! < x.to) ?? bins[bins.length - 1]
    b.count++
  }
  return bins.filter((b) => b.from >= 500)
}

/** Deterministic pseudo-random 0–1 for a pair of ids (used for fabricated completion data). */
export const pairRandom = (a: string, b: string) => rng(hashString(a + '|' + b)).next()
