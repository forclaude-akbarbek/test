import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, KeyRound } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { ThemeToggle } from '../components/ThemeToggle'
import { DEMO_ACCOUNTS, login, signup } from '../lib/store'
import { homeFor } from '../lib/nav'

export default function Auth({ mode }: { mode: 'login' | 'signup' }) {
  const nav = useNavigate()
  const [error, setError] = useState('')
  const [f, setF] = useState({ name: '', email: '', password: '', grade: '11', targetScore: 1400, testDate: '' })
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: k === 'targetScore' ? Number(e.target.value) : e.target.value })

  const doLogin = (email: string, password: string) => {
    const r = login(email, password)
    if (!r.ok) return setError(r.error)
    nav(homeFor(r.role))
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (mode === 'login') return doLogin(f.email, f.password)
    if (f.password.length < 6) return setError('Password must be at least 6 characters.')
    const r = signup({ ...f, testDate: f.testDate || new Date(Date.now() + 70 * 864e5).toISOString().slice(0, 10) })
    if (!r.ok) return setError(r.error)
    nav('/app')
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-sky/20 blur-[120px]" />
      <header className="relative mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <ThemeToggle />
      </header>
      <main className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-[1fr_380px] lg:pt-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mx-auto w-full max-w-md lg:mx-0 lg:justify-self-end">
          <h1 className="text-4xl font-bold tracking-tight">{mode === 'login' ? 'Welcome back.' : 'Create your account.'}</h1>
          <p className="mt-2 text-muted">{mode === 'login' ? 'Students, schools and administrators sign in here.' : 'Free forever. Upgrade anytime.'}</p>
          <form onSubmit={submit} className="mt-8 space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="label" htmlFor="name">Full name</label>
                <input id="name" className="input" required value={f.name} onChange={set('name')} placeholder="Aziza Rahimova" />
              </div>
            )}
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" type="email" className="input" required value={f.email} onChange={set('email')} placeholder="you@example.com" autoComplete="email" />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" type="password" className="input" required value={f.password} onChange={set('password')} placeholder="••••••••" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
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
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl bg-bad/10 px-4 py-3 text-sm text-bad" role="alert">
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
            <button className="btn-primary w-full py-3.5 text-base">
              {mode === 'login' ? 'Log in' : 'Create account'} <ArrowRight size={18} />
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
          {mode === 'login' && <p className="mt-2 text-center text-xs text-muted">School and government accounts are issued by Horizon SAT administrators.</p>}
        </motion.div>

        {mode === 'login' && (
          <motion.aside initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.15 }} className="card mx-auto h-fit w-full max-w-md bg-surface p-6 lg:mt-24">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <KeyRound size={16} className="text-sky" /> Demo access
            </div>
            <p className="mt-1 text-xs text-muted">One click to sign in as each account type.</p>
            <div className="mt-4 space-y-2">
              {DEMO_ACCOUNTS.map((a) => (
                <button key={a.email} onClick={() => doLogin(a.email, a.password)} className="flex w-full items-center justify-between rounded-2xl border border-line bg-elevated px-4 py-3 text-left transition hover:border-sky">
                  <div>
                    <div className="text-sm font-semibold">{a.label}</div>
                    <div className="text-xs text-muted">{a.email}</div>
                  </div>
                  <ArrowRight size={16} className="text-muted" />
                </button>
              ))}
            </div>
          </motion.aside>
        )}
      </main>
    </div>
  )
}
