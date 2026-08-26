import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface LightboxProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

function Lightbox(props: LightboxProps) {
  const { open, onClose, title, children } = props

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const closeButton = (
    <button
      type="button"
      onClick={onClose}
      aria-label="סגור"
      className="shrink-0 rounded-full p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  )

  const header = (
    <div className="mb-3 flex items-start justify-between gap-3">
      <h3 className="text-lg font-extrabold leading-snug text-slate-900 dark:text-slate-100">{title}</h3>
      {closeButton}
    </div>
  )

  const modal = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-[#150a2e]"
        onClick={(e) => e.stopPropagation()}
      >
        {header}
        {children}
      </div>
    </div>
  )

  return open ? createPortal(modal, document.body) : null
}

export default Lightbox
