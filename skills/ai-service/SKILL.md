---
name: ai-service
description: Manage claude-selector server and read captured web elements
allowed-tools: ["Bash", "Read", "WebFetch"]
---

# AI Service — Claude Selector Manager

You manage a local Bun server that receives CSS selectors and HTML snippets from a Chrome extension. Use Bash for process management and curl/WebFetch to communicate with the server.

Server URL: `http://localhost:7890`
PID file: `/tmp/claude-selector/server.pid`

> **Note:** The server starts/stops automatically via plugin hooks. Manual on/off commands below are fallbacks.

---

## `/ai-service on` — Start the server

1. Run: `${CLAUDE_PLUGIN_ROOT}/scripts/start-server.sh`
2. Report whether the server started successfully

## `/ai-service off` — Stop the server

1. Run: `${CLAUDE_PLUGIN_ROOT}/scripts/stop-server.sh`
2. Confirm the server has stopped

## `/ai-service status` — Check server status

1. Try `curl -s --max-time 2 http://localhost:7890/health`
2. If the server responds, report:
   - Status: running
   - Any info returned by the health endpoint (e.g. element count, uptime)
3. If the server does not respond, report: Status: stopped

## `/ai-service clear` — Clear captured elements

1. Run `curl -s -X DELETE http://localhost:7890/elements`
2. Confirm that elements have been cleared

## `/ai-service read` — Read latest captured elements

1. Fetch data from `http://localhost:7890/elements/latest` using curl or WebFetch
2. If elements exist, display them clearly:
   - Source URL the elements came from
   - Number of elements captured
   - For each element: its CSS selector and an HTML snippet (truncated if very long)
3. If no elements have been captured yet, say so
