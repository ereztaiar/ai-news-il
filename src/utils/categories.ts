export interface CategoryDef {
  slug: string
  label: string
  badge: string
  banner: string
  tile: string
  /** Top-border accent used on neutral card surfaces (StoryTile caption) so the
   *  saturated category hue reads as a tag rather than a full color block. */
  accent: string
}

export const CATEGORIES: CategoryDef[] = [
  {
    slug: 'news',
    label: 'חדשות',
    badge: 'bg-sky-600 text-white',
    banner: 'bg-sky-50 dark:bg-sky-950/30',
    tile: 'bg-sky-600/90',
    accent: 'border-sky-500',
  },
  {
    slug: 'security',
    label: 'ביטחון',
    badge: 'bg-rose-700 text-white',
    banner: 'bg-rose-50 dark:bg-rose-950/30',
    tile: 'bg-rose-700/90',
    accent: 'border-rose-600',
  },
  {
    slug: 'world',
    label: 'עולם',
    badge: 'bg-indigo-600 text-white',
    banner: 'bg-indigo-50 dark:bg-indigo-950/30',
    tile: 'bg-indigo-600/90',
    accent: 'border-indigo-500',
  },
  {
    slug: 'business',
    label: 'כלכלה',
    badge: 'bg-emerald-700 text-white',
    banner: 'bg-emerald-50 dark:bg-emerald-950/30',
    tile: 'bg-emerald-700/90',
    accent: 'border-emerald-600',
  },
  {
    slug: 'tech',
    label: 'טכנולוגיה',
    badge: 'bg-violet-600 text-white',
    banner: 'bg-violet-50 dark:bg-violet-950/30',
    tile: 'bg-violet-600/90',
    accent: 'border-violet-500',
  },
  {
    slug: 'sports',
    label: 'ספורט',
    badge: 'bg-orange-600 text-white',
    banner: 'bg-orange-50 dark:bg-orange-950/30',
    tile: 'bg-orange-600/90',
    accent: 'border-orange-500',
  },
  {
    slug: 'culture',
    label: 'תרבות ובריאות',
    badge: 'bg-pink-600 text-white',
    banner: 'bg-pink-50 dark:bg-pink-950/30',
    tile: 'bg-pink-600/90',
    accent: 'border-pink-500',
  },
  {
    slug: 'weather',
    label: 'מזג אוויר',
    badge: 'bg-cyan-600 text-white',
    banner: 'bg-cyan-50 dark:bg-cyan-950/30',
    tile: 'bg-cyan-600/90',
    accent: 'border-cyan-500',
  },
]

// Not part of CATEGORIES: this isn't a real category value on stories (it's
// a good_news_score threshold, see useHomeSections), so it's excluded from
// the header nav / category pages and only used for styling that section.
export const GOOD_NEWS_CATEGORY: CategoryDef = {
  slug: 'good-news',
  label: 'חדשות טובות',
  badge: 'bg-amber-500 text-white',
  banner: 'bg-amber-50 dark:bg-amber-950/30',
  tile: 'bg-amber-500/90',
  accent: 'border-amber-400',
}

const BY_SLUG = new Map(CATEGORIES.map((c) => [c.slug, c]))
const FALLBACK = CATEGORIES.find((c) => c.slug === 'news')!

export function getCategory(slug: string | undefined): CategoryDef {
  return (slug && BY_SLUG.get(slug)) || FALLBACK
}
