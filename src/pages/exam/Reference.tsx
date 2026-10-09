import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Rich } from '../../components/Rich'

const ITEMS = [
  ['Circle', '$A = \\pi r^2$, $C = 2\\pi r$'],
  ['Rectangle', '$A = \\ell w$'],
  ['Triangle', '$A = \\tfrac{1}{2}bh$'],
  ['Pythagorean theorem', '$c^2 = a^2 + b^2$'],
  ['Special right triangles', '$30^\\circ\\text{-}60^\\circ\\text{-}90^\\circ$: $x,\\ x\\sqrt{3},\\ 2x$ · $45^\\circ\\text{-}45^\\circ\\text{-}90^\\circ$: $s,\\ s,\\ s\\sqrt{2}$'],
  ['Rectangular prism', '$V = \\ell wh$'],
  ['Cylinder', '$V = \\pi r^2 h$'],
  ['Sphere', '$V = \\tfrac{4}{3}\\pi r^3$'],
  ['Cone', '$V = \\tfrac{1}{3}\\pi r^2 h$'],
  ['Pyramid', '$V = \\tfrac{1}{3}\\ell wh$'],
]

export function ReferenceSheet({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed right-4 top-24 z-40 w-[min(440px,94vw)] overflow-hidden rounded-xl border border-line bg-elevated shadow-lift"
    >
      <div className="flex cursor-move items-center justify-between bg-neutral-900 px-4 py-2 text-sm text-white">
        <span className="font-semibold">Reference</span>
        <button onClick={onClose} className="rounded p-1 hover:bg-white/10" aria-label="Close reference sheet">
          <X size={14} />
        </button>
      </div>
      <div className="max-h-[60vh] space-y-3 overflow-auto p-5 text-sm scroll-thin">
        {ITEMS.map(([k, v]) => (
          <div key={k} className="flex flex-col gap-0.5 border-b border-line pb-2 last:border-0">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">{k}</span>
            <Rich text={v} />
          </div>
        ))}
        <p className="pt-1 text-xs text-muted">
          The number of degrees of arc in a circle is 360. The number of radians of arc in a circle is <Rich text="$2\pi$" />. The sum of the measures in degrees of the angles of a
          triangle is 180.
        </p>
      </div>
    </motion.div>
  )
}
