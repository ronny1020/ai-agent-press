# Copilot instructions for ai-agent-press

Purpose

- Provide concise, repo-specific guidance to Copilot/Copilot sessions about build/test/lint commands, high-level architecture, and key conventions.

1. Build / test / lint (commands)

- Install deps: bun install
- Build (bundle + types): bun run build
- Run CLI locally (preview): bun run press
- Build static site: bun run press:build (or bun run press build)
- Lint: bun run lint
- Auto-fix lint: bun run lint:fix
- Type-check: bun run type-check
- Format: bun run format
- Unit tests (Vitest): bun run test
  - Run a single unit test file: bun test src/path/to/your.file.test.ts
  - Watch mode: bun test --watch
  - Coverage: bun test --coverage
- E2E tests (Playwright): bun run test:e2e
  - Playwright webserver is started by playwright.config.ts using: bun run src/cli/index.ts preview ${PRESS_ARGS}
  - To pass preview flags to e2e runs, set PRESS_ARGS, e.g.:
    PRESS_ARGS=--all bun run test:e2e
- Full validation (lint + typecheck + tests + e2e): bun run test:all

2. High-level architecture (big picture)

- CLI entry: src/cli/ (cac-based) — exposes `press`, `preview`, `build`, `list`, `validate`, `doctor`.
- Discovery & normalization core: src/core/ — scans repo and global locations, normalizes diverse agent files into a content graph.
- Renderer / VitePress integration: src/renderer/ and src/vitepress/ — turn the normalized content graph into a transient VitePress site (config.js is generated at runtime).
- Packaging: Bundled with Bun (`bun build`) to dist/index.js (ESM). Type declarations emitted via tsc.
- Runtime & discovery order: repo → user-global (~/.agents, agent folders) → global node_modules → built-in/internal agents.
- Sidebar & URLs: hierarchical by Scope → Agent → Category → Name. Smart flattening hides layers when there is only one scope or agent.

3. Key conventions (repo-specific)

- Runtime: Bun is the authoritative runtime for development and CI (scripts and docs assume bun).
- Commit format: Conventional Commits required (feat(scope): description).
- AI agent protocol: automated agents and Copilot sessions must read GEMINI.md and follow its mandates; do NOT stage/commit changes unless explicitly requested.
- CLI flags: use -a / --agent to filter (e.g., -a gemini,claude); PRESS_ARGS is used to forward preview flags for Playwright e2e runs.
- Tests: unit tests use _.test.ts (Vitest); e2e use _.e2e.ts (Playwright). Tests are colocated with source files.
- Homepage selection for portal: GEMINI.md is preferred; AGENTS.md used as fallback.
- Transient files: builds and preview outputs are transient (.press, user cache, dist for release). Avoid checking transient build caches into the repo.
- Lint & format: ESLint (src/\*_/_.ts) and Prettier are enforced; husky + lint-staged run pre-commit hooks.
- Type system: ESM + TypeScript; tsc is used only for type-checking and declaration emission.

4. Where to find more details

- README.md, CONTRIBUTING.md, TESTING.md, AGENTS.md, and GEMINI.md contain extended guidance (discovery rules, architecture mandates, testing setup).

5. Quick tips for Copilot sessions

- Prefer Bun when running scripts and reproducing CI locally.
- When asked to change code, do not commit or push unless explicitly told to.
- For e2e work, respect PRESS_ARGS and reuse playwright.config.ts webServer settings.

---

If you want this file adjusted (more/less detail, add example workflows, or include other AI assistant configs such as CLAUDE.md / .cursor rules), say which areas to expand.
