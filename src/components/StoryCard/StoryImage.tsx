import { useEffect, useRef, useState } from 'react'
import { IMAGE_CYCLE_MS, sizedImageUrl } from './utils'

interface StoryImageProps {
  images: string[]
  className: string
  fallback: React.ReactNode
  // Target render size (CSS px) of the image container, used to request a
  // matching crop from image CDNs that support width/height query params.
  size: { width: number; height: number }
}

function StoryImage(props: StoryImageProps) {
  const { images, className, fallback, size } = props
  const [index, setIndex] = useState(0)
  const [exhausted, setExhausted] = useState(false)
  const failedRef = useRef<Set<number>>(new Set())

  useEffect(() => {
    failedRef.current = new Set()
    setExhausted(false)
    setIndex(0)
  }, [images])

  const advance = () => {
    for (let step = 1; step <= images.length; step++) {
      const next = (index + step) % images.length
      if (!failedRef.current.has(next)) {
        setIndex(next)
        return
      }
    }
    setExhausted(true)
  }

  const cycling = !exhausted && images.length - failedRef.current.size > 1

  useEffect(() => {
    if (!cycling) return
    const id = setInterval(advance, IMAGE_CYCLE_MS)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images, index, exhausted])

  const hasImage = images.length > 0 && !exhausted

  const img = hasImage && (
    <img
      src={sizedImageUrl(images[index], size.width * 2, size.height * 2)}
      alt=""
      loading="lazy"
      className={className}
      onError={() => {
        failedRef.current.add(index)
        advance()
      }}
    />
  )

  const progressDots = hasImage && cycling && (
    <div className="absolute inset-x-2 top-2 flex gap-1">
      {images.map((_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full shadow-[0_0_2px_rgba(0,0,0,0.8)] transition-all duration-300 ${
            i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
          }`}
        />
      ))}
    </div>
  )

  return hasImage ? (
    <>
      {img}
      {progressDots}
    </>
  ) : (
    <>{fallback}</>
  )
}

export default StoryImage
