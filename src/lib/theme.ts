import { useSyncExternalStore } from 'react'

type Theme = 'light' | 'dark'
const listeners = new Set<() => void>()

const current = (): Theme => (document.documentElement.classList.contains('dark') ? 'dark' : 'light')

export function setTheme(t: Theme) {
  document.documentElement.classList.toggle('dark', t === 'dark')
  try {
    localStorage.setItem('hz_theme', t)
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l())
}

export function useTheme() {
  const theme = useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    current,
  )
  return { theme, toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark') }
}
