import { AnimatePresence, motion } from 'framer-motion'
import { Bookmark, Calculator, ChevronDown, ChevronUp, Clock, Highlighter, LogOut, MapPin, MoreVertical, Sigma, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Rich } from '../../components/Rich'
import { ALL_QUESTIONS, PRACTICE_TESTS, ROUTE_THRESHOLD, getQuestion, isCorrect, type ModuleSpec } from '../../data/tests'
import { skillStats, weakestSkills } from '../../lib/analytics'
import { rng } from '../../lib/rng'
import { addAttempt, scoreModules, uid, usage, useSession } from '../../lib/store'
import type { Attempt, AttemptKind, ModuleResult, Question } from '../../lib/types'
import { DesmosPanel } from './Desmos'
import { Passage, type Range } from './Passage'
import { ReferenceSheet } from './Reference'

type StageKey = 'rw1' | 'rw2' | 'break' | 'm1' | 'm2' | 'quick'

interface CurrentModule {
  key: StageKey
  title: string
  section: 'rw' | 'math'
  route?: 'easy' | 'hard'
  qids: string[]
  answers: Record<string, string>
  marked: string[]
  elim: Record<string, string[]>
  hl: Record<string, Range[]>
  time: Record<string, number>
  timeLeft: number
  idx: number
}

interface RunState {
  phase: 'intro' | 'module' | 'review' | 'break'
  stage: number
  done: ModuleResult[]
  cur: CurrentModule | null
  breakLeft: number
  startedAt: string
}

const STAGES: Record<AttemptKind, StageKey[]> = {
  full: ['rw1', 'rw2', 'break', 'm1', 'm2'],
  rw: ['rw1', 'rw2'],
  math: ['m1', 'm2'],
  quick: ['quick'],
}

const DIRECTIONS = {
  rw: 'The questions in this section address a number of important reading and writing skills. Each question includes one or more passages, which may include a table or graph. Read each passage and question carefully, and then choose the best answer to the question based on the passage(s). All questions in this section are multiple-choice with four answer choices. Each question has a single best answer.',
  math: 'The questions in this section address a number of important math skills. Use of a calculator is permitted for all questions. A reference sheet, calculator, and these directions can be accessed throughout the test. Unless otherwise indicated: all variables and expressions represent real numbers, figures provided are drawn to scale, and all figures lie in a plane. For multiple-choice questions, solve each problem and choose the correct answer. For student-produced response questions, solve each problem and enter your answer.',
}

