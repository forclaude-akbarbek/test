import { AnimatePresence, motion } from 'framer-motion'
import { Bookmark, Check, ChevronLeft, ChevronRight, Filter, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Difficulty } from '../../components/Mockups'
import { Rich } from '../../components/Rich'
import { MATH_DOMAINS } from '../../data/math'
import { RW_DOMAINS } from '../../data/rw'
import { ALL_QUESTIONS, isCorrect } from '../../data/tests'
import { answerBank, toggleBookmark, useSession } from '../../lib/store'
import type { Difficulty as Diff, Question, Section } from '../../lib/types'
import { PageTitle } from './Layout'

const DIFF_LABEL: Record<Diff, string> = { E: 'Easy', M: 'Medium', H: 'Hard' }

export default function QuestionBank() {
  const { data } = useSession()
  const [section, setSection] = useState<Section>('rw')
  const [skills, setSkills] = useState<string[]>([])
  const [diffs, setDiffs] = useState<Diff[]>([])
  const [excludeAnswered, setExcludeAnswered] = useState(false)
  const [onlyBookmarked, setOnlyBookmarked] = useState(false)
  const [query, setQuery] = useState('')
  const [shown, setShown] = useState(20)
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const domains = section === 'rw' ? RW_DOMAINS : MATH_DOMAINS

  const list = useMemo(
    () =>
      ALL_QUESTIONS.filter(
        (q) =>
          q.section === section &&
          (!skills.length || skills.includes(q.skill)) &&
          (!diffs.length || diffs.includes(q.difficulty)) &&
          (!excludeAnswered || !data.bq[q.id]) &&
          (!onlyBookmarked || data.bookmarks.includes(q.id)) &&
          (!query || q.id.toLowerCase().includes(query.toLowerCase()) || q.skill.toLowerCase().includes(query.toLowerCase())),
      ),
    [section, skills, diffs, excludeAnswered, onlyBookmarked, query, data.bq, data.bookmarks],
  )

  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
  const answeredInSection = ALL_QUESTIONS.filter((q) => q.section === section && data.bq[q.id])
  const correctInSection = answeredInSection.filter((q) => data.bq[q.id].correct).length

  const filters = (
    <div className="space-y-6">
      <div>
        <div className="label">Test</div>
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-ink/5 p-1 text-sm">
          {(['rw', 'math'] as const).map((s) => (
            <button key={s} onClick={() => { setSection(s); setSkills([]); setShown(20) }} className={`rounded-lg py-2 font-medium transition ${section === s ? 'bg-elevated shadow-soft' : 'text-muted'}`}>
              {s === 'rw' ? 'Reading & Writing' : 'Math'}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="label">Domain & skill</div>
        <div className="space-y-4">
          {Object.entries(domains).map(([d, sk]) => {
            const all = sk.every((s) => skills.includes(s))
            return (
              <div key={d}>
                <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
                  <input type="checkbox" className="h-4 w-4 accent-sky-500" checked={all} onChange={() => setSkills(all ? skills.filter((s) => !sk.includes(s)) : [...new Set([...skills, ...sk])])} />
                  {d}
                </label>
                <div className="ml-6 mt-2 space-y-1.5">
                  {sk.map((s) => (
                    <label key={s} className="flex cursor-pointer items-center gap-2 text-sm text-muted">
                      <input type="checkbox" className="h-4 w-4 accent-sky-500" checked={skills.includes(s)} onChange={() => setSkills(toggle(skills, s))} />
                      {s}
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <div>
        <div className="label">Difficulty</div>
        <div className="flex gap-2">
          {(['E', 'M', 'H'] as const).map((d) => (
            <button key={d} onClick={() => setDiffs(toggle(diffs, d))} className={`chip border px-3 py-1.5 transition ${diffs.includes(d) ? 'border-sky bg-sky-soft text-sky-deep dark:text-sky' : 'border-line text-muted'}`}>
              {DIFF_LABEL[d]}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2 text-sm">
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" className="h-4 w-4 accent-sky-500" checked={excludeAnswered} onChange={(e) => setExcludeAnswered(e.target.checked)} /> Exclude questions I've answered
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" className="h-4 w-4 accent-sky-500" checked={onlyBookmarked} onChange={(e) => setOnlyBookmarked(e.target.checked)} /> Bookmarked only
        </label>
      </div>
    </div>
  )

  return (
    <div>
      <PageTitle
        title="Question Bank"
        sub="Unlimited practice, filtered by domain, skill and difficulty."
        right={
          <div className="flex gap-6 text-sm">
            <div><div className="text-muted">Answered</div><div className="text-xl font-bold tabular-nums">{answeredInSection.length}</div></div>
            <div><div className="text-muted">Accuracy</div><div className="text-xl font-bold tabular-nums">{answeredInSection.length ? Math.round((correctInSection / answeredInSection.length) * 100) : 0}%</div></div>
          </div>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="card hidden h-fit p-5 lg:block">{filters}</aside>
        <div>
          <div className="mb-4 flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input className="input pl-10" placeholder="Search by question ID or skill" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <button onClick={() => setFiltersOpen(true)} className="btn-outline lg:hidden"><Filter size={16} /> Filters</button>
          </div>
          <div className="mb-3 text-sm text-muted">{list.length} questions</div>
          <div className="card overflow-hidden">
            <div className="hidden grid-cols-[110px_90px_1fr_1fr_70px] gap-3 border-b border-line bg-ink/[0.03] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted md:grid">
              <div>Question ID</div><div>Difficulty</div><div>Domain</div><div>Skill</div><div className="text-right">Status</div>
            </div>
            <div className="divide-y divide-line">
              {list.slice(0, shown).map((q, i) => {
                const st = data.bq[q.id]
                return (
                  <button key={q.id} onClick={() => setOpenIdx(i)} className="grid w-full grid-cols-[1fr_auto] gap-3 px-5 py-3.5 text-left text-sm transition hover:bg-sky-soft/40 md:grid-cols-[110px_90px_1fr_1fr_70px]">
                    <div className="font-mono text-xs text-muted md:self-center">{q.id.toUpperCase()}</div>
                    <div className="hidden md:flex md:items-center"><Difficulty level={q.difficulty} /></div>
                    <div className="hidden text-muted md:block">{q.domain}</div>
                    <div className="col-span-2 font-medium md:col-span-1">{q.skill}</div>
                    <div className="row-start-1 flex items-center justify-end gap-2 md:row-auto">
                      {data.bookmarks.includes(q.id) && <Bookmark size={14} className="fill-sky text-sky" />}
                      {st ? (
                        <span className={`grid h-6 w-6 place-items-center rounded-full ${st.correct ? 'bg-good/15 text-good' : 'bg-bad/15 text-bad'}`} aria-label={st.correct ? 'Answered correctly' : 'Answered incorrectly'}>
                          {st.correct ? <Check size={13} /> : <X size={13} />}
                        </span>
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-ink/15" aria-label="Not answered" />
                      )}
                    </div>
                  </button>
                )
              })}
              {!list.length && <div className="p-10 text-center text-sm text-muted">No questions match these filters.</div>}
            </div>
          </div>
          {shown < list.length && (
            <div className="mt-4 text-center">
              <button onClick={() => setShown(shown + 20)} className="btn-outline">Show more</button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {filtersOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/40" onClick={() => setFiltersOpen(false)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 34, stiffness: 380 }} className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-auto rounded-t-3xl bg-elevated p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-lg font-semibold">Filters</div>
                <button onClick={() => setFiltersOpen(false)} aria-label="Close"><X size={20} /></button>
              </div>
              {filters}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {openIdx !== null && list[openIdx] && (
          <QuestionModal
            key={list[openIdx].id}
            q={list[openIdx]}
            index={openIdx}
            total={list.length}
            onClose={() => setOpenIdx(null)}
            onPrev={() => setOpenIdx(Math.max(0, openIdx - 1))}
            onNext={() => setOpenIdx(Math.min(list.length - 1, openIdx + 1))}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function QuestionModal({ q, index, total, onClose, onPrev, onNext }: { q: Question; index: number; total: number; onClose: () => void; onPrev: () => void; onNext: () => void }) {
  const { data } = useSession()
  const prev = data.bq[q.id]
  const [answer, setAnswer] = useState<string>('')
  const [checked, setChecked] = useState(false)
  const correct = checked && isCorrect(q, answer)
  const bookmarked = data.bookmarks.includes(q.id)

  const check = () => {
    if (!answer) return
    setChecked(true)
    answerBank(q.id, answer, isCorrect(q, answer))
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        transition={{ type: 'spring', damping: 30, stiffness: 340 }}
        className="fixed inset-x-2 bottom-2 top-10 z-50 mx-auto flex max-w-5xl flex-col overflow-hidden rounded-3xl bg-elevated shadow-lift sm:inset-x-6 sm:bottom-6"
        role="dialog"
        aria-label={`Question ${q.id}`}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-mono text-xs text-muted">{q.id.toUpperCase()}</span>
            <Difficulty level={q.difficulty} />
            <span className="hidden text-muted sm:inline">{q.domain} · {q.skill}</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => toggleBookmark(q.id)} className="btn-ghost px-3 py-1.5" aria-pressed={bookmarked}>
              <Bookmark size={16} className={bookmarked ? 'fill-sky text-sky' : ''} /> <span className="hidden sm:inline">{bookmarked ? 'Saved' : 'Save'}</span>
            </button>
            <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full hover:bg-ink/5" aria-label="Close"><X size={18} /></button>
          </div>
        </div>
        <div className={`grid min-h-0 flex-1 ${q.passage ? 'md:grid-cols-2' : ''}`}>
          {q.passage && <div className="overflow-auto border-b border-line p-6 font-serif text-[17px] leading-relaxed whitespace-pre-line scroll-thin md:border-b-0 md:border-r md:p-10">{q.passage}</div>}
          <div className="overflow-auto p-6 scroll-thin md:p-10">
            <div className={q.passage ? '' : 'mx-auto max-w-2xl'}>
              {prev && !checked && <div className="mb-4 chip bg-ink/5 text-muted">Previously answered {prev.correct ? 'correctly' : 'incorrectly'}</div>}
              <div className="mb-5 font-serif text-[17px] leading-relaxed"><Rich text={q.stem} /></div>
              {q.type === 'mcq' ? (
                <div className="space-y-2.5">
                  {q.choices!.map((c, i) => {
                    const l = 'ABCD'[i]
                    const isAns = l === q.answer
                    const sel = answer === l
                    const state = checked ? (isAns ? 'good' : sel ? 'bad' : 'idle') : sel ? 'sel' : 'idle'
                    return (
                      <button
                        key={l}
                        disabled={checked}
                        onClick={() => setAnswer(l)}
                        className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left font-serif transition ${
                          state === 'good' ? 'border-good bg-good/10' : state === 'bad' ? 'border-bad bg-bad/10' : state === 'sel' ? 'border-sky' : 'border-line hover:border-ink/30'
                        }`}
                      >
                        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 font-sans text-sm font-semibold ${state === 'sel' ? 'border-sky bg-sky text-white dark:text-black' : 'border-ink/40'}`}>{l}</span>
                        <Rich text={c} />
                        {state === 'good' && <Check size={18} className="ml-auto text-good" />}
                        {state === 'bad' && <X size={18} className="ml-auto text-bad" />}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <input
                  value={answer}
                  disabled={checked}
                  onChange={(e) => setAnswer(e.target.value.replace(/[^0-9./-]/g, '').slice(0, 6))}
                  onKeyDown={(e) => e.key === 'Enter' && check()}
                  placeholder="Enter your answer"
                  className={`input max-w-xs text-lg ${checked ? (correct ? 'border-good' : 'border-bad') : ''}`}
                  aria-label="Your answer"
                />
              )}
              <AnimatePresence>
                {checked && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-3">
                    <div className={`flex items-center gap-2 font-semibold ${correct ? 'text-good' : 'text-bad'}`}>
                      {correct ? <Check size={18} /> : <X size={18} />} {correct ? 'Correct!' : `Not quite. The correct answer is ${q.answer}.`}
                    </div>
                    <div className="rounded-xl border-l-4 border-sky bg-sky-soft/50 px-4 py-3 text-sm leading-relaxed">
                      <div className="mb-1 font-semibold">Explanation</div>
                      <Rich text={q.explanation} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-line px-5 py-3">
          <button onClick={onPrev} disabled={index === 0} className="btn-ghost"><ChevronLeft size={16} /> Previous</button>
          <span className="text-sm text-muted">{index + 1} of {total}</span>
          {checked ? (
            <button onClick={onNext} disabled={index === total - 1} className="btn-primary">Next <ChevronRight size={16} /></button>
          ) : (
            <button onClick={check} disabled={!answer} className="btn-primary">Check answer</button>
          )}
        </div>
      </motion.div>
    </>
  )
}
