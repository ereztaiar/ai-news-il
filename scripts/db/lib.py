"""Shared helpers for the SQLite-based news pipeline. Stdlib only (sqlite3,
subprocess) — no pip install needed, so this runs unattended from cron.
"""
import json
import re
import sqlite3
import subprocess
import sys
from pathlib import Path

SCHEMA_PATH = Path(__file__).parent / "schema.sql"

FENCE_RE = re.compile(r"^```[a-zA-Z]*\s*$", re.MULTILINE)


def get_connection(db_path: str) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.executescript(SCHEMA_PATH.read_text())
    return conn


def strip_fences(text: str) -> str:
    # Models are asked for "ONLY JSON" but routinely wrap it in a ```json
    # fence anyway.
    return FENCE_RE.sub("", text).strip()


def call_claude_json(prompt: str, model: str, retries: int = 1, timeout: int = 180):
    """Call `claude -p` with prompt on stdin, return parsed JSON or None.

    Prompt is passed via stdin, not argv — with many articles embedded, the
    prompt can exceed the OS execve ARG_MAX for a command-line argument.
    """
    for attempt in range(retries + 1):
        try:
            result = subprocess.run(
                ["claude", "-p", "--allowedTools", "", "--model", model, "--output-format", "text"],
                input=prompt,
                capture_output=True,
                text=True,
                timeout=timeout,
            )
        except subprocess.TimeoutExpired:
            print(f"WARNING: claude call timed out after {timeout}s (attempt {attempt + 1}/{retries + 1})", file=sys.stderr)
            continue
        text = strip_fences(result.stdout.strip())
        if text:
            try:
                return json.loads(text)
            except json.JSONDecodeError as e:
                print(
                    f"WARNING: claude call returned non-JSON output (attempt {attempt + 1}/{retries + 1}): {e}",
                    file=sys.stderr,
                )
                continue
        print(
            f"WARNING: claude call returned empty output (attempt {attempt + 1}/{retries + 1}, "
            f"exit code {result.returncode}): {result.stderr.strip()[:500]}",
            file=sys.stderr,
        )
    return None
