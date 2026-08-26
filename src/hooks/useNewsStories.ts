import { useEffect, useState } from 'react'
import type { Story } from '@/types'

// A handful of sources reuse the same generic "breaking news" stock graphic
// across unrelated articles (e.g. a default og:image). Reused across two
// different stories, it reads as a stock photo rather than a real one and
// undercuts credibility more than showing no image at all — so drop any
// image URL that shows up in more than one distinct story before it ever
// reaches the UI, letting those cards fall back to the placeholder treatment.
function stripGenericReusedImages(stories: Story[]) {
  const storyIdsByImage = new Map<string, Set<number>>()
  for (const story of stories) {
    for (const source of story.sources) {
      if (!source.image) continue
      const ids = storyIdsByImage.get(source.image)
      if (ids) ids.add(story.story_id)
      else storyIdsByImage.set(source.image, new Set([story.story_id]))
    }
  }

  return stories.map((story) => ({
    ...story,
    sources: story.sources.map((source) => {
      if (source.image && (storyIdsByImage.get(source.image)?.size ?? 0) > 1) {
        const { image: _image, ...rest } = source
        return rest
      }
      return source
    }),
  }))
}

export function useNewsStories() {
  const [stories, setStories] = useState<Story[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/news.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load news (${res.status})`)
        return res.json()
      })
      .then((data: Story[]) => {
        const deduped = stripGenericReusedImages(data)
        setStories([...deduped].sort((a, b) => b.sources.length - a.sources.length))
      })
      .catch((err) => setError(err.message))
  }, [])

  return { stories, error }
}
