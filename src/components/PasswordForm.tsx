import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { changePassword, passwordProblem } from '../lib/store'

export function PasswordInput({ id, value, onChange, placeholder, autoComplete, autoFocus }: { id: string; value: string; onChange: (v: string) => void; placeholder?: string; autoComplete?: string; autoFocus?: boolean }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input id={id} type={show ? 'text' : 'password'} className="input pr-11" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete={autoComplete} autoFocus={autoFocus} required />
      <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-muted hover:text-ink" aria-label={show ? 'Hide password' : 'Show password'}>
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}

export function PasswordStrength({ value }: { value: string }) {
  if (!value) return null
  const checks = [value.length >= 8, /[a-zA-Z]/.test(value) && /[0-9]/.test(value), value.length >= 12 || /[^a-zA-Z0-9]/.test(value)]
  const score = checks.filter(Boolean).length
  const label = ['Too weak', 'Weak', 'Good', 'Strong'][score]
  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span key={i} className={`h-1 flex-1 rounded-full ${i < score ? (score === 1 ? 'bg-warn' : 'bg-good') : 'bg-ink/10'}`} />
        ))}
      </div>
      <div className="mt-1 text-xs text-muted">
        {label}
        {passwordProblem(value) ? ` · ${passwordProblem(value)}` : ''}
      </div>
    </div>
  )
}

/** Change-password form. With `firstLogin`, the current password isn't asked for. */
export function PasswordForm({ firstLogin, onDone }: { firstLogin?: boolean; onDone?: () => void }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (next !== confirm) return setMsg({ ok: false, text: "The two new passwords don't match." })
        const r = changePassword(current, next)
        if (!r.ok) return setMsg({ ok: false, text: r.error })
        setMsg({ ok: true, text: 'Password updated.' })
        setCurrent('')
        setNext('')
        setConfirm('')
        onDone?.()
      }}
      className="space-y-4"
    >
      {!firstLogin && (
        <div>
          <label className="label" htmlFor="pw-current">Current password</label>
          <PasswordInput id="pw-current" value={current} onChange={setCurrent} autoComplete="current-password" />
        </div>
      )}
      <div>
        <label className="label" htmlFor="pw-new">New password</label>
        <PasswordInput id="pw-new" value={next} onChange={setNext} autoComplete="new-password" autoFocus={firstLogin} />
        <PasswordStrength value={next} />
      </div>
      <div>
        <label className="label" htmlFor="pw-confirm">Repeat new password</label>
        <PasswordInput id="pw-confirm" value={confirm} onChange={setConfirm} autoComplete="new-password" />
      </div>
      {msg && <div className={`rounded-xl px-4 py-3 text-sm ${msg.ok ? 'bg-good/10 text-good' : 'bg-bad/10 text-bad'}`} role={msg.ok ? 'status' : 'alert'}>{msg.text}</div>}
      <button className="btn-primary w-full py-3">{firstLogin ? 'Set password and continue' : 'Update password'}</button>
    </form>
  )
}
