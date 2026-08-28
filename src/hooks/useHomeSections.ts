import { useMemo } from 'react'
import { CATEGORIES } from '@utils/categories'
import type { Story } from '@/types'

const GOOD_NEWS_SCORE_THRESHOLD = 8
const MAX_GOOD_NEWS_STORIES = 6

export function useGoodNewsStories(stories: Story[]) {
  return useMemo(
    () =>
      stories
        .filter((story) => (story.good_news_score ?? 0) >= GOOD_NEWS_SCORE_THRESHOLD)
        .sort((a, b) => (b.good_news_score ?? 0) - (a.good_news_score ?? 0))
        .slice(0, MAX_GOOD_NEWS_STORIES),
    [stories],
  )
}

export function useHomeSections(stories: Story[]) {
  const byCategory = useMemo(() => {
    const map = new Map<string, Story[]>()
    for (const story of stories) {
      const slug = story.category ?? 'news'
      const list = map.get(slug)
      if (list) list.push(story)
      else map.set(slug, [story])
    }
    return map
  }, [stories])

  const sections = useMemo(
    () =>
      CATEGORIES.map((category) => ({
        category,
        stories: byCategory.get(category.slug) ?? [],
      })).filter((section) => section.stories.length > 0),
    [byCategory],
  )

  return sections
}
