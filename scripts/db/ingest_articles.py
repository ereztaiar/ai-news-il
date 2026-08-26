#!/usr/bin/env python3
"""ingest_articles.py — insert newly-fetched articles into the articles
table, skipping ones already present (matched by link/URL, which is UNIQUE).
Stdlib only (sqlite3) — parameterized queries, so Hebrew text with literal
quotes (צה"ל, בג"ץ...) never needs manual SQL-escaping.

Usage: ingest_articles.py DB_PATH SOURCE ARTICLES_JSON_FILE
Reads:  ARTICLES_JSON_FILE — a JSON array of {title, url, published, summary,
        image} objects, as produced by parse_feed.py.
Prints: the number of newly inserted rows (0 if all were already known).
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from lib import get_connection


def main():
    if len(sys.argv) != 4:
        print("usage: ingest_articles.py DB_PATH SOURCE ARTICLES_JSON_FILE", file=sys.stderr)
        sys.exit(2)

    db_path, source, articles_path = sys.argv[1:4]
    articles = json.loads(Path(articles_path).read_text())

    conn = get_connection(db_path)
    inserted = 0
    for a in articles:
        cur = conn.execute(
            """INSERT OR IGNORE INTO articles (source, link, title, description, image, published)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (source, a["url"], a["title"], a.get("summary"), a.get("image"), a.get("published")),
        )
        inserted += cur.rowcount
    conn.commit()
    conn.close()
    print(inserted)


if __name__ == "__main__":
    main()
