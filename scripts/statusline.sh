#!/bin/bash

# Claude Code sends JSON on stdin — we ignore it and poll the server instead
cat > /dev/null

RESP=$(curl -s --max-time 1 http://localhost:7890/health 2>/dev/null)
if [ -z "$RESP" ]; then
  exit 0
fi

if command -v jq >/dev/null 2>&1; then
  echo "$RESP" | jq -r 'if .stored > 0 then "📎 \(.stored) web elements" else "" end'
else
  STORED=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('stored',0))" 2>/dev/null || echo "0")
  if [ "$STORED" -gt 0 ] 2>/dev/null; then
    echo "📎 $STORED web elements"
  fi
fi
