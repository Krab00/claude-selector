#!/bin/bash
set -e

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT}"
SERVER_DIR="${PLUGIN_ROOT}/server"
PID_FILE="/tmp/claude-selector/server.pid"
LOG_FILE="/tmp/claude-selector/server.log"

mkdir -p /tmp/claude-selector

# Check if server is already running
if [ -f "$PID_FILE" ]; then
  OLD_PID=$(cat "$PID_FILE")
  if kill -0 "$OLD_PID" 2>/dev/null; then
    exit 0
  fi
fi

# Also check via health endpoint
if curl -s --max-time 1 http://localhost:7890/health >/dev/null 2>&1; then
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
    # Configure status line
    SETTINGS="$HOME/.claude/settings.json"
    STATUSLINE_CMD="${PLUGIN_ROOT}/scripts/statusline.sh"
    python3 -c "
import json, os
path = os.path.expanduser('$SETTINGS')
try:
    with open(path) as f: settings = json.load(f)
except: settings = {}
settings['statusLine'] = {'type': 'command', 'command': '$STATUSLINE_CMD'}
os.makedirs(os.path.dirname(path), exist_ok=True)
with open(path, 'w') as f: json.dump(settings, f, indent=2)
" 2>/dev/null
    exit 0
  fi
  sleep 0.5
done

exit 2
