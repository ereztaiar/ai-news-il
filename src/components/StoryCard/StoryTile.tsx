import { useState } from 'react'
import type { CategoryDef } from '@utils/categories'
import type { Story } from '@/types'
import ImageFallback from './ImageFallback'
import Lightbox from './Lightbox'
import SourceLinks from './SourceLinks'
import StoryImage from './StoryImage'
import { formatPublished, imageCandidatesOf, primarySourceOf } from './utils'

interface StoryTileProps {
  story: Story
  category: CategoryDef
}

function StoryTile(props: StoryTileProps) {
  const { story, category } = props
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const primary = primarySourceOf(story)
  const published = formatPublished(primary.published)
  const summary = story.story_summary ?? primary.summary

  const thumbnail = (
    <button
      type="button"
      onClick={() => setLightboxOpen(true)}
      title={story.topic}
      className="relative aspect-[4/3] w-full bg-slate-200 dark:bg-white/5"
    >
      <StoryImage
        images={imageCandidatesOf(story, primary)}
        className="absolute inset-0 h-full w-full object-cover object-top"
        fallback={<ImageFallback category={category} source={primary.source} topic={story.topic} />}
      />
    </button>
  )

  const publishedLabel = published && (
    <span className="mt-1 block text-[10px] font-semibold text-slate-500 dark:text-slate-400">{published}</span>
  )

  const tileSourceLinks = (
    <SourceLinks
      sources={story.sources}
      className="mt-1 flex flex-wrap items-center gap-1"
      pillClassName="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 ring-1 ring-black/10 hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:ring-white/20 dark:hover:bg-white/20"
    />
  )

  const caption = (
    <div className={`flex-1 border-t-4 px-2 py-2 ${category.accent}`}>
      <button type="button" onClick={() => setLightboxOpen(true)} className="block text-right">
        <h3 className="line-clamp-2 min-h-[2.75em] text-xs font-semibold leading-snug text-slate-900 hover:underline sm:text-sm dark:text-slate-100">
          {story.topic}
        </h3>
      </button>
      {publishedLabel}
      {tileSourceLinks}
    </div>
  )

  const publishedDetail = published && (
    <p className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">{published}</p>
  )

  const summaryDetail = summary && <p className="text-sm text-slate-600 dark:text-slate-300">{summary}</p>

  const readMoreLink = (
    <a
      href={primary.url}
      target="_blank"
      rel="noreferrer"
      className="mt-4 inline-block rounded-full bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 dark:bg-cyan-500 dark:text-black dark:hover:bg-cyan-400"
    >
      להמשך הכתבה ‹
    </a>
  )

  const detailSourceLinks = (
    <SourceLinks
      sources={story.sources}
      className="mt-4 flex flex-wrap items-center gap-1.5"
      pillClassName="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-bold text-slate-800 ring-1 ring-black/10 hover:bg-slate-300 dark:bg-white/15 dark:text-white dark:ring-white/25 dark:hover:bg-white/25"
    />
  )

  const lightbox = (
    <Lightbox open={lightboxOpen} onClose={() => setLightboxOpen(false)} title={story.topic}>
      {publishedDetail}
      {summaryDetail}
      {readMoreLink}
      {detailSourceLinks}
    </Lightbox>
  )

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-sm transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-lg dark:bg-black/40">
      {thumbnail}
      {caption}
      {lightbox}
    </div>
  )
}

export default StoryTile
