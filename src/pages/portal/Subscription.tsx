import { AnimatePresence, motion } from 'framer-motion'
import { Check, Crown, Minus, X } from 'lucide-react'
import { useState } from 'react'
import { FREE_LIMITS, PREMIUM_DAILY_WORDS, PRICES, updateProfile, usage, useSession } from '../../lib/store'
import { PageTitle } from './Layout'

const ROWS: [string, string | boolean, string | boolean][] = [
  ['Question Bank questions', 'Unlimited', 'Unlimited'],
  ['Standard vocabulary lists', true, true],
  ['Full-length adaptive exams', '1 per month', 'Unlimited'],
  ['AI study plans', '1 per month', 'Unlimited'],
  ['New vocabulary words', `${FREE_LIMITS.dailyWords} per day`, `${PREMIUM_DAILY_WORDS} per day`],
  ['Section tests & quick practice', true, true],
  ['Advanced analytics', false, true],
]

export default function Subscription() {
  const { user, data } = useSession()
  const u = usage(user, data)
  const [checkout, setCheckout] = useState(false)

  const meters = [
    { label: 'Full-length exams', used: u.examsUsed, max: FREE_LIMITS.fullExamsPerMonth },
    { label: 'AI study plans', used: u.plansUsed, max: FREE_LIMITS.plansPerMonth },
  ]
  const resetDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

  return (
    <div className="space-y-6">
      <PageTitle title="Subscription" sub="Manage your plan and usage." />
      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className={`rounded-3xl p-6 ${u.premium ? 'bg-gradient-to-br from-sky to-sky-deep text-white dark:from-sky-soft dark:to-elevated dark:text-ink' : 'card'}`}>
          <div className="flex items-center gap-2 text-sm font-semibold opacity-90">
            <Crown size={16} /> Current plan
          </div>
          <div className="mt-2 text-3xl font-bold tracking-tight">{u.premium ? 'Premium' : 'Free'}</div>
          <div className={`mt-1 text-sm ${u.premium ? 'opacity-90' : 'text-muted'}`}>{u.premium ? `${PRICES.monthly.toLocaleString('en-US')} UZS / month · renews ${resetDate}` : 'Free forever'}</div>
          {u.premium ? (
            <button onClick={() => updateProfile({ plan: 'free' })} className="btn mt-6 bg-white/20 text-white hover:bg-white/30 dark:text-ink">
              Switch to Free (demo)
            </button>
          ) : (
            <button onClick={() => setCheckout(true)} className="btn-primary mt-6">
              Upgrade to Premium
            </button>
          )}
        </div>
        <div className="card p-6">
          <div className="font-semibold">This month's usage</div>
          <div className="text-sm text-muted">Resets on {resetDate}</div>
          <div className="mt-5 space-y-5">
            {meters.map((m) => (
              <div key={m.label}>
                <div className="flex justify-between text-sm">
                  <span>{m.label}</span>
                  <span className="font-semibold tabular-nums">{u.premium ? `${m.used} used · unlimited` : `${m.used} / ${m.max}`}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-ink/10">
                  <div className={`h-2 rounded-full transition-all ${!u.premium && m.used >= m.max ? 'bg-warn' : 'bg-sky'}`} style={{ width: u.premium ? '8%' : `${Math.min(100, (m.used / m.max) * 100)}%` }} />
                </div>
              </div>
            ))}
            <div className="flex justify-between text-sm">
              <span>New vocabulary words per day</span>
              <span className="font-semibold">{u.dailyWords}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-[1.4fr_1fr_1fr] border-b border-line bg-ink/[0.03] px-6 py-4 text-sm font-semibold">
          <div>Feature</div>
          <div className="text-center">Free</div>
          <div className="text-center text-sky">Premium</div>
        </div>
        {ROWS.map(([f, a, b]) => (
          <div key={f} className="grid grid-cols-[1.4fr_1fr_1fr] items-center border-b border-line px-6 py-3.5 text-sm last:border-0">
            <div>{f}</div>
            <Cell v={a} />
            <Cell v={b} />
          </div>
        ))}
      </div>

      <AnimatePresence>{checkout && <Checkout onClose={() => setCheckout(false)} />}</AnimatePresence>
    </div>
  )
}

function Cell({ v }: { v: string | boolean }) {
  if (v === true) return <Check size={18} className="mx-auto text-sky" aria-label="Included" />
  if (v === false) return <Minus size={18} className="mx-auto text-muted" aria-label="Not included" />
  return <div className="text-center">{v}</div>
}

function Checkout({ onClose }: { onClose: () => void }) {
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [method, setMethod] = useState('Payme')
  const [step, setStep] = useState<'choose' | 'paying' | 'done'>('choose')
  const pay = () => {
    setStep('paying')
    setTimeout(() => {
      updateProfile({ plan: 'premium' })
      setStep('done')
    }, 1400)
  }
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }} className="fixed inset-x-4 top-[10vh] z-50 mx-auto max-w-md rounded-3xl bg-elevated p-7 shadow-lift" role="dialog" aria-label="Upgrade to Premium">
        <button onClick={onClose} className="absolute right-5 top-5 grid h-8 w-8 place-items-center rounded-full hover:bg-ink/5" aria-label="Close"><X size={18} /></button>
        {step === 'done' ? (
          <div className="py-6 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 18 }} className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-sky text-white dark:text-black">
              <Crown size={28} />
            </motion.div>
            <div className="mt-5 text-2xl font-bold">Welcome to Premium</div>
            <p className="mt-1 text-muted">Unlimited exams and study plans are now unlocked.</p>
            <button onClick={onClose} className="btn-primary mt-6">Start practicing</button>
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold tracking-tight">Upgrade to Premium</div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {(['monthly', 'yearly'] as const).map((p) => (
                <button key={p} onClick={() => setPeriod(p)} className={`rounded-2xl border-2 p-4 text-left transition ${period === p ? 'border-sky' : 'border-line'}`}>
                  <div className="text-sm text-muted capitalize">{p}</div>
                  <div className="text-lg font-bold">{PRICES[p].toLocaleString('en-US')} UZS</div>
                  {p === 'yearly' && <div className="text-xs font-semibold text-good">Save 33%</div>}
                </button>
              ))}
            </div>
            <div className="label mt-5">Payment method</div>
            <div className="grid grid-cols-3 gap-2">
              {['Payme', 'Click', 'Uzum'].map((m) => (
                <button key={m} onClick={() => setMethod(m)} className={`rounded-xl border-2 py-3 text-sm font-semibold transition ${method === m ? 'border-sky text-sky' : 'border-line'}`}>
                  {m}
                </button>
              ))}
            </div>
            <button onClick={pay} disabled={step === 'paying'} className="btn-primary mt-6 w-full py-3">
              {step === 'paying' ? 'Processing…' : `Pay ${PRICES[period].toLocaleString('en-US')} UZS with ${method}`}
            </button>
            <p className="mt-3 text-center text-xs text-muted">Demo checkout — no real payment is made.</p>
          </>
        )}
      </motion.div>
    </>
  )
}
