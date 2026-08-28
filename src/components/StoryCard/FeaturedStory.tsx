import type { CategoryDef } from '@utils/categories'
import type { Story } from '@/types'
import ImageFallback from './ImageFallback'
import SourceLinks from './SourceLinks'
import StoryImage from './StoryImage'
import { formatPublished, imageCandidatesOf, mostRecentPublished, primarySourceOf } from './utils'

interface FeaturedStoryProps {
  story: Story
  category: CategoryDef
}

function FeaturedStory(props: FeaturedStoryProps) {
  const { story, category } = props

  const primary = primarySourceOf(story)
  const summary = story.story_summary ?? primary.summary
  const published = formatPublished(mostRecentPublished(story))

  const image = (
    <a
      href={primary.url}
      target="_blank"
      rel="noreferrer"
      title={story.topic}
      className="relative aspect-video w-full shrink-0 bg-slate-200 sm:aspect-auto sm:w-2/3 sm:min-h-[22rem] dark:bg-white/5"
    >
      <StoryImage
        images={imageCandidatesOf(story, primary)}
        className="absolute inset-0 h-full w-full object-cover object-top"
        fallback={<ImageFallback category={category} source={primary.source} topic={story.topic} size="lg" />}
        size={{ width: 960, height: 540 }}
      />
    </a>
  )

  const heading = (
    <a href={primary.url} target="_blank" rel="noreferrer" title={story.topic}>
      <h2 className="line-clamp-3 text-lg font-extrabold leading-snug text-slate-900 hover:underline sm:text-xl dark:text-slate-100">
        {story.topic}
      </h2>
    </a>
  )

  const publishedLabel = published && (
    <span className="w-fit text-xs font-semibold text-slate-500 dark:text-slate-400">{published}</span>
  )

  const summaryText = summary && <p className="text-sm text-slate-600 dark:text-slate-300">{summary}</p>

  const sourceLinks = (
    <SourceLinks
      sources={story.sources}
      className="flex flex-wrap items-center gap-1.5"
      pillClassName="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-bold text-slate-800 ring-1 ring-black/10 hover:bg-slate-300 dark:bg-white/15 dark:text-white dark:ring-white/25 dark:hover:bg-white/25"
    />
  )

  const details = (
    <div className="flex w-full flex-col justify-center gap-3 p-4 sm:w-1/3 sm:p-6">
      {heading}
      {publishedLabel}
      {summaryText}
      {sourceLinks}
    </div>
  )

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-b-2xl shadow-sm transition-shadow duration-200 hover:shadow-lg sm:flex-row ${category.banner}`}
    >
      {image}
      {details}
    </div>
  )
}

export default FeaturedStory
