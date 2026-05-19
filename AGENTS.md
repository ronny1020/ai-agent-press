# AI Agent Portal

Welcome to the AI Agent Press portal for this repository.

## Agents Summary

- **Primary Agent**: Gemini CLI (System Orchestrator)
- **Specialized Skills**:
  - `skill-creator`: For extending CLI capabilities.
  - `codebase_investigator`: For deep architectural analysis.
  - `github-pr`: For automated, template-compliant PR creation using `gh`.

## Ecosystems Detected

- [x] Google Gemini
- [x] Anthropic Claude
- [x] Cursor Rules
- [x] Custom `.agents/` and `AGENTS.md` (Agent)
- [x] Custom `.codex/` and `CODEX.md` (Codex)
- [x] OpenAI, Claude, Gemini, Cursor, Cline, Roo, and OpenClaw filter flags

## Ecosystem Discovery

- **OpenAI**: `OPENAI.md`, `.openai/`
- **Agent**: `AGENTS.md`, `.agents/`
- **Codex**: `CODEX.md`, `.codex/`
- **Claude**: `CLAUDE.md`, `.claude/`
- **Gemini**: `GEMINI.md`, `.gemini/`
- **Cursor**: `.cursor/rules/`
- **Cline**: `.cline/`, `.clinerules`
- **Roo**: `.roo/`, `.roomodes`, `.roorules`
- **OpenClaw**: `openclaw.json`, `openclaw.json5`, `.openclaw/`

## Current CLI Behavior

- `press` starts preview mode by default.
- `press preview [paths...]` starts the local documentation server for the current working directory or the provided paths.
- `press build [paths...]` generates a static VitePress site and supports `--outDir`.
- `press list` (Headless mode) emits a hierarchical JSON structure identical to the portal sidebar.
- `press list --json` emits the normalized content graph, including parsed `metadata.ecosystemConfig` settings objects.
- `press list --all --json` explicitly includes all supported ecosystems and scope/ecosystem layers.
- **Scope Filtering**:
  - `press --global`: Shows only global configurations.
  - `press --repo`: Shows only repository configurations.
  - `press` (no flags): Shows both.
- Ecosystem flags such as `--gemini`, `--claude`, `--cursor`, and `--openclaw` filter scan results and can be combined with scope flags.
- **Hierarchical Sidebar**: Content is organized as Sections (Global/Repo) -> Ecosystems -> Categories (Instructions, Agents, Skills, Resources).
- **Flattening Logic**:
  - The "Global/Repo" layer is omitted if only one scope is active.
  - The "Ecosystem" layer is omitted if only one ecosystem is active.
- **Hierarchical URLs**: Pages follow the `/{scope}/{ecosystem}/{category}/{name}` pattern.
- `GEMINI.md` is the preferred portal homepage; `AGENTS.md` is used as the fallback homepage when `GEMINI.md` is absent.
- Preview/build output includes per-ecosystem review pages that group discovered files and parsed settings.

## Development Standards

### Configuration Files

- **Standalone Configs**: Prefer standalone configuration files (e.g., `.eslintrc.json`, `.lintstagedrc.json`, `tsconfig.json`) instead of embedding configurations inside `package.json`. This keeps the project structure clean and manageable.

### Commit Style

- **Conventional Commits**: All contributions must use the `feat(xxx):`, `fix(xxx):` etc. format.

### AI Agent Protocols

- **Source Control**: DO NOT stage or commit changes unless explicitly requested by the user.
- **Git Tags**: DO NOT create, push, or maintain git tags. This is strictly prohibited.
- **PR Readiness**: Agents must read `.github/PULL_REQUEST_TEMPLATE.md` before initiating PR tasks.
- **Rules**: Refer to `GEMINI.md` for internal agent mandates.
