#!/usr/bin/env python3
"""export_news_json.py — read stories (+ member articles) from the SQLite DB
and write the flat JSON array the frontend fetches at public/data/news.json
(see src/types.ts: Story / StorySource). Only stories touched within
STORY_RETENTION_HOURS are included, so the published site doesn't accumulate
every story ever seen.

Usage: export_news_json.py DB_PATH OUT_PATH
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from lib import get_connection

STORY_RETENTION_HOURS = 24


def main():
    if len(sys.argv) != 3:
        print("usage: export_news_json.py DB_PATH OUT_PATH", file=sys.stderr)
        sys.exit(2)

    db_path, out_path = sys.argv[1:3]
    conn = get_connection(db_path)

    stories = conn.execute(
        """SELECT id, topic, category, ai_summary FROM stories
           WHERE updated_at >= datetime('now', ?)
           ORDER BY updated_at DESC, created_at DESC""",
        (f"-{STORY_RETENTION_HOURS} hours",),
    ).fetchall()

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
