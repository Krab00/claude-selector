# claude-selector

A Chrome extension + Claude Code plugin that lets you select elements on a web page and send their CSS selectors and HTML to Claude Code — automatically.

## Installation

### 1. Install the Claude Code plugin

```bash
/plugin marketplace add https://github.com/Krab00/claude-selector
/plugin install claude-selector@claude-selector-marketplace
```

This automatically:
- Installs the `/ai-service` skill
- Starts a local Bun server when a Claude Code session begins
- Stops it when the session ends
- Shows `📎 web elements` in the status line when elements are captured
- Auto-injects captured elements into your next prompt

Your existing status line configuration is preserved — the plugin wraps it and appends the indicator.

### 2. Install the Chrome Extension

1. Clone this repo (if you haven't already)
2. Open `chrome://extensions` in Chrome
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `extension/` directory

## Usage

1. Open Claude Code (the server starts automatically)
2. Open a web page in Chrome and press `Cmd+Shift+S` to enter selection mode
3. Click elements to select them (`Cmd/Ctrl+click` for multi-select)
4. Press `Cmd+Shift+E` to send to server
5. Your terminal will flash (bell) and the status line shows `📎 web elements`
6. Type your next prompt — captured elements are automatically injected into context

No copy-paste, no `/ai-service read` needed. The hook handles everything.

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+Shift+S` | Toggle selection mode |
| `Cmd/Ctrl+click` | Multi-select elements |
| `Cmd+Shift+E` | Send to server |
| `Cmd+C` | Copy as JSON to clipboard (with screenshots) |
| `Escape` | Exit selection mode |

All shortcuts are configurable in the extension settings. The popup also has an "Auto-send on exit" toggle — when enabled, elements are sent automatically when you press Escape.

### Commands

| Command | Description |
|---------|-------------|
| `/ai-service read` | Read the latest captured elements manually |
| `/ai-service clear` | Clear all captured elements |
| `/ai-service status` | Check if the server is running |
| `/ai-service on` | Manually start the server |
| `/ai-service off` | Manually stop the server |

### How it works

```
Chrome Extension                    Bun Server (localhost:7890)              Claude Code
─────────────────                   ──────────────────────────              ───────────
Select elements ──► Cmd+Shift+E ──► POST /elements
                                    ├─ Store in memory
                                    ├─ Save to /tmp/.../latest.json
                                    ├─ macOS notification
                                    └─ Terminal bell (\x07)         ──►    Status line: 📎 web elements

                                                                           User types prompt
                                                                           ──► UserPromptSubmit hook
                                                                               ├─ GET /elements/latest?session=ID
                                                                               ├─ Inject summary into context
                                                                               ├─ POST /elements/consume?session=ID
                                                                               └─ Status line clears
```

### Multi-session support

Multiple Claude Code sessions share one server. Elements captured in Chrome are delivered to all sessions independently — each session sees the `📎` indicator and receives elements on its next prompt. When all sessions have consumed the elements, they are automatically cleaned up.

### Extension features

- **Popup** — Toggle selection mode, send/copy/clear buttons, server status indicator
- **Logs viewer** — Dedicated page showing selection, send, and error history (accessible from popup)
- **Settings** — Configure which data to include (HTML, attributes, computed styles, screenshots), keyboard shortcuts, server URL

## Project Structure

```
claude-selector/
├── .claude-plugin/
│   ├── plugin.json              # Plugin manifest
│   └── marketplace.json         # Marketplace config
├── hooks/
│   └── hooks.json               # SessionStart, SessionEnd, UserPromptSubmit
├── skills/
│   └── ai-service/
│       └── SKILL.md             # /ai-service slash command
├── scripts/
│   ├── start-server.sh          # Server start + session register + statusline setup
│   ├── stop-server.sh           # Session unregister + server stop + statusline restore
│   ├── inject-elements.sh       # UserPromptSubmit hook — auto-inject elements
│   └── statusline.sh            # Wraps original statusline + 📎 indicator
├── server/
│   ├── server.ts                # HTTP endpoints (elements, sessions, health)
│   ├── store.ts                 # Element storage + per-session consumption tracking
│   └── index.ts                 # Entry point
└── extension/
    ├── manifest.json            # Chrome extension manifest (Manifest V3)
    ├── content.js               # Element selection, hover, badges, keyboard shortcuts
    ├── content.css              # Selection styles + toast
    ├── background.js            # Screenshot capture, server communication, logging
    ├── popup/                   # Extension popup UI
    ├── options/                 # Settings (data options, keyboard shortcuts)
    └── logs/                    # Live log viewer
```

## Development

```bash
cd server && bun install
claude --plugin-dir .            # Test the plugin locally
```
