import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Bookmark, Check, ChevronDown, PartyPopper, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { BarList, Ring } from '../../components/Charts'
import { Difficulty } from '../../components/Mockups'
import { Rich } from '../../components/Rich'
import { getQuestion } from '../../data/tests'
import { attemptAccuracy, fmtDate } from '../../lib/analytics'
import { useSession } from '../../lib/store'
import type { Question, ResponseRecord } from '../../lib/types'

export default function ResultDetail() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const { data } = useSession()
  const a = data.attempts.find((x) => x.id === id)
  const [filter, setFilter] = useState<'all' | 'wrong' | 'marked'>('all')
  const [open, setOpen] = useState<string | null>(null)

  const domains = useMemo(() => {
    if (!a) return []
    const m = new Map<string, { c: number; t: number; section: string }>()
    for (const mod of a.modules)
      for (const r of mod.responses) {
        const q = getQuestion(r.qid)
        if (!q) continue
        const cur = m.get(q.domain) ?? { c: 0, t: 0, section: q.section }
        cur.t++
        if (r.correct) cur.c++
        m.set(q.domain, cur)
      }
    return [...m.entries()].map(([domain, v]) => ({ domain, ...v, acc: (v.c / v.t) * 100 }))
  }, [a])

  if (!a) return <div className="text-muted">Result not found. <Link to="/app/results" className="text-sky">Back to results</Link></div>

  const acc = Math.round(attemptAccuracy(a) * 100)
  const isQuick = a.kind === 'quick'
  const max = a.kind === 'full' ? 1600 : 800

  return (
    <div className="space-y-6">
      <Link to="/app/results" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft size={15} /> All results</Link>
      {params.get('fresh') && (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-3 rounded-2xl bg-sky-soft px-5 py-4 text-sky-deep dark:text-sky">
          <PartyPopper size={20} /> <span className="font-semibold">Well done! Your results are ready.</span>
        </motion.div>
      )}
      <div className="card grid gap-8 p-8 md:grid-cols-[auto_1fr]">
        <div className="flex justify-center">
          <Ring value={isQuick ? acc : a.scores.total - (a.kind === 'full' ? 400 : 200)} max={isQuick ? 100 : max - (a.kind === 'full' ? 400 : 200)} size={180} stroke={14}>
            <div>
              <div className="text-5xl font-bold tracking-tight">{isQuick ? `${acc}%` : a.scores.total}</div>
              <div className="text-xs text-muted">{isQuick ? 'correct' : `${a.kind === 'full' ? '400' : '200'}–${max}`}</div>
            </div>
          </Ring>
        </div>
        <div>
          <div className="text-sm text-muted">{fmtDate(a.startedAt, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{a.title}</h1>
          {!isQuick && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {a.scores.rw != null && <SectionScore label="Reading and Writing" score={a.scores.rw} route={a.modules.find((m) => m.key === 'rw2')?.route} />}
              {a.scores.math != null && <SectionScore label="Math" score={a.scores.math} route={a.modules.find((m) => m.key === 'm2')?.route} />}
            </div>
          )}
          <div className="mt-4 text-sm text-muted">
            {a.modules.flatMap((m) => m.responses).filter((r) => r.correct).length} of {a.modules.flatMap((m) => m.responses).length} questions correct · {acc}% accuracy
          </div>
        </div>
      </div>

      {domains.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {(['rw', 'math'] as const).map((s) => {
            const rows = domains.filter((d) => d.section === s)
            if (!rows.length) return null
            return (
              <div key={s} className="card p-6">
                <div className="mb-4 font-semibold">{s === 'rw' ? 'Reading and Writing' : 'Math'} · by domain</div>
                <BarList rows={rows.map((d) => ({ label: d.domain, value: d.acc, detail: `${d.c} of ${d.t} correct` }))} />
              </div>
            )
          })}
        </div>
      )}

      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-lg font-semibold">Review questions</div>
          <div className="inline-flex rounded-full border border-line p-1 text-sm">
            {(['all', 'wrong', 'marked'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-1.5 font-medium capitalize transition ${filter === f ? 'bg-sky text-white dark:text-black' : 'text-muted'}`}>
                {f === 'wrong' ? 'Incorrect' : f === 'marked' ? 'Marked' : 'All'}
              </button>
            ))}
          </div>
        </div>
        {a.modules.map((m) => {
          const rows = m.responses.map((r, i) => ({ r, i })).filter(({ r }) => (filter === 'wrong' ? !r.correct : filter === 'marked' ? r.marked : true))
          if (!rows.length) return null
          return (
            <div key={m.key} className="mt-6">
              <div className="mb-2 text-sm font-semibold text-muted">
                {m.title}
                {m.route && <span className="ml-2 chip bg-ink/5">{m.route === 'hard' ? 'Harder' : 'Easier'} module</span>}
              </div>
              <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
                {rows.map(({ r, i }) => {
                  const q = getQuestion(r.qid)
                  if (!q) return null
                  const key = m.key + r.qid
                  return <ReviewRow key={key} q={q} r={r} n={i + 1} open={open === key} onToggle={() => setOpen(open === key ? null : key)} />
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SectionScore({ label, score, route }: { label: string; score: number; route?: 'easy' | 'hard' }) {
  return (
    <div className="rounded-2xl bg-ink/[0.04] p-4">
      <div className="text-sm text-muted">{label}</div>
      <div className="text-3xl font-bold tracking-tight tabular-nums">{score}</div>
      <div className="mt-2 h-1.5 rounded-full bg-ink/10">
        <div className="h-1.5 rounded-full bg-sky" style={{ width: `${((score - 200) / 600) * 100}%` }} />
      </div>
      {route && <div className="mt-2 text-xs text-muted">Routed to the {route === 'hard' ? 'harder' : 'easier'} Module 2</div>}
    </div>
  )
}

function ReviewRow({ q, r, n, open, onToggle }: { q: Question; r: ResponseRecord; n: number; open: boolean; onToggle: () => void }) {
  return (
    <div>
      <button onClick={onToggle} className="flex w-full items-center gap-4 px-4 py-3 text-left text-sm hover:bg-ink/[0.03]" aria-expanded={open}>
        <span className="w-6 text-muted tabular-nums">{n}</span>
        <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${r.correct ? 'bg-good/15 text-good' : 'bg-bad/15 text-bad'}`} aria-label={r.correct ? 'Correct' : 'Incorrect'}>
          {r.correct ? <Check size={14} /> : <X size={14} />}
        </span>
        <span className="min-w-0 flex-1 truncate">{q.skill}</span>
        {r.marked && <Bookmark size={14} className="fill-bad text-bad" />}
        <Difficulty level={q.difficulty} />
        <span className="hidden w-24 text-right text-muted sm:block">Yours: {r.answer ?? '—'}</span>
        <span className="hidden w-20 text-right text-muted sm:block">{Math.floor(r.timeSec / 60)}:{String(r.timeSec % 60).padStart(2, '0')}</span>
        <ChevronDown size={16} className={`text-muted transition ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <QuestionReview q={q} answer={r.answer} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function QuestionReview({ q, answer }: { q: Question; answer: string | null }) {
  return (
    <div className="space-y-4 bg-ink/[0.02] px-4 py-5 sm:px-12">
      {q.passage && <div className="whitespace-pre-line font-serif leading-relaxed">{q.passage}</div>}
      <div className="font-serif font-medium"><Rich text={q.stem} /></div>
      {q.type === 'mcq' ? (
        <div className="space-y-2">
          {q.choices!.map((c, i) => {
            const l = 'ABCD'[i]
            const correct = l === q.answer
            const mine = l === answer
            return (
              <div key={l} className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-sm ${correct ? 'border-good bg-good/10' : mine ? 'border-bad bg-bad/10' : 'border-line'}`}>
                <span className="font-semibold">{l}.</span> <Rich text={c} />
                {correct && <span className="ml-auto chip bg-good/15 text-good"><Check size={12} /> Correct</span>}
                {mine && !correct && <span className="ml-auto chip bg-bad/15 text-bad"><X size={12} /> Your answer</span>}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-sm">
          Correct answer: <b>{q.answer}</b> · Your answer: <b>{answer ?? '—'}</b>
        </div>
      )}
      <div className="rounded-xl border-l-4 border-sky bg-sky-soft/50 px-4 py-3 text-sm">
        <div className="mb-1 font-semibold">Explanation</div>
        <Rich text={q.explanation} />
      </div>
    </div>
  )
}
