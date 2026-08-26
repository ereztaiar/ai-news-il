import { useCategoryStories } from '@hooks/useCategoryStories'
import { StoryTile } from '@components/StoryCard'
import type { Story } from '@/types'
import SourceFilter from './SourceFilter'

interface CategoryPageProps {
  stories: Story[]
  categorySlug: string
}

function CategoryPage(props: CategoryPageProps) {
  const { stories, categorySlug } = props
  const {
    category,
    allSources,
    selectedSources,
    toggleSource,
    clearSources,
    sortOrder,
    setSortOrder,
    storyCount,
    dateRangeLabel,
    hasCategoryStories,
    hasFilteredStories,
    visibleStories,
    hasMore,
    sentinelRef,
  } = useCategoryStories(stories, categorySlug)

  const breadcrumb = (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <a href="#/" className="text-sm font-semibold text-indigo-600 dark:text-cyan-300">
        › כל הקטגוריות
      </a>
      <span className={`rounded-full px-3 py-1 text-sm font-bold ${category.badge}`}>{category.label}</span>
      {hasCategoryStories && (
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {storyCount} כתבות{dateRangeLabel && ` · ${dateRangeLabel}`}
        </span>
      )}
    </div>
  )

  const sortControl = hasCategoryStories && (
    <div className="mb-5 flex items-center gap-2">
      <span className="text-sm font-bold text-indigo-600 dark:text-fuchsia-300">מיון:</span>
      {(
        [
          { value: 'relevance', label: 'רלוונטיות' },
          { value: 'newest', label: 'החדש ביותר' },
        ] as const
      ).map((option) => {
        const active = sortOrder === option.value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => setSortOrder(option.value)}
            className={
              active
                ? 'rounded-full border border-transparent bg-gradient-to-r from-indigo-600 to-fuchsia-500 px-3 py-1 text-xs font-bold text-white shadow-sm dark:from-cyan-400 dark:to-fuchsia-500 dark:text-black'
                : 'rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 dark:border-fuchsia-500/30 dark:bg-white/5 dark:text-fuchsia-200 dark:hover:bg-white/10'
            }
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )

  const sourceFilter = (
    <SourceFilter sources={allSources} selected={selectedSources} onToggle={toggleSource} onClear={clearSources} />
  )

  const emptyCategoryMessage = !hasCategoryStories && (
    <p className="text-slate-500 dark:text-slate-400">אין עדיין כתבות בקטגוריה זו.</p>
  )

  const emptyFilterMessage = hasCategoryStories && !hasFilteredStories && (
    <p className="text-slate-500 dark:text-slate-400">אין כתבות התואמות לסינון שנבחר.</p>
  )

  const storyGrid = (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
      {visibleStories.map((story) => (
        <li key={story.story_id}>
          <StoryTile story={story} category={category} />
        </li>
      ))}
    </ul>
  )

  const loadMoreSentinel = hasMore && (
    <div ref={sentinelRef} className="flex h-16 items-center justify-center">
      <span className="text-sm text-slate-400 dark:text-fuchsia-300/60">טוען עוד...</span>
    </div>
  )

  return (
    <div>
      {breadcrumb}
      {sortControl}
      {sourceFilter}
      {emptyCategoryMessage}
      {emptyFilterMessage}
      {storyGrid}
      {loadMoreSentinel}
    </div>
  )
}

export default CategoryPage
