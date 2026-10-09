import { Table2, TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarList, LineChart } from '../../components/Charts'
import { getQuestion } from '../../data/tests'
import { fmtDate, fullAttempts, predictedScore, skillStats } from '../../lib/analytics'
import { useSession } from '../../lib/store'
import { PageTitle } from './Layout'

export default function Analytics() {
  const { data } = useSession()
  const full = fullAttempts(data)
  const stats = useMemo(() => skillStats(data), [data])
  const [table, setTable] = useState(false)
  const [section, setSection] = useState<'rw' | 'math'>('rw')

  const allResponses = useMemo(
    () => [
      ...data.attempts.flatMap((a) => a.modules.flatMap((m) => m.responses.map((r) => ({ qid: r.qid, correct: r.correct, time: r.timeSec })))),
      ...Object.entries(data.bq).map(([qid, r]) => ({ qid, correct: r.correct, time: 0 })),
    ],
    [data],
  )
  const answered = allResponses.length
  const accuracy = answered ? Math.round((allResponses.filter((r) => r.correct).length / answered) * 100) : 0
  const predicted = predictedScore(data)

  const byDifficulty = (['E', 'M', 'H'] as const).map((d) => {
    const rs = allResponses.filter((r) => getQuestion(r.qid)?.difficulty === d)
    return { label: d === 'E' ? 'Easy' : d === 'M' ? 'Medium' : 'Hard', value: rs.length ? (rs.filter((r) => r.correct).length / rs.length) * 100 : 0, detail: `${rs.filter((r) => r.correct).length} of ${rs.length} correct` }
  })

  const pace = (['rw', 'math'] as const).map((s) => {
    const rs = data.attempts.flatMap((a) => a.modules.filter((m) => m.section === s).flatMap((m) => m.responses)).filter((r) => r.timeSec > 0)
    const avg = rs.length ? rs.reduce((acc, r) => acc + r.timeSec, 0) / rs.length : 0
    return { s, avg, target: s === 'rw' ? 71 : 95 }
  })

  if (!full.length && !answered) {
    return (
      <div>
        <PageTitle title="Analytics" />
        <div className="card grid place-items-center p-16 text-center">
          <TrendingUp size={32} className="text-muted" />
          <div className="mt-3 font-semibold">Your analytics will appear here</div>
          <Link to="/app/practice" className="btn-primary mt-4">Start practicing</Link>
        </div>
      </div>
    )
  }

  const labels = full.map((a) => fmtDate(a.startedAt, { month: 'short', day: 'numeric' }))
  const kpis = [
    ['Predicted score', predicted ?? '—'],
    ['Full exams taken', full.length],
    ['Questions answered', answered.toLocaleString('en-US')],
    ['Overall accuracy', `${accuracy}%`],
  ]

  return (
    <div className="space-y-6">
      <PageTitle title="Analytics" sub="Your progress across exams and Question Bank practice." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map(([k, v]) => (
          <div key={k} className="card p-5">
            <div className="text-sm text-muted">{k}</div>
            <div className="mt-1 text-3xl font-bold tracking-tight tabular-nums">{v}</div>
          </div>
        ))}
      </div>

      {full.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="font-semibold">Total score</div>
                <div className="text-xs text-muted">Full-length exams</div>
              </div>
              <button onClick={() => setTable(!table)} className="btn-ghost px-3 py-1.5 text-xs" aria-pressed={table}>
                <Table2 size={14} /> {table ? 'Chart' : 'Table'}
              </button>
            </div>
            {table ? (
              <ScoreTable rows={full.map((a, i) => [labels[i], a.scores.total, a.scores.rw ?? '—', a.scores.math ?? '—'])} />
            ) : (
              <LineChart ariaLabel="Total score over time" labels={labels} series={[{ name: 'Total', color: 'var(--viz-1)', values: full.map((a) => a.scores.total) }]} yMin={800} yMax={1600} />
            )}
          </div>
          <div className="card p-6">
            <div className="mb-4">
              <div className="font-semibold">Section scores</div>
              <div className="text-xs text-muted">Reading and Writing vs Math</div>
            </div>
            {table ? (
              <ScoreTable rows={full.map((a, i) => [labels[i], a.scores.total, a.scores.rw ?? '—', a.scores.math ?? '—'])} />
            ) : (
              <LineChart
                ariaLabel="Section scores over time"
                labels={labels}
                series={[
                  { name: 'Reading and Writing', color: 'var(--viz-1)', values: full.map((a) => a.scores.rw) },
                  { name: 'Math', color: 'var(--viz-2)', values: full.map((a) => a.scores.math) },
                ]}
                yMin={400}
                yMax={800}
              />
            )}
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="card p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="font-semibold">Accuracy by skill</div>
            <div className="inline-flex rounded-full border border-line p-1 text-sm">
              {(['rw', 'math'] as const).map((s) => (
                <button key={s} onClick={() => setSection(s)} className={`rounded-full px-4 py-1.5 font-medium transition ${section === s ? 'bg-sky text-white dark:text-black' : 'text-muted'}`}>
                  {s === 'rw' ? 'Reading & Writing' : 'Math'}
                </button>
              ))}
            </div>
          </div>
          <BarList
            rows={stats
              .filter((s) => s.section === section && s.total > 0)
              .sort((a, b) => a.accuracy - b.accuracy)
              .map((s) => ({ label: s.skill, value: s.accuracy, detail: `${s.correct} of ${s.total} correct · ${s.domain}` }))}
          />
        </div>
        <div className="space-y-4">
          <div className="card p-6">
            <div className="mb-4 font-semibold">Accuracy by difficulty</div>
            <BarList rows={byDifficulty} />
          </div>
          <div className="card p-6">
            <div className="mb-4 font-semibold">Pacing</div>
            <div className="space-y-4">
              {pace.map((p) => (
                <div key={p.s} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium">{p.s === 'rw' ? 'Reading and Writing' : 'Math'}</div>
                    <div className="text-xs text-muted">Test-day pace: {p.target}s per question</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold tabular-nums">{Math.round(p.avg)}s</div>
                    <div className={`text-xs font-semibold ${p.avg <= p.target ? 'text-good' : 'text-warn'}`}>{p.avg <= p.target ? 'On pace' : 'Slower than pace'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ScoreTable({ rows }: { rows: (string | number)[][] }) {
  return (
    <table className="w-full text-sm">
      <thead className="text-left text-xs text-muted">
        <tr>
          <th className="py-2 font-medium">Date</th>
          <th className="py-2 text-right font-medium">Total</th>
          <th className="py-2 text-right font-medium">R&W</th>
          <th className="py-2 text-right font-medium">Math</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line">
        {rows.map((r) => (
          <tr key={String(r[0])}>
            {r.map((c, i) => (
              <td key={i} className={`py-2 tabular-nums ${i ? 'text-right' : ''}`}>{c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
