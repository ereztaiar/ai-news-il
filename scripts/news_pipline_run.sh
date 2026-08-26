#!/usr/bin/env bash
#
# news_pipline_run.sh
#
# Orchestrates the news pipeline: fetch_news.sh (pulls RSS feeds, inserts
# new articles into data/news.db), scripts/db/group_stories.py (matches
# those new articles to an existing open story or starts a new one,
# synthesizing a Hebrew topic+summary for each affected story), then
# scripts/db/export_news_json.py (writes public/data/news.json from the
# DB). If that export changed, it's committed and pushed to main, which
# triggers .github/workflows/deploy.yml to build and publish to GitHub
# Pages. All output is captured into a single timestamped log file under
# logs/.
#
# Runs from a local cron job, e.g.:
#   0 */5 * * * /home/ereztaiar/tsc-workdir/news/scripts/news_pipline_run.sh
#
# Run `crontab -e` to view/edit.

set -euo pipefail

# cron invokes this with a minimal, non-login environment, so PATH won't
# include ~/.local/bin (where `claude` lives) unless we add it ourselves —
# group_stories.py shells out to the `claude` CLI and fails with
# FileNotFoundError otherwise.
export PATH="$HOME/.local/bin:$PATH"

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$REPO_DIR/logs"
LOG_FILE="$LOG_DIR/update_$(date +%Y%m%d_%H%M%S).log"
DB_PATH="$REPO_DIR/data/news.db"
NEWS_JSON="$REPO_DIR/public/data/news.json"
LOCK_FILE="$REPO_DIR/.pipeline.lock"

mkdir -p "$LOG_DIR" "$REPO_DIR/data"
cd "$REPO_DIR"

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "[$(date -Iseconds)] Another run is already in progress, skipping" >>"$LOG_DIR/update_skipped.log"
  exit 0
fi

{
  echo "[$(date -Iseconds)] Starting news update"

  echo "[$(date -Iseconds)] Running fetch_news.sh"
  "$REPO_DIR/scripts/fetch_news.sh"

  echo "[$(date -Iseconds)] Running group_stories.py"
  python3 "$REPO_DIR/scripts/db/group_stories.py" "$DB_PATH"

  echo "[$(date -Iseconds)] Exporting stories to public/data/news.json"
  python3 "$REPO_DIR/scripts/db/export_news_json.py" "$DB_PATH" "$NEWS_JSON"

  if ! git diff --quiet -- "$NEWS_JSON"; then
    echo "[$(date -Iseconds)] news.json changed, committing and pushing"
    git add "$NEWS_JSON"
    git commit -m "Update news data $(date -Iseconds)"
    git push origin main
  else
    echo "[$(date -Iseconds)] news.json unchanged, nothing to push"
  fi

  echo "[$(date -Iseconds)] Done"
} >"$LOG_FILE" 2>&1
