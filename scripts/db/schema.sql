-- schema.sql — SQLite schema for the news pipeline (data/news.db).
--
-- articles: one row per fetched article, deduplicated by link. Populated by
-- ingest_articles.py (INSERT OR IGNORE, so re-fetching an already-seen link
-- is a no-op). story_id is NULL until group_stories.py assigns it.
--
-- stories: one row per clustered story (possibly spanning many sources/
-- articles). ai_summary + topic are (re)written by group_stories.py every
-- time a new article joins that story.

CREATE TABLE IF NOT EXISTS stories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  topic       TEXT NOT NULL,
  category    TEXT,
  ai_summary  TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS articles (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  source      TEXT NOT NULL,
  link        TEXT NOT NULL UNIQUE,
  title       TEXT NOT NULL,
  description TEXT,
  image       TEXT,
  published   TEXT,
  ai_summary  TEXT,
  story_id    INTEGER REFERENCES stories(id),
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_articles_story_id ON articles(story_id);
CREATE INDEX IF NOT EXISTS idx_stories_updated_at ON stories(updated_at);
