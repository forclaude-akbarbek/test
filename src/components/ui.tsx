import { AnimatePresence, motion } from 'framer-motion'
import { Check, Copy, Download, X, type LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { downloadCsv } from '../lib/school'
import type { IssuedLogin as IssuedLoginLike } from '../lib/store'

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ type: 'spring', damping: 30, stiffness: 360 }}
            className={`fixed inset-x-3 top-[6vh] z-50 mx-auto max-h-[88vh] overflow-auto rounded-3xl bg-elevated p-6 shadow-lift scroll-thin sm:p-7 ${wide ? 'max-w-3xl' : 'max-w-lg'}`}
            role="dialog"
            aria-label={title}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
              <button onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-ink/5" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export function Drawer({ open, onClose, children, label }: { open: boolean; onClose: () => void; children: React.ReactNode; label: string }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 36, stiffness: 380 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-xl overflow-auto bg-elevated shadow-lift scroll-thin"
            role="dialog"
            aria-label={label}
          >
            <button onClick={onClose} className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full hover:bg-ink/5" aria-label="Close">
              <X size={18} />
            </button>
            {children}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

export function Stat({ label, value, note, tone }: { label: string; value: React.ReactNode; note?: React.ReactNode; tone?: 'good' | 'bad' | 'warn' }) {
  return (
    <div className="card p-5">
      <div className="text-sm text-muted">{label}</div>
      <div className="mt-1 text-3xl font-bold tracking-tight tabular-nums">{value}</div>
      {note != null && <div className={`mt-1 text-xs ${tone === 'good' ? 'font-semibold text-good' : tone === 'bad' ? 'font-semibold text-bad' : tone === 'warn' ? 'font-semibold text-warn' : 'text-muted'}`}>{note}</div>}
    </div>
  )
}

export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="inline-flex flex-wrap rounded-full border border-line bg-elevated p-1 text-sm">
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)} className={`rounded-full px-4 py-1.5 font-medium transition ${value === o.value ? 'bg-sky text-white dark:text-black' : 'text-muted hover:text-ink'}`} aria-pressed={value === o.value}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function StatusPill({ days }: { days: number | null }) {
  if (days == null) return <span className="chip bg-ink/5 text-muted">Not started</span>
  if (days <= 7) return <span className="chip bg-good/15 text-good">Active</span>
  if (days <= 14) return <span className="chip bg-warn/15 text-warn">Slowing</span>
  return <span className="chip bg-bad/15 text-bad">Inactive</span>
}

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setDone(true)
          setTimeout(() => setDone(false), 1600)
        } catch {
          /* clipboard unavailable: the text is still selectable */
        }
      }}
      className="btn-ghost px-3 py-1.5 text-xs"
    >
      {done ? <Check size={14} className="text-good" /> : <Copy size={14} />} {done ? 'Copied' : label}
    </button>
  )
}

