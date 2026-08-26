import { useMemo } from 'react'
import { formatDate } from '@components/StoryCard'
import type { Story } from '@/types'

export function useLastUpdated(stories: Story[]) {
  return useMemo(() => {
    let latest: Date | null = null
    for (const story of stories) {
      for (const source of story.sources) {
        if (!source.published) continue
        const date = new Date(source.published)
        if (Number.isNaN(date.getTime())) continue
        if (!latest || date > latest) latest = date
      }
    }
    return latest ? formatDate(latest) : undefined
  }, [stories])
}
