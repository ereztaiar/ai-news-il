import { GOOD_NEWS_CATEGORY } from '@utils/categories'
import type { Story } from '@/types'
import { FeaturedStory, StoryTile } from '@components/StoryCard'

interface GoodNewsSectionProps {
  stories: Story[]
}

function GoodNewsSection(props: GoodNewsSectionProps) {
  const { stories } = props

  if (stories.length === 0) return null

  // Same hero-picks-the-photo rule as CategorySection.
  const heroIndex = stories.findIndex((story) => story.sources.some((s) => s.image))
  const featuredIndex = heroIndex >= 0 ? heroIndex : 0
  const featured = stories[featuredIndex]
  const tiles = stories.filter((_, index) => index !== featuredIndex)

  const badge = (
    <div
      className={`w-full rounded-t-2xl px-4 py-2.5 text-base font-extrabold text-white sm:w-2/3 sm:px-6 sm:py-3 sm:text-lg ${GOOD_NEWS_CATEGORY.badge}`}
    >
      {GOOD_NEWS_CATEGORY.label} ✨
    </div>
  )

  const tileList = tiles.map((story) => (
    <StoryTile key={story.story_id} story={story} category={GOOD_NEWS_CATEGORY} />
  ))

  const grid = tiles.length > 0 && (
    <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">{tileList}</div>
  )

  return (
    <section>
      {badge}
      <FeaturedStory story={featured} category={GOOD_NEWS_CATEGORY} />
      {grid}
    </section>
  )
}

export default GoodNewsSection
