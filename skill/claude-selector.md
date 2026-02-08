---
name: ai-service
description: Manage claude-selector server and read captured web elements
command: ai-service
allowed-tools: ["Bash", "Read", "WebFetch"]
---

# AI Service — Claude Selector Manager

You manage a local Bun server that receives CSS selectors and HTML snippets from a Chrome extension. Use Bash for process management and curl/WebFetch to communicate with the server.

Server location: `/Users/krzysiek/Documents/Projekty/claude-selector`
Server URL: `http://localhost:7890`
PID file: `/tmp/claude-selector/server.pid`

---

## `/ai-service on` — Start the server

1. Create the PID directory if it doesn't exist: `mkdir -p /tmp/claude-selector`
2. Check if the server is already running:
   - If `/tmp/claude-selector/server.pid` exists, read the PID and check if the process is alive with `kill -0 <PID> 2>/dev/null`
   - Also try `curl -s --max-time 2 http://localhost:7890/health`
   - If already running, report that and stop
3. Start the server in the background:
   ```bash
   cd /Users/krzysiek/Documents/Projekty/claude-selector && nohup bun run server/index.ts > /tmp/claude-selector/server.log 2>&1 &
   echo $! > /tmp/claude-selector/server.pid
   ```
4. Wait 1 second, then verify with `curl -s --max-time 3 http://localhost:7890/health`
5. Report whether the server started successfully, including the PID

## `/ai-service off` — Stop the server

1. Read the PID from `/tmp/claude-selector/server.pid`
2. If the file doesn't exist, check with curl whether something is still listening on port 7890 and report accordingly
3. Kill the process: `kill <PID>`
4. Remove the PID file: `rm -f /tmp/claude-selector/server.pid`
5. Confirm the server has stopped

## `/ai-service status` — Check server status

1. Try `curl -s --max-time 2 http://localhost:7890/health`
2. If the server responds, report:
   - Status: running
   - Any info returned by the health endpoint (e.g. element count, uptime)
3. If the server does not respond, report: Status: stopped

## `/ai-service read` — Read latest captured elements

1. Fetch data from `http://localhost:7890/elements/latest` using curl or WebFetch
2. If elements exist, display them clearly:
   - Source URL the elements came from
   - Number of elements captured
   - For each element: its CSS selector and an HTML snippet (truncated if very long)
3. If no elements have been captured yet, say so
