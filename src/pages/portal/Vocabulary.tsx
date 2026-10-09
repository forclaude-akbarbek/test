import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Check, RotateCcw, Shuffle, Sparkles, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { WORDS, WORD_LISTS, wordByName, type Word } from '../../data/vocab'
import { rng } from '../../lib/rng'
import { ensureDailyWords, setWordStatus, usage, useSession } from '../../lib/store'
import { PageTitle } from './Layout'

type Mode = { kind: 'home' } | { kind: 'list'; list: string } | { kind: 'cards'; words: Word[]; title: string } | { kind: 'quiz'; words: Word[]; title: string }

export default function Vocabulary() {
  const { user, data } = useSession()
  const u = usage(user, data)
  const [mode, setMode] = useState<Mode>({ kind: 'home' })
  const [today, setToday] = useState<string[]>([])
  useEffect(() => setToday(ensureDailyWords(u.dailyWords)), [u.dailyWords])
  const mastered = new Set(data.vocab.mastered)

  if (mode.kind === 'cards') return <Flashcards words={mode.words} title={mode.title} onBack={() => setMode({ kind: 'home' })} />
  if (mode.kind === 'quiz') return <Quiz words={mode.words} title={mode.title} onBack={() => setMode({ kind: 'home' })} />
  if (mode.kind === 'list') {
    const words = WORDS.filter((w) => w.list === mode.list)
    return (
      <div>
        <button onClick={() => setMode({ kind: 'home' })} className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft size={15} /> All lists</button>
        <PageTitle
          title={mode.list}
          sub={`${words.filter((w) => mastered.has(w.word)).length} of ${words.length} mastered`}
          right={
            <div className="flex gap-2">
              <button onClick={() => setMode({ kind: 'cards', words, title: mode.list })} className="btn-outline">Flashcards</button>
              <button onClick={() => setMode({ kind: 'quiz', words, title: mode.list })} className="btn-primary">Quiz</button>
            </div>
          }
        />
        <div className="card divide-y divide-line">
          {words.map((w) => (
            <WordRow key={w.word} w={w} mastered={mastered.has(w.word)} />
          ))}
        </div>
      </div>
    )
  }

  const todayWords = today.map(wordByName).filter(Boolean) as Word[]
  return (
    <div className="space-y-8">
      <PageTitle title="Vocabulary" sub={`${data.vocab.mastered.length} of ${WORDS.length} words mastered`} />
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-sky to-sky-deep p-8 text-white dark:from-sky-soft dark:to-elevated dark:text-ink">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold opacity-90"><Sparkles size={16} /> Today's words</div>
            <div className="mt-1 text-3xl font-bold tracking-tight">{todayWords.length} new words</div>
            <div className="text-sm opacity-90">{u.premium ? 'Premium: 20 words a day' : 'Free plan: 5 words a day'}</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setMode({ kind: 'cards', words: todayWords, title: "Today's words" })} className="btn bg-white/20 text-white backdrop-blur hover:bg-white/30 dark:text-ink">Flashcards</button>
            <button onClick={() => setMode({ kind: 'quiz', words: todayWords, title: "Today's words" })} className="btn bg-white text-sky-deep hover:bg-white/90 dark:bg-sky dark:text-black">Quiz me</button>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {todayWords.map((w) => (
            <span key={w.word} className="rounded-full bg-white/20 px-3 py-1.5 text-sm font-medium backdrop-blur dark:bg-white/10">{w.word}</span>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Standard word lists</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WORD_LISTS.map((l, i) => {
            const words = WORDS.filter((w) => w.list === l)
            const done = words.filter((w) => mastered.has(w.word)).length
            return (
              <motion.button key={l} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} onClick={() => setMode({ kind: 'list', list: l })} className="card p-5 text-left transition hover:-translate-y-0.5 hover:border-sky">
                <div className="font-semibold">{l}</div>
                <div className="mt-1 text-sm text-muted">{words.length} words</div>
                <div className="mt-4 h-1.5 rounded-full bg-ink/10">
                  <div className="h-1.5 rounded-full bg-sky transition-all" style={{ width: `${(done / words.length) * 100}%` }} />
                </div>
                <div className="mt-1.5 text-xs text-muted">{done} mastered</div>
              </motion.button>
            )
          })}
        </div>
      </div>

      {data.vocab.learning.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Still learning</h2>
            <button onClick={() => setMode({ kind: 'cards', words: data.vocab.learning.map(wordByName).filter(Boolean) as Word[], title: 'Still learning' })} className="text-sm font-semibold text-sky">Review all</button>
          </div>
          <div className="card divide-y divide-line">
            {data.vocab.learning.slice(0, 6).map((w) => {
              const word = wordByName(w)
              return word ? <WordRow key={w} w={word} mastered={false} /> : null
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function WordRow({ w, mastered }: { w: Word; mastered: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-4">
      <div className="min-w-0">
        <div className="font-semibold">
          {w.word} <span className="text-xs font-normal italic text-muted">{w.pos}</span>
        </div>
        <div className="text-sm">{w.def}</div>
        <div className="mt-1 text-sm italic text-muted">"{w.example}"</div>
      </div>
      <button onClick={() => setWordStatus(w.word, mastered ? 'learning' : 'mastered')} className={`chip shrink-0 ${mastered ? 'bg-good/15 text-good' : 'bg-ink/5 text-muted hover:text-ink'}`}>
        <Check size={12} /> {mastered ? 'Mastered' : 'Mark mastered'}
      </button>
    </div>
  )
}

function Flashcards({ words, title, onBack }: { words: Word[]; title: string; onBack: () => void }) {
  const [order, setOrder] = useState(words)
  const [i, setI] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState(0)
  const w = order[i]
  const next = (status: 'mastered' | 'learning') => {
    setWordStatus(w.word, status)
    if (status === 'mastered') setKnown(known + 1)
    setFlipped(false)
    setI(i + 1)
  }
  return (
    <div className="mx-auto max-w-xl">
      <button onClick={onBack} className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft size={15} /> Vocabulary</button>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <button onClick={() => { setOrder(rng(Date.now() % 1e5).shuffle(words)); setI(0); setFlipped(false) }} className="btn-ghost px-3"><Shuffle size={16} /> Shuffle</button>
      </div>
      <div className="mb-4 h-1.5 rounded-full bg-ink/10">
        <div className="h-1.5 rounded-full bg-sky transition-all" style={{ width: `${(Math.min(i, order.length) / order.length) * 100}%` }} />
      </div>
      {i < order.length ? (
        <>
          <div className="[perspective:1200px]">
            <motion.button
              onClick={() => setFlipped(!flipped)}
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              style={{ transformStyle: 'preserve-3d' }}
              className="relative block h-72 w-full"
              aria-label={flipped ? 'Show word' : 'Show definition'}
            >
              <div className="card absolute inset-0 grid place-items-center p-8 [backface-visibility:hidden]">
                <div>
                  <div className="text-4xl font-bold tracking-tight">{w.word}</div>
                  <div className="mt-2 text-sm italic text-muted">{w.pos}</div>
                  <div className="mt-8 text-xs text-muted">Tap to reveal</div>
                </div>
              </div>
              <div className="absolute inset-0 grid place-items-center rounded-3xl bg-sky p-8 text-white [backface-visibility:hidden] [transform:rotateY(180deg)] dark:text-black">
                <div>
                  <div className="text-xl font-semibold">{w.def}</div>
                  <div className="mt-4 text-sm italic opacity-90">"{w.example}"</div>
                </div>
              </div>
            </motion.button>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button onClick={() => next('learning')} className="btn-outline py-3"><RotateCcw size={16} /> Still learning</button>
            <button onClick={() => next('mastered')} className="btn-primary py-3"><Check size={16} /> I know it</button>
          </div>
          <div className="mt-3 text-center text-sm text-muted">{i + 1} of {order.length}</div>
        </>
      ) : (
        <Done text={`You marked ${known} of ${order.length} words as known.`} onAgain={() => { setI(0); setKnown(0) }} onBack={onBack} />
      )}
    </div>
  )
}

function Quiz({ words, title, onBack }: { words: Word[]; title: string; onBack: () => void }) {
  const questions = useMemo(() => {
    const r = rng(Date.now() % 1e5)
    return r.shuffle(words).slice(0, 10).map((w) => {
      const distractors = r.shuffle(WORDS.filter((x) => x.word !== w.word)).slice(0, 3)
      return { w, options: r.shuffle([w, ...distractors]) }
    })
  }, [words])
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const cur = questions[i]
  const choose = (word: string) => {
    if (picked) return
    setPicked(word)
    const ok = word === cur.w.word
    if (ok) setScore(score + 1)
    setWordStatus(cur.w.word, ok ? 'mastered' : 'learning')
  }
  return (
    <div className="mx-auto max-w-xl">
      <button onClick={onBack} className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft size={15} /> Vocabulary</button>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">{title} · Quiz</h1>
      {i < questions.length ? (
        <AnimatePresence mode="wait">
          <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="card p-6">
            <div className="text-sm text-muted">Question {i + 1} of {questions.length}</div>
            <div className="mt-3 text-lg font-semibold">Which word means: "{cur.w.def}"?</div>
            <div className="mt-5 grid gap-2.5">
              {cur.options.map((o) => {
                const ok = o.word === cur.w.word
                const st = picked ? (ok ? 'good' : picked === o.word ? 'bad' : 'idle') : 'idle'
                return (
                  <button key={o.word} onClick={() => choose(o.word)} className={`flex items-center justify-between rounded-xl border-2 px-4 py-3 text-left font-medium transition ${st === 'good' ? 'border-good bg-good/10' : st === 'bad' ? 'border-bad bg-bad/10' : 'border-line hover:border-ink/30'}`}>
                    {o.word}
                    {st === 'good' && <Check size={18} className="text-good" />}
                    {st === 'bad' && <X size={18} className="text-bad" />}
                  </button>
                )
              })}
            </div>
            {picked && (
              <div className="mt-5 flex items-center justify-between gap-4">
                <div className="text-sm italic text-muted">"{cur.w.example}"</div>
                <button onClick={() => { setPicked(null); setI(i + 1) }} className="btn-primary shrink-0">Next</button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      ) : (
        <Done text={`You scored ${score} out of ${questions.length}.`} onAgain={() => { setI(0); setScore(0); setPicked(null) }} onBack={onBack} />
      )}
    </div>
  )
}

function Done({ text, onAgain, onBack }: { text: string; onAgain: () => void; onBack: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="card p-10 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-good/15 text-good"><Check size={28} /></div>
      <div className="mt-4 text-2xl font-bold">Session complete</div>
      <div className="mt-1 text-muted">{text}</div>
      <div className="mt-6 flex justify-center gap-2">
        <button onClick={onAgain} className="btn-outline">Again</button>
        <button onClick={onBack} className="btn-primary">Done</button>
      </div>
    </motion.div>
  )
}
