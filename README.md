# ai-agent-press 🚀

**ai-agent-press** is a zero-config, **Bun-powered** CLI tool that transforms AI agent ecosystem files into searchable documentation portals and structured content graphs.

Turn your AI-agent instruction files and config directories into a unified developer portal or a hierarchical JSON stream in seconds.

## ✨ Features

- **Filesystem-first**: Scans your repo for AI-agent-related files automatically.
- **Bun-powered**: Native speed and built-in testing with `bun test`.
- **Hierarchical Navigation**: Strictly organized sidebar and URLs (`/{scope}/{ecosystem}/{category}/{name}`).
- **Smart Flattening**: Automatically simplifies the sidebar structure when only one scope or ecosystem is present.
- **Headless Mode**: List agent configurations as a hierarchical JSON tree that matches the portal sidebar.
- **Zero-config**: No manual VitePress scaffolding or repo pollution.
- **Ecosystem-aware**: Supports OpenAI, Claude, Gemini, Cursor, Agent, Codex, Cline, Roo, and OpenClaw.
- **Global-first**: Simultaneously loads local repo and global (`~/.agents`, etc.) instructions by default.

## 🚀 Quick Start

### Installation

```bash
npm add -g ai-agent-press@latest
```

### Usage

```bash
# Start a documentation portal (default preview mode)
press

# Preview a specific project or multiple roots
press ../my-project -p 3000
press preview ./repo-a ./repo-b --port 5000

# Build a static documentation site (output to .press/dist)
press build
press build ./repo-a --outDir .press/repo-a

# Headless: List all discovered agents as a hierarchical JSON tree
press list --json

# Filter to one or more ecosystems
press list --claude --json
press preview --gemini --cursor
press list --all --json
```

## 🛠 Commands & Flags

- `press`: Start local documentation server in preview mode.
- `press preview`: Start local documentation server.
- `press build`: Generate static documentation site.
- `press list`: List agent files in a hierarchical structure (Headless mode).
- `press validate`: Validate ecosystem structures and content.
- `press doctor`: Diagnostics and environment checks.

### Global Options

- `--global`: Include only global configurations from `~/.agents`, `~/.claude`, etc.
- `--repo`: Include only configurations from the current repository.
- `-p, --port <port>`: Choose the preview server port.
- `--json`: Format output as JSON (for `list`).
- `--openai`, `--claude`, `--gemini`, `--cursor`, `--codex`, `--cline`, `--roo`, `--openclaw`: Filter ecosystems.
- `--all`: Include all ecosystems and categories (Skills, Rules, Workflows).
- `-h, --help`: Display help information.

## 🖥 Architecture & Display

### Hierarchical Sidebar & URLs

The portal and headless output follow a strict hierarchy:

1.  **Scope**: `Global` or `Current Repo` (omitted if only one exists).
2.  **Ecosystem**: `gemini`, `claude`, etc. (omitted if only one exists).
3.  **Category**: `instructions`, `agents`, `skills`, or `resources`.
4.  **Name**: The slugified filename.

**URL Example**: `/global/gemini/skills/github-pr`

### Smart Flattening

To keep navigation clean, **ai-agent-press** automatically flattens layers:

- If only local repo files are found, the top-level "Current Repo" section is hidden.
- If only one ecosystem is active (e.g., via `--gemini`), the ecosystem layer is omitted.

### Ecosystem Discovery

- **OpenAI**: `OPENAI.md`, `.openai/`
- **Agent**: `AGENTS.md`, `.agents/`
- **Codex**: `CODEX.md`, `.codex/`
- **Claude**: `CLAUDE.md`, `.claude/`
- **Gemini**: `GEMINI.md`, `.gemini/`
- **Cursor**: `.cursor/rules/`
- **Cline**: `.cline/`, `.clinerules`
- **Roo**: `.roo/`, `.roomodes`, `.roorules`
- **OpenClaw**: `openclaw.json`, `openclaw.json5`, `.openclaw/`

### Rendering Notes

- `GEMINI.md` is the preferred portal homepage; `AGENTS.md` is the fallback.
- Content is automatically wrapped in `<div v-pre>` to prevent VitePress from parsing agent instructions as Vue components.
- Problematic system files (e.g., `models_cache.json`) are automatically excluded from rendering to ensure build stability.

## 📂 Project Philosophy

**ai-agent-press** aims to unify fragmented AI ecosystems into a single, searchable experience without repo pollution. All temporary files are stored in `node_modules/.ai-agent-press`, keeping your project clean.

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) and [TESTING.md](TESTING.md) for details. **Note**: This project uses `bun` for all development and testing.

## 📄 License

MIT © [AI Agent Press Contributors](LICENSE)