const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.max(0, s % 60)).padStart(2, '0')}`
const frac = (m: ModuleResult) => (m.responses.length ? m.responses.filter((r) => r.correct).length / m.responses.length : 0)

export default function ExamRunner() {
  const { testId = '' } = useParams()
  const [params] = useSearchParams()
  const kind = (params.get('mode') as AttemptKind) || 'full'
  const nav = useNavigate()
  const { user, data } = useSession()
  const test = PRACTICE_TESTS.find((t) => t.id === testId)
  const storageKey = `hz_exam_${user?.id}_${testId}_${kind}_${params.get('section') ?? ''}${params.get('skill') ?? ''}`

  const [state, setState] = useState<RunState>(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) return JSON.parse(saved) as RunState
    } catch {
      /* ignore */
    }
    return { phase: 'intro', stage: 0, done: [], cur: null, breakLeft: 600, startedAt: new Date().toISOString() }
  })

  // Autosave every change so a refresh or closed tab resumes where the student left off.
  useEffect(() => {
    try {
      if (state.phase === 'intro') localStorage.removeItem(storageKey)
      else localStorage.setItem(storageKey, JSON.stringify(state))
    } catch {
      /* ignore */
    }
  }, [state, storageKey])

  const stages = STAGES[kind]

  /** Builds the module for a stage, choosing the adaptive Module 2 from Module 1 results. */
  const buildModule = useCallback(
    (key: StageKey, done: ModuleResult[]): CurrentModule => {
      const base = { answers: {}, marked: [], elim: {}, hl: {}, time: {}, idx: 0 }
      if (key === 'quick') {
        const section = params.get('section') ?? 'mixed'
        const skill = params.get('skill')
        let pool: Question[] = ALL_QUESTIONS
        if (skill) pool = pool.filter((q) => q.skill === skill)
        else if (section === 'weak') {
          const weak = new Set(weakestSkills(skillStats(data), 3).map((s) => s.skill))
          pool = pool.filter((q) => weak.has(q.skill))
        } else if (section === 'rw' || section === 'math') pool = pool.filter((q) => q.section === section)
        const qs = rng(Date.now() % 100000).shuffle(pool).slice(0, 10)
        const sec = qs.every((q) => q.section === 'rw') ? 'rw' : 'math'
        return { ...base, key, title: skill ? `Quick Practice: ${skill}` : 'Quick Practice Set', section: sec, qids: qs.map((q) => q.id), timeLeft: 15 * 60 }
      }
      const t = test!
      let spec: ModuleSpec
      let route: 'easy' | 'hard' | undefined
      if (key === 'rw1') spec = t.rw1
      else if (key === 'm1') spec = t.math1
      else {
        const first = done.find((m) => m.key === (key === 'rw2' ? 'rw1' : 'm1'))
        route = first && frac(first) >= ROUTE_THRESHOLD ? 'hard' : 'easy'
        spec = key === 'rw2' ? t.rw2[route] : t.math2[route]
      }
      return { ...base, key, title: spec.title, section: spec.section, route, qids: spec.questions.map((q) => q.id), timeLeft: spec.minutes * 60 }
    },
    [data, params, test],
  )

  const finish = useCallback(
    (done: ModuleResult[]) => {
      const scores = scoreModules(done)
      const title = kind === 'quick' ? done[0]?.title ?? 'Quick Practice' : kind === 'full' ? test!.title : `${test!.title} · ${kind === 'rw' ? 'Reading and Writing' : 'Math'} only`
      const attempt: Attempt = { id: uid(), testId, title, kind, startedAt: state.startedAt, finishedAt: new Date().toISOString(), modules: done, scores }
      addAttempt(attempt)
      try {
        localStorage.removeItem(storageKey)
      } catch {
        /* ignore */
      }
      nav(`/app/results/${attempt.id}?fresh=1`, { replace: true })
    },
    [kind, nav, state.startedAt, storageKey, test, testId],
  )

  const startStage = useCallback(
    (stage: number, done: ModuleResult[]) => {
      if (stage >= stages.length) return finish(done)
      const key = stages[stage]
      if (key === 'break') return setState((s) => ({ ...s, phase: 'break', stage, done, cur: null, breakLeft: 600 }))
      setState((s) => ({ ...s, phase: 'module', stage, done, cur: buildModule(key, done) }))
    },
    [buildModule, finish, stages],
  )

  const stateRef = useRef(state)
  stateRef.current = state
  const submittedStage = useRef<number | null>(null)

  const submitModule = useCallback(() => {
    const s = stateRef.current
    if (!s.cur || submittedStage.current === s.stage) return
    submittedStage.current = s.stage
    const c = s.cur
    const result: ModuleResult = {
      key: c.key,
      title: c.title,
      section: c.section,
      route: c.route,
      responses: c.qids.map((qid) => {
        const q = getQuestion(qid)!
        const answer = c.answers[qid] ?? null
        return { qid, answer, correct: isCorrect(q, answer), timeSec: c.time[qid] ?? 0, marked: c.marked.includes(qid) }
      }),
    }
    startStage(s.stage + 1, [...s.done, result])
  }, [startStage])

  // Allow submitting again once a new stage is running.
  useEffect(() => {
    if (submittedStage.current !== null && submittedStage.current !== state.stage) submittedStage.current = null
  }, [state.stage])

  // Ticking clock: module timer, per-question time, break timer.
  useEffect(() => {
    if (state.phase === 'intro') return
    const t = setInterval(() => {
      setState((s) => {
        if (s.phase === 'break') return { ...s, breakLeft: Math.max(0, s.breakLeft - 1) }
        if (!s.cur) return s
        const qid = s.cur.qids[s.cur.idx]
        const time = s.phase === 'module' ? { ...s.cur.time, [qid]: (s.cur.time[qid] ?? 0) + 1 } : s.cur.time
        return { ...s, cur: { ...s.cur, timeLeft: s.cur.timeLeft - 1, time } }
      })
    }, 1000)
    return () => clearInterval(t)
  }, [state.phase])

  useEffect(() => {
    if (state.cur && state.cur.timeLeft <= 0 && (state.phase === 'module' || state.phase === 'review')) submitModule()
  }, [state.cur, state.phase, submitModule])

  useEffect(() => {
    if (state.phase === 'break' && state.breakLeft <= 0) startStage(state.stage + 1, state.done)
  }, [state.phase, state.breakLeft, state.stage, state.done, startStage])

  if (!test && kind !== 'quick') {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <p className="text-muted">This test could not be found.</p>
          <Link to="/app/practice" className="btn-primary mt-4">Back to Practice</Link>
        </div>
      </div>
    )
  }

  if (state.phase === 'intro') return <Intro kind={kind} title={kind === 'quick' ? 'Quick Practice Set' : test!.title} blocked={kind === 'full' && usage(user, data).examsLeft <= 0} onStart={() => startStage(0, [])} />
  if (state.phase === 'break') return <BreakScreen left={state.breakLeft} onResume={() => startStage(state.stage + 1, state.done)} />
  if (!state.cur) return null

  return (
    <ModuleView
      key={state.cur.key}
      cur={state.cur}
      phase={state.phase}
      studentName={user?.name ?? ''}
      update={(fn) => setState((s) => (s.cur ? { ...s, cur: fn(s.cur) } : s))}
      setPhase={(phase) => setState((s) => ({ ...s, phase }))}
      onSubmit={submitModule}
      onExit={() => nav('/app/practice')}
      onDiscard={() => {
        try {
          localStorage.removeItem(storageKey)
        } catch {
          /* ignore */
        }
        nav('/app/practice')
      }}
    />
  )
}

function Intro({ kind, title, blocked, onStart }: { kind: AttemptKind; title: string; blocked: boolean; onStart: () => void }) {
  const info =
    kind === 'full'
      ? ['Reading and Writing: 2 modules · 27 questions each · 32 minutes each', '10-minute break', 'Math: 2 modules · 22 questions each · 35 minutes each', 'Module 2 of each section adapts to your Module 1 performance']
      : kind === 'quick'
        ? ['10 questions', '15 minutes', 'Instant results with explanations']
        : [kind === 'rw' ? 'Reading and Writing: 2 adaptive modules · 27 questions each · 32 minutes each' : 'Math: 2 adaptive modules · 22 questions each · 35 minutes each']
  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-2xl px-4 py-16">
        <Link to="/app/practice" className="text-sm text-muted hover:text-ink">← Back to Practice</Link>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card mt-6 p-8">
          <div className="text-sm font-semibold text-sky">Before you begin</div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{title}</h1>
          <ul className="mt-6 space-y-3">
            {info.map((i) => (
              <li key={i} className="flex gap-3 text-sm">
                <Clock size={18} className="shrink-0 text-sky" /> {i}
              </li>
            ))}
          </ul>
          <div className="mt-6 rounded-2xl bg-ink/[0.04] p-4 text-sm text-muted">
            Your answers are saved automatically. If you close the window, you can resume from the same question. The timer keeps running only while the exam is open.
          </div>
          {blocked ? (
            <div className="mt-8 rounded-2xl border border-sky/40 bg-sky-soft/60 p-5">
              <div className="font-semibold">You've used your free full-length exam for this month.</div>
              <p className="mt-1 text-sm text-muted">Upgrade to Premium for unlimited exams, or try a section test or quick practice set.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to="/app/subscription" className="btn-primary">Upgrade to Premium</Link>
                <Link to="/app/practice" className="btn-outline">Other practice</Link>
              </div>
            </div>
          ) : (
            <button onClick={onStart} className="btn mt-8 w-full bg-[#324dc7] py-3.5 text-base text-white hover:bg-[#2a40a8]">
              Start
            </button>
          )}
        </motion.div>
      </div>
    </div>
  )
}

function BreakScreen({ left, onResume }: { left: number; onResume: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center bg-neutral-950 px-4 text-white">
      <div className="text-center">
        <div className="text-sm uppercase tracking-widest text-neutral-400">Remaining break time</div>
        <div className="mt-4 text-7xl font-bold tabular-nums">{fmtTime(left)}</div>
        <p className="mx-auto mt-6 max-w-md text-neutral-400">You can resume this practice test as soon as you're ready to move on. On test day, you'll wait until the clock counts down.</p>
        <button onClick={onResume} className="btn mt-8 bg-[#fedb00] px-8 py-3 text-base text-neutral-900 hover:bg-[#f0cf00]">
          Resume Testing
        </button>
      </div>
    </div>
  )
}

function ModuleView({
  cur,
  phase,
  studentName,
  update,
  setPhase,
  onSubmit,
  onExit,
  onDiscard,
}: {
  cur: CurrentModule
  phase: 'module' | 'review'
  studentName: string
  update: (fn: (c: CurrentModule) => CurrentModule) => void
  setPhase: (p: 'module' | 'review') => void
  onSubmit: () => void
  onExit: () => void
  onDiscard: () => void
}) {
  const [showNav, setShowNav] = useState(false)
  const [showDirections, setShowDirections] = useState(false)
  const [hideTimer, setHideTimer] = useState(false)
  const [calc, setCalc] = useState(false)
  const [ref, setRef] = useState(false)
  const [highlighting, setHighlighting] = useState(false)
  const [elimMode, setElimMode] = useState(false)
  const [menu, setMenu] = useState(false)
  const qid = cur.qids[cur.idx]
  const q = useMemo(() => getQuestion(qid)!, [qid])
  const total = cur.qids.length
  const lowTime = cur.timeLeft <= 300
  const go = (i: number) => {
    update((c) => ({ ...c, idx: i }))
    setPhase('module')
    setShowNav(false)
  }

  return (
    <div className="flex h-screen flex-col bg-bg text-ink">
      {/* Header */}
      <header className="relative flex h-16 shrink-0 items-center justify-between border-b-2 border-dashed border-line px-4 sm:px-6">
        <div className="min-w-0">
          <div className="truncate text-[15px] font-semibold">{cur.title}</div>
          <button onClick={() => setShowDirections(!showDirections)} className="flex items-center gap-1 text-sm text-ink/80 hover:text-ink">
            Directions {showDirections ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
        <div className="absolute left-1/2 flex -translate-x-1/2 flex-col items-center">
          {hideTimer ? <Clock size={20} className="my-0.5" /> : <div className={`text-xl font-bold tabular-nums ${lowTime ? 'text-bad' : ''}`}>{fmtTime(cur.timeLeft)}</div>}
          <button onClick={() => setHideTimer(!hideTimer)} className="rounded-full border border-ink/40 px-2.5 text-[11px] leading-5 hover:bg-ink/5">
            {hideTimer ? 'Show' : 'Hide'}
          </button>
        </div>
        <div className="flex items-center gap-1 sm:gap-3">
          {cur.section === 'rw' ? (
            <ToolButton icon={Highlighter} label="Highlight" active={highlighting} onClick={() => setHighlighting(!highlighting)} />
          ) : (
            <>
              <ToolButton icon={Calculator} label="Calculator" active={calc} onClick={() => setCalc(!calc)} />
              <ToolButton icon={Sigma} label="Reference" active={ref} onClick={() => setRef(!ref)} />
            </>
          )}
          <div className="relative">
            <ToolButton icon={MoreVertical} label="More" active={menu} onClick={() => setMenu(!menu)} />
            <AnimatePresence>
              {menu && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-xl border border-line bg-elevated text-sm shadow-lift">
                  <button onClick={onExit} className="flex w-full items-center gap-2 px-4 py-3 hover:bg-ink/5">
                    <LogOut size={15} /> Save and exit
                  </button>
                  <button onClick={onDiscard} className="flex w-full items-center gap-2 px-4 py-3 text-bad hover:bg-bad/5">
                    <X size={15} /> Discard this attempt
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <AnimatePresence>
          {showDirections && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="absolute left-4 top-16 z-50 w-[min(640px,92vw)] rounded-xl border border-line bg-elevated p-6 text-sm leading-relaxed shadow-lift">
              {DIRECTIONS[cur.section]}
              <div className="mt-4 text-right">
                <button onClick={() => setShowDirections(false)} className="btn bg-[#fedb00] px-5 text-neutral-900">Close</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
      {lowTime && !hideTimer && cur.timeLeft > 290 && <div className="bg-bad/10 py-1 text-center text-xs font-semibold text-bad">5 minutes remaining in this module</div>}

      {/* Body */}
      <div className="min-h-0 flex-1">{phase === 'review' ? <ReviewPage cur={cur} onGo={go} /> : <QuestionPane q={q} cur={cur} update={update} highlighting={highlighting} elimMode={elimMode} setElimMode={setElimMode} />}</div>

      {/* Footer */}
      <footer className="relative flex h-16 shrink-0 items-center justify-between border-t-2 border-dashed border-line bg-[#eef3fb] px-4 dark:bg-elevated sm:px-6">
        <div className="hidden truncate text-sm font-semibold sm:block">{studentName}</div>
        {phase === 'module' ? (
          <button onClick={() => setShowNav(!showNav)} className="flex items-center gap-1.5 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white dark:bg-ink dark:text-bg">
            Question {cur.idx + 1} of {total} {showNav ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        ) : (
          <div />
        )}
        <div className="flex gap-2">
          {(cur.idx > 0 || phase === 'review') && (
            <button onClick={() => (phase === 'review' ? setPhase('module') : go(cur.idx - 1))} className="btn bg-[#324dc7] px-6 text-white hover:bg-[#2a40a8]">
              Back
            </button>
          )}
          <button
            onClick={() => {
              if (phase === 'review') onSubmit()
              else if (cur.idx < total - 1) go(cur.idx + 1)
              else setPhase('review')
            }}
            className="btn bg-[#324dc7] px-6 text-white hover:bg-[#2a40a8]"
          >
            Next
          </button>
        </div>
        <AnimatePresence>
          {showNav && phase === 'module' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-20 left-1/2 z-50 w-[min(560px,94vw)] -translate-x-1/2 rounded-2xl border border-line bg-elevated p-6 shadow-lift">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{cur.title}</div>
                <button onClick={() => setShowNav(false)} aria-label="Close"><X size={18} /></button>
              </div>
              <Legend />
              <QuestionGrid cur={cur} onGo={go} />
              <div className="mt-5 text-center">
                <button onClick={() => { setPhase('review'); setShowNav(false) }} className="btn border border-[#324dc7] px-6 text-[#324dc7] hover:bg-[#324dc7]/5 dark:border-sky dark:text-sky">
                  Go to Review Page
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </footer>

      {calc && <DesmosPanel onClose={() => setCalc(false)} />}
      {ref && <ReferenceSheet onClose={() => setRef(false)} />}
    </div>
  )
}

function ToolButton({ icon: Icon, label, active, onClick }: { icon: typeof Calculator; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center rounded-lg px-2 py-1 text-[11px] transition ${active ? 'text-[#324dc7] dark:text-sky' : 'text-ink/80 hover:text-ink'}`} aria-pressed={active}>
      <Icon size={20} />
      <span className="hidden sm:block">{label}</span>
    </button>
  )
}

