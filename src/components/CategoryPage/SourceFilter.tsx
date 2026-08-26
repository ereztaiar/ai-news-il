import { sourceLabel } from '@utils/sources'

interface SourceFilterProps {
  sources: string[]
  selected: Set<string>
  onToggle: (source: string) => void
  onClear: () => void
}

function SourceFilter(props: SourceFilterProps) {
  const { sources, selected, onToggle, onClear } = props

  const label = <span className="text-sm font-bold text-indigo-600 dark:text-fuchsia-300">סינון מקורות:</span>

  const sourceButtons = sources.map((source) => {
    const active = selected.has(source)
    return (
      <button
        key={source}
        type="button"
        aria-pressed={active}
        onClick={() => onToggle(source)}
        className={
          active
            ? 'inline-flex cursor-pointer items-center gap-1 rounded-full border border-transparent bg-gradient-to-r from-indigo-600 to-fuchsia-500 px-3 py-1 text-xs font-bold text-white shadow-sm dark:from-cyan-400 dark:to-fuchsia-500 dark:text-black'
            : 'inline-flex cursor-pointer items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 dark:border-fuchsia-500/30 dark:bg-white/5 dark:text-fuchsia-200 dark:hover:bg-white/10'
        }
      >
        {active && <span aria-hidden="true">✓</span>}
        {sourceLabel(source)}
      </button>
    )
  })

  const clearButton = selected.size > 0 && (
    <button
      type="button"
      onClick={onClear}
      className="rounded-full px-2 py-1 text-xs font-semibold text-slate-400 underline hover:text-indigo-500 dark:text-slate-400 dark:hover:text-fuchsia-300"
    >
      נקה סינון
    </button>
  )

  return sources.length > 0 ? (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      {label}
      {sourceButtons}
      {clearButton}
    </div>
  ) : null
}

export default SourceFilter
