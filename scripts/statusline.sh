#!/bin/bash

# Claude Code sends JSON on stdin — capture it for the original statusline
INPUT=$(cat)

SESSION_FILE="/tmp/claude-selector/session-id"
BACKUP="/tmp/claude-selector/original-statusline.json"
ORIGINAL_OUTPUT=""

# Run original status line if backed up
if [ -f "$BACKUP" ]; then
  ORIG_TYPE=$(python3 -c "import json; d=json.load(open('$BACKUP')); print(d.get('type',''))" 2>/dev/null)
  if [ "$ORIG_TYPE" = "command" ]; then
    ORIG_CMD=$(python3 -c "import json; d=json.load(open('$BACKUP')); print(d.get('command',''))" 2>/dev/null)
    if [ -n "$ORIG_CMD" ]; then
      ORIG_CMD="${ORIG_CMD/#\~/$HOME}"
      ORIGINAL_OUTPUT=$(echo "$INPUT" | bash -c "$ORIG_CMD" 2>/dev/null || true)
    fi
  elif [ "$ORIG_TYPE" = "template" ]; then
    ORIGINAL_OUTPUT=$(python3 -c "import json; d=json.load(open('$BACKUP')); print(d.get('template',''))" 2>/dev/null)
  fi
fi

# Get session-aware claude-selector indicator
SELECTOR_OUTPUT=""
if [ -f "$SESSION_FILE" ]; then
  SESSION_ID=$(cat "$SESSION_FILE")
  RESP=$(curl -s --max-time 0.5 "http://localhost:7890/health?session=${SESSION_ID}" 2>/dev/null)
  if [ -n "$RESP" ]; then
    UNCONSUMED=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('unconsumed',False))" 2>/dev/null || echo "False")
    if [ "$UNCONSUMED" = "True" ]; then
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
