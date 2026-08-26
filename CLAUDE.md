# News Site

A React app that displays summarized news, mostly Israeli, in Hebrew. Hosted
on GitHub Pages as a static site. Content updates automatically.

## Architecture

- **Content pipeline**: runs *outside* GitHub — a bash script
  (`scripts/news_pipline_run.sh`) on a local cron job on the user's
  machine, backed by a local SQLite database (`data/news.db`, gitignored —
  never committed). Three stages:
  1. `scripts/fetch_news.sh` curls each configured RSS feed, parses it with
     `scripts/parse_feed.py` (stdlib `xml.etree.ElementTree`), and inserts
     new articles into the `articles` table via
     `scripts/db/ingest_articles.py`. Dedup is a plain `UNIQUE` constraint
     on `articles.link` — re-fetching an already-seen article is a no-op
     `INSERT OR IGNORE`, not a data-processing step.
  2. `scripts/db/group_stories.py` looks only at articles with
     `story_id IS NULL` (new since the last run) and matches each one, via
     one Claude (sonnet) completion, against stories updated within the
     last 48h — or starts a new story if nothing matches. It then
     (re)synthesizes a Hebrew topic + summary (Claude haiku) for every
     story that changed. This is the piece that used to reprocess the
     *entire* accumulated article set every run (the old `group_news.sh`);
     now it only ever touches what's new.
  3. `scripts/db/export_news_json.py` queries stories touched in the last
     `STORY_RETENTION_DAYS` (3) days, joined with their member articles,
     and writes the flat array `public/data/news.json` expects. The
     pipeline script then commits and pushes.
  See `scripts/db/schema.sql` for the `articles`/`stories` table shapes.
- **Deploy pipeline**: `.github/workflows/deploy.yml` runs on every push to
  `main` — `npm ci && npm run build`, then publishes `dist/` to GitHub
  Pages via `actions/deploy-pages`. This only builds/deploys the site; it
  does not fetch or generate content.
- **Data flow**: cron → `news_pipline_run.sh` (fetch → group → export) →
  `public/data/news.json` → git push → GitHub Actions builds the Vite app
  (bundling the updated JSON) → GitHub Pages serves it. There is no
  server-side component and no GitHub Actions workflow for content — the
  local script is the only source of updates; Actions only builds/deploys.

## Key files

- `vite.config.ts` — `base: '/news/'`. Must match the GitHub repo name for
  Pages routing to work (project page vs. user page).
- `index.html` — also carries static SEO/GEO tags: meta description, Open
  Graph/Twitter card, canonical link, and a `WebSite` JSON-LD block. Several
  fields hold a `https://TODO-GITHUB-USERNAME.github.io/news/` placeholder
  (canonical, og:url, og:image, twitter:image, and the JSON-LD `url`) —
  replace once the repo is pushed and Pages is enabled, same as the `base`
  TODO in `vite.config.ts`.
- `public/robots.txt`, `public/sitemap.xml`, `public/llms.txt` — crawler
  directives (including explicit allows for AI crawlers like GPTBot/
  ClaudeBot/PerplexityBot for GEO) and site discovery files. `sitemap.xml`
  only lists the homepage since category pages are hash routes
  (`#/category/...`), not distinct crawlable URLs — see the comment in that
  file if that ever changes. Both files also carry the same TODO domain
  placeholder as `index.html`.

## Open decisions (not yet settled)

- Repo not yet pushed to GitHub / GitHub Pages not yet enabled.
- Which news sources/feeds to pull from.
- How feed items get parsed (xmllint / python+feedparser / jq, etc.).
- Whether/how summarization happens, and what tool generates Hebrew
  summaries.
- Update frequency (cron interval).
- Styling is Tailwind utility classes directly in JSX; no design system
  or component library yet, just a minimal placeholder layout.

## Conventions

- The content pipeline lives in bash + stdlib Python — keep it
  dependency-light (curl, `sqlite3`/`xml.etree.ElementTree` from the
  standard library, `jq`) since it runs unattended via cron on the user's
  machine, not in CI. No `pip install`.
- `data/news.db` is the actual source of truth (articles + stories);
  `public/data/news.json` is a derived export of it. If the shape changes,
  change `scripts/db/schema.sql`, the script that writes the affected
  table, and `scripts/db/export_news_json.py` (and the `Story`/
  `StorySource` types in `src/types.ts`) together — don't patch the JSON
  or the DB by hand.
