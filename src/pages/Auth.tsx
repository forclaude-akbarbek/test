import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, KeyRound, MailCheck, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { PasswordForm, PasswordInput, PasswordStrength } from '../components/PasswordForm'
import { ThemeToggle } from '../components/ThemeToggle'
import { DEMO_ACCOUNTS, homePath, login, logout, passwordProblem, signup, useSession } from '../lib/store'

function Shell({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-sky/20 blur-[120px]" />
      <header className="relative mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <ThemeToggle />
      </header>
      <main className={`relative mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-8 sm:px-6 lg:pt-14 ${aside ? 'lg:grid-cols-[1fr_400px]' : ''}`}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className={`mx-auto w-full max-w-md ${aside ? 'lg:mx-0 lg:justify-self-end' : ''}`}>
          {children}
        </motion.div>
        {aside}
      </main>
    </div>
  )
}

function ErrorBox({ error }: { error: string }) {
  return (
    <AnimatePresence>
      {error && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl bg-bad/10 px-4 py-3 text-sm text-bad" role="alert">
          {error}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function Auth({ mode }: { mode: 'login' | 'signup' }) {
  const nav = useNavigate()
  const { user } = useSession()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [f, setF] = useState({ name: '', email: '', password: '', grade: '11', targetScore: 1400, testDate: '' })
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: k === 'targetScore' ? Number(e.target.value) : e.target.value })

  if (user) return <Navigate to={homePath(user)} replace />

  const doLogin = (email: string, password: string) => {
    setBusy(true)
    // A short pause so the button state is visible, as with a real network request.
    setTimeout(() => {
      const r = login(email, password)
      setBusy(false)
      if (!r.ok) return setError(r.error)
      nav(r.path)
    }, 350)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (mode === 'login') return doLogin(f.email, f.password)
    const problem = passwordProblem(f.password)
    if (problem) return setError(problem)
    const r = signup({ ...f, testDate: f.testDate || new Date(Date.now() + 70 * 864e5).toISOString().slice(0, 10) })
    if (!r.ok) return setError(r.error)
    nav('/app')
  }

  const aside =
    mode === 'login' ? (
      <motion.aside initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.15 }} className="card mx-auto h-fit w-full max-w-md bg-surface p-6 lg:mt-20">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <KeyRound size={16} className="text-sky" /> Demo access
        </div>
        <p className="mt-1 text-xs text-muted">One click to sign in as each kind of account.</p>
        <div className="mt-4 space-y-2">
          {DEMO_ACCOUNTS.map((a) => (
            <button key={a.email} onClick={() => doLogin(a.email, a.password)} disabled={busy} className="flex w-full items-center justify-between gap-3 rounded-2xl border border-line bg-elevated px-4 py-2.5 text-left transition hover:border-sky disabled:opacity-60">
              <div className="min-w-0">
                <div className="text-sm font-semibold">{a.label}</div>
                <div className="truncate text-xs text-muted">{a.note}</div>
              </div>
              <ArrowRight size={16} className="shrink-0 text-muted" />
            </button>
          ))}
        </div>
      </motion.aside>
    ) : undefined

  return (
    <Shell aside={aside}>
      <h1 className="text-4xl font-bold tracking-tight">{mode === 'login' ? 'Welcome back.' : 'Create your account.'}</h1>
      <p className="mt-2 text-muted">{mode === 'login' ? 'Students, teachers, schools and administrators sign in here.' : 'Free forever. Upgrade anytime.'}</p>
      <form onSubmit={submit} className="mt-8 space-y-4" noValidate={false}>
        {mode === 'signup' && (
          <div>
            <label className="label" htmlFor="name">Full name</label>
            <input id="name" className="input" required value={f.name} onChange={set('name')} placeholder="Aziza Rahimova" autoComplete="name" />
          </div>
        )}
        <div>
          <label className="label" htmlFor="email">Email or school login</label>
          <input id="email" type="email" className="input" required value={f.email} onChange={set('email')} placeholder="you@example.com" autoComplete="username" />
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <label className="label" htmlFor="password">Password</label>
            {mode === 'login' && <Link to="/forgot" className="text-xs font-semibold text-sky">Forgot password?</Link>}
          </div>
          <PasswordInput id="password" value={f.password} onChange={(v) => setF({ ...f, password: v })} placeholder="••••••••" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          {mode === 'signup' && <PasswordStrength value={f.password} />}
        </div>
        {mode === 'signup' && (
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label" htmlFor="grade">Grade</label>
              <select id="grade" className="input" value={f.grade} onChange={set('grade')}>
                {['9', '10', '11', '12', 'Gap year'].map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="target">Target</label>
              <select id="target" className="input" value={f.targetScore} onChange={set('targetScore')}>
                {[1200, 1300, 1400, 1450, 1500, 1550].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="date">Test date</label>
              <input id="date" type="date" className="input px-2" value={f.testDate} onChange={set('testDate')} />
            </div>
          </div>
        )}
        <ErrorBox error={error} />
        <button className="btn-primary w-full py-3.5 text-base" disabled={busy}>
          {busy ? 'Signing in…' : mode === 'login' ? 'Log in' : 'Create account'} {!busy && <ArrowRight size={18} />}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        {mode === 'login' ? (
          <>
            New student? <Link to="/signup" className="font-semibold text-sky">Create a free account</Link>
          </>
        ) : (
          <>
            Already have an account? <Link to="/login" className="font-semibold text-sky">Log in</Link>
          </>
        )}
      </p>
      {mode === 'login' && <p className="mt-2 text-center text-xs text-muted">School and government accounts are issued by Horizon SAT. Students and teachers at a school get their login from the school.</p>}
    </Shell>
  )
}

export function Forgot() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  return (
    <Shell>
      <Link to="/login" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft size={15} /> Back to log in</Link>
      {sent ? (
        <div className="mt-6">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-sky-soft text-sky-deep dark:text-sky"><MailCheck size={26} /></div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight">Check your email</h1>
          <p className="mt-2 text-muted">
            If an account exists for <b className="text-ink">{email}</b>, we've sent a link to reset the password. The link works for 30 minutes.
          </p>
          <p className="mt-4 rounded-2xl bg-ink/[0.04] p-4 text-sm text-muted">Signed in with a school login? Your school administrator or teacher can reset your password from their portal.</p>
        </div>
      ) : (
        <>
          <h1 className="mt-6 text-4xl font-bold tracking-tight">Reset your password.</h1>
          <p className="mt-2 text-muted">Enter the email you use to sign in and we'll send you a reset link.</p>
          <form onSubmit={(e) => { e.preventDefault(); setSent(true) }} className="mt-8 space-y-4">
            <div>
              <label className="label" htmlFor="f-email">Email</label>
              <input id="f-email" type="email" className="input" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" autoFocus />
            </div>
            <button className="btn-primary w-full py-3.5 text-base">Send reset link</button>
          </form>
        </>
      )}
    </Shell>
  )
}

/** First sign-in with a school-issued temporary password. */
export function Welcome() {
  const { user } = useSession()
  const nav = useNavigate()
  if (!user) return <Navigate to="/login" replace />
  if (!user.mustChangePassword) return <Navigate to={homePath(user)} replace />
  return (
    <Shell>
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-sky-soft text-sky-deep dark:text-sky"><ShieldCheck size={26} /></div>
      <h1 className="mt-5 text-4xl font-bold tracking-tight">Welcome, {user.name.split(' ')[0]}.</h1>
      <p className="mt-2 text-muted">You signed in with a temporary password. Choose your own password to continue.</p>
      <div className="mt-8">
        <PasswordForm firstLogin onDone={() => nav(homePath({ ...user, mustChangePassword: false }))} />
      </div>
      <button onClick={() => { logout(); nav('/login') }} className="mt-4 w-full text-center text-sm text-muted hover:text-ink">Not you? Log out</button>
    </Shell>
  )
}
