#!/bin/bash
set -e

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT}"
SERVER_DIR="${PLUGIN_ROOT}/server"
PID_FILE="/tmp/claude-selector/server.pid"
LOG_FILE="/tmp/claude-selector/server.log"
SESSION_FILE="/tmp/claude-selector/session-id"
SETTINGS="$HOME/.claude/settings.json"
STATUSLINE_CMD="${PLUGIN_ROOT}/scripts/statusline.sh"
BACKUP="/tmp/claude-selector/original-statusline.json"

mkdir -p /tmp/claude-selector

# Generate session ID
SESSION_ID="s_$$_$(date +%s)"
echo "$SESSION_ID" > "$SESSION_FILE"

configure_statusline() {
  python3 -c "
import json, os
path = os.path.expanduser('$SETTINGS')
backup_path = '$BACKUP'
wrapper_cmd = '$STATUSLINE_CMD'
try:
    with open(path) as f: settings = json.load(f)
except: settings = {}
existing = settings.get('statusLine')
# Already set to our wrapper — nothing to do
if existing and existing.get('command', '') == wrapper_cmd:
    exit()
# Backup existing statusLine only if no backup yet
if existing and not os.path.exists(backup_path):
    with open(backup_path, 'w') as f: json.dump(existing, f, indent=2)
settings['statusLine'] = {'type': 'command', 'command': wrapper_cmd}
os.makedirs(os.path.dirname(path), exist_ok=True)
with open(path, 'w') as f: json.dump(settings, f, indent=2)
" 2>/dev/null
}

# Check if server is already running
SERVER_RUNNING=false
if [ -f "$PID_FILE" ]; then
  OLD_PID=$(cat "$PID_FILE")
  if kill -0 "$OLD_PID" 2>/dev/null; then
    SERVER_RUNNING=true
  fi
fi
if ! $SERVER_RUNNING && curl -s --max-time 1 http://localhost:7890/health >/dev/null 2>&1; then
  SERVER_RUNNING=true
fi

if $SERVER_RUNNING; then
  curl -s -X POST "http://localhost:7890/sessions/register?id=${SESSION_ID}" >/dev/null 2>&1
  configure_statusline
  exit 0
fi

# Install dependencies if needed
if [ ! -d "$SERVER_DIR/node_modules" ]; then
  cd "$SERVER_DIR" && bun install >> "$LOG_FILE" 2>&1
fi

# Start the server
cd "$PLUGIN_ROOT"
nohup bun run server/index.ts > "$LOG_FILE" 2>&1 &
echo $! > "$PID_FILE"

# Wait for server to be ready
for i in $(seq 1 10); do
  if curl -s --max-time 1 http://localhost:7890/health >/dev/null 2>&1; then
    curl -s -X POST "http://localhost:7890/sessions/register?id=${SESSION_ID}" >/dev/null 2>&1
    configure_statusline
    exit 0
  fi
  sleep 0.5
done

exit 2
