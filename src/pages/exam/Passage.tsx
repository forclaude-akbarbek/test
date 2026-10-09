import { useRef } from 'react'

export type Range = [number, number]

/** Merges overlapping ranges so marks never nest. */
export function mergeRanges(ranges: Range[]): Range[] {
  const sorted = [...ranges].sort((a, b) => a[0] - b[0])
  const out: Range[] = []
  for (const r of sorted) {
    const last = out[out.length - 1]
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1])
    else out.push([r[0], r[1]])
  }
  return out
}

function offsetWithin(root: Node, node: Node, offset: number) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let total = 0
  let cur = walker.nextNode()
  while (cur) {
    if (cur === node) return total + offset
    total += cur.textContent?.length ?? 0
    cur = walker.nextNode()
  }
  // Selection endpoint was an element: approximate with full length.
  return total
}

/**
 * Exam passage with a highlighter: when `highlighting` is on, selecting text adds a highlight;
 * clicking an existing highlight removes it.
 */
export function Passage({ text, ranges, onChange, highlighting }: { text: string; ranges: Range[]; onChange: (r: Range[]) => void; highlighting: boolean }) {
  const ref = useRef<HTMLDivElement>(null)

  const onMouseUp = () => {
    if (!highlighting || !ref.current) return
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return
    const r = sel.getRangeAt(0)
    if (!ref.current.contains(r.startContainer) || !ref.current.contains(r.endContainer)) return
    const a = offsetWithin(ref.current, r.startContainer, r.startOffset)
    const b = offsetWithin(ref.current, r.endContainer, r.endOffset)
    if (b > a) onChange(mergeRanges([...ranges, [a, b]]))
    sel.removeAllRanges()
  }

  const parts: { t: string; mark: number | null }[] = []
  let pos = 0
  mergeRanges(ranges).forEach((rg, i) => {
    if (rg[0] > pos) parts.push({ t: text.slice(pos, rg[0]), mark: null })
    parts.push({ t: text.slice(rg[0], rg[1]), mark: i })
    pos = rg[1]
  })
  if (pos < text.length) parts.push({ t: text.slice(pos), mark: null })

  return (
    <div
      ref={ref}
      onMouseUp={onMouseUp}
      className={`whitespace-pre-line font-serif text-[17px] leading-[1.75] text-ink ${highlighting ? 'cursor-text selection:bg-amber-300/60' : ''}`}
    >
      {parts.map((p, i) =>
        p.mark == null ? (
          <span key={i}>{p.t}</span>
        ) : (
          <mark
            key={i}
            className="hl cursor-pointer"
            title="Click to remove highlight"
            onClick={() => onChange(mergeRanges(ranges).filter((_, j) => j !== p.mark))}
          >
            {p.t}
          </mark>
        ),
      )}
    </div>
  )
}
