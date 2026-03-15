#!/bin/bash

PID_FILE="/tmp/claude-selector/server.pid"

if [ -f "$PID_FILE" ]; then
  PID=$(cat "$PID_FILE")
  if kill -0 "$PID" 2>/dev/null; then
    kill "$PID" 2>/dev/null || true
  fi
  rm -f "$PID_FILE"
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
