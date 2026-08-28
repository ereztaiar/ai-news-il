export interface StorySource {
  source: string
  title: string
  published?: string
  summary?: string
  url: string
  image?: string
}

export interface Story {
  story_id: number
  topic: string
  category?: string
  story_summary?: string
  good_news_score?: number
  sources: StorySource[]
}
