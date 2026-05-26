# AI Agent Portal

Welcome to the AI Agent Press portal.

## Agents Summary

- **Content Focus**:
  - **Instructions**: Core behavioral mandates and system prompts.
  - **Skills**: Specialized capabilities and automated workflows.

## Architecture Mandates

These are foundational mandates for any AI agent operating in this repository.

- **Runtime**: MUST use `bun` for all commands, scripts, and testing (`bun test`).
- **Category Focus**: ONLY `Instructions` and `Skills` categories are supported. All other discovered content MUST be mapped to one of these two.
- **Nested Loading**:
  - **Skills**: MUST support nested directory structures in the sidebar.
  - **Instructions**: MUST NOT support nesting; all instruction files MUST be flattened at the root of the "Instructions" category.
- **External Skills**: The scanner MUST automatically include `~/projects/skills` (resolved via homedir) in the global scope.
- **Global Claude Skills**: `~/.claude/skills/**` MUST be scanned and included in the global scope under the `claude` agent.
- **Port**: The `-p` flag is optional (default 5173).
- **Sidebar Structure**: The sidebar MUST separate content into "Global" and "Current Repo" top-level sections IF both exist.
  - **Scope Flattening**: If only one scope is active, the top-level scope layer MUST be omitted.
  - **Agent Flattening**: If only one agent is active, the agent layer MUST be omitted.
- **Hierarchy**: Sections -> Agents -> Categories (Instructions, Skills).
- **URL Pattern**: URLs MUST follow a hierarchical structure: `/{scope}/{agent}/{category}/{name}`.
- **Global Loading**: Global and Repo instructions MUST be loaded simultaneously by default.
- **Self-Documentation**: `AGENTS.md` MUST be auto-updated by the agent whenever new or different architectural instructions are received from the user.

### Content Filtering Mandates

- **Binary files excluded**: Image extensions (PNG, JPG, JPEG, GIF, WEBP) MUST NOT be included in `ASSET_EXTENSIONS`. Only text and markup formats (md, mdc, ts, js, py, sh, txt, svg) are valid scan targets.
- **Hidden directories filtered**: Path segments starting with `.` (e.g., `.system`) MUST be stripped from sidebar labels and URL slugs in `getRelativeParts`. The file content is still rendered; only the dot-prefixed folder name is hidden from navigation.
- **Empty sidebar groups pruned**: After building the sidebar hierarchy, `pruneEmptySidebarGroups` MUST remove any group that has no `link` and zero children. This prevents phantom navigation entries.
- **Language warnings suppressed**: The VitePress config MUST be generated as a JS file (not JSON) and MUST include a `shikiSetup` hook that patches `console.warn` to suppress "is not loaded" language warnings. This prevents noisy build output without altering content.
- **Graceful render failures**: Pages that fail to render (Vue template compilation errors from complex markdown) MUST be skipped gracefully — tests and the build pipeline MUST NOT crash on them.

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
- `AGENTS.md` is the portal homepage.
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
