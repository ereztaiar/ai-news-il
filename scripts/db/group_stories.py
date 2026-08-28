#!/usr/bin/env python3
"""group_stories.py — match newly-fetched articles to an existing "open"
story or start a new one, then (re)synthesize the Hebrew topic + summary for
each story that changed.

This replaces the old group_news.sh pipeline, which re-clustered every
accumulated article on every run — one Claude call across the whole set,
then one synthesis call per resulting story (hence "Synthesizing 115 story
summaries" every 30 minutes, most of it re-deriving stories that hadn't
changed). Here the only inputs are:
  - articles.story_id IS NULL   (new since the last run — usually a handful)
  - stories touched within STORY_MATCH_WINDOW_HOURS (candidates to extend)
so a typical run is one small clustering call plus a synthesis call per
*affected* story, not the whole history.

Usage: group_stories.py DB_PATH
"""
import json
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from lib import call_claude_json, get_connection

CLUSTER_MODEL = "sonnet"
SYNTH_MODEL = "haiku"
STORY_MATCH_WINDOW_HOURS = 48
MAX_CANDIDATE_STORIES = 50
SYNTH_WORKERS = 4

# A single clustering call covering the whole new-article backlog can take
# longer than call_claude_json's timeout once that backlog grows past ~100
# articles (it did, consistently, once ungrouped articles piled up past a
# failed run) — and a timed-out call falls back to singleton stories, which
# grows the backlog further and makes the next call even more likely to time
# out. Splitting into fixed-size batches keeps each call's prompt (and the
# number of groups it has to emit) bounded regardless of backlog size, so
# clustering degrades gracefully instead of collapsing under its own backlog.
CLUSTER_BATCH_SIZE = 30
CLUSTER_WORKERS = 4

# Clustering (one call across the whole new-article batch) is cheap; a Haiku
# synthesis call per resulting story is not, and most groups are one-off
# articles nobody else picked up. Only synthesize the N groups with the most
# references (existing story's article count + new articles matched to it
# this run, or just article count for a brand-new group) per run. The rest
# are still linked to their existing story if they matched one (cheap, no
# rewrite); a brand-new group that isn't top-N is left ungrouped so it's
# reconsidered next run — if it picks up more sources later its reference
# count grows and it can win then.
TOP_N_STORIES = 1
# A brand-new group that never grows past TOP_N_STORIES would otherwise sit
# in the ungrouped pool (and get re-sent to the clustering call) forever.
# Past this age, file it as a plain non-AI story (verbatim title, no Claude
# call) so it drops out of the pool.
MAX_UNGROUPED_AGE_HOURS = 72

# Used when a story is filed without a synthesis call (verbatim fallback, or
# an aged-out group) — neutral until an actual synthesis call scores it.
DEFAULT_GOOD_NEWS_SCORE = 5

CATEGORY_GUIDE = """- news: Israeli domestic news not covered below — politics, crime, courts,
  government, elections, society.
- security: military/defense/terror — IDF operations, Gaza, West Bank,
  Lebanon, Iran, Hezbollah, Houthis, attacks, security forces.
- world: international news not primarily about Israel.
- business: economy, markets, companies, banks, finance.
- tech: technology, AI, startups, science.
- sports: sports news of any kind.
- culture: lifestyle, entertainment, travel, food, health, human interest,
  obituaries, arts.
- weather: weather forecasts, storms, heatwaves, floods, and other
  meteorological reports/warnings."""


def fetch_ungrouped(conn):
    return conn.execute(
        "SELECT id, source, title, description, published, created_at FROM articles "
        "WHERE story_id IS NULL ORDER BY created_at"
    ).fetchall()


def count_story_articles(conn, story_id):
    return conn.execute(
        "SELECT COUNT(*) FROM articles WHERE story_id = ?", (story_id,)
    ).fetchone()[0]


