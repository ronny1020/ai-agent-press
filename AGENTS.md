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
- [x] Custom `.agents/` definitions
- [x] OpenAI, Codex, Cline, Roo, and OpenClaw filter flags

## Ecosystem Discovery

- **OpenAI**: `OPENAI.md`, `.openai/`
- **Codex**: `AGENTS.md`, `.codex/`
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
- `press list --json` emits the normalized content graph, including parsed `metadata.ecosystemConfig` settings objects.
- `press list --all --json` explicitly includes all supported ecosystems.
- Ecosystem flags such as `--gemini`, `--claude`, `--cursor`, and `--openclaw` filter scan results and can be combined.
- `GEMINI.md` is the preferred portal homepage; `AGENTS.md` is used as the fallback homepage when `GEMINI.md` is absent.
- Preview/build output includes per-ecosystem review pages that group discovered files and parsed settings.

## Development Standards

### Commit Style
- **Conventional Commits**: All contributions must use the `feat(xxx):`, `fix(xxx):` etc. format.

### AI Agent Protocols
- **Source Control**: DO NOT stage or commit changes unless explicitly requested by the user.
- **PR Readiness**: Agents must read `.github/PULL_REQUEST_TEMPLATE.md` before initiating PR tasks.
- **Rules**: Refer to `GEMINI.md` for internal agent mandates.
