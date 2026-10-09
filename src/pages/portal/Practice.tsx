import { motion } from 'framer-motion'
import { ArrowRight, BookOpenText, Calculator, Lock, Target, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PRACTICE_TESTS } from '../../data/tests'
import { fmtDate } from '../../lib/analytics'
import { usage, useSession } from '../../lib/store'
import { PageTitle } from './Layout'

export default function Practice() {
  const { user, data } = useSession()
  const u = usage(user, data)
  const inProgress = (testId: string, mode: string) => {
    try {
      return !!localStorage.getItem(`hz_exam_${user?.id}_${testId}_${mode}_`)
    } catch {
      return false
    }
  }

  return (
    <div>
      <PageTitle
        title="Practice"
        sub="Full-length adaptive exams, section tests and quick sets."
        right={
          <div className="rounded-2xl border border-line bg-elevated px-4 py-2.5 text-sm">
            {u.premium ? (
              <span className="font-semibold text-sky">Premium · unlimited exams</span>
            ) : (
              <span>
                Full exams this month: <b>{u.examsUsed}</b> / 1 used
              </span>
            )}
          </div>
        }
      />

      <h2 className="mb-4 text-lg font-semibold">Full-length practice tests</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {PRACTICE_TESTS.map((t, i) => {
          const attempts = data.attempts.filter((a) => a.testId === t.id && a.kind === 'full')
          const best = attempts.length ? Math.max(...attempts.map((a) => a.scores.total)) : null
          const resume = inProgress(t.id, 'full')
          const locked = !resume && u.examsLeft <= 0
          return (
            <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="card flex flex-col p-6">
              <div className="flex items-start justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-soft text-xl font-bold text-sky-deep dark:text-sky">{i + 1}</div>
                {best != null && <span className="chip bg-ink/5 text-muted">Best {best}</span>}
              </div>
              <div className="mt-5 text-lg font-semibold">{t.title}</div>
              <div className="text-sm text-muted">{t.subtitle}</div>
              <div className="mt-3 text-xs text-muted">{attempts.length ? `Last taken ${fmtDate(attempts[attempts.length - 1].startedAt)}` : 'Not taken yet'}</div>
              <div className="mt-auto pt-6">
                {locked ? (
                  <Link to="/app/subscription" className="btn-outline w-full">
                    <Lock size={15} /> Unlock with Premium
                  </Link>
                ) : (
                  <Link to={`/exam/${t.id}?mode=full`} className="btn-primary w-full">
                    {resume ? 'Resume exam' : attempts.length ? 'Retake exam' : 'Start exam'} <ArrowRight size={16} />
                  </Link>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      <h2 className="mb-4 mt-12 text-lg font-semibold">Section tests</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {[
          { mode: 'rw', icon: BookOpenText, title: 'Reading and Writing', d: '2 adaptive modules · 54 questions · 64 minutes' },
          { mode: 'math', icon: Calculator, title: 'Math', d: '2 adaptive modules · 44 questions · 70 minutes · Desmos' },
        ].map((s) => (
          <div key={s.mode} className="card flex items-center gap-5 p-6">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-ink/5">
              <s.icon size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold">{s.title}</div>
              <div className="text-sm text-muted">{s.d}</div>
            </div>
            <Link to={`/exam/${PRACTICE_TESTS[0].id}?mode=${s.mode}`} className="btn-outline shrink-0">
              Start
            </Link>
          </div>
        ))}
      </div>

      <h2 className="mb-4 mt-12 text-lg font-semibold">Quick practice · 10 questions · 15 minutes</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { q: 'section=weak', icon: Target, t: 'My weakest skills', d: 'Targets your three lowest-accuracy skills' },
          { q: 'section=rw', icon: BookOpenText, t: 'Reading and Writing', d: 'Mixed skills and difficulty' },
          { q: 'section=math', icon: Calculator, t: 'Math', d: 'Mixed skills and difficulty' },
          { q: 'section=mixed', icon: Zap, t: 'Surprise me', d: 'A bit of everything' },
        ].map((s) => (
          <Link key={s.q} to={`/exam/quick?mode=quick&${s.q}`} className="card group p-5 transition hover:-translate-y-0.5 hover:border-sky">
            <s.icon size={20} className="text-sky" />
            <div className="mt-4 font-semibold">{s.t}</div>
            <div className="text-sm text-muted">{s.d}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