function Legend() {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-5 border-b border-line pb-4 text-xs text-muted">
      <span className="flex items-center gap-1.5"><MapPin size={14} /> Current</span>
      <span className="flex items-center gap-1.5"><span className="h-4 w-4 rounded border border-dashed border-ink/50" /> Unanswered</span>
      <span className="flex items-center gap-1.5"><Bookmark size={14} className="fill-bad text-bad" /> For Review</span>
    </div>
  )
}

function QuestionGrid({ cur, onGo }: { cur: CurrentModule; onGo: (i: number) => void }) {
  return (
    <div className="mt-4 grid grid-cols-8 gap-2.5 sm:grid-cols-10">
      {cur.qids.map((id, i) => {
        const answered = cur.answers[id] != null && cur.answers[id] !== ''
        const marked = cur.marked.includes(id)
        return (
          <button
            key={id}
            onClick={() => onGo(i)}
            className={`relative grid h-9 place-items-center rounded text-sm font-semibold transition ${answered ? 'bg-[#324dc7] text-white dark:bg-sky dark:text-black' : 'border border-dashed border-ink/50 text-[#324dc7] dark:text-sky'} ${i === cur.idx ? 'ring-2 ring-ink ring-offset-2 ring-offset-elevated' : ''}`}
            aria-label={`Question ${i + 1}${answered ? ', answered' : ', unanswered'}${marked ? ', marked for review' : ''}`}
          >
            {i === cur.idx && <MapPin size={12} className="absolute -top-3 left-1/2 -translate-x-1/2 text-ink" />}
            {marked && <Bookmark size={11} className="absolute -right-1 -top-1 fill-bad text-bad" />}
            {i + 1}
          </button>
        )
      })}
    </div>
  )
}

