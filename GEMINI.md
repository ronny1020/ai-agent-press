# Gemini CLI Project Rules

These instructions are foundational mandates for any AI agent operating in this repository.

## Commit Message Convention

- All commits MUST follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.
- Format: `<type>(<scope>): <description>`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- Example: `feat(cli): add ecosystem filtering flags`

## Pull Request Protocol

- BEFORE creating a Pull Request or proposing its content, you MUST read `.github/PULL_REQUEST_TEMPLATE.md`.
- Ensure the PR description matches the template structure.
- Verify that all items in the "Checklist" are addressed in your plan.

## Documentation

- Always update [AGENTS.md](./AGENTS.md) when new ecosystems, adapters, or core features are added.
- Maintain `TESTING.md` if testing procedures change.

## Architecture Mandates

- **Runtime**: MUST use `bun` for all commands, scripts, and testing (`bun test`).
- **Sidebar Structure**: The sidebar MUST separate content into "Global" and "Current Repo" top-level sections IF both exist.
  - **Scope Flattening**: If only one scope is active (e.g., via `--global` or if only one exists), the top-level scope layer MUST be omitted.
  - **Ecosystem Flattening**: If only one ecosystem is active (e.g., via flags like `--gemini` or if only one exists), the ecosystem layer MUST be omitted.
- **Hierarchy**: Sections -> Ecosystems -> Categories (Skills, Instructions, Agents).
- **URL Pattern**: URLs MUST follow a hierarchical structure: `/{scope}/{ecosystem}/{category}/{name}`.
  - Example: `/global/gemini/skills/github-pr`
  - Example: `/repo/claude/instructions/gemini-md`
- **Headless Mode**: The `list` command MUST output the exact same hierarchical structure as the portal sidebar to ensure consistency.
- **Global Loading**: Global and Repo instructions MUST be loaded simultaneously by default.
- **Scope Filtering**:
  - If `--global` is provided without `--repo`, only "Global" content MUST be loaded.
  - If `--repo` is provided without `--global`, only "Current Repo" content MUST be loaded.
  - If both flags are provided, both scopes MUST be loaded.
  - Ecosystem flags (e.g., `--gemini`) MUST work in combination with scope flags.
- **Self-Documentation**: This `GEMINI.md` file MUST be auto-updated by the agent whenever new or different architectural instructions are received from the user.
