import { Component, type ReactNode } from 'react'

/** Shows a recovery screen instead of a blank page if something fails while rendering. */
export class ErrorBoundary extends Component<{ children: ReactNode; resetKey?: string }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('Horizon SAT render error:', error)
  }

  componentDidUpdate(prev: { resetKey?: string }) {
    // Navigating to another page clears the error.
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null })
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="grid min-h-[60vh] place-items-center px-4 py-16 text-center">
        <div className="max-w-md">
          <div className="text-2xl font-bold tracking-tight">This page didn't load correctly</div>
          <p className="mt-2 text-muted">Your data is safe. Reload the page to continue.</p>
          <p className="mt-3 break-words rounded-xl bg-ink/[0.04] p-3 font-mono text-xs text-muted">{this.state.error.message}</p>
          <button onClick={() => window.location.reload()} className="btn-primary mt-6">Reload page</button>
        </div>
      </div>
    )
  }
}
