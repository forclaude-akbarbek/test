import { useState } from 'react'
import { REGIONS } from '../data/schools'
import { seqColor, seqInk } from './ui'

/**
 * Tile map of Uzbekistan's 14 regions (positions approximate geography, west → east).
 * Colour is a single-hue sequential scale of the regional average score.
 */
export function RegionMap({ values, onSelect, selected }: { values: Record<string, { avg: number | null; students: number; schools: number }>; onSelect?: (region: string) => void; selected?: string }) {
  const [hover, setHover] = useState<string | null>(null)
  const avgs = Object.values(values).map((v) => v.avg).filter((v): v is number => v != null)
  const lo = Math.floor(Math.min(...avgs) / 50) * 50
  const hi = Math.ceil(Math.max(...avgs) / 50) * 50
  const pct = (v: number) => ((v - lo) / Math.max(1, hi - lo)) * 100
  const cols = 7
  const rows = 3
  const h = hover ? values[hover] : null
  return (
    <div>
      <div className="overflow-x-auto scroll-thin">
        <div className="grid min-w-[520px] gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}>
          {REGIONS.map((r) => {
            const v = values[r.name]
            const p = v?.avg == null ? null : pct(v.avg)
            const short = r.name === 'Tashkent City' ? 'Tashkent City' : r.name === 'Tashkent Region' ? 'Tashkent reg.' : r.name.replace('Republic of ', '')
            return (
              <button
                key={r.name}
                onClick={() => onSelect?.(r.name)}
                onPointerEnter={() => setHover(r.name)}
                onPointerLeave={() => setHover(null)}
                onFocus={() => setHover(r.name)}
                onBlur={() => setHover(null)}
                style={{ gridColumn: r.col + 1, gridRow: r.row + 1, background: p == null ? 'rgb(var(--ink) / 0.05)' : seqColor(p), color: p == null ? 'rgb(var(--muted))' : seqInk(p) }}
                className={`flex aspect-[1.15] min-w-0 flex-col justify-between rounded-xl p-2 text-left transition hover:-translate-y-0.5 ${selected === r.name ? 'ring-2 ring-ink ring-offset-2 ring-offset-elevated' : ''}`}
                aria-label={`${r.name}: average ${v?.avg ?? 'no data'}`}
              >
                <span className="line-clamp-2 break-words text-[10px] font-semibold leading-tight sm:text-[11px]">{short}</span>
                <span className="text-sm font-bold tabular-nums sm:text-lg">{v?.avg ?? '—'}</span>
              </button>
            )
          })}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
        <span className="tabular-nums">{lo}</span>
        <span className="h-2 w-28 rounded-full" style={{ background: `linear-gradient(90deg, ${seqColor(0)}, ${seqColor(100)})` }} />
        <span className="tabular-nums">{hi}</span>
        <span>average predicted score</span>
        <span className="min-w-0 truncate sm:ml-auto sm:text-right" aria-live="polite">
          {h && hover ? (
            <>
              <b className="text-ink">{hover}</b> · avg {h.avg ?? '—'} · {h.schools} schools · {h.students.toLocaleString('en-US')} students
            </>
          ) : null}
        </span>
      </div>
    </div>
  )
}
