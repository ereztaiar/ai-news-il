#!/usr/bin/env bash
#
# fetch_news.sh — fetch each configured RSS feed with curl, parse it into
# article objects, and insert new ones into the SQLite articles table
# (data/news.db). No agent/LLM involved: curl fetches the raw XML,
# parse_feed.py (stdlib xml.etree.ElementTree, no pip install needed) turns
# it into JSON, and ingest_articles.py (stdlib sqlite3) inserts rows —
# duplicates (same link) are silently skipped via the UNIQUE constraint on
# articles.link, so re-fetching an already-seen article is a no-op. Using
# json.dumps/sqlite3 params (not hand-built strings) sidesteps quote-escaping
# entirely, which matters because Hebrew text routinely contains literal `"`
# as abbreviation punctuation (צה"ל, בג"ץ, יועמ"ש...).

set -uo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

# Israeli news RSS feeds (source => URL)
declare -A FEEDS=(
  [ynet]="https://www.ynet.co.il/Integration/StoryRss2.xml"
  [ynet_sport]="https://www.ynet.co.il/Integration/StoryRss3.xml"
  [ynet_economy]="https://www.ynet.co.il/Integration/StoryRss6.xml"
  [walla]="https://rss.walla.co.il/feed/1?type=main"
  # [timesofisrael]="https://www.timesofisrael.com/feed/"
  # [jpost]="https://www.jpost.com/rss/rssfeedsheadlines.aspx"
  # [arutz_sheva]="https://www.israelnationalnews.com/Rss.aspx"
  # [channel14]="https://www.now14.co.il/feed/"
  [haaretz_en]="https://www.haaretz.com/cmlink/1.4605102"
  # [n12_mako]="..."  # grab the exact .xml from https://www.mako.co.il/rss
  # makor_rishon RSS (https://www.makorrishon.co.il/feed/) and
  # israelhayom.co.il/rss.xml both 403 non-browser requests (Akamai edge
  # block) — don't re-add without re-testing curl with the User-Agent below.
  # timesofisrael sits behind Cloudflare bot management (__cf_bm challenge)
  # that 403s plain curl regardless of User-Agent/Accept headers — this is a
  # TLS/fingerprint-level block, not a UA check, so it's not something to
  # work around here. Worked previously only because it went through
  # WebFetch (a real browser-ish client), which this script no longer uses.
)

USER_AGENT="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
PARSE_SCRIPT="$REPO_DIR/scripts/parse_feed.py"
INGEST_SCRIPT="$REPO_DIR/scripts/db/ingest_articles.py"
DB_PATH="$REPO_DIR/data/news.db"

mkdir -p "$REPO_DIR/data"

for src in "${!FEEDS[@]}"; do
  url="${FEEDS[$src]}"
  echo "------ $src -> $url ------"

  ts="$(date +%Y%m%d_%H%M%S)"
  raw_file="data/.${src}_${ts}.raw.xml"
  parsed_file="data/.${src}_${ts}.parsed.json"
  err_file="data/.${src}_${ts}.err.log"

  ok=0
  attempt=1
  while (( attempt <= 2 )); do
    rm -f "$raw_file" "$parsed_file" "$err_file"

    if ! curl -sS -L --fail --max-time 20 --retry 1 \
           -A "$USER_AGENT" \
           -o "$raw_file" "$url" 2>"$err_file"; then
      echo "  -> WARNING: $src curl fetch failed (attempt $attempt): $(cat "$err_file")" >&2
      ((attempt++))
      continue
    fi

    if python3 "$PARSE_SCRIPT" "$raw_file" > "$parsed_file" 2>"$err_file" \
         && [[ "$(jq 'length' "$parsed_file")" -gt 0 ]]; then
      total="$(jq 'length' "$parsed_file")"
      inserted="$(python3 "$INGEST_SCRIPT" "$DB_PATH" "$src" "$parsed_file")"
      echo "  -> parsed $total item(s), inserted $inserted new"
      ok=1
      break
    fi

    echo "  -> WARNING: $src parse failed or produced no items (attempt $attempt): $(cat "$err_file")" >&2
    rm -f "$parsed_file"
    ((attempt++))
  done

  rm -f "$raw_file" "$parsed_file" "$err_file"
  (( ok )) || echo "  -> ERROR: $src fetch/parse failed after retries, nothing ingested" >&2
done
