import { useHomeSections } from '@hooks/useHomeSections'
import type { Story } from '@/types'
import CategorySection from './CategorySection'

interface HomePageProps {
  stories: Story[]
}

function HomePage(props: HomePageProps) {
  const { stories } = props
  const sections = useHomeSections(stories)

  const sectionList = sections.map(({ category, stories: categoryStories }) => (
    <CategorySection key={category.slug} category={category} stories={categoryStories} />
  ))

  return <div className="flex flex-col gap-8 sm:gap-10">{sectionList}</div>
}

export default HomePage
