import { motion } from 'framer-motion'
import { Bookmark, Calculator, Check, ChevronDown, Flame, Highlighter, MoreVertical } from 'lucide-react'

/** Miniature, non-interactive product screens used on the landing page. */

export function ExamMock() {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-xl bg-white text-[10px] text-neutral-900 sm:text-[11px]">
      <div className="flex items-center justify-between border-b border-dashed border-neutral-300 px-3 py-2">
        <div>
          <div className="font-semibold">Section 1, Module 1: Reading and Writing</div>
          <div className="flex items-center gap-0.5 text-neutral-500">
            Directions <ChevronDown size={10} />
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold tabular-nums">31:42</div>
          <div className="rounded-full border border-neutral-300 px-2 text-[9px]">Hide</div>
        </div>
        <div className="flex items-center gap-3 text-neutral-600">
          <span className="flex flex-col items-center"><Highlighter size={12} />Annotate</span>
          <span className="hidden flex-col items-center sm:flex"><Calculator size={12} />Calculator</span>
          <span className="flex flex-col items-center"><MoreVertical size={12} />More</span>
        </div>
      </div>
      <div className="grid flex-1 grid-cols-2 divide-x divide-neutral-200">
        <div className="p-3 font-serif leading-relaxed text-neutral-800">
          Marine biologist Ayana Brooks found that young octopuses raised in tanks with shells and rocks were far more{' '}
          <span className="rounded bg-amber-200 px-0.5">_______</span> than those raised in bare tanks: they explored new objects quickly and solved
          simple puzzles in half the time.
        </div>
        <div className="space-y-1.5 p-3">
          <div className="flex items-center justify-between bg-neutral-100 px-2 py-1">
            <span className="rounded bg-neutral-900 px-1.5 text-white">3</span>
            <span className="flex items-center gap-1 text-neutral-600"><Bookmark size={10} /> Mark for Review</span>
            <span className="rounded border border-neutral-400 px-1 text-[9px] line-through">ABC</span>
          </div>
          <div className="font-serif">Which choice completes the text with the most logical and precise word?</div>
          {['curious', 'hesitant', 'fragile', 'predictable'].map((c, i) => (
            <div key={c} className={`flex items-center gap-2 rounded-lg border px-2 py-1 ${i === 0 ? 'border-[#3b6fd6] ring-1 ring-[#3b6fd6]' : 'border-neutral-300'}`}>
              <span className={`grid h-4 w-4 place-items-center rounded-full border text-[8px] ${i === 0 ? 'border-[#3b6fd6] bg-[#3b6fd6] text-white' : 'border-neutral-500'}`}>{'ABCD'[i]}</span>
              {c}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-dashed border-neutral-300 bg-[#e6edf8] px-3 py-1.5">
        <span className="font-semibold">Dilnoza Karimova</span>
        <span className="rounded bg-neutral-900 px-2 py-0.5 text-white">Question 3 of 27</span>
        <span className="rounded-full bg-[#324dc7] px-3 py-0.5 font-semibold text-white">Next</span>
      </div>
    </div>
  )
}

export function BankMock() {
  const rows = [
    ['Words in Context', 'E', true],
    ['Boundaries', 'M', true],
    ['Nonlinear functions', 'H', false],
    ['Systems of two linear equations', 'M', null],
    ['Command of Evidence', 'H', null],
  ] as const
  return (
    <div className="h-full w-full overflow-hidden rounded-xl bg-elevated p-4 text-xs text-ink">
      <div className="mb-3 flex flex-wrap gap-1.5">
        {['Reading and Writing', 'Math', 'Easy', 'Medium', 'Hard'].map((f, i) => (
          <span key={f} className={`chip ${i === 1 || i === 4 ? 'bg-sky text-white dark:text-black' : 'bg-ink/5 text-muted'}`}>{f}</span>
        ))}
      </div>
      <div className="divide-y divide-line rounded-xl border border-line">
        {rows.map(([skill, d, ok], i) => (
          <div key={skill} className="flex items-center justify-between px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className="text-muted tabular-nums">#{1040 + i * 7}</span>
              <span>{skill}</span>
            </div>
            <div className="flex items-center gap-2">
              <Difficulty level={d} />
              <span className={`h-2 w-2 rounded-full ${ok === true ? 'bg-good' : ok === false ? 'bg-bad' : 'bg-ink/15'}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Difficulty({ level }: { level: 'E' | 'M' | 'H' }) {
  const n = level === 'E' ? 1 : level === 'M' ? 2 : 3
  return (
    <span className="inline-flex items-end gap-0.5" title={level === 'E' ? 'Easy' : level === 'M' ? 'Medium' : 'Hard'} aria-label={level === 'E' ? 'Easy' : level === 'M' ? 'Medium' : 'Hard'}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={`w-1 rounded-sm ${i <= n ? 'bg-ink/70' : 'bg-ink/15'}`} style={{ height: 4 + i * 3 }} />
      ))}
    </span>
  )
}

export function PlanMock() {
  const weeks = [
    ['Week 1', 'Boundaries & punctuation', true],
    ['Week 2', 'Nonlinear functions', true],
    ['Week 3', 'Inferences', false],
    ['Week 4', 'Full mock + review', false],
  ] as const
  return (
    <div className="h-full w-full overflow-hidden rounded-xl bg-elevated p-4 text-xs text-ink">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-muted">Your plan to</div>
          <div className="text-lg font-bold">1450</div>
        </div>
        <span className="chip bg-sky-soft text-sky-deep dark:text-sky">AI generated</span>
      </div>
      <div className="space-y-2">
        {weeks.map(([w, f, done], i) => (
          <motion.div
            key={w}
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.12 }}
            className="flex items-center gap-3 rounded-xl border border-line px-3 py-2"
          >
            <span className={`grid h-5 w-5 place-items-center rounded-full ${done ? 'bg-sky text-white dark:text-black' : 'border border-line'}`}>{done && <Check size={12} />}</span>
            <div>
              <div className="font-semibold">{w}</div>
              <div className="text-muted">{f}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export function VocabMock() {
  return (
    <div className="grid h-full w-full place-items-center overflow-hidden rounded-xl bg-elevated p-4 text-ink">
      <motion.div
        animate={{ rotateY: [0, 0, 180, 180, 360] }}
        transition={{ duration: 6, repeat: Infinity, times: [0, 0.4, 0.5, 0.9, 1] }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative h-40 w-64"
      >
        <div className="absolute inset-0 grid place-items-center rounded-2xl border border-line bg-surface [backface-visibility:hidden]">
          <div className="text-center">
            <div className="text-2xl font-bold">meticulous</div>
            <div className="mt-1 text-xs text-muted">adjective</div>
          </div>
        </div>
        <div className="absolute inset-0 grid place-items-center rounded-2xl bg-sky p-4 text-center text-sm text-white [backface-visibility:hidden] [transform:rotateY(180deg)] dark:text-black">
          showing great attention to detail
        </div>
      </motion.div>
      <div className="mt-3 flex items-center gap-1 text-xs text-muted">
        <Flame size={14} className="text-warn" /> 5 new words today
      </div>
    </div>
  )
}

export function AnalyticsMock() {
  const pts = [1180, 1230, 1270, 1320, 1350, 1390]
  const W = 260, H = 110
  const x = (i: number) => 10 + (i * (W - 20)) / (pts.length - 1)
  const y = (v: number) => 10 + (1 - (v - 1150) / 300) * (H - 20)
  return (
    <div className="h-full w-full overflow-hidden rounded-xl bg-elevated p-4 text-xs text-ink">
      <div className="text-muted">Predicted score</div>
      <div className="text-3xl font-bold tracking-tight">
        1390 <span className="text-sm font-semibold text-good">+210</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full" aria-label="Predicted score rising from 1180 to 1390">
        <motion.polyline
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
          points={pts.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
          fill="none"
          stroke="var(--viz-1)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {pts.map((v, i) => (
          <circle key={i} cx={x(i)} cy={y(v)} r="3.5" fill="var(--viz-1)" stroke="rgb(var(--elevated))" strokeWidth="2" />
        ))}
      </svg>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {[
          ['Reading & Writing', 700],
          ['Math', 690],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg bg-ink/[0.04] px-2 py-1.5">
            <div className="text-muted">{k}</div>
            <div className="font-semibold">{v}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** A laptop-style frame for hero mockups. */
export function DeviceFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="rounded-[22px] border border-line bg-neutral-900 p-2 shadow-lift sm:p-3 dark:bg-neutral-800">
        <div className="aspect-[16/10] overflow-hidden rounded-xl">{children}</div>
      </div>
      <div className="mx-auto h-3 w-[104%] -translate-x-[2%] rounded-b-2xl bg-gradient-to-b from-neutral-300 to-neutral-400 dark:from-neutral-700 dark:to-neutral-800" />
    </div>
  )
}
