#!/bin/bash

LATEST="/tmp/claude-selector/latest.json"
SEEN="/tmp/claude-selector/last_seen"

# No file, nothing to inject
[ -f "$LATEST" ] || exit 0

# Check if file was modified since last seen
if [ -f "$SEEN" ]; then
  LATEST_MOD=$(stat -f %m "$LATEST" 2>/dev/null || stat -c %Y "$LATEST" 2>/dev/null)
  SEEN_MOD=$(cat "$SEEN")
  [ "$LATEST_MOD" = "$SEEN_MOD" ] && exit 0
fi

# Mark as seen
stat -f %m "$LATEST" 2>/dev/null > "$SEEN" || stat -c %Y "$LATEST" 2>/dev/null > "$SEEN"

# Output the elements — this gets injected into context
echo "[Claude Selector] New elements captured from browser:"
cat "$LATEST"
