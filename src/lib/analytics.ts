import { getQuestion } from '../data/tests'
import { MATH_DOMAINS } from '../data/math'
import { RW_DOMAINS } from '../data/rw'
import type { Attempt, Section, UserData } from './types'

export interface SkillStat {
  skill: string
  domain: string
  section: Section
  correct: number
  total: number
  accuracy: number
}

const ALL_SKILLS: { skill: string; domain: string; section: Section }[] = [
  ...Object.entries(RW_DOMAINS).flatMap(([domain, skills]) => skills.map((skill) => ({ skill, domain, section: 'rw' as const }))),
  ...Object.entries(MATH_DOMAINS).flatMap(([domain, skills]) => skills.map((skill) => ({ skill, domain, section: 'math' as const }))),
]

/** Accuracy per skill across full exams and Question Bank practice. */
export function skillStats(data: UserData): SkillStat[] {
  const acc = new Map<string, { c: number; t: number }>()
  const add = (qid: string, correct: boolean) => {
    const q = getQuestion(qid)
    if (!q) return
    const cur = acc.get(q.skill) ?? { c: 0, t: 0 }
    cur.t += 1
    if (correct) cur.c += 1
    acc.set(q.skill, cur)
  }
  for (const a of data.attempts) for (const m of a.modules) for (const r of m.responses) add(r.qid, r.correct)
  for (const [qid, r] of Object.entries(data.bq)) add(qid, r.correct)
  return ALL_SKILLS.map((s) => {
    const v = acc.get(s.skill) ?? { c: 0, t: 0 }
    return { ...s, correct: v.c, total: v.t, accuracy: v.t ? (v.c / v.t) * 100 : 0 }
  })
}

export function domainStats(stats: SkillStat[]) {
  const out = new Map<string, { domain: string; section: Section; c: number; t: number }>()
  for (const s of stats) {
    const cur = out.get(s.domain) ?? { domain: s.domain, section: s.section, c: 0, t: 0 }
    cur.c += s.correct
    cur.t += s.total
    out.set(s.domain, cur)
  }
  return [...out.values()].map((d) => ({ ...d, accuracy: d.t ? (d.c / d.t) * 100 : 0 }))
}

export function weakestSkills(stats: SkillStat[], n = 3) {
  return stats.filter((s) => s.total >= 3).sort((a, b) => a.accuracy - b.accuracy).slice(0, n)
}

export const fullAttempts = (data: UserData) => data.attempts.filter((a) => a.kind === 'full').sort((a, b) => a.startedAt.localeCompare(b.startedAt))

export function predictedScore(data: UserData) {
  const full = fullAttempts(data)
  if (!full.length) return null
  // Weighted toward the most recent exams.
  const recent = full.slice(-3)
  const weights = recent.map((_, i) => i + 1)
  const sum = recent.reduce((acc, a, i) => acc + a.scores.total * weights[i], 0)
  return Math.round(sum / weights.reduce((a, b) => a + b, 0) / 10) * 10
}

export function attemptAccuracy(a: Attempt) {
  const rs = a.modules.flatMap((m) => m.responses)
  return rs.length ? rs.filter((r) => r.correct).length / rs.length : 0
}

export const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }) => new Date(iso).toLocaleDateString('en-US', opts)

export function daysUntil(date?: string) {
  if (!date) return null
  const d = Math.ceil((new Date(date + 'T09:00:00').getTime() - Date.now()) / 864e5)
  return d
}
