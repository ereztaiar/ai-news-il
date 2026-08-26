# סיכום חדשות AI (AI News Digest)

A React + Vite site that aggregates Hebrew and international news RSS
feeds, groups related articles into stories, and generates Hebrew
summaries with Claude. Hosted as a static site on GitHub Pages.

## How it works

Content is produced *outside* GitHub Actions, by a local pipeline
(`scripts/news_pipline_run.sh`) run on a cron job:

1. **Fetch** — pull configured RSS feeds and insert new articles into a
   local SQLite database.
2. **Group & summarize** — match new articles against recent stories (or
   start new ones), then generate a Hebrew topic + summary per story
   using Claude.
3. **Export** — write recent stories to `public/data/news.json`, commit,
   and push.

A push to `main` triggers `.github/workflows/deploy.yml`, which builds
the Vite app and publishes it to GitHub Pages. GitHub Actions only
builds/deploys — it never fetches or generates content.

## Stack

- React + TypeScript, Vite, Tailwind CSS
- Python (stdlib only) + bash for the content pipeline
- SQLite for storage, Claude for grouping/summarization

## Development

```bash
npm install
npm run dev
```

## Links

- Repo: [github.com/ereztaiar/ai-news-il](https://github.com/ereztaiar/ai-news-il)
- Author: [Erez Taiar on LinkedIn](https://www.linkedin.com/in/erez-taiar/)

## License

MIT — see [LICENSE](LICENSE).
