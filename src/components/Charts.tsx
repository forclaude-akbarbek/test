import { useMemo, useRef, useState } from 'react'

export interface Series {
  name: string
  color: string // CSS color, e.g. 'var(--viz-1)'
  values: (number | null)[]
}

/**
 * Line chart with a snapping crosshair + tooltip listing every series.
 * A legend appears for 2+ series; the last point of each series is direct-labeled.
 */
export function LineChart({
  labels,
  series,
  height = 240,
  yMin,
  yMax,
  format = (v: number) => String(v),
  ariaLabel,
}: {
  labels: string[]
  series: Series[]
  height?: number
  yMin?: number
  yMax?: number
  format?: (v: number) => string
  ariaLabel: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<number | null>(null)
  const W = 640
  const H = height
  const pad = { l: 44, r: 56, t: 16, b: 28 }
  const all = series.flatMap((s) => s.values.filter((v): v is number => v != null))
  const lo = yMin ?? Math.floor(Math.min(...all) / 100) * 100
  const hi = yMax ?? Math.ceil(Math.max(...all) / 100) * 100
  const x = (i: number) => pad.l + (labels.length === 1 ? (W - pad.l - pad.r) / 2 : (i * (W - pad.l - pad.r)) / (labels.length - 1))
  const y = (v: number) => pad.t + (1 - (v - lo) / (hi - lo || 1)) * (H - pad.t - pad.b)
  const ticks = useMemo(() => {
    const n = 4
    return Array.from({ length: n + 1 }, (_, i) => Math.round(lo + ((hi - lo) * i) / n))
  }, [lo, hi])

  // Direct labels at each series' last point, nudged apart so they never overlap.
  const endLabels = series
    .map((s) => {
      const i = s.values.reduce<number>((acc, v, idx) => (v != null ? idx : acc), -1)
      return i < 0 ? null : { name: s.name, i, v: s.values[i]!, y: y(s.values[i]!) }
    })
    .filter((l): l is { name: string; i: number; v: number; y: number } => l !== null)
    .sort((a, b) => a.y - b.y)
  for (let k = 1; k < endLabels.length; k++) if (endLabels[k].y - endLabels[k - 1].y < 14) endLabels[k].y = endLabels[k - 1].y + 14

  const onMove = (e: React.PointerEvent) => {
    const rect = ref.current!.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * W
    let best = 0
    labels.forEach((_, i) => {
      if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i
    })
    setHover(best)
  }

  return (
    <div>
      {series.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-4 text-xs text-muted">
          {series.map((s) => (
            <span key={s.name} className="inline-flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4 rounded" style={{ background: s.color }} />
              {s.name}
            </span>
          ))}
        </div>
      )}
      <div ref={ref} className="relative" onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={ariaLabel}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="rgb(var(--line))" strokeWidth="1" />
              <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="rgb(var(--muted))">
                {format(t)}
              </text>
            </g>
          ))}
          {labels.map((l, i) => (
            <text key={l + i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="rgb(var(--muted))">
              {l}
            </text>
          ))}
          {hover != null && <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} stroke="rgb(var(--muted))" strokeWidth="1" strokeDasharray="3 3" />}
          {series.map((s) => {
            const pts = s.values.map((v, i) => (v == null ? null : ([x(i), y(v)] as const))).filter(Boolean) as (readonly [number, number])[]
            return (
              <g key={s.name}>
                <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                {s.values.map((v, i) =>
                  v == null ? null : (
                    <circle key={i} cx={x(i)} cy={y(v)} r={hover === i ? 5 : 4} fill={s.color} stroke="rgb(var(--elevated))" strokeWidth="2" />
                  ),
                )}
              </g>
            )
          })}
          {endLabels.map((l) => (
            <text key={l.name} x={x(l.i) + 10} y={l.y + 4} fontSize="12" fontWeight="600" fill="rgb(var(--ink))">
              {format(l.v)}
            </text>
          ))}
        </svg>
        {hover != null && (
          <div
            className="pointer-events-none absolute top-2 z-10 min-w-[140px] rounded-xl border border-line bg-elevated px-3 py-2 text-xs shadow-soft"
            style={{ left: `${(x(hover) / W) * 100}%`, transform: x(hover) > W * 0.6 ? 'translateX(calc(-100% - 12px))' : 'translateX(12px)' }}
          >
            <div className="mb-1 text-muted">{labels[hover]}</div>
            {series.map((s) => (
              <div key={s.name} className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 text-muted">
                  <span className="inline-block h-0.5 w-3 rounded" style={{ background: s.color }} />
                  {s.name}
                </span>
                <span className="font-semibold text-ink">{s.values[hover] == null ? '—' : format(s.values[hover]!)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/** Horizontal bars (single hue = magnitude) with value labels and per-bar hover detail. */
export function BarList({ rows, max = 100, unit = '%' }: { rows: { label: string; value: number; detail?: string }[]; max?: number; unit?: string }) {
  const [hover, setHover] = useState<number | null>(null)
  return (
    <div className="space-y-2.5">
      {rows.map((r, i) => (
        <div
          key={r.label}
          className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1"
          onPointerEnter={() => setHover(i)}
          onPointerLeave={() => setHover(null)}
          tabIndex={0}
          onFocus={() => setHover(i)}
          onBlur={() => setHover(null)}
        >
          <div className="truncate text-sm text-ink">{r.label}</div>
          <div className="text-right text-sm font-semibold tabular-nums text-ink">
            {Math.round(r.value)}
            {unit}
          </div>
          <div className="col-span-2 h-2 rounded-full bg-ink/[0.06]">
            <div
              className="h-2 rounded-full transition-all duration-700"
              style={{ width: `${Math.max(2, (r.value / max) * 100)}%`, background: 'var(--viz-1)', opacity: hover === null || hover === i ? 1 : 0.55 }}
            />
          </div>
          {hover === i && r.detail && <div className="col-span-2 text-xs text-muted">{r.detail}</div>}
        </div>
      ))}
    </div>
  )
}

/** Circular progress ring used for headline numbers. */
export function Ring({ value, max, size = 140, stroke = 12, children }: { value: number; max: number; size?: number; stroke?: number; children?: React.ReactNode }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(1, value / max))
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--ink) / 0.07)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgb(var(--sky))"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  )
}
