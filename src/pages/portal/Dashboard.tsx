import { motion } from 'framer-motion'
import { ArrowRight, CalendarDays, Check, ClipboardList, Flame, PenLine, Sparkles, Target } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarList, Ring } from '../../components/Charts'
import { wordByName } from '../../data/vocab'
import { daysUntil, fmtDate, fullAttempts, predictedScore, skillStats, weakestSkills } from '../../lib/analytics'
import { ensureDailyWords, orgOf, setWordStatus, streak, usage, useAppState, useSession } from '../../lib/store'
import { appliesTo, assignmentHref, assignmentLabel, assignmentStatus, assignmentsForSchool, fmtDue, realStudent } from '../../lib/school'

const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

export default function Dashboard() {
  const { user, data } = useSession()
  const u = usage(user, data)
  const predicted = predictedScore(data)
  const days = daysUntil(user?.testDate)
  const st = streak(data.activity)
  const weak = weakestSkills(skillStats(data), 4)
  const recent = fullAttempts(data).slice(-3).reverse()
  const [words, setWords] = useState<string[]>([])
  useEffect(() => {
    setWords(ensureDailyWords(u.dailyWords))
  }, [u.dailyWords])

  const tiles = [
    { icon: Target, label: 'Target score', value: user?.targetScore ?? '—', note: predicted ? `${Math.max(0, (user?.targetScore ?? 0) - predicted)} points to go` : 'Take a mock to begin' },
    { icon: CalendarDays, label: 'Test day', value: days != null ? `${days} days` : '—', note: user?.testDate ? fmtDate(user.testDate, { month: 'long', day: 'numeric' }) : 'Set your date' },
    { icon: Flame, label: 'Streak', value: `${st} ${st === 1 ? 'day' : 'days'}`, note: st ? 'Practice today to keep it' : 'Start one today' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {greeting()}, {user?.name.split(' ')[0]}.
        </h1>
        <p className="mt-1.5 text-muted">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_2fr]">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card flex flex-col items-center justify-center gap-4 p-6 sm:flex-row sm:justify-start">
          <Ring value={(predicted ?? 400) - 400} max={1200} size={150}>
            <div>
              <div className="text-3xl font-bold tracking-tight">{predicted ?? '—'}</div>
              <div className="text-[11px] text-muted">of 1600</div>
            </div>
          </Ring>
          <div className="text-center sm:text-left">
            <div className="text-sm text-muted">Predicted score</div>
            <div className="mt-1 text-lg font-semibold">{predicted ? (predicted >= (user?.targetScore ?? 1600) ? 'On target' : 'On your way') : 'No data yet'}</div>
            <p className="mt-1 max-w-[220px] text-sm text-muted">Based on your recent full-length exams.</p>
          </div>
        </motion.div>
        <div className="grid gap-4 sm:grid-cols-3">
          {tiles.map((t, i) => (
            <motion.div key={t.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * (i + 1) }} className="card p-5">
              <t.icon size={20} className={t.icon === Flame ? 'text-warn' : 'text-sky'} />
              <div className="mt-4 text-sm text-muted">{t.label}</div>
              <div className="text-2xl font-bold tracking-tight">{t.value}</div>
              <div className="mt-1 text-xs text-muted">{t.note}</div>
            </motion.div>
          ))}
        </div>
      </div>

      <SchoolAssignments />

      <div className="grid gap-4 lg:grid-cols-3">
        <Link to="/app/practice" className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky to-sky-deep p-6 text-white dark:from-sky-soft dark:to-elevated dark:text-ink">
          <PenLine size={22} />
          <div className="mt-6 text-xl font-semibold">Take a full-length exam</div>
          <div className="mt-1 text-sm opacity-90">{u.premium ? 'Unlimited with Premium' : `${u.examsLeft} of 1 free exam left this month`}</div>
          <ArrowRight className="absolute bottom-6 right-6 transition group-hover:translate-x-1" />
        </Link>
        <Link to="/app/bank" className="card group relative p-6 transition hover:border-sky">
          <div className="text-sm font-semibold text-sky">Focus skill</div>
          <div className="mt-6 text-xl font-semibold">{weak[0]?.skill ?? 'Question Bank'}</div>
          <div className="mt-1 text-sm text-muted">{weak[0] ? `${Math.round(weak[0].accuracy)}% accuracy — practice in the Question Bank` : 'Practice by skill and difficulty'}</div>
          <ArrowRight className="absolute bottom-6 right-6 text-muted transition group-hover:translate-x-1" />
        </Link>
        <Link to="/app/plan" className="card group relative p-6 transition hover:border-sky">
          <Sparkles size={22} className="text-sky" />
          <div className="mt-6 text-xl font-semibold">AI study plan</div>
          <div className="mt-1 text-sm text-muted">{data.plans.length ? 'View your current plan' : 'Generate your personal plan'}</div>
          <ArrowRight className="absolute bottom-6 right-6 text-muted transition group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">Today's words</div>
              <div className="text-sm text-muted">{u.dailyWords} new words every day{words.length > 5 ? ` · showing 5 of ${words.length}` : ''}</div>
            </div>
            <Link to="/app/vocabulary" className="text-sm font-semibold text-sky">All words</Link>
          </div>
          <div className="mt-4 divide-y divide-line">
            {words.slice(0, 5).map((w) => {
              const word = wordByName(w)
              if (!word) return null
              const learned = data.vocab.mastered.includes(w)
              return (
                <div key={w} className="flex items-start justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <div className="font-semibold">
                      {word.word} <span className="text-xs font-normal italic text-muted">{word.pos}</span>
                    </div>
                    <div className="text-sm text-muted">{word.def}</div>
                  </div>
                  <button
                    onClick={() => setWordStatus(w, learned ? 'learning' : 'mastered')}
                    className={`chip shrink-0 transition ${learned ? 'bg-good/15 text-good' : 'bg-ink/5 text-muted hover:text-ink'}`}
                  >
                    <Check size={12} /> {learned ? 'Learned' : 'Mark learned'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
        <div className="space-y-4">
          <div className="card p-6">
            <div className="text-lg font-semibold">Skills to improve</div>
            <div className="mb-4 text-sm text-muted">Lowest accuracy across your practice</div>
            {weak.length ? <BarList rows={weak.map((w) => ({ label: w.skill, value: w.accuracy, detail: `${w.correct} of ${w.total} correct · ${w.domain}` }))} /> : <div className="text-sm text-muted">Practice a few questions to see your skills.</div>}
          </div>
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">Recent exams</div>
              <Link to="/app/results" className="text-sm font-semibold text-sky">All results</Link>
            </div>
            <div className="mt-3 divide-y divide-line">
              {recent.map((a) => (
                <Link key={a.id} to={`/app/results/${a.id}`} className="flex items-center justify-between py-3 text-sm hover:text-sky">
                  <div>
                    <div className="font-medium">{a.title}</div>
                    <div className="text-xs text-muted">{fmtDate(a.startedAt)}</div>
                  </div>
                  <div className="text-lg font-bold tabular-nums">{a.scores.total}</div>
                </Link>
              ))}
              {!recent.length && <div className="py-3 text-sm text-muted">No exams yet.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SchoolAssignments() {
  const st = useAppState()
  const { user, data } = useSession()
  const org = orgOf(user, st)
  if (!user || !org) return null
  const me = realStudent(user, data)
  const list = assignmentsForSchool(st, org)
    .filter((a) => appliesTo(a, me))
    .map((a) => ({ a, status: assignmentStatus(st, a, me) }))
    .filter(({ a, status }) => !status.done || new Date(a.due).getTime() > Date.now() - 7 * 864e5)
    .filter(({ a }) => new Date(a.due).getTime() > Date.now() - 14 * 864e5)
    .sort((x, y) => Number(x.status.done) - Number(y.status.done) || x.a.due.localeCompare(y.a.due))
  if (!list.length) return null
  const daysLeft = (iso: string) => Math.ceil((new Date(iso).getTime() - Date.now()) / 864e5)
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ClipboardList size={18} className="text-sky" />
          <div className="text-lg font-semibold">From {org.name}</div>
        </div>
        <div className="text-sm text-muted">{list.filter((x) => !x.status.done).length} to do</div>
      </div>
      <div className="mt-4 divide-y divide-line">
        {list.map(({ a, status }) => {
          const d = daysLeft(a.due)
          const overdue = d < 0 && !status.done
          return (
            <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <div className="font-medium">{a.title}</div>
                <div className={`text-xs ${overdue ? 'font-semibold text-bad' : 'text-muted'}`}>
                  {assignmentLabel[a.type]} · {status.done ? 'Completed' : overdue ? `Overdue since ${fmtDue(a.due)}` : d === 0 ? 'Due today' : d === 1 ? 'Due tomorrow' : `Due ${fmtDue(a.due)} · ${d} days left`}
                </div>
              </div>
              {status.done ? (
                <span className="chip bg-good/15 text-good">
                  <Check size={12} /> Done{status.score != null ? ` · ${status.score}${a.type === 'quick' || a.type === 'vocab' ? '%' : ''}` : ''}
                </span>
              ) : (
                <Link to={assignmentHref(a)} className="btn-primary px-4 py-2 text-sm">
                  {a.type === 'vocab' ? 'Study words' : 'Start'} <ArrowRight size={14} />
                </Link>
              )}
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
