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

# Extract summary info
URL=$(python3 -c "import json,sys; d=json.load(open('$LATEST')); print(d.get('source',{}).get('url','unknown'))" 2>/dev/null || echo "unknown")
COUNT=$(python3 -c "import json,sys; d=json.load(open('$LATEST')); print(len(d.get('elements',[])))" 2>/dev/null || echo "?")
SELECTORS=$(python3 -c "
import json
d=json.load(open('$LATEST'))
for e in d.get('elements',[]):
    print('  - ' + e.get('selector','(no selector)'))
" 2>/dev/null)

# Output summary — this gets injected into context
echo "[Claude Selector] ${COUNT} element(s) captured from: ${URL}"
echo "Selectors:"
echo "$SELECTORS"
echo ""
echo "Full data available at: ${LATEST}"
echo "Use the Read tool on this file to see complete HTML, attributes, and screenshots."
