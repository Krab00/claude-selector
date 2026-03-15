#!/bin/bash

PID_FILE="/tmp/claude-selector/server.pid"
SESSION_FILE="/tmp/claude-selector/session-id"

# Unregister session
if [ -f "$SESSION_FILE" ]; then
  SESSION_ID=$(cat "$SESSION_FILE")
  curl -s -X DELETE "http://localhost:7890/sessions/${SESSION_ID}" >/dev/null 2>&1
  rm -f "$SESSION_FILE"
fi

# Only kill server if no more sessions
SESSIONS=$(curl -s --max-time 1 http://localhost:7890/health 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('sessions',0))" 2>/dev/null || echo "0")

if [ "$SESSIONS" -le 0 ] 2>/dev/null; then
  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
      kill "$PID" 2>/dev/null || true
    fi
    rm -f "$PID_FILE"
  fi
fi

# Restore original status line config
SETTINGS="$HOME/.claude/settings.json"
BACKUP="/tmp/claude-selector/original-statusline.json"
python3 -c "
import json, os
path = os.path.expanduser('$SETTINGS')
backup_path = '$BACKUP'
try:
    with open(path) as f: settings = json.load(f)
except: exit()
if os.path.exists(backup_path):
    with open(backup_path) as f: original = json.load(f)
    settings['statusLine'] = original
    os.remove(backup_path)
elif 'statusLine' in settings:
    del settings['statusLine']
with open(path, 'w') as f: json.dump(settings, f, indent=2)
" 2>/dev/null

exit 0
