import { motion } from 'framer-motion'
import { ChevronRight, ClipboardList } from 'lucide-react'
import { Link } from 'react-router-dom'
import { attemptAccuracy, fmtDate } from '../../lib/analytics'
import { useSession } from '../../lib/store'
import { PageTitle } from './Layout'

const KIND_LABEL = { full: 'Full-length', rw: 'Section test', math: 'Section test', quick: 'Quick practice' }

export default function Results() {
  const { data } = useSession()
  const list = [...data.attempts].sort((a, b) => b.startedAt.localeCompare(a.startedAt))
  return (
    <div>
      <PageTitle title="Results" sub="Every exam and practice set you've completed." />
      {!list.length && (
        <div className="card grid place-items-center p-16 text-center">
          <ClipboardList size={32} className="text-muted" />
          <div className="mt-3 font-semibold">No results yet</div>
          <Link to="/app/practice" className="btn-primary mt-4">Take your first exam</Link>
        </div>
      )}
      <div className="space-y-3">
        {list.map((a, i) => {
          const acc = Math.round(attemptAccuracy(a) * 100)
          return (
            <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }}>
              <Link to={`/app/results/${a.id}`} className="card flex items-center gap-4 p-5 transition hover:border-sky">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{a.title}</span>
                    <span className="chip bg-ink/5 text-muted">{KIND_LABEL[a.kind]}</span>
                  </div>
                  <div className="mt-1 text-sm text-muted">{fmtDate(a.startedAt, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</div>
                </div>
                <div className="hidden gap-6 text-right text-sm sm:flex">
                  {a.scores.rw != null && a.kind !== 'quick' && (
                    <div><div className="text-muted">R&W</div><div className="font-semibold tabular-nums">{a.scores.rw}</div></div>
                  )}
                  {a.scores.math != null && a.kind !== 'quick' && (
                    <div><div className="text-muted">Math</div><div className="font-semibold tabular-nums">{a.scores.math}</div></div>
                  )}
                  <div><div className="text-muted">Accuracy</div><div className="font-semibold tabular-nums">{acc}%</div></div>
                </div>
                <div className="w-20 text-right">
                  <div className="text-2xl font-bold tabular-nums tracking-tight">{a.kind === 'quick' ? `${acc}%` : a.scores.total}</div>
                  <div className="text-xs text-muted">{a.kind === 'full' ? 'of 1600' : a.kind === 'quick' ? 'correct' : 'of 800'}</div>
                </div>
                <ChevronRight size={18} className="text-muted" />
              </Link>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
