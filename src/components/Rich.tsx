import katex from 'katex'
import 'katex/dist/katex.min.css'
import { Fragment, useMemo } from 'react'

/** Renders text with inline $math$ and display $$math$$ using KaTeX; newlines become paragraph breaks. */
export function Rich({ text, className }: { text: string; className?: string }) {
  const parts = useMemo(() => {
    const out: { kind: 'text' | 'inline' | 'block'; value: string }[] = []
    const re = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g
    let last = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(text))) {
      if (m.index > last) out.push({ kind: 'text', value: text.slice(last, m.index) })
      out.push(m[1] !== undefined ? { kind: 'block', value: m[1] } : { kind: 'inline', value: m[2] })
      last = re.lastIndex
    }
    if (last < text.length) out.push({ kind: 'text', value: text.slice(last) })
    return out
  }, [text])

  return (
    <span className={className}>
      {parts.map((p, i) => {
        if (p.kind === 'text')
          return (
            <Fragment key={i}>
              {p.value.split('\n').map((line, j, arr) => (
                <Fragment key={j}>
                  {line}
                  {j < arr.length - 1 && <br />}
                </Fragment>
              ))}
            </Fragment>
          )
        const html = katex.renderToString(p.value, { throwOnError: false, displayMode: p.kind === 'block' })
        return p.kind === 'block' ? (
          <span key={i} className="my-2 block" dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <span key={i} dangerouslySetInnerHTML={{ __html: html }} />
        )
      })}
    </span>
  )
}
