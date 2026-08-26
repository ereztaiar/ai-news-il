import { useMemo } from 'react'
import { CATEGORIES } from '@utils/categories'
import type { Story } from '@/types'

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
