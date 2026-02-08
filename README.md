# claude-selector

A Chrome extension + local server that lets you select elements on a web page and send their CSS selectors and HTML to Claude Code.

## Components

- **extension/** — Chrome extension for selecting elements on any page
- **server/** — Bun HTTP server that receives and stores captured elements
- **skill/** — Claude Code skill for managing the server and reading data

## Installation

### 1. Server

```bash
cd server
bun install
```

### 2. Chrome Extension

1. Open `chrome://extensions` in Chrome
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `extension/` directory

### 3. Claude Code Skill

Symlink or copy the skill file into your Claude Code skills directory:

```bash
ln -s "$(pwd)/skill/claude-selector.md" ~/.claude/skills/claude-selector.md
```

## Usage

All commands are available as Claude Code slash commands:

| Command             | Description                          |
|---------------------|--------------------------------------|
| `/ai-service on`    | Start the local server               |
| `/ai-service off`   | Stop the local server                |
| `/ai-service status`| Check if the server is running       |
| `/ai-service read`  | Read the latest captured elements    |

### Workflow

1. Start the server: `/ai-service on`
2. Open a web page in Chrome and use the extension to select elements
3. Read captured elements in Claude Code: `/ai-service read`
4. Use the selectors and HTML in your coding tasks
5. Stop the server when done: `/ai-service off`
