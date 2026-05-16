# Contributing to ai-agent-press

First off, thanks for taking the time to contribute! 🎉

## Development Setup

This project uses [Bun](https://bun.sh/).

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/ai-agent-press.git
    cd ai-agent-press
    ```

2.  **Install dependencies**:
    ```bash
    bun install
    ```

3.  **Start preview mode**:
    This will scan your local files and start a hot-reloading documentation portal:
    ```bash
    bun run press
    ```

4.  **Other commands**:
    ```bash
    bun run press build    # Build static site
    bun run stub           # Prepare build stubs for unbuild
    ```

5.  **Run the built binary**:
    After running `bun run build`, you can use the generated entry point:
    ```bash
    bun ./dist/index.mjs build
    ```

## Running with Props

Pass CLI props after the `press` script name:

```bash
bun run press --help
bun run press -- --help
bun run press -- --all
bun run press -- --gemini --cursor
bun run press -- ../other-repo
bun run press preview -- --all
bun run press build -- ./docs-repo --outDir .press/docs-repo
bun run press list -- --openclaw --json
```

Common props:
- `--all`: Include all ecosystems explicitly.
- `--global`: Include global agent configuration directories.
- `-p, --port <port>`: Choose the preview server port for `press` or `preview`.
- `--json`: Format output as JSON (for `list` and `validate`).
- `--openai`, `--claude`, `--gemini`, `--cursor`, `--codex`, `--cline`, `--roo`, `--aider`, `--openclaw`: Filter to matching ecosystems. Flags can be combined.
- `[paths...]`: Scan one or more project roots instead of the current working directory.
- `--outDir <dir>`: Choose the static build output directory for `build`.


Playwright e2e tests can pass preview props through `PRESS_ARGS`:

```bash
bun run test:e2e
PRESS_ARGS=--all bun run test:e2e
PRESS_ARGS="--gemini --cursor" bun run test:e2e
```

## Testing

Testing is a critical part of this project. Please refer to the [TESTING.md](TESTING.md) file for detailed instructions on:
- How to run tests.
- How to write new tests.
- Our testing philosophy and tools.

Validate your changes by running `bun run test` before submitting a PR.

## Development Workflow

1.  **Create a branch**: `git checkout -b feature/my-new-feature`
2.  **Make your changes**: Write clean, idiomatic TypeScript.
3.  **Add tests**: Ensure your changes are verified with Vitest.
4.  **Validate**: Run `bun run lint` and `bun run test` before committing.
5.  **Commit**: Use **Conventional Commits** (`feat(scope): description`). Husky will automatically run lint and tests on pre-commit.
6.  **Push**: `git push origin feature/my-new-feature`
7.  **Submit a Pull Request**: Before creating a PR, please read `.github/PULL_REQUEST_TEMPLATE.md`.

## 🤖 AI Agent Protocols

If you are an AI agent contributing to this repository:
- You **MUST** adhere to the mandates defined in [GEMINI.md](GEMINI.md).
- You **MUST** read the Pull Request template before proposing or implementing PR-related tasks.
- Ensure all commits strictly follow the `feat(xxx):` or `fix(xxx):` format.

## Architecture Overview

- `src/cli/`: Command-line interface definitions using `cac`.
- `src/core/`: Core logic for ecosystem detection and content normalization.
- `src/adapters/`: Handlers for different AI ecosystem file formats.
- `src/renderer/`: Logic to transform the content graph into a VitePress site.
- `src/vitepress/`: Shared VitePress configuration and virtual site structure.

## Style Guide

- Use semicolon-less, single-quote Prettier style (enforced by `.prettierrc`).
- Follow the provided `ContentNode` interface for all normalized data.
- Ensure all new features are covered by tests in `src/**/*.test.ts`.
