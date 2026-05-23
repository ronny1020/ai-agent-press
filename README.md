# ai-agent-press 🚀

**ai-agent-press** is a zero-config, **high-performance** CLI tool that transforms AI agent configuration files into searchable documentation portals and structured content graphs.

Turn your AI-agent instruction files and skill directories into a unified developer portal or a hierarchical JSON stream in seconds. Built for the modern JavaScript ecosystem, it runs anywhere **Node.js 20+** or **Bun** is available.

## ✨ Features

- **Instruction & Skill Focus**: Strictly organized into Instructions and Skills.
- **Nested Skills**: Supports hierarchical organization for skills, while keeping instructions flat.
- **Global-first**: Loads local repo, global home, and external `~/projects/skills` automatically.
- **Cross-runtime**: Fully compatible with Node.js 20+ and Bun.

## 🚀 Quick Start

### Installation

```bash
# Using Bun (Recommended)
bun install -g ai-agent-press

# Using NPM
npm install -g ai-agent-press
```

### Usage

```bash
# Start a documentation portal on port 5173
press -p 5173

# Preview a specific project
press ./my-project -p 3000

# Headless: List all discovered agents as a hierarchical JSON tree
press list --json
```

## 🏗 Architecture

### Multi-tiered Scanning

**ai-agent-press** employs a robust discovery strategy:

1.  **Current Repository**: Scans for agent-specific files and the `.agents/` directory.
2.  **Global Home**: Scans `~/.agents/` and other agent hidden folders.
3.  **External Skills**: Automatically includes `~/projects/skills` for cross-project agent capabilities.
4.  **Internal Agents**: Includes the tool's own built-in instructions.

### Hierarchy & Navigation

The portal follows a strict hierarchy:

1.  **Scope**: `Global` or `Current Repo`.
2.  **Agent**: `gemini`, `claude`, etc.
3.  **Category**: `instructions` or `skills`.
4.  **Name**: The slugified filename.

**Nested Loading**: Skills support nested folders for better organization. Instructions are always flattened at the root of their category.

## 🛠 Commands & Flags

- `press`: Start local documentation server (default port 5173).
- `press preview -p <port>`: Start local documentation server on a specific port.
- `press build`: Generate static documentation site.
- `press list`: List agent files in a hierarchical structure.

### Global Options

- `-p, --port <port>`: Port to run the server on (default: 5173).
- `--global`: Include only global configurations.
- `--repo`: Include only repository configurations.
- `-a, --agent <name>`: Filter by agent.
- `--json`: Format output as JSON.
- `-h, --help`: Display help information.

## 🖥 Architecture & Display

### Hierarchical Sidebar & URLs

The portal and headless output follow a strict hierarchy:

1.  **Scope**: `Global` or `Current Repo` (omitted if only one exists).
2.  **Agent**: `gemini`, `claude`, etc. (omitted if only one exists).
3.  **Category**: `instructions` or `skills`.
4.  **Name**: The slugified filename.

**URL Example**: `/global/gemini/skills/github-pr`

### Smart Flattening

To keep navigation clean, **ai-agent-press** automatically flattens layers:

- If only local repo files are found, the top-level "Current Repo" section is hidden.
- If only one agent is active (e.g., via `-a gemini`), the agent layer is omitted.

### Agent Discovery

- **OpenAI**: `OPENAI.md`, `.openai/`
- **Agent**: `AGENTS.md`, `.agents/`
- **Codex**: `CODEX.md`, `.codex/`
- **Claude**: `CLAUDE.md`, `.claude/`
- **Gemini**: `GEMINI.md`, `.gemini/`
- **Antigravity**: `.gemini/antigravity/brain/`
- **Cursor**: `.cursor/rules/`
- **Cline**: `.cline/`, `.clinerules`
- **Roo**: `.roo/`, `.roomodes`, `.roorules`
- **Aider**: `.aider.conf.yml`, `.aider.chat.history.md`
- **OpenClaw**: `openclaw.json`, `openclaw.json5`, `.openclaw/`

### Rendering Notes

- `GEMINI.md` is the preferred portal homepage; `AGENTS.md` is the fallback.
- Content is automatically wrapped in `<div v-pre>` to prevent VitePress from parsing agent instructions as Vue components.
- Problematic system files (e.g., `models_cache.json`) are automatically excluded from rendering to ensure build stability.

## 📂 Project Philosophy

**ai-agent-press** aims to unify fragmented AI agent environments into a single, searchable experience without repo pollution. All temporary files are stored in the user's home cache directory, keeping your project clean.

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) and [TESTING.md](TESTING.md) for details. **Note**: This project uses `bun` for all development and testing.

## 📄 License

MIT © [AI Agent Press Contributors](LICENSE)
