#!/usr/bin/env bash
#
# rebuild_news_json.sh
#
# Re-exports public/data/news.json from the existing data/news.db and
# pushes it if it changed — without re-fetching feeds or re-running
# group_stories.py (which shells out to the `claude` CLI). Use this after
# changing export_news_json.py's query/shape (e.g. the retention window)
# when you just want the site to reflect the current DB state, with no
# agent call involved.
#
# Usage: scripts/rebuild_news_json.sh

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_PATH="$REPO_DIR/data/news.db"
NEWS_JSON="$REPO_DIR/public/data/news.json"
LOCK_FILE="$REPO_DIR/.pipeline.lock"

cd "$REPO_DIR"

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "[$(date -Iseconds)] Another run is already in progress, skipping" >&2
  exit 0
fi

echo "[$(date -Iseconds)] Rebuilding news.json from $DB_PATH"
python3 "$REPO_DIR/scripts/db/export_news_json.py" "$DB_PATH" "$NEWS_JSON"

if ! git diff --quiet -- "$NEWS_JSON"; then
  echo "[$(date -Iseconds)] news.json changed, committing and pushing"
  git add "$NEWS_JSON"
  git commit -m "Rebuild news.json $(date -Iseconds)"
  git push origin main
else
  echo "[$(date -Iseconds)] news.json unchanged, nothing to push"
fi
