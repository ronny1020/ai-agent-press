# Gemini CLI Project Rules

These instructions are foundational mandates for any AI agent operating in this repository.

## Architecture Mandates

- **Runtime**: MUST use `bun` for all commands, scripts, and testing (`bun test`).
- **Category Focus**: ONLY `Instructions` and `Skills` categories are supported. All other discovered content MUST be mapped to one of these two.
- **Nested Loading**:
  - **Skills**: MUST support nested directory structures in the sidebar.
  - **Instructions**: MUST NOT support nesting; all instruction files MUST be flattened at the root of the "Instructions" category.
- **External Skills**: Set `PRESS_EXTRA_SKILLS_PATH=~/projects/skills` to include an extra skills directory in the global scope (opt-in via env var, tilde-expanded).
- **Port**: The `-p` flag is optional (default 5173).
- **Sidebar Structure**: The sidebar MUST separate content into "Global" and "Current Repo" top-level sections IF both exist.
  - **Scope Flattening**: If only one scope is active, the top-level scope layer MUST be omitted.
  - **Agent Flattening**: If only one agent is active, the agent layer MUST be omitted.
- **Hierarchy**: Sections -> Agents -> Categories (Instructions, Skills).
- **URL Pattern**: URLs MUST follow a hierarchical structure: `/{scope}/{agent}/{category}/{name}`.
- **Global Loading**: Global and Repo instructions MUST be loaded simultaneously by default.
- **Self-Documentation**: This `GEMINI.md` file MUST be auto-updated by the agent whenever new or different architectural instructions are received from the user.
