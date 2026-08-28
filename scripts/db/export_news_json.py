#!/usr/bin/env python3
"""export_news_json.py — read stories (+ member articles) from the SQLite DB
and write the flat JSON array the frontend fetches at public/data/news.json
(see src/types.ts: Story / StorySource). Normally only stories touched within
STORY_RETENTION_HOURS are included, capped at MAX_STORIES_PER_CATEGORY (most
recently updated first) so a high-churn category (e.g. sports) can't crowd
out quieter ones. A category with fewer than MIN_STORIES_PER_CATEGORY within
that window is backfilled from up to STORY_BACKFILL_HOURS back, so a quiet
category doesn't just disappear.

Usage: export_news_json.py DB_PATH OUT_PATH
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from lib import get_connection

STORY_RETENTION_HOURS = 24
STORY_BACKFILL_HOURS = 24 * 7
MIN_STORIES_PER_CATEGORY = 3
MAX_STORIES_PER_CATEGORY = 30


def select_stories(conn):
    fresh_cutoff = conn.execute(
        "SELECT datetime('now', ?) AS cutoff", (f"-{STORY_RETENTION_HOURS} hours",)
    ).fetchone()["cutoff"]

    rows = conn.execute(
        """SELECT id, topic, category, ai_summary, good_news_score, updated_at FROM stories
           WHERE updated_at >= datetime('now', ?)
           ORDER BY updated_at DESC, created_at DESC""",
        (f"-{STORY_BACKFILL_HOURS} hours",),
    ).fetchall()

    by_category = {}
    for row in rows:
        by_category.setdefault(row["category"] or "news", []).append(row)

    selected = []
    for cat_rows in by_category.values():
        fresh = [r for r in cat_rows if r["updated_at"] >= fresh_cutoff]
        pool = cat_rows if len(fresh) < MIN_STORIES_PER_CATEGORY else fresh
        selected.extend(pool[:MAX_STORIES_PER_CATEGORY])

    selected.sort(key=lambda r: (r["updated_at"]), reverse=True)
    return selected


def main():
    if len(sys.argv) != 3:
        print("usage: export_news_json.py DB_PATH OUT_PATH", file=sys.stderr)
        sys.exit(2)

    db_path, out_path = sys.argv[1:3]
    conn = get_connection(db_path)

    stories = select_stories(conn)

    out = []
    for s in stories:
        articles = conn.execute(
            """SELECT source, title, published, description, link, image
               FROM articles WHERE story_id = ? ORDER BY created_at""",
            (s["id"],),
        ).fetchall()
        if not articles:
            continue
        out.append(
            {
                "story_id": s["id"],
                "topic": s["topic"],
                "category": s["category"],
                "story_summary": s["ai_summary"],
                "good_news_score": s["good_news_score"],
                "sources": [
                    {
                        k: v
                        for k, v in {
                            "source": a["source"],
                            "title": a["title"],
                            "published": a["published"],
                            "summary": a["description"],
                            "url": a["link"],
                            "image": a["image"],
                        }.items()
                        if v is not None
                    }
                    for a in articles
                ],
            }
        )

    Path(out_path).write_text(json.dumps(out, ensure_ascii=False, indent=2))
    print(f"Wrote {len(out)} stories to {out_path}")


if __name__ == "__main__":
    main()
