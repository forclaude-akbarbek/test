import { motion, useDragControls } from 'framer-motion'
import { GripHorizontal, Maximize2, Minimize2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

// Public demonstration key from the Desmos API documentation. Production needs its own licensed key.
const DESMOS_SRC = 'https://www.desmos.com/api/v1.9/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6'

declare global {
  interface Window {
    Desmos?: { GraphingCalculator: (el: HTMLElement, opts?: Record<string, unknown>) => { destroy: () => void } }
  }
}

let loader: Promise<void> | null = null
function loadDesmos() {
  if (window.Desmos) return Promise.resolve()
  if (!loader) {
    loader = new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = DESMOS_SRC
      s.async = true
      s.onload = () => resolve()
      s.onerror = () => {
        loader = null
        reject(new Error('Desmos failed to load'))
      }
      document.head.appendChild(s)
    })
  }
  return loader
}

export function DesmosPanel({ onClose }: { onClose: () => void }) {
  const el = useRef<HTMLDivElement>(null)
  const drag = useDragControls()
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [big, setBig] = useState(false)

  useEffect(() => {
    let calc: { destroy: () => void } | null = null
    let cancelled = false
    loadDesmos()
      .then(() => {
        if (cancelled || !el.current || !window.Desmos) return
        calc = window.Desmos.GraphingCalculator(el.current, { keypad: true, expressions: true, settingsMenu: false, zoomButtons: true })
        setStatus('ready')
      })
      .catch(() => !cancelled && setStatus('error'))
    return () => {
      cancelled = true
      calc?.destroy()
    }
  }, [])

  return (
    <motion.div
      drag
      dragListener={false}
      dragControls={drag}
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`fixed left-4 top-24 z-40 flex flex-col overflow-hidden rounded-xl border border-line bg-elevated shadow-lift ${big ? 'h-[78vh] w-[min(760px,94vw)]' : 'h-[520px] w-[min(420px,94vw)]'}`}
    >
      <div onPointerDown={(e) => drag.start(e)} className="flex cursor-move items-center justify-between bg-neutral-900 px-3 py-2 text-sm text-white">
        <span className="font-semibold">Calculator</span>
        <GripHorizontal size={16} className="opacity-60" />
        <div className="flex items-center gap-1">
          <button onClick={() => setBig(!big)} className="rounded p-1 hover:bg-white/10" aria-label={big ? 'Collapse calculator' : 'Expand calculator'}>
            {big ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button onClick={onClose} className="rounded p-1 hover:bg-white/10" aria-label="Close calculator">
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="relative flex-1 bg-white">
        <div ref={el} className="absolute inset-0" />
        {status !== 'ready' && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-neutral-600">
            {status === 'loading' ? 'Loading Desmos…' : 'The Desmos calculator could not load here. It loads on the hosted demo site with internet access.'}
          </div>
        )}
      </div>
    </motion.div>
  )
}
