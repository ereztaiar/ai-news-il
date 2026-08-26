import { useEffect, useMemo, useRef, useState } from 'react'
import { latestPublishedDate, publishedDateRangeLabel } from '@components/StoryCard'
import { getCategory } from '@utils/categories'
import type { Story } from '@/types'

const PAGE_SIZE = 20

export type SortOrder = 'relevance' | 'newest'

export function useCategoryStories(stories: Story[], categorySlug: string) {
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set())
  const [sortOrder, setSortOrder] = useState<SortOrder>('relevance')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const category = getCategory(categorySlug)

  const categoryStories = useMemo(
    () => stories.filter((s) => (s.category ?? 'news') === category.slug),
    [stories, category],
  )

  const allSources = useMemo(() => {
    const set = new Set<string>()
    categoryStories.forEach((story) => story.sources.forEach((s) => set.add(s.source)))
    return [...set].sort()
  }, [categoryStories])

  const filteredStories = useMemo(() => {
    const base =
      selectedSources.size === 0
        ? categoryStories
        : categoryStories.filter((story) => story.sources.some((s) => selectedSources.has(s.source)))
    if (sortOrder !== 'newest') return base
    return [...base].sort((a, b) => latestPublishedDate(b) - latestPublishedDate(a))
  }, [categoryStories, selectedSources, sortOrder])

  const visibleStories = useMemo(() => filteredStories.slice(0, visibleCount), [filteredStories, visibleCount])

  const dateRangeLabel = useMemo(() => publishedDateRangeLabel(filteredStories), [filteredStories])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [filteredStories])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredStories.length))
        }
      },
      { rootMargin: '400px' },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [filteredStories])

  const toggleSource = (source: string) => {
    setSelectedSources((prev) => {
      const next = new Set(prev)
      if (next.has(source)) next.delete(source)
      else next.add(source)
      return next
    })
  }

  const clearSources = () => setSelectedSources(new Set())

  return {
    category,
    allSources,
    selectedSources,
    toggleSource,
    clearSources,
    sortOrder,
    setSortOrder,
    storyCount: filteredStories.length,
    dateRangeLabel,
    hasCategoryStories: categoryStories.length > 0,
    hasFilteredStories: filteredStories.length > 0,
    visibleStories,
    hasMore: visibleCount < filteredStories.length,
    sentinelRef,
  }
}
