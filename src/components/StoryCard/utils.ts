import type { Story } from '@/types'

export const IMAGE_CYCLE_MS = 5000
export const DROPDOWN_WIDTH = 192

export function primarySourceOf(story: Story) {
  return story.sources.find((s) => s.image) ?? story.sources[0]
}

// The source whose `published` is most recent — used for the displayed date
// label so a story shows how fresh it actually is, rather than the date of
// whichever source happens to be `primarySourceOf` (picked for its image).
export function mostRecentPublished(story: Story): string | undefined {
  let best: string | undefined
  let bestTime = -Infinity
  for (const source of story.sources) {
    if (!source.published) continue
    const time = new Date(source.published).getTime()
    if (!Number.isNaN(time) && time > bestTime) {
      bestTime = time
      best = source.published
    }
  }
  return best
}

export function latestPublishedDate(story: Story): number {
  const published = mostRecentPublished(story)
  return published ? new Date(published).getTime() : -Infinity
}

const HAARETZ_IMAGE_HOST = 'img.haarets.co.il'

// Haaretz's RSS feed always links its own CDN's tiny 108x81 RSS-thumbnail
// crop, which then gets stretched across containers many times that size
// (StoryTile is a full-width 4:3 tile, FeaturedStory can be 2/3 of a
// 1600px-wide page). The CDN honors arbitrary `width`/`height` query params,
// so request a crop close to how large the image actually renders instead.
export function sizedImageUrl(url: string, width: number, height: number): string {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return url
  }
  if (parsed.hostname !== HAARETZ_IMAGE_HOST) return url
  parsed.searchParams.set('width', String(width))
  parsed.searchParams.set('height', String(height))
  return parsed.toString()
}

export function imageCandidatesOf(story: Story, primary: ReturnType<typeof primarySourceOf>) {
  const seen = new Set<string>()
  const images: string[] = []
  for (const image of [primary.image, ...story.sources.map((s) => s.image)]) {
    if (image && !seen.has(image)) {
      seen.add(image)
      images.push(image)
    }
  }
  return images
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('he-IL', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatDateOnly(date: Date) {
  return new Intl.DateTimeFormat('he-IL', {
    day: '2-digit',
    month: '2-digit',
  }).format(date)
}

// Some feeds (e.g. haaretz_en) publish a date with no time-of-day component,
// like "August 20, 2026". `new Date(...)` parses that as local midnight, which
// then rendered as a fake-looking "00:00" — indistinguishable from a real
// midnight publish time. Detect the missing time component from the source
// string itself (rather than trusting the parsed 00:00:00) and fall back to a
// date-only label instead of fabricating a time.
const HAS_TIME_COMPONENT = /\d{1,2}:\d{2}/

export function formatPublished(dateStr?: string) {
  if (!dateStr) return undefined
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return undefined
  if (!HAS_TIME_COMPONENT.test(dateStr)) return formatDateOnly(date)
  return formatDate(date)
}

export function publishedDateRangeLabel(stories: Story[]): string | undefined {
  let min = Infinity
  let max = -Infinity
  for (const story of stories) {
    for (const source of story.sources) {
      if (!source.published) continue
      const time = new Date(source.published).getTime()
      if (Number.isNaN(time)) continue
      if (time < min) min = time
      if (time > max) max = time
    }
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return undefined
  const oldest = formatDateOnly(new Date(min))
  const newest = formatDateOnly(new Date(max))
  return oldest === newest ? oldest : `${oldest}–${newest}`
}
