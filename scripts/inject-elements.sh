#!/bin/bash

SESSION_FILE="/tmp/claude-selector/session-id"
INJECT_FILE="/tmp/claude-selector/injected.json"

# Need session ID
[ -f "$SESSION_FILE" ] || exit 0
SESSION_ID=$(cat "$SESSION_FILE")

# Fetch unconsumed elements for this session from server
RESP=$(curl -s --max-time 2 "http://localhost:7890/elements/latest?session=${SESSION_ID}" 2>/dev/null)
[ -z "$RESP" ] && exit 0

# Check if it's an error (already consumed or no elements)
echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); exit(0 if 'elements' in d else 1)" 2>/dev/null || exit 0

# Save response to temp file so Claude can Read it
echo "$RESP" > "$INJECT_FILE"

# Extract summary info
URL=$(echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('source',{}).get('url','unknown'))" 2>/dev/null || echo "unknown")
COUNT=$(echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('elements',[])))" 2>/dev/null || echo "?")
SELECTORS=$(echo "$RESP" | python3 -c "
import sys,json
d=json.load(sys.stdin)
for e in d.get('elements',[]):
    print('  - ' + e.get('selector','(no selector)'))
" 2>/dev/null)

# Output summary — this gets injected into context
echo "[Claude Selector] ${COUNT} element(s) captured from: ${URL}"
echo "Selectors:"
echo "$SELECTORS"
echo ""
echo "Full data available at: ${INJECT_FILE}"
echo "Use the Read tool on this file to see complete HTML, attributes, and screenshots."

# Mark as consumed for this session
curl -s -X POST "http://localhost:7890/elements/consume?session=${SESSION_ID}" >/dev/null 2>&1
