#!/bin/bash

# Claude Code sends JSON on stdin — capture it for the original statusline
INPUT=$(cat)

BACKUP="/tmp/claude-selector/original-statusline.json"
ORIGINAL_OUTPUT=""

# Run original status line if backed up
if [ -f "$BACKUP" ]; then
  ORIG_TYPE=$(python3 -c "import json; d=json.load(open('$BACKUP')); print(d.get('type',''))" 2>/dev/null)
  if [ "$ORIG_TYPE" = "command" ]; then
    ORIG_CMD=$(python3 -c "import json; d=json.load(open('$BACKUP')); print(d.get('command',''))" 2>/dev/null)
    if [ -n "$ORIG_CMD" ]; then
      # Expand ~ in command path
      ORIG_CMD="${ORIG_CMD/#\~/$HOME}"
      ORIGINAL_OUTPUT=$(echo "$INPUT" | bash -c "$ORIG_CMD" 2>/dev/null || true)
    fi
  elif [ "$ORIG_TYPE" = "template" ]; then
    ORIGINAL_OUTPUT=$(python3 -c "import json; d=json.load(open('$BACKUP')); print(d.get('template',''))" 2>/dev/null)
  fi
fi

# Get claude-selector indicator
SELECTOR_OUTPUT=""
RESP=$(curl -s --max-time 1 http://localhost:7890/health 2>/dev/null)
if [ -n "$RESP" ]; then
  if command -v jq >/dev/null 2>&1; then
    SELECTOR_OUTPUT=$(echo "$RESP" | jq -r 'if .stored > 0 then "📎 web elements" else "" end')
  else
    STORED=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('stored',0))" 2>/dev/null || echo "0")
    if [ "$STORED" -gt 0 ] 2>/dev/null; then
      SELECTOR_OUTPUT="📎 web elements"
    fi
  fi
fi

# Combine outputs
if [ -n "$ORIGINAL_OUTPUT" ] && [ -n "$SELECTOR_OUTPUT" ]; then
  echo "${ORIGINAL_OUTPUT} | ${SELECTOR_OUTPUT}"
elif [ -n "$ORIGINAL_OUTPUT" ]; then
  echo "$ORIGINAL_OUTPUT"
elif [ -n "$SELECTOR_OUTPUT" ]; then
  echo "$SELECTOR_OUTPUT"
fi