def fetch_candidate_stories(conn):
    return conn.execute(
        """SELECT s.id, s.topic, s.category, s.ai_summary, s.good_news_score,
                  (SELECT a.title FROM articles a
                     WHERE a.story_id = s.id
                     ORDER BY a.created_at DESC LIMIT 1) AS latest_title
           FROM stories s
           WHERE s.updated_at >= datetime('now', ?)
           ORDER BY s.updated_at DESC
           LIMIT ?""",
        (f"-{STORY_MATCH_WINDOW_HOURS} hours", MAX_CANDIDATE_STORIES),
    ).fetchall()


def build_cluster_prompt(new_articles, candidates):
    new_payload = [
        {
            "id": a["id"],
            "source": a["source"],
            "title": a["title"],
            "published": a["published"],
            "summary": (a["description"] or "")[:120],
        }
        for a in new_articles
    ]
    candidate_payload = [
        {
            "story_id": s["id"],
            "topic": s["topic"],
            "category": s["category"],
            "latest_title": s["latest_title"],
        }
        for s in candidates
    ]
    return f"""Below is a JSON array of NEW news articles that were just fetched, and a
JSON array of EXISTING stories already being tracked (each already covers
one or more earlier articles).

For each new article, decide:
- If it covers the SAME underlying story as one of the EXISTING stories
  (same event/subject, even if worded differently or from a different
  source), assign it that story's "story_id".
- Otherwise, group it with any OTHER new articles that share a story with
  it, set "story_id" to null, and assign a category from: news, security,
  world, business, tech, sports, culture, weather.
{CATEGORY_GUIDE}

Output ONLY a JSON array, one object per group, in exactly this shape:
[{{"article_ids": [12, 13], "story_id": 5}},
 {{"article_ids": [14], "story_id": null, "category": "security"}}]
"article_ids" must use the exact "id" values from the new articles input,
every new article id must appear in exactly one group, and "category" is
only required when "story_id" is null. No other text, no explanation.

New articles:
{json.dumps(new_payload, ensure_ascii=False)}

Existing stories:
{json.dumps(candidate_payload, ensure_ascii=False)}
"""


def verbatim_topic_summary(members):
    """No AI call: use the first member article's own text as topic/summary.
    Used both when a synthesis call fails and when a low-reference group
    ages out of the ungrouped pool without ever being picked for synthesis.
    """
    first = members[0]
    return first["title"], (first["description"] or first["title"])


def synthesize_story(members, existing_context=None):
    if existing_context:
        prompt = f"""An existing news story is already being tracked, in Hebrew:
Topic: {existing_context['topic']}
Summary: {existing_context['ai_summary'] or ''}

New articles have just come in that continue this same story:
{json.dumps(members, ensure_ascii=False)}

Update, in Hebrew:
- "topic": a short neutral label for the story (a few words).
- "story_summary": a 1-2 sentence summary reflecting the story INCLUDING
  the new developments, synthesized in your own words — not a copy of any
  single source.
- "good_news_score": an integer 0-10 rating how positive/uplifting this
  story is, judged as a whole including the new developments. 0 means
  tragic/violent (murder, terror attack, war, fatal accident, serious
  crime), 5 means routine/neutral news, 10 means heartwarming good news
  (births, weddings, rescues, medical breakthroughs, major achievements).
Output ONLY a single JSON object:
{{"topic": "...", "story_summary": "...", "good_news_score": 0}}.
No other text."""
    else:
        prompt = f"""You will be given a JSON array of news articles that all cover the SAME
underlying story, each with a source name, title, and description. Write,
in Hebrew:
- "topic": a short neutral label for the shared story (a few words).
- "story_summary": a 1-2 sentence summary of the story, synthesized in your
  own words from the article titles/descriptions across sources — not a
  copy of any single one.
- "good_news_score": an integer 0-10 rating how positive/uplifting this
  story is. 0 means tragic/violent (murder, terror attack, war, fatal
  accident, serious crime), 5 means routine/neutral news, 10 means
  heartwarming good news (births, weddings, rescues, medical breakthroughs,
  major achievements).
Keep any Hebrew text you read exactly as-is; translate non-Hebrew source
text into Hebrew for the summary if needed. Output ONLY a single JSON
object: {{"topic": "...", "story_summary": "...", "good_news_score": 0}}.
No other text.

Articles:
{json.dumps(members, ensure_ascii=False)}"""

    result = call_claude_json(prompt, SYNTH_MODEL, retries=1)
    if result and result.get("topic") and result.get("story_summary"):
        score = result.get("good_news_score")
        score = score if isinstance(score, int) and 0 <= score <= 10 else DEFAULT_GOOD_NEWS_SCORE
        return result["topic"], result["story_summary"], score

    if existing_context:
        # Don't regress an already-good Hebrew topic/summary to an arbitrary
        # (possibly non-Hebrew) member's raw title just because this one
        # synthesis call flaked — the new article is still linked to the
        # story below, it just won't be reflected in the text until the
        # next run succeeds.
        print(
            f"WARNING: re-synthesis failed for story '{existing_context['topic']}', keeping its existing topic/summary",
            file=sys.stderr,
        )
        return existing_context["topic"], existing_context["ai_summary"], existing_context["good_news_score"]

    # New story, no prior text to fall back to: degrade this one story
    # instead of failing the whole run.
    print(f"WARNING: synthesis failed for new story (first title: {members[0]['title']!r}), using it verbatim", file=sys.stderr)
    topic, summary = verbatim_topic_summary(members)
    return topic, summary, DEFAULT_GOOD_NEWS_SCORE