function ReviewPage({ cur, onGo }: { cur: CurrentModule; onGo: (i: number) => void }) {
  return (
    <div className="h-full overflow-auto scroll-thin">
      <div className="mx-auto max-w-3xl px-4 py-10 text-center">
        <h2 className="text-3xl font-semibold">Check Your Work</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted">
          On test day, you won't be able to move on to the next module until time expires. For these practice questions, you can click <b>Next</b> when you're ready to move on.
        </p>
        <div className="card mt-8 p-6 text-left shadow-soft">
          <div className="font-semibold">{cur.title}</div>
          <Legend />
          <QuestionGrid cur={cur} onGo={onGo} />
        </div>
      </div>
    </div>
  )
}

function QuestionPane({ q, cur, update, highlighting, elimMode, setElimMode }: { q: Question; cur: CurrentModule; update: (fn: (c: CurrentModule) => CurrentModule) => void; highlighting: boolean; elimMode: boolean; setElimMode: (v: boolean) => void }) {
  const answer = cur.answers[q.id]
  const marked = cur.marked.includes(q.id)
  const elim = cur.elim[q.id] ?? []
  const setAnswer = (v: string) => update((c) => ({ ...c, answers: { ...c.answers, [q.id]: v }, elim: { ...c.elim, [q.id]: (c.elim[q.id] ?? []).filter((x) => x !== v) } }))
  const toggleElim = (l: string) =>
    update((c) => {
      const cur2 = c.elim[q.id] ?? []
      const next = cur2.includes(l) ? cur2.filter((x) => x !== l) : [...cur2, l]
      const answers = { ...c.answers }
      if (answers[q.id] === l && !cur2.includes(l)) delete answers[q.id]
      return { ...c, elim: { ...c.elim, [q.id]: next }, answers }
    })
  const split = !!q.passage || q.type === 'spr'
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0)
  }, [q.id])

  const head = (
    <div className="mb-4 flex items-center justify-between border-b-2 border-dashed border-line bg-ink/[0.04] pr-2">
      <div className="flex items-center gap-3">
        <span className="grid h-8 w-8 place-items-center bg-neutral-900 text-sm font-bold text-white dark:bg-ink dark:text-bg">{cur.idx + 1}</span>
        <button onClick={() => update((c) => ({ ...c, marked: marked ? c.marked.filter((x) => x !== q.id) : [...c.marked, q.id] }))} className="flex items-center gap-1.5 text-sm" aria-pressed={marked}>
          <Bookmark size={16} className={marked ? 'fill-bad text-bad' : ''} /> Mark for Review
        </button>
      </div>
      {q.type === 'mcq' && (
        <button onClick={() => setElimMode(!elimMode)} className={`rounded border px-1.5 text-xs font-bold line-through transition ${elimMode ? 'border-[#324dc7] bg-[#324dc7] text-white dark:border-sky dark:bg-sky dark:text-black' : 'border-ink/50'}`} aria-pressed={elimMode} title="Answer eliminator">
          ABC
        </button>
      )}
    </div>
  )

  const body = (
    <div>
      {head}
      <div className="mb-5 font-serif text-[17px] leading-relaxed">
        <Rich text={q.stem} />
      </div>
      {q.type === 'mcq' ? (
        <div className="space-y-3">
          {q.choices!.map((c, i) => {
            const l = 'ABCD'[i]
            const selected = answer === l
            const crossed = elim.includes(l)
            return (
              <div key={l} className="flex items-center gap-3">
                <button
                  onClick={() => setAnswer(l)}
                  className={`relative flex flex-1 items-center gap-3 rounded-xl border-2 px-4 py-3 text-left font-serif text-[16px] transition ${selected ? 'border-[#324dc7] dark:border-sky' : 'border-ink/25 hover:border-ink/50'} ${crossed ? 'opacity-50' : ''}`}
                  aria-pressed={selected}
                >
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 font-sans text-sm font-semibold ${selected ? 'border-[#324dc7] bg-[#324dc7] text-white dark:border-sky dark:bg-sky dark:text-black' : 'border-ink/60'}`}>{l}</span>
                  <Rich text={c} />
                  {crossed && <span className="pointer-events-none absolute inset-x-2 top-1/2 h-0.5 bg-ink/70" />}
                </button>
                {elimMode && (
                  <button onClick={() => toggleElim(l)} className="w-12 text-center text-sm font-semibold underline" aria-label={crossed ? `Undo eliminate ${l}` : `Eliminate ${l}`}>
                    {crossed ? 'Undo' : <span className="inline-grid h-6 w-6 place-items-center rounded-full border border-ink/60 text-xs line-through">{l}</span>}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div>
          <input
            value={answer ?? ''}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9./-]/g, '')
              if (v.length <= (v.startsWith('-') ? 6 : 5)) setAnswer(v)
            }}
            inputMode="decimal"
            className="w-44 border-b-2 border-ink bg-transparent px-2 py-2 text-lg outline-none focus:border-[#324dc7] dark:focus:border-sky"
            aria-label="Your answer"
          />
          <div className="mt-3 text-sm text-muted">
            Answer Preview: <span className="font-semibold text-ink">{answer ? <Rich text={answer.includes('/') ? `$\\dfrac{${answer.split('/')[0]}}{${answer.split('/')[1] ?? ''}}$` : answer} /> : ''}</span>
          </div>
        </div>
      )}
    </div>
  )

  if (!split) {
    return (
      <div ref={scrollRef} className="h-full overflow-auto scroll-thin">
        <div className="mx-auto max-w-2xl px-4 py-8">{body}</div>
      </div>
    )
  }

  return (
    <div className="grid h-full grid-cols-1 md:grid-cols-2">
      <div className="overflow-auto border-b-2 border-line px-5 py-8 scroll-thin md:border-b-0 md:border-r-4 md:px-10">
        {q.passage ? (
          <Passage text={q.passage} ranges={cur.hl[q.id] ?? []} onChange={(r) => update((c) => ({ ...c, hl: { ...c.hl, [q.id]: r } }))} highlighting={highlighting} />
        ) : (
          <SprDirections />
        )}
        {highlighting && q.passage && <div className="mt-4 text-xs text-muted">Select text to highlight it. Click a highlight to remove it.</div>}
      </div>
      <div ref={scrollRef} className="overflow-auto px-5 py-8 scroll-thin md:px-10">{body}</div>
    </div>
  )
}

function SprDirections() {
  return (
    <div className="space-y-3 text-sm leading-relaxed">
      <div className="text-base font-semibold">Student-produced response directions</div>
      <ul className="list-disc space-y-2 pl-5">
        <li>If you find more than one correct answer, enter only one answer.</li>
        <li>You can enter up to 5 characters for a positive answer and up to 6 characters (including the negative sign) for a negative answer.</li>
        <li>If your answer is a fraction that doesn't fit in the provided space, enter the decimal equivalent.</li>
        <li>If your answer is a decimal that doesn't fit, enter it by truncating or rounding at the fourth digit.</li>
        <li>If your answer is a mixed number (such as 3½), enter it as an improper fraction (7/2) or its decimal equivalent (3.5).</li>
        <li>Don't enter symbols such as a percent sign, comma, or dollar sign.</li>
      </ul>
      <table className="mt-2 w-full border border-line text-center text-sm">
        <thead className="bg-ink/[0.04]">
          <tr>
            <th className="border border-line p-2">Answer</th>
            <th className="border border-line p-2">Acceptable ways to enter answer</th>
          </tr>
        </thead>
        <tbody>
          <tr><td className="border border-line p-2">3.5</td><td className="border border-line p-2">3.5 · 3.50 · 7/2</td></tr>
          <tr><td className="border border-line p-2">2/3</td><td className="border border-line p-2">2/3 · .6666 · .6667 · 0.666 · 0.667</td></tr>
          <tr><td className="border border-line p-2">−1/3</td><td className="border border-line p-2">−1/3 · −.3333 · −0.333</td></tr>
        </tbody>
      </table>
    </div>
  )
}
