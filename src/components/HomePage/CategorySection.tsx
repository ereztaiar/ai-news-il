import type { CategoryDef } from '@utils/categories'
import type { Story } from '@/types'
import { FeaturedStory, StoryTile, ViewAllTile } from '@components/StoryCard'

interface CategorySectionProps {
  category: CategoryDef
  stories: Story[]
}

function CategorySection(props: CategorySectionProps) {
  const { category, stories } = props

  // Promote whichever story actually has a photo into the hero slot — it's
  // the largest, most visible card, and forcing the top-ranked story there
  // when it has no image just puts the fallback treatment front and center.
  const heroIndex = stories.findIndex((story) => story.sources.some((s) => s.image))
  const featuredIndex = heroIndex >= 0 ? heroIndex : 0
  const featured = stories[featuredIndex]
  const tiles = stories.filter((_, index) => index !== featuredIndex).slice(0, 5)

  const badge = (
    <div
      className={`w-full rounded-t-2xl px-4 py-2.5 text-base font-extrabold text-white sm:w-2/3 sm:px-6 sm:py-3 sm:text-lg ${category.badge}`}
    >
      {category.label}
    </div>
  )

  const tileList = tiles.map((story) => <StoryTile key={story.story_id} story={story} category={category} />)

  const grid = (
    <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
      {tileList}
      <ViewAllTile category={category} />
    </div>
  )

  return (
    <section>
      {badge}
      <FeaturedStory story={featured} category={category} />
      {grid}
    </section>
  )
}

export default CategorySection
