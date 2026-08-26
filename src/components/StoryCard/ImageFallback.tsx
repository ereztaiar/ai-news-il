import type { CategoryDef } from '@utils/categories'
import { sourceLabel } from '@utils/sources'

interface ImageFallbackProps {
  category: CategoryDef
  source: string
  topic: string
  size?: 'sm' | 'lg'
}

// Text-only stories don't get a photo template with a stand-in icon floating
// in a plain gray box — that reads as a broken image. This keeps the site's
// mascot (for brand recognition) but shrinks it to a corner watermark on a
// saturated category-color panel, with the story's own headline as the main
// visual — so repeats in a grid read as a deliberate layout, not the same
// icon copy-pasted across cards.
function ImageFallback(props: ImageFallbackProps) {
  const { category, source, topic, size = 'sm' } = props
  const isLarge = size === 'lg'

  return (
    <div
      className={`absolute inset-0 flex flex-col justify-between overflow-hidden text-white ${category.tile} ${
        isLarge ? 'p-6' : 'p-3'
      }`}
    >
      <img
        src={`${import.meta.env.BASE_URL}assets/news_bot_mono.jpg`}
        alt=""
        className={`self-end rounded-full opacity-50 shadow-sm ${isLarge ? 'h-16 w-16' : 'h-9 w-9'}`}
      />
      <div className="flex flex-col gap-1">
        <p className={`line-clamp-3 font-bold leading-snug ${isLarge ? 'text-xl' : 'text-xs'}`}>{topic}</p>
        <span className={`font-semibold text-white/70 ${isLarge ? 'text-xs' : 'text-[10px]'}`}>
          {sourceLabel(source)}
        </span>
      </div>
    </div>
  )
}

export default ImageFallback