def main():
    if len(sys.argv) != 2:
        print("usage: group_stories.py DB_PATH", file=sys.stderr)
        sys.exit(2)

    db_path = sys.argv[1]
    conn = get_connection(db_path)

    new_articles = fetch_ungrouped(conn)
    if not new_articles:
        print("No new articles to group.")
        return

    candidates = fetch_candidate_stories(conn)
    candidates_by_id = {s["id"]: s for s in candidates}
    new_ids = {a["id"] for a in new_articles}
    articles_by_id = {a["id"]: a for a in new_articles}

    batches = [new_articles[i:i + CLUSTER_BATCH_SIZE] for i in range(0, len(new_articles), CLUSTER_BATCH_SIZE)]
    print(
        f"Clustering {len(new_articles)} new article(s) (in {len(batches)} batch(es) of up to "
        f"{CLUSTER_BATCH_SIZE}) against {len(candidates)} open stor{'y' if len(candidates) == 1 else 'ies'}…",
        file=sys.stderr,
    )

    def cluster_batch(batch):
        result = call_claude_json(build_cluster_prompt(batch, candidates), CLUSTER_MODEL, retries=1)
        if result is None:
            print(
                f"WARNING: clustering call failed for a batch of {len(batch)} — "
                "treating them as singleton stories",
                file=sys.stderr,
            )
        return result

    with ThreadPoolExecutor(max_workers=CLUSTER_WORKERS) as pool:
        batch_results = list(pool.map(cluster_batch, batches))
    assignments = [g for result in batch_results if result for g in result]

    groups = []
    seen = set()
    for g in assignments:
        ids = [i for i in g.get("article_ids", []) if i in new_ids and i not in seen]
        if not ids:
            continue
        seen.update(ids)
        groups.append({"article_ids": ids, "story_id": g.get("story_id"), "category": g.get("category")})

    # Anything the model missed (or a batch's call failed outright) becomes its own singleton story.
    for a in new_articles:
        if a["id"] not in seen:
            groups.append({"article_ids": [a["id"]], "story_id": None, "category": "news"})

    def reference_count(g):
        existing = candidates_by_id.get(g["story_id"]) if g["story_id"] else None
        base = count_story_articles(conn, existing["id"]) if existing else 0
        return base + len(g["article_ids"])

    groups.sort(key=reference_count, reverse=True)
    top_groups, rest_groups = groups[:TOP_N_STORIES], groups[TOP_N_STORIES:]

    cutoff = conn.execute(
        "SELECT strftime('%Y-%m-%dT%H:%M:%SZ', 'now', ?) AS cutoff",
        (f"-{MAX_UNGROUPED_AGE_HOURS} hours",),
    ).fetchone()["cutoff"]

    linked_count = 0
    aged_out_count = 0
    left_ungrouped_count = 0
    for g in rest_groups:
        if g["story_id"]:
            # Matches an existing story but isn't a top-N reference count this
            # run: link it, but skip the (paid) resynthesis.
            conn.executemany(
                "UPDATE articles SET story_id = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = ?",
                [(g["story_id"], aid) for aid in g["article_ids"]],
            )
            linked_count += len(g["article_ids"])
            continue

        oldest = min(articles_by_id[aid]["created_at"] for aid in g["article_ids"])
        if oldest >= cutoff:
            # Still fresh: leave ungrouped, reconsidered together with
            # whatever's new on a future run (it may pick up more sources
            # and earn a top-N spot then).
            left_ungrouped_count += len(g["article_ids"])
            continue

        # Aged out of the ungrouped pool without ever being a top reference
        # count: file it without spending a synthesis call.
        members = [
            {"title": articles_by_id[i]["title"], "description": articles_by_id[i]["description"], "source": articles_by_id[i]["source"]}
            for i in g["article_ids"]
        ]
        topic, summary = verbatim_topic_summary(members)
        cur = conn.execute(
            "INSERT INTO stories (topic, category, ai_summary, good_news_score) VALUES (?, ?, ?, ?)",
            (topic, g.get("category") or "news", summary, DEFAULT_GOOD_NEWS_SCORE),
        )
        conn.executemany(
            "UPDATE articles SET story_id = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = ?",
            [(cur.lastrowid, aid) for aid in g["article_ids"]],
        )
        aged_out_count += len(g["article_ids"])

    def process_group(g):
        members = [
            {"title": articles_by_id[i]["title"], "description": articles_by_id[i]["description"], "source": articles_by_id[i]["source"]}
            for i in g["article_ids"]
        ]
        existing = candidates_by_id.get(g["story_id"]) if g["story_id"] else None
        if existing:
            topic, summary, score = synthesize_story(members, existing_context=existing)
            return {"kind": "update", "story_id": existing["id"], "topic": topic, "summary": summary, "score": score, "article_ids": g["article_ids"]}
        topic, summary, score = synthesize_story(members)
        return {"kind": "new", "category": g.get("category") or "news", "topic": topic, "summary": summary, "score": score, "article_ids": g["article_ids"]}

    with ThreadPoolExecutor(max_workers=SYNTH_WORKERS) as pool:
        results = list(pool.map(process_group, top_groups))

    new_count = 0
    updated_count = 0
    for r in results:
        if r["kind"] == "update":
            story_id = r["story_id"]
            conn.execute(
                "UPDATE stories SET topic = ?, ai_summary = ?, good_news_score = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = ?",
                (r["topic"], r["summary"], r["score"], story_id),
            )
            updated_count += 1
        else:
            cur = conn.execute(
                "INSERT INTO stories (topic, category, ai_summary, good_news_score) VALUES (?, ?, ?, ?)",
                (r["topic"], r["category"], r["summary"], r["score"]),
            )
            story_id = cur.lastrowid
            new_count += 1

        conn.executemany(
            "UPDATE articles SET story_id = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = ?",
            [(story_id, aid) for aid in r["article_ids"]],
        )

    conn.commit()
    print(
        f"Grouped {len(new_articles)} article(s) into {len(groups)} stor{'y' if len(groups) == 1 else 'ies'}: "
        f"{new_count} new, {updated_count} updated (synthesized, top {TOP_N_STORIES} by reference count); "
        f"{linked_count} linked without resynthesis, {aged_out_count} filed verbatim after aging out, "
        f"{left_ungrouped_count} left ungrouped for a future run"
    )


if __name__ == "__main__":
    main()
