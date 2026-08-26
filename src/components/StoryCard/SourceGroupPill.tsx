import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Story } from '@/types'
import { sourceLabel } from '@utils/sources'
import { DROPDOWN_WIDTH } from './utils'

interface SourceGroupPillProps {
  source: string
  items: Story['sources']
  pillClassName: string
}

function LinkIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
      aria-hidden="true"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
    </svg>
  )
}

function SourceGroupPill(props: SourceGroupPillProps) {
  const { source, items, pillClassName } = props
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  const updatePosition = () => {
    const btn = btnRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    const left = Math.min(Math.max(rect.left, 8), window.innerWidth - DROPDOWN_WIDTH - 8)
    setPos({ top: rect.bottom + 4, left })
  }

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (btnRef.current?.contains(target) || dropRef.current?.contains(target)) return
      setOpen(false)
    }
    const onDismiss = () => setOpen(false)
    document.addEventListener('mousedown', onClick)
    window.addEventListener('scroll', onDismiss, true)
    window.addEventListener('resize', onDismiss)
    return () => {
      document.removeEventListener('mousedown', onClick)
      window.removeEventListener('scroll', onDismiss, true)
      window.removeEventListener('resize', onDismiss)
    }
  }, [open])

  const isSingle = items.length === 1
  const singleItem = items[0]
  const label = sourceLabel(source)

  const singleLink = isSingle && (
    <a
      href={singleItem.url}
      target="_blank"
      rel="noreferrer"
      title={singleItem.title}
      className={`${pillClassName} group inline-flex items-center gap-1`}
    >
      {label}
      <LinkIcon className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
    </a>
  )

  const toggleButton = (
    <button
      ref={btnRef}
      type="button"
      title={`${items.length} כתבות ממקור ${label}`}
      onClick={(e) => {
        e.stopPropagation()
        setOpen((o) => {
          const next = !o
          if (next) updatePosition()
          return next
        })
      }}
      className={`${pillClassName} inline-flex cursor-pointer items-center gap-1`}
    >
      {label}
      <span
        title={`${items.length} כתבות ממקור ${label}`}
        className="rounded-full bg-black/20 px-1.5 text-[10px] dark:bg-white/25"
      >
        {items.length}
      </span>
    </button>
  )

  const dropdown = open && pos &&
    createPortal(
      <div
        ref={dropRef}
        style={{ top: pos.top, left: pos.left, width: DROPDOWN_WIDTH }}
        className="fixed z-[100] overflow-hidden rounded-lg bg-white text-right shadow-lg ring-1 ring-black/10 dark:bg-[#150a2e] dark:ring-white/20"
      >
        {items.map((s) => (
          <a
            key={s.url}
            href={s.url}
            target="_blank"
            rel="noreferrer"
            title={s.title}
            className="group flex items-center gap-1.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
          >
            <span className="truncate">{s.title}</span>
            <LinkIcon className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
          </a>
        ))}
      </div>,
      document.body,
    )

  return isSingle ? (
    singleLink
  ) : (
    <>
      {toggleButton}
      {dropdown}
    </>
  )
}

export default SourceGroupPill
