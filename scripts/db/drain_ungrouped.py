#!/usr/bin/env python3
"""drain_ungrouped.py — manually work down the articles.story_id IS NULL
backlog, outside the regular cron pipeline. group_stories.py caps itself to
TOP_N_STORIES=1 new story per run to keep routine cost low, so a spike in
new articles (or a run of failed clustering calls) can leave a large batch
permanently stuck ungrouped, waiting for MAX_UNGROUPED_AGE_HOURS to file
them verbatim. This has no such cap: it loads the oldest BATCH_SIZE
ungrouped articles, asks Claude to match each to an existing "open" story or
group the rest into new ones (same prompt/logic as group_stories.py), and
synthesizes a topic + summary for every resulting group — updating the
matched story or creating a new one for each.

Not part of news_pipline_run.sh — run by hand (or your own cron entry) when
the backlog needs draining faster than the regular pipeline does it:
  python3 scripts/db/drain_ungrouped.py data/news.db
  python3 scripts/db/drain_ungrouped.py data/news.db --newest   # newest first

Usage: drain_ungrouped.py DB_PATH [--newest]
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from group_stories import CLUSTER_MODEL, build_cluster_prompt, fetch_candidate_stories, synthesize_story
from lib import call_claude_json, get_connection

BATCH_SIZE = 10


def fetch_ungrouped_batch(conn, limit, newest_first=False):
    order = "DESC" if newest_first else "ASC"
    return conn.execute(
        "SELECT id, source, title, description, published, created_at FROM articles "
        f"WHERE story_id IS NULL ORDER BY created_at {order} LIMIT ?",
        (limit,),
    ).fetchall()


def main():
    if len(sys.argv) < 2 or len(sys.argv) > 3:
        print("usage: drain_ungrouped.py DB_PATH [--newest]", file=sys.stderr)
        sys.exit(2)

    db_path = sys.argv[1]
    newest_first = "--newest" in sys.argv[2:]
    conn = get_connection(db_path)

    new_articles = fetch_ungrouped_batch(conn, BATCH_SIZE, newest_first)
    if not new_articles:
        print("No ungrouped articles.")
        return

    candidates = fetch_candidate_stories(conn)
    candidates_by_id = {s["id"]: s for s in candidates}
    new_ids = {a["id"] for a in new_articles}
    articles_by_id = {a["id"]: a for a in new_articles}

    print(
        f"Clustering {len(new_articles)} ungrouped article(s) against "
        f"{len(candidates)} open stor{'y' if len(candidates) == 1 else 'ies'}…",
        file=sys.stderr,
    )
    result = call_claude_json(build_cluster_prompt(new_articles, candidates), CLUSTER_MODEL, retries=1)
    if result is None:
        print("WARNING: clustering call failed — treating all as singleton stories", file=sys.stderr)
    assignments = result or []

    groups = []
    seen = set()
    for g in assignments:
        ids = [i for i in g.get("article_ids", []) if i in new_ids and i not in seen]
        if not ids:
            continue
        seen.update(ids)
        groups.append({"article_ids": ids, "story_id": g.get("story_id"), "category": g.get("category")})

    # Anything the model missed (or the call failed outright) becomes its own singleton story.
    for a in new_articles:
        if a["id"] not in seen:
            groups.append({"article_ids": [a["id"]], "story_id": None, "category": "news"})

    new_count = 0
    updated_count = 0
    for g in groups:
        members = [
            {"title": articles_by_id[i]["title"], "description": articles_by_id[i]["description"], "source": articles_by_id[i]["source"]}
            for i in g["article_ids"]
        ]
        existing = candidates_by_id.get(g["story_id"]) if g["story_id"] else None
        topic, summary = synthesize_story(members, existing_context=existing)

        if existing:
            story_id = existing["id"]
            conn.execute(
                "UPDATE stories SET topic = ?, ai_summary = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = ?",
                (topic, summary, story_id),
            )
            updated_count += 1
        else:
            cur = conn.execute(
                "INSERT INTO stories (topic, category, ai_summary) VALUES (?, ?, ?)",
                (topic, g.get("category") or "news", summary),
            )
            story_id = cur.lastrowid
            new_count += 1

        conn.executemany(
            "UPDATE articles SET story_id = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = ?",
            [(story_id, aid) for aid in g["article_ids"]],
        )

    conn.commit()
    print(f"Grouped {len(new_articles)} article(s) into {len(groups)} stor{'y' if len(groups) == 1 else 'ies'}: {new_count} new, {updated_count} updated")


if __name__ == "__main__":
    main()
