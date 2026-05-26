# Skill: GitHub Pull Request Management

This skill provides instructions for creating Pull Requests using the GitHub CLI (`gh`).

## Protocol

### 1. Pre-computation

Before initiating a PR, you MUST read the template:

```bash
cat .github/PULL_REQUEST_TEMPLATE.md
```

### 2. Implementation

Ensure your local branch is clean and all tests pass:

```bash
bun run lint && bun run test
```

### 3. PR Creation

Use the `gh` CLI to create the PR. Ensure the title follows Conventional Commits:

```bash
gh pr create \
  --title "feat(scope): description" \
  --body-file .github/PULL_REQUEST_TEMPLATE.md \
  --draft
```

_Note: Use `--draft` first to verify the content before final submission._

### 4. Mandatory Checks

- Verify the `type of change` is correctly checked in the body.
- Ensure the `related issues` section is populated if applicable.
- Confirm all `checklist` items are verified.
