import type { Story } from '@/types'
import SourceGroupPill from './SourceGroupPill'

interface SourceLinksProps {
  sources: Story['sources']
  className: string
  pillClassName: string
}

function SourceLinks(props: SourceLinksProps) {
  const { sources, className, pillClassName } = props

  const groups = new Map<string, Story['sources']>()
  for (const s of sources) {
    const items = groups.get(s.source)
    if (items) items.push(s)
    else groups.set(s.source, [s])
  }

  const pills = [...groups.entries()].map(([source, items]) => (
    <SourceGroupPill key={source} source={source} items={items} pillClassName={pillClassName} />
  ))

  return <div className={className}>{pills}</div>
}

export default SourceLinks
