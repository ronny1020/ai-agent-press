# AI Agent Portal

Welcome to the AI Agent Press portal.

## Agents Summary

- **Primary Agent**: Gemini CLI (System Orchestrator)
- **Content Focus**:
  - **Instructions**: Core behavioral mandates and system prompts.
  - **Skills**: Specialized capabilities and automated workflows.

## Content Organization

- **Nested Skills**: Skills are organized hierarchically to support complex capability sets.
- **Flat Instructions**: Instructions are prioritized and kept at the root of their category for immediate access.

## Architecture Mandates

- **Runtime**: Use `bun` for development and testing (`bun test`).
- **Global Scanning**:
  - Automatically include `~/projects/skills` in the global scope.
- **Hierarchy**: Sections -> Agents -> Categories (Instructions, Skills).
- **Nested Loading**: ONLY Skills support nested directory structures in the sidebar.
- **Port**: The `-p` flag is optional (defaults to 5173).

## Current CLI Behavior

- `press` starts preview mode by default.
- `press preview [paths...]` starts the local documentation server for the current working directory or the provided paths.
- `press build [paths...]` generates a static VitePress site and supports `--outDir`.
- `press list` (Headless mode) emits a hierarchical JSON structure identical to the portal sidebar.
- `press list --json` emits the normalized content graph, including parsed `metadata.agentConfig` settings objects.
- `press list --all --json` explicitly includes all supported agents and scope/agent layers.
- **Scope Filtering**:
  - `press --global`: Shows only global configurations.
  - `press --repo`: Shows only repository configurations.
  - `press` (no flags): Shows both.
- `-a, --agent <name>` filters scan results and can be combined with scope flags.
- **Hierarchical Sidebar**: Content is organized as Sections (Global/Repo) -> Agents -> Categories (Instructions, Skills).
- **Flattening Logic**:
  - The "Global/Repo" layer is omitted if only one scope is active.
  - The "Agent" layer is omitted if only one agent is active.
- **Hierarchical URLs**: Pages follow the `/{scope}/{agent}/{category}/{name}` pattern.
- `GEMINI.md` is the preferred portal homepage; `AGENTS.md` is used as the fallback homepage when `GEMINI.md` is absent.
- Preview/build output includes per-agent review pages that group discovered files and parsed settings.

## Development Standards

### Tooling & Ignore Rules

- **Linting**: `bun run lint` (using ESLint with `ignores` for `dist` and `.press`).
- **Formatting**: `bunx prettier --write .`.
- **Testing**: `bun run test:all` (includes unit and Playwright e2e tests).
- **Versioning**: Increment beta versions in `package.json`.
- **Ignore Files**: Ensure `.gitignore`, `.prettierignore`, and tool-specific `ignores` cover all build artifacts (`dist/`, `.press/`, etc.).

### Configuration Files

- **Standalone Configs**: Prefer standalone configuration files (e.g., `.eslintrc.json`, `.lintstagedrc.json`, `tsconfig.json`) instead of embedding configurations inside `package.json`. This keeps the project structure clean and manageable.

### Commit Style

- **Conventional Commits**: All contributions must use the `feat(xxx):`, `fix(xxx):` etc. format.

### AI Agent Protocols

- **Source Control**: DO NOT stage or commit changes unless explicitly requested by the user.
- **Git Tags**: DO NOT create, push, or maintain git tags. This is strictly prohibited.
- **PR Readiness**: Agents must read `.github/PULL_REQUEST_TEMPLATE.md` before initiating PR tasks.
- **Rules**: Refer to `GEMINI.md` for internal agent mandates.
