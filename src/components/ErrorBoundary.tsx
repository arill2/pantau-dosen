import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  galat: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { galat: null }

  static getDerivedStateFromError(galat: Error): State {
    return { galat }
  }

  componentDidCatch(galat: Error, info: ErrorInfo) {
    console.error('Terjadi galat pada antarmuka:', galat, info)
  }

  render() {
    if (!this.state.galat) return this.props.children

    return (
      <div className="grid min-h-dvh place-items-center bg-paper px-4">
        <div className="w-full max-w-md rounded-[10px] border border-line bg-surface p-6 text-center">
          <span
            aria-hidden="true"
            className="mx-auto grid size-11 place-items-center rounded-full bg-alfa-soft text-alfa"
          >
            ⚠
          </span>
          <h1 className="mt-3 text-base font-bold text-ink">
            Terjadi kesalahan tak terduga
          </h1>
          <p className="mt-1 text-[13px] text-muted">
            Muat ulang halaman. Bila masih berlanjut, salin pesan di bawah untuk
            pengelola sistem.
          </p>
          <pre className="mt-4 max-h-32 overflow-auto rounded-[6px] bg-surface-2 p-3 text-left text-[11px] text-muted">
            {this.state.galat.message}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 h-10 w-full rounded-[6px] bg-brand text-sm font-semibold text-on-brand hover:bg-brand-strong"
          >
            Muat ulang
          </button>
        </div>
      </div>
    )
  }
}
