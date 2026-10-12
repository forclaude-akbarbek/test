import { AnimatePresence, animate, motion, useInView, useMotionValueEvent, useScroll, useSpring, useTransform } from 'framer-motion'
import { ArrowRight, BarChart3, BookOpen, Brain, Calculator, Check, ChevronDown, Flame, Gauge, GraduationCap, Layers, ListChecks, Menu, MoonStar, ShieldCheck, Sparkles, Timer, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { ThemeToggle } from '../components/ThemeToggle'
import { AnalyticsMock, BankMock, DeviceFrame, ExamMock, PlanMock, VocabMock } from '../components/Mockups'
import { PRICES } from '../lib/store'

const ease = [0.22, 1, 0.36, 1] as const

function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { scrollY } = useScroll()
  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 12))
  const links = [
    ['Features', '#features'],
    ['Exam', '#exam'],
    ['Pricing', '#pricing'],
    ['Schools', '#schools'],
    ['FAQ', '#faq'],
  ]
  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? 'glass' : 'bg-transparent'}`}>
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <div className="hidden items-center gap-7 text-[13px] text-ink/80 md:flex">
          {links.map(([l, h]) => (
            <a key={l} href={h} className="transition hover:text-ink">
              {l}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Link to="/login" className="btn-ghost hidden px-4 py-2 text-[13px] sm:inline-flex">
            Log in
          </Link>
          <Link to="/signup" className="btn-primary px-4 py-2 text-[13px]">
            Start free
          </Link>
          <button className="ml-1 grid h-9 w-9 place-items-center rounded-full hover:bg-ink/5 md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="glass overflow-hidden md:hidden">
            <div className="flex flex-col px-4 py-3">
              {links.map(([l, h]) => (
                <a key={l} href={h} onClick={() => setOpen(false)} className="py-2.5 text-ink/90">
                  {l}
                </a>
              ))}
              <Link to="/login" className="py-2.5 text-sky">
                Log in
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.8, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function Hero() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const rotateX = useTransform(scrollYProgress, [0, 0.5], [22, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.88, 1])
  const y = useTransform(scrollYProgress, [0, 1], [0, -60])
  const words = ['Your', 'SAT.']
  return (
    <section ref={ref} className="relative overflow-hidden pb-20 pt-32 sm:pt-40">
      {/* soft sky glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[620px] w-[1100px] -translate-x-1/2 rounded-full bg-sky/20 blur-[120px] dark:bg-sky/15" />
      <div className="relative mx-auto max-w-6xl px-4 text-center sm:px-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-elevated/70 px-3 py-1.5 text-xs font-medium text-muted backdrop-blur">
          <Sparkles size={14} className="text-sky" />
          The complete Digital SAT platform for Uzbekistan
        </motion.div>
        <h1 className="text-[44px] font-bold leading-[1.02] tracking-[-0.035em] sm:text-7xl md:text-[96px]">
          {words.map((w, i) => (
            <motion.span key={w} initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 0.9, delay: 0.1 + i * 0.12, ease }} className="mr-[0.25em] inline-block">
              {w}
            </motion.span>
          ))}
          <br />
          <motion.span
            initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.9, delay: 0.38, ease }}
            className="inline-block bg-gradient-to-r from-sky via-sky-deep to-sky bg-[length:200%_auto] bg-clip-text text-transparent [animation:shine_6s_linear_infinite]"
          >
            Mastered.
          </motion.span>
        </h1>
        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.55 }} className="mx-auto mt-6 max-w-2xl text-lg text-muted sm:text-xl">
          Practice in an interface identical to test day, with the official question bank, adaptive full-length exams, an AI study plan and a vocabulary
          coach — all in one place.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.7 }} className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/signup" className="btn-primary px-7 py-3.5 text-base">
            Start practicing free <ArrowRight size={18} />
          </Link>
          <a href="#exam" className="btn-ghost px-7 py-3.5 text-base text-sky">
            See the exam experience
          </a>
        </motion.div>
      </div>
      <motion.div style={{ rotateX, scale, y, transformPerspective: 1400 }} className="relative mx-auto mt-16 max-w-6xl px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, delay: 0.5, ease }}>
          <DeviceFrame>
            <ExamMock />
          </DeviceFrame>
        </motion.div>
        {/* floating cards */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0, y: [0, -8, 0] }}
          transition={{ opacity: { delay: 1.1 }, x: { delay: 1.1 }, y: { duration: 5, repeat: Infinity, ease: 'easeInOut' } }}
          className="absolute -left-2 top-1/3 hidden rounded-2xl border border-line bg-elevated/90 p-4 shadow-lift backdrop-blur lg:block"
        >
          <div className="text-xs text-muted">Predicted score</div>
          <div className="text-3xl font-bold tracking-tight">1390</div>
          <div className="text-xs font-semibold text-good">+210 since July</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0, y: [0, 10, 0] }}
          transition={{ opacity: { delay: 1.3 }, x: { delay: 1.3 }, y: { duration: 6, repeat: Infinity, ease: 'easeInOut' } }}
          className="absolute -right-2 bottom-12 hidden items-center gap-3 rounded-2xl border border-line bg-elevated/90 p-4 shadow-lift backdrop-blur lg:flex"
        >
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-warn/15 text-warn">
            <Flame size={20} />
          </div>
          <div>
            <div className="text-sm font-semibold">12-day streak</div>
            <div className="text-xs text-muted">Keep it going!</div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}

function Counter({ to, suffix = '', duration = 1.6 }: { to: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!inView) return
    const c = animate(0, to, { duration, ease: 'easeOut', onUpdate: (x) => setV(Math.round(x)) })
    return () => c.stop()
  }, [inView, to, duration])
  return (
    <span ref={ref} className="tabular-nums">
      {v.toLocaleString('en-US')}
      {suffix}
    </span>
  )
}

function Stats() {
  const items = [
    { n: 3000, s: '+', l: 'Question Bank questions' },
    { n: 98, s: '', l: 'Questions per adaptive mock' },
    { n: 14, s: '', l: 'Regions of Uzbekistan reached' },
    { n: 120, s: '+', l: 'Points average improvement' },
  ]
  return (
    <section className="border-y border-line bg-surface/60">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-14 sm:px-6 md:grid-cols-4">
        {items.map((it, i) => (
          <Reveal key={it.l} delay={i * 0.08} className="text-center">
            <div className="text-4xl font-bold tracking-tight sm:text-5xl">
              <Counter to={it.n} suffix={it.s} />
            </div>
            <div className="mt-2 text-sm text-muted">{it.l}</div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

const STORY = [
  {
    icon: Timer,
    eyebrow: 'Bluebook-style exams',
    title: 'Test day, before test day.',
    body: 'Full-length adaptive mocks with the same layout, timer, highlighter, answer eliminator, reference sheet and built-in Desmos calculator students will see on the real exam.',
    visual: <ExamMock />,
  },
  {
    icon: Layers,
    eyebrow: 'Question Bank',
    title: 'Every skill. Every difficulty.',
    body: 'Filter thousands of questions by section, domain, skill and difficulty. Check answers instantly, read clear explanations, and bookmark the ones to revisit.',
    visual: <BankMock />,
  },
  {
    icon: Brain,
    eyebrow: 'AI study plan',
    title: 'A plan that knows you.',
    body: 'Horizon reads your results, finds your weakest skills and builds a week-by-week plan to your target score and test date.',
    visual: <PlanMock />,
  },
  {
    icon: BookOpen,
    eyebrow: 'Vocabulary coach',
    title: 'Five words a day. Every day.',
    body: 'Curated SAT word lists, daily new words, flashcards and quick quizzes that turn tough Words-in-Context questions into easy points.',
    visual: <VocabMock />,
  },
  {
    icon: BarChart3,
    eyebrow: 'Analytics',
    title: 'See progress, not guesses.',
    body: 'Score trends, accuracy by skill and a predicted score that updates after every practice session.',
    visual: <AnalyticsMock />,
  },
]

function Story() {
  const [active, setActive] = useState(0)
  return (
    <section id="features" className="relative mx-auto max-w-6xl px-4 py-28 sm:px-6">
      <Reveal className="mx-auto mb-20 max-w-3xl text-center">
        <div className="text-sm font-semibold text-sky">Everything in one place</div>
        <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-6xl">Built for one goal: your best score.</h2>
      </Reveal>
      <div className="grid gap-10 md:grid-cols-2 md:gap-16">
        <div>
          {STORY.map((s, i) => (
            <StoryStep key={s.title} index={i} onActive={setActive} active={active === i} {...s} />
          ))}
        </div>
        <div className="hidden md:block">
          <div className="sticky top-28 h-[440px]">
            <div className="relative h-full rounded-[28px] border border-line bg-surface p-5 shadow-soft">
              <>
                <motion.div
                  key={active}
                  initial={{ opacity: 0, scale: 0.96, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -12 }}
                  transition={{ duration: 0.5, ease }}
                  className="h-full overflow-hidden rounded-2xl border border-line shadow-soft"
                >
                  {STORY[active].visual}
                </motion.div>
              </>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function StoryStep({ index, onActive, active, icon: Icon, eyebrow, title, body, visual }: (typeof STORY)[number] & { index: number; onActive: (i: number) => void; active: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { margin: '-45% 0px -45% 0px' })
  useEffect(() => {
    if (inView) onActive(index)
  }, [inView, index, onActive])
  return (
    <div ref={ref} className="flex min-h-[60vh] flex-col justify-center py-10 md:min-h-[70vh]">
      <motion.div animate={{ opacity: active ? 1 : 0.35 }} transition={{ duration: 0.4 }}>
        <div className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-sky">
          <Icon size={18} /> {eyebrow}
        </div>
        <h3 className="text-3xl font-bold tracking-tight sm:text-5xl">{title}</h3>
        <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">{body}</p>
      </motion.div>
      <div className="mt-8 h-72 overflow-hidden rounded-2xl border border-line shadow-soft md:hidden">{visual}</div>
    </div>
  )
}

function ExamShowcase() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const scale = useSpring(useTransform(scrollYProgress, [0, 0.45], [0.82, 1]), { stiffness: 120, damping: 30 })
  const radius = useTransform(scrollYProgress, [0, 0.45], [48, 24])
  const tools = [
    { icon: Calculator, t: 'Desmos built in', d: 'The same graphing calculator as the real exam.' },
    { icon: Gauge, t: 'Truly adaptive', d: 'Module 2 adapts to how you did on Module 1.' },
    { icon: ListChecks, t: 'Mark for review', d: 'Flag, eliminate and come back with the navigator.' },
    { icon: ShieldCheck, t: 'Autosave', d: 'Every answer is saved the moment you click.' },
  ]
  return (
    <section id="exam" ref={ref} className="bg-surface py-28 text-ink">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-3xl text-center">
          <div className="text-sm font-semibold text-sky">The exam experience</div>
          <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-6xl">So familiar, test day feels like practice.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted">Every button, panel and timer is where students expect it to be on the real Digital SAT.</p>
        </Reveal>
        <motion.div style={{ scale, borderRadius: radius }} className="mx-auto mt-16 aspect-[16/10] max-w-5xl overflow-hidden border border-line shadow-[0_40px_120px_-20px_rgba(14,165,233,0.35)]">
          <ExamMock />
        </motion.div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((t, i) => (
            <Reveal key={t.t} delay={i * 0.08}>
              <t.icon className="text-sky" size={26} />
              <div className="mt-3 font-semibold">{t.t}</div>
              <div className="mt-1 text-sm text-muted">{t.d}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function Bento() {
  const cards = [
    { cls: 'md:col-span-2', icon: Gauge, t: 'Score report in seconds', d: 'Total, section and skill-level breakdown the moment you finish, with question-by-question review.' },
    { cls: '', icon: MoonStar, t: 'Light & dark', d: 'Easy on the eyes, day or night.' },
    { cls: '', icon: Flame, t: 'Streaks', d: 'Small daily wins that add up.' },
    { cls: 'md:col-span-2', icon: GraduationCap, t: 'Made for Uzbek students', d: 'Built with teachers in Tashkent, Samarkand and Namangan, around how our students actually learn.' },
  ]
  return (
    <section className="mx-auto max-w-6xl px-4 py-28 sm:px-6">
      <Reveal className="mb-14 max-w-2xl">
        <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">Thoughtful in every detail.</h2>
      </Reveal>
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((c, i) => (
          <Reveal key={c.t} delay={i * 0.06} className={c.cls}>
            <motion.div whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }} className="card h-full bg-surface p-8">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-soft text-sky-deep dark:text-sky">
                <c.icon size={22} />
              </div>
              <div className="mt-6 text-xl font-semibold">{c.t}</div>
              <div className="mt-2 text-muted">{c.d}</div>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function Pricing() {
  const [yearly, setYearly] = useState(false)
  const free = ['Unlimited Question Bank questions', 'Standard vocabulary lists', '1 full-length exam per month', '1 AI study plan per month', '5 new vocabulary words daily']
  const premium = ['Everything in Free', 'Unlimited full-length exams', 'Unlimited AI study plans', '20 new vocabulary words daily', 'Advanced analytics & mistake log']
  const price = yearly ? PRICES.yearly : PRICES.monthly
  return (
    <section id="pricing" className="bg-surface/60 py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Reveal className="text-center">
          <h2 className="text-4xl font-bold tracking-tight sm:text-6xl">Start free. Go further.</h2>
          <div className="mt-8 inline-flex rounded-full border border-line bg-elevated p-1 text-sm">
            {['Monthly', 'Yearly'].map((l, i) => (
              <button key={l} onClick={() => setYearly(i === 1)} className={`relative rounded-full px-5 py-2 font-medium transition ${yearly === (i === 1) ? 'text-white dark:text-black' : 'text-muted'}`}>
                {yearly === (i === 1) && <motion.span layoutId="billing" className="absolute inset-0 rounded-full bg-sky" />}
                <span className="relative">
                  {l}
                  {i === 1 && <span className="ml-1 text-xs opacity-80">−33%</span>}
                </span>
              </button>
            ))}
          </div>
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <Reveal>
            <div className="card h-full p-8">
              <div className="text-lg font-semibold">Free</div>
              <div className="mt-3 text-5xl font-bold tracking-tight">0 <span className="text-lg font-medium text-muted">UZS</span></div>
              <div className="mt-1 text-sm text-muted">Forever</div>
              <ul className="mt-8 space-y-3">
                {free.map((f) => (
                  <li key={f} className="flex gap-3 text-sm">
                    <Check size={18} className="shrink-0 text-sky" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="btn-outline mt-10 w-full py-3">
                Create free account
              </Link>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="relative h-full overflow-hidden rounded-3xl border-2 border-sky bg-elevated p-8">
              <div className="absolute right-6 top-6 chip bg-sky text-white dark:text-black">Most popular</div>
              <div className="text-lg font-semibold">Premium</div>
              <div className="mt-3 text-5xl font-bold tracking-tight">
                <>
                  <motion.span key={price} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="inline-block">
                    {price.toLocaleString('en-US')}
                  </motion.span>
                </>{' '}
                <span className="text-lg font-medium text-muted">UZS</span>
              </div>
              <div className="mt-1 text-sm text-muted">per {yearly ? 'year' : 'month'}</div>
              <ul className="mt-8 space-y-3">
                {premium.map((f) => (
                  <li key={f} className="flex gap-3 text-sm">
                    <Check size={18} className="shrink-0 text-sky" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="btn-primary mt-10 w-full py-3">
                Get Premium
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function Schools() {
  return (
    <section id="schools" className="mx-auto max-w-6xl px-4 py-28 sm:px-6">
      <div className="grid items-center gap-10 overflow-hidden rounded-[32px] bg-gradient-to-br from-sky to-sky-deep p-10 text-white sm:p-14 md:grid-cols-2 dark:from-sky-soft dark:to-black dark:text-ink">
        <Reveal>
          <div className="text-sm font-semibold opacity-80">For schools</div>
          <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Private, presidential and specialized schools.</h2>
          <p className="mt-5 text-lg opacity-90">Dedicated portals for school leaders and teachers, with class-level analytics and test-day tools. School accounts are issued by our team.</p>
          <div className="mt-8 inline-flex flex-col rounded-2xl bg-white/15 px-5 py-3 backdrop-blur dark:bg-white/5">
            <span className="text-xs font-semibold uppercase tracking-wide opacity-80">Contact our schools team</span>
            <span className="select-all text-lg font-semibold">schools@horizonsat.uz</span>
          </div>
        </Reveal>
        <Reveal delay={0.15} className="grid grid-cols-2 gap-4">
          {[
            ['Private schools', 'B2B'],
            ['Government schools', 'B2G'],
            ['Class analytics', 'Live'],
            ['Accounts', 'Managed'],
          ].map(([a, b]) => (
            <div key={a} className="rounded-2xl bg-white/15 p-5 backdrop-blur dark:bg-white/5">
              <div className="text-2xl font-bold">{b}</div>
              <div className="mt-1 text-sm opacity-90">{a}</div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  )
}

function FAQ() {
  const items = [
    ['Is Horizon SAT really free?', 'Yes. The Free plan includes unlimited Question Bank practice, standard vocabulary lists, one full-length exam and one AI study plan every month.'],
    ['How close is the exam to the real Digital SAT?', 'Our exam interface mirrors the official testing app: two adaptive modules per section, the same tools (highlighter, answer eliminator, reference sheet, Desmos calculator) and the same timing.'],
    ['How is my score calculated?', 'Each section is scored from 200 to 800 based on your accuracy and the difficulty of your second module, the same adaptive principle the real test uses.'],
    ['Can my school get access?', 'Yes. Private and government schools receive dedicated portals. Contact our schools team and we will create your accounts.'],
    ['Does it work on phones?', 'Practice, vocabulary and analytics work on any device. For full-length exams we recommend a laptop or tablet, like the real test.'],
  ]
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-28 sm:px-6">
      <Reveal>
        <h2 className="mb-10 text-center text-4xl font-bold tracking-tight sm:text-5xl">Questions, answered.</h2>
      </Reveal>
      <div className="divide-y divide-line border-y border-line">
        {items.map(([q, a], i) => (
          <div key={q}>
            <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between gap-4 py-5 text-left text-lg font-medium" aria-expanded={open === i}>
              {q}
              <motion.span animate={{ rotate: open === i ? 180 : 0 }}>
                <ChevronDown size={20} className="text-muted" />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {open === i && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease }} className="overflow-hidden">
                  <p className="pb-5 text-muted">{a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </section>
  )
}

function FinalCTA() {
  return (
    <section className="px-4 pb-28 text-center sm:px-6">
      <Reveal>
        <h2 className="mx-auto max-w-3xl text-5xl font-bold tracking-tight sm:text-7xl">
          Your best score <span className="text-sky">starts today.</span>
        </h2>
        <Link to="/signup" className="btn-primary mt-10 px-8 py-4 text-base">
          Create your free account <ArrowRight size={18} />
        </Link>
      </Reveal>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-line bg-surface/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Logo />
        <div className="flex flex-wrap gap-6">
          <a href="#features" className="hover:text-ink">Features</a>
          <a href="#pricing" className="hover:text-ink">Pricing</a>
          <a href="#schools" className="hover:text-ink">Schools</a>
          <Link to="/login" className="hover:text-ink">Log in</Link>
        </div>
        <div>© {new Date().getFullYear()} Horizon SAT · Demo version</div>
      </div>
    </footer>
  )
}

export default function Landing() {
  return (
    <div className="overflow-x-clip">
      <style>{`@keyframes shine { to { background-position: 200% center; } }`}</style>
      <Nav />
      <main>
        <Hero />
        <Stats />
        <Story />
        <ExamShowcase />
        <Bento />
        <Pricing />
        <Schools />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}
