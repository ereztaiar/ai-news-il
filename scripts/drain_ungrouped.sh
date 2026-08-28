#!/usr/bin/env bash
#
# drain_ungrouped.sh
#
# Thin wrapper around scripts/db/drain_ungrouped.py — works down the
# articles.story_id IS NULL backlog in batches of 10, outside the regular
# cron pipeline (news_pipline_run.sh's group_stories.py caps itself to one
# new story per run, which can't keep up when a lot of articles pile up
# ungrouped — see that script's docstring for details). Not invoked by
# news_pipline_run.sh; run by hand, as many times as needed:
#   scripts/drain_ungrouped.sh            # oldest ungrouped articles first
#   scripts/drain_ungrouped.sh --newest   # newest ungrouped articles first
#
# Each run only processes one batch of 10 — rerun to keep draining.

set -euo pipefail

# group_stories.py (imported here for its clustering/synthesis helpers)
# shells out to the `claude` CLI, which needs ~/.local/bin on PATH.
export PATH="$HOME/.local/bin:$PATH"

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_PATH="$REPO_DIR/data/news.db"
LOCK_FILE="$REPO_DIR/.pipeline.lock"

cd "$REPO_DIR"

# Share the pipeline's lock so this never writes to news.db at the same
# time as a cron-triggered news_pipline_run.sh.
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "A pipeline run is already in progress, skipping" >&2
  exit 0
fi

python3 "$REPO_DIR/scripts/db/drain_ungrouped.py" "$DB_PATH" "$@"
