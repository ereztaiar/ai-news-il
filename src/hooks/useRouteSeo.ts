import { useEffect } from 'react'
import { getCategory } from '@utils/categories'
import { DEFAULT_DESCRIPTION, SITE_TITLE, updateJsonLd, updatePageMeta } from '@utils/seo'
import type { Story } from '@/types'
import type { Route } from './useHashRoute'

export function useRouteSeo(route: Route, stories: Story[]) {
  useEffect(() => {
    if (stories.length === 0) return

    const asStructuredItem = (story: Story) => {
      const primary = story.sources[0]
      return {
        '@type': 'CreativeWork',
        headline: story.topic,
        ...(story.story_summary ? { abstract: story.story_summary } : {}),
        ...(primary?.url ? { url: primary.url } : {}),
        ...(primary?.published ? { datePublished: primary.published } : {}),
      }
    }

    if (route.view === 'category') {
      const category = getCategory(route.slug)
      const categoryStories = stories.filter((s) => (s.category ?? 'news') === category.slug)
      const title = `${category.label} | ${SITE_TITLE}`
      const description = `כתבות מסוכמות בקטגוריית ${category.label}. ${DEFAULT_DESCRIPTION}`
      updatePageMeta(title, description)
      updateJsonLd('ld-stories', {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: title,
        description,
        hasPart: categoryStories.slice(0, 30).map(asStructuredItem),
      })
    } else {
      updatePageMeta(SITE_TITLE, DEFAULT_DESCRIPTION)
      updateJsonLd('ld-stories', {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: SITE_TITLE,
        description: DEFAULT_DESCRIPTION,
        hasPart: stories.slice(0, 30).map(asStructuredItem),
      })
    }
  }, [route, stories])
}
