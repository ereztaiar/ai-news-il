import type { CategoryDef } from '@utils/categories'

interface ViewAllTileProps {
  category: CategoryDef
}

function ViewAllTile(props: ViewAllTileProps) {
  const { category } = props

  const arrowIcon = (
    <svg
      viewBox="0 0 24 24"
      className="h-7 w-7"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 6l-6 6 6 6" />
    </svg>
  )

  const label = <span className="text-xs font-bold leading-snug sm:text-sm">כל הכתבות ב{category.label}</span>

  return (
    <a
      href={`#/category/${category.slug}`}
      className={`flex h-full min-h-24 flex-col items-center justify-center gap-1 rounded-xl p-3 text-center text-white shadow-sm transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-lg ${category.tile}`}
    >
      {arrowIcon}
      {label}
    </a>
  )
}

export default ViewAllTile
