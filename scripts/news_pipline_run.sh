#!/usr/bin/env bash
#
# news_pipline_run.sh
#
# Orchestrates the news pipeline: fetch_news.sh (pulls RSS feeds, inserts
# new articles into data/news.db), scripts/db/group_stories.py (matches
# those new articles to an existing open story or starts a new one,
# synthesizing a Hebrew topic+summary for each affected story), then
# scripts/db/export_news_json.py (writes public/data/news.json from the
# DB). All output is captured into a single timestamped log file under
# logs/.
#
# Intended to run from a local cron job, e.g.:
#   */30 * * * * /home/ereztaiar/tsc-workdir/news/scripts/news_pipline_run.sh
#
# Run `crontab -e` and add a line like the one above (adjust the interval).

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$REPO_DIR/logs"
LOG_FILE="$LOG_DIR/update_$(date +%Y%m%d_%H%M%S).log"
DB_PATH="$REPO_DIR/data/news.db"

mkdir -p "$LOG_DIR" "$REPO_DIR/data"
cd "$REPO_DIR"

{
  echo "[$(date -Iseconds)] Starting news update"

  echo "[$(date -Iseconds)] Running fetch_news.sh"
  "$REPO_DIR/scripts/fetch_news.sh"

  echo "[$(date -Iseconds)] Running group_stories.py"
  python3 "$REPO_DIR/scripts/db/group_stories.py" "$DB_PATH"

  echo "[$(date -Iseconds)] Exporting stories to public/data/news.json"
  python3 "$REPO_DIR/scripts/db/export_news_json.py" "$DB_PATH" "$REPO_DIR/public/data/news.json"

  echo "[$(date -Iseconds)] Done"
} >"$LOG_FILE" 2>&1
