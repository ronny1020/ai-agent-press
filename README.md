# ai-agent-press 🚀

**ai-agent-press** is a zero-config CLI tool that transforms AI agent ecosystem files into searchable documentation portals and structured content graphs.

Turn your AI-agent instruction files and config directories into a unified developer portal or a headless JSON stream in seconds.

## ✨ Features

- **Filesystem-first**: Scans your repo for AI-agent-related files automatically.
- **Zero-config**: No manual VitePress scaffolding or repo pollution.
- **Ephemeral**: Generates documentation in `node_modules` or global cache.
- **Headless Mode**: List and stream agent configurations as JSON for CI/CD integration.
- **Ecosystem-aware**: Supports OpenAI, Claude, Gemini, Cursor, Codex, Cline, Roo, and OpenClaw.
- **Scoped scans**: Target one or more directories and filter by ecosystem.
- **Settings review**: Parses config files into per-ecosystem settings objects in JSON output and portal review pages.
- **Graph-oriented**: Normalizes all content into a shared internal model.

## 🚀 Quick Start

### Global Installation
```bash
npm install -g ai-agent-press
# or
bun add -g ai-agent-press
```

### Usage
```bash
# Start a hot-reloading documentation portal (default preview mode)
press

# Equivalent named preview command
press preview

# Preview a specific project or multiple roots
press ../my-project -p 3000
press preview ./repo-a ./repo-b --port 5000

# Build a static documentation site (output to .press/dist)
press build
press build ./repo-a --outDir .press/repo-a
bun run press:build

# Headless: List all discovered agents
press list

# Headless: Output agent graph as JSON
press list --json

# Filter to one or more ecosystems
press list --claude --json
press preview --gemini --cursor
press list --openclaw --json
press list --all --json
```

## 🛠 Commands & Flags

- `press`: Start local documentation server in preview mode.
- `press preview`: Start local documentation server.
- `press build`: Generate static documentation site.
- `press list`: List all discovered agent files (Headless mode).
- `press validate`: Validate ecosystem structures and content.
- `press doctor`: Diagnostics and environment checks.

### Global Options
- `--global`: Include global configurations from `~/.agents`, `~/.claude`, etc.
- `-p, --port <port>`: Choose the preview server port for `press` or `preview`.
- `--json`: Format output as JSON (for `list` and `validate`).
- `--openai`, `--claude`, `--gemini`, `--cursor`, `--codex`, `--cline`, `--roo`, `--openclaw`: Include only matching ecosystems. Flags can be combined.
- `--all`: Include all ecosystems explicitly. This is also the default when no ecosystem filter is provided.
- `-h, --help`: Display help information.

## 🖥 Display Modes

- **Current Mode** (Default): Focuses strictly on **Agents**. When scanning the current directory or specific ecosystems, skills and auxiliary resources are hidden for a streamlined experience.
- **All Mode** (`--all`): Includes all discovered nodes (Agents, Skills, Rules, Workflows). The portal reorganizes the sidebar into a hierarchical "Ecosystems" structure.

### Ecosystem Discovery
- **OpenAI**: `OPENAI.md`, `.openai/`
- **Codex**: `AGENTS.md`, `.codex/`
- **Claude**: `CLAUDE.md`, `.claude/`
- **Gemini**: `GEMINI.md`, `.gemini/`
- **Cursor**: `.cursor/rules/`
- **Cline**: `.cline/`, `.clinerules`
- **Roo**: `.roo/`, `.roomodes`, `.roorules`
- **OpenClaw**: `openclaw.json`, `openclaw.json5`, `.openclaw/`

### Rendering Notes
- `GEMINI.md` is used as the portal homepage when present.
- `AGENTS.md` becomes the homepage fallback when `GEMINI.md` is absent.
- Pages with the same filename in different directories are given unique generated routes to avoid collisions.
- The portal includes one ecosystem review page per detected ecosystem, with parsed settings from JSON, YAML, and Markdown frontmatter.
- **Nested Sidebar**: In "All Mode", Skills and Resources are nested under their respective Ecosystems. In "Current Mode", agents are displayed at the top level for quick access.

## 📂 Project Philosophy

**ai-agent-press** aims to unify fragmented AI ecosystems into a single, searchable experience without requiring repository structure changes.

**No Repo Pollution**: All temporary files are stored in `node_modules/.ai-agent-press` or your system's global cache, keeping your project root clean.

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) and [TESTING.md](TESTING.md) for details.

## 📄 License

MIT © [AI Agent Press Contributors](LICENSE)
