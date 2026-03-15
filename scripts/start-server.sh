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
    exit 0
  fi
  sleep 0.5
done

exit 2
