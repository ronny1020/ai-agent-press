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