/** Shows newly issued logins once, with copy and CSV download. */
export function IssuedLogins({ logins, filename }: { logins: IssuedLoginLike[]; filename: string }) {
  const text = logins.map((l) => `${l.name}\t${l.email}\t${l.password}`).join('\n')
  return (
    <div>
      <div className="rounded-2xl border border-warn/40 bg-warn/10 px-4 py-3 text-sm">
        Share these sign-in details now. Each person sets their own password the first time they log in, so this temporary password is shown only once.
      </div>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-line">
        <table className="w-full min-w-[460px] text-sm">
          <thead className="bg-ink/[0.03] text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Name</th>
              {logins.some((l) => l.className) && <th className="px-4 py-2.5 font-semibold">Class</th>}
              <th className="px-4 py-2.5 font-semibold">Login</th>
              <th className="px-4 py-2.5 font-semibold">Temporary password</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {logins.map((l) => (
              <tr key={l.email}>
                <td className="px-4 py-2.5 font-medium">{l.name}</td>
                {logins.some((x) => x.className) && <td className="px-4 py-2.5 text-muted">{l.className ?? '—'}</td>}
                <td className="select-all px-4 py-2.5 font-mono text-xs">{l.email}</td>
                <td className="select-all px-4 py-2.5 font-mono text-xs">{l.password}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <CopyButton text={text} label="Copy all" />
        <button type="button" onClick={() => downloadCsv(filename, [['Name', 'Class', 'Login', 'Temporary password'], ...logins.map((l) => [l.name, l.className ?? '', l.email, l.password])])} className="btn-ghost px-3 py-1.5 text-xs">
          <Download size={14} /> Download CSV
        </button>
      </div>
    </div>
  )
}

/** Sequential single-hue fill for a 0–100 value, from the surface toward the chart accent. */
export const seqColor = (v: number) => `color-mix(in oklab, var(--viz-1) ${Math.round(8 + Math.max(0, Math.min(100, v)) * 0.88)}%, rgb(var(--elevated)))`
export const seqInk = (v: number) => (v >= 55 ? '#fff' : 'rgb(var(--ink))')

export function SeqLegend({ from = 0, to = 100, unit = '%' }: { from?: number; to?: number; unit?: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted">
      <span className="tabular-nums">
        {from}
        {unit}
      </span>
      <span className="h-2 w-28 rounded-full" style={{ background: `linear-gradient(90deg, ${seqColor(0)}, ${seqColor(100)})` }} />
      <span className="tabular-nums">
        {to}
        {unit}
      </span>
    </div>
  )
}

/** Rows × columns grid of 0–100 values (e.g. students × domains). */
export function Heatmap({ rows, cols, value, rowLabel, onRow, colLabel }: { rows: { id: string; label: string }[]; cols: string[]; value: (rowId: string, col: string) => number | null; rowLabel?: string; onRow?: (id: string) => void; colLabel?: (c: string) => string }) {
  const [hover, setHover] = useState<string | null>(null)
  return (
    <div className="overflow-x-auto scroll-thin">
      <table className="w-full min-w-[640px] border-separate text-xs" style={{ borderSpacing: 2 }}>
        <thead>
          <tr>
            <th className="sticky left-0 bg-elevated px-2 py-2 text-left font-semibold text-muted">{rowLabel ?? ''}</th>
            {cols.map((c) => (
              <th key={c} className="px-1 py-2 text-center font-semibold text-muted">
                {colLabel ? colLabel(c) : c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <th scope="row" className="sticky left-0 max-w-[180px] truncate bg-elevated px-2 py-1 text-left font-medium">
                {onRow ? (
                  <button onClick={() => onRow(r.id)} className="truncate hover:text-sky">
                    {r.label}
                  </button>
                ) : (
                  r.label
                )}
              </th>
              {cols.map((c) => {
                const v = value(r.id, c)
                const key = r.id + c
                return (
                  <td
                    key={c}
                    onPointerEnter={() => setHover(key)}
                    onPointerLeave={() => setHover(null)}
                    title={`${r.label} · ${colLabel ? colLabel(c) : c}: ${v == null ? 'no data' : `${Math.round(v)}%`}`}
                    className={`h-8 min-w-[64px] rounded-md text-center font-semibold tabular-nums transition ${hover === key ? 'ring-2 ring-ink/60' : ''}`}
                    style={{ background: v == null ? 'rgb(var(--ink) / 0.04)' : seqColor(v), color: v == null ? 'rgb(var(--muted))' : seqInk(v) }}
                  >
                    {v == null ? '—' : Math.round(v)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Vertical bar histogram with per-bar hover. */
export function Histogram({ bins, ariaLabel }: { bins: { label: string; count: number }[]; ariaLabel: string }) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(1, ...bins.map((b) => b.count))
  return (
    <div role="img" aria-label={ariaLabel}>
      <div className="flex h-44 items-end gap-1.5">
        {bins.map((b, i) => (
          <div key={b.label} className="relative flex h-full flex-1 flex-col justify-end" onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)}>
            {hover === i && (
              <div className="absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-line bg-elevated px-2 py-1 text-xs shadow-soft">
                <b className="tabular-nums">{b.count}</b> <span className="text-muted">students · {b.label}</span>
              </div>
            )}
            <div className="rounded-t-[4px] transition-all duration-500" style={{ height: `${(b.count / max) * 100}%`, minHeight: b.count ? 3 : 0, background: 'var(--viz-1)', opacity: hover == null || hover === i ? 1 : 0.6 }} />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5 text-[10px] text-muted">
        {bins.map((b, i) => (
          <div key={b.label} className="flex-1 text-center tabular-nums">
            {i % 2 === 0 ? b.label.split('–')[0] : ''}
          </div>
        ))}
      </div>
    </div>
  )
}

export function Empty({ icon: Icon, title, body, action }: { icon: LucideIcon; title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="card grid place-items-center p-12 text-center">
      <Icon size={30} className="text-muted" />
      <div className="mt-3 font-semibold">{title}</div>
      {body && <p className="mt-1 max-w-sm text-sm text-muted">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Progress({ value, tone }: { value: number; tone?: 'good' | 'warn' }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-ink/10">
      <div className={`h-1.5 rounded-full transition-all duration-700 ${tone === 'warn' ? 'bg-warn' : tone === 'good' ? 'bg-good' : 'bg-sky'}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}
