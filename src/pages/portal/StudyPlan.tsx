import { motion } from 'framer-motion'
import { Brain, Check, Lock, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { daysUntil, fmtDate, predictedScore, skillStats, weakestSkills } from '../../lib/analytics'
import { addPlan, togglePlanTask, uid, updateProfile, usage, useSession } from '../../lib/store'
import type { StudyPlan as Plan, UserData } from '../../lib/types'
import { PageTitle } from './Layout'

/**
 * Demo plan generator: rule-based, built from the student's weakest skills, score gap and test date.
 * In production this is where the AI model call goes.
 */
function generatePlan(data: UserData, target: number, testDate: string): Plan {
  const baseline = predictedScore(data) ?? 1000
  const days = Math.max(14, daysUntil(testDate) ?? 56)
  const weeksCount = Math.min(8, Math.max(4, Math.round(days / 7)))
  const weak = weakestSkills(skillStats(data), 6)
  const rw = weak.filter((s) => s.section === 'rw')
  const math = weak.filter((s) => s.section === 'math')
  const focusQueue = [...rw, ...math].sort((a, b) => a.accuracy - b.accuracy)
  const gap = Math.max(0, target - baseline)
  const perWeek = Math.round(gap / weeksCount / 5) * 5

  const weeks = Array.from({ length: weeksCount }, (_, i) => {
    const last = i === weeksCount - 1
    const a = focusQueue[i % Math.max(1, focusQueue.length)]
    const b = focusQueue[(i + 1) % Math.max(1, focusQueue.length)]
    if (last)
      return {
        week: i + 1,
        focus: 'Final review & test readiness',
        tasks: ['Take a full-length practice test under real timing', 'Review every incorrect and marked question', 'Light vocabulary review — no new words', 'Rest the day before the test'],
      }
    const tasks = [
      a ? `Question Bank: 20 ${a.skill} questions (start Medium, then Hard)` : 'Question Bank: 20 mixed Reading and Writing questions',
      b && b.skill !== a?.skill ? `Question Bank: 15 ${b.skill} questions` : 'Question Bank: 15 mixed Math questions',
      'Re-read explanations for every question you miss and log the reason',
      `Vocabulary: learn ${i % 2 ? 35 : 30} new words and pass one quiz`,
    ]
    if (i % 2 === 1) tasks.push('Take a full-length practice test, then review it the next day')
    else tasks.push('Quick practice set: "My weakest skills"')
    return { week: i + 1, focus: a ? `${a.skill}${b && b.skill !== a.skill ? ` + ${b.skill}` : ''}` : 'Foundations', tasks }
  })

  const names = focusQueue.slice(0, 3).map((s) => s.skill)
  const summary =
    gap > 0
      ? `You're currently predicted at ${baseline}. To reach ${target} by ${fmtDate(testDate, { month: 'long', day: 'numeric' })}, aim for about +${perWeek} points per week over ${weeksCount} weeks. Your biggest opportunities are ${names.join(', ')}.`
      : `You're already predicted at ${baseline}, at or above your ${target} target. This plan keeps you sharp and pushes your weakest skills: ${names.join(', ')}.`

  return { id: uid(), createdAt: new Date().toISOString(), baseline, target, testDate, weakSkills: names, summary, weeks }
}

const STEPS = ['Reading your exam results', 'Measuring accuracy across 19 skills', 'Finding your biggest opportunities', 'Building your week-by-week plan']

export default function StudyPlan() {
  const { user, data } = useSession()
  const u = usage(user, data)
  const plan = data.plans[data.plans.length - 1]
  const [generating, setGenerating] = useState(false)
  const [step, setStep] = useState(0)
  const [target, setTarget] = useState(user?.targetScore ?? 1400)
  const [testDate, setTestDate] = useState(user?.testDate ?? '')
  const [showForm, setShowForm] = useState(!plan)

  const latest = useRef({ data, target, testDate })
  latest.current = { data, target, testDate }

  // Step through the "thinking" animation, then save the plan once.
  useEffect(() => {
    if (!generating) return
    const last = step >= STEPS.length
    const t = setTimeout(() => {
      if (!last) return setStep((x) => x + 1)
      const { data: d, target: tg, testDate: td } = latest.current
      setGenerating(false)
      setShowForm(false)
      updateProfile({ targetScore: tg, testDate: td })
      addPlan(generatePlan(d, tg, td))
    }, last ? 300 : 750)
    return () => clearTimeout(t)
  }, [generating, step])

  const canGenerate = u.plansLeft > 0

  return (
    <div>
      <PageTitle
        title="Study Plan"
        sub="A personal plan built from your results, target score and test date."
        right={
          plan && !showForm && !generating ? (
            <button onClick={() => setShowForm(true)} className="btn-outline">
              <Sparkles size={16} /> New plan
            </button>
          ) : undefined
        }
      />

      <>
        {generating ? (
          <motion.div key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="card mx-auto max-w-lg p-10 text-center">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-tr from-sky to-sky-deep text-white">
              <Brain size={28} />
            </motion.div>
            <div className="mt-6 text-xl font-semibold">Creating your plan…</div>
            <div className="mt-6 space-y-3 text-left">
              {STEPS.map((s, i) => (
                <motion.div key={s} initial={{ opacity: 0.3 }} animate={{ opacity: i <= step ? 1 : 0.3 }} className="flex items-center gap-3 text-sm">
                  <span className={`grid h-5 w-5 place-items-center rounded-full ${i < step ? 'bg-sky text-white dark:text-black' : 'border border-line'}`}>{i < step && <Check size={12} />}</span>
                  {s}
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : showForm ? (
          <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="card mx-auto max-w-lg p-8">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-soft text-sky-deep dark:text-sky"><Sparkles size={22} /></div>
            <h2 className="mt-5 text-2xl font-bold tracking-tight">Generate your AI study plan</h2>
            <p className="mt-1 text-sm text-muted">We'll analyze your exams and Question Bank history to plan every week until test day.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="pt">Target score</label>
                <select id="pt" className="input" value={target} onChange={(e) => setTarget(Number(e.target.value))}>
                  {[1200, 1250, 1300, 1350, 1400, 1450, 1500, 1550, 1600].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="pd">Test date</label>
                <input id="pd" type="date" className="input" value={testDate} onChange={(e) => setTestDate(e.target.value)} />
              </div>
            </div>
            {canGenerate ? (
              <button onClick={() => { setStep(0); setGenerating(true) }} className="btn-primary mt-6 w-full py-3">
                <Sparkles size={16} /> Generate plan
              </button>
            ) : (
              <div className="mt-6 rounded-2xl border border-sky/40 bg-sky-soft/60 p-4 text-sm">
                <div className="flex items-center gap-2 font-semibold"><Lock size={15} /> You've used this month's free plan</div>
                <p className="mt-1 text-muted">Premium includes unlimited AI study plans.</p>
                <Link to="/app/subscription" className="btn-primary mt-3">Upgrade</Link>
              </div>
            )}
            <div className="mt-3 text-center text-xs text-muted">{u.premium ? 'Unlimited plans with Premium' : `${u.plansLeft} of 1 free plan left this month`}</div>
            {plan && <button onClick={() => setShowForm(false)} className="mt-2 w-full text-center text-sm text-sky">Back to current plan</button>}
          </motion.div>
        ) : plan ? (
          <PlanView key="plan" plan={plan} />
        ) : null}
      </>
    </div>
  )
}

function PlanView({ plan }: { plan: Plan }) {
  const totalTasks = plan.weeks.reduce((a, w) => a + w.tasks.length, 0)
  const done = plan.done?.length ?? 0
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="card grid gap-6 p-6 md:grid-cols-[1fr_auto]">
        <div>
          <div className="chip bg-sky-soft text-sky-deep dark:text-sky"><Sparkles size={12} /> AI generated · {fmtDate(plan.createdAt)}</div>
          <p className="mt-4 text-lg leading-relaxed">{plan.summary}</p>
        </div>
        <div className="flex gap-6 md:flex-col md:gap-3 md:border-l md:border-line md:pl-6">
          <div><div className="text-xs text-muted">Now</div><div className="text-2xl font-bold">{plan.baseline}</div></div>
          <div><div className="text-xs text-muted">Target</div><div className="text-2xl font-bold text-sky">{plan.target}</div></div>
          <div><div className="text-xs text-muted">Progress</div><div className="text-2xl font-bold">{Math.round((done / totalTasks) * 100)}%</div></div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {plan.weeks.map((w, wi) => (
          <motion.div key={w.week} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: wi * 0.05 }} className="card p-6">
            <div className="flex items-baseline justify-between">
              <div className="text-sm font-semibold text-sky">Week {w.week}</div>
              <div className="text-xs text-muted">{w.tasks.filter((_, ti) => plan.done?.includes(`${w.week}-${ti}`)).length}/{w.tasks.length}</div>
            </div>
            <div className="mt-1 text-lg font-semibold">{w.focus}</div>
            <ul className="mt-4 space-y-2.5">
              {w.tasks.map((t, ti) => {
                const key = `${w.week}-${ti}`
                const checked = plan.done?.includes(key)
                return (
                  <li key={key}>
                    <button onClick={() => togglePlanTask(plan.id, key)} className="flex w-full items-start gap-3 text-left text-sm" aria-pressed={checked}>
                      <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full transition ${checked ? 'bg-sky text-white dark:text-black' : 'border border-ink/30'}`}>{checked && <Check size={12} />}</span>
                      <span className={checked ? 'text-muted line-through' : ''}>{t}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
