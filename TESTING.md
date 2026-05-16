# Testing Guide

This document outlines the testing strategy and procedures for `ai-agent-press`.

## 🧪 Test Suite

We use [Vitest](https://vitest.dev/) for our testing framework. It is fast, compatible with Vite, and provides a great developer experience.

### Running Tests

- **Run all tests**:
  ```bash
  bun run test
  ```
- **Run type check**:
  ```bash
  bun run type-check
  ```
- **Run E2E tests (Playwright)**:
  ```bash
  bun run test:e2e
  ```
- **Run tests in watch mode**:
  ```bash
  bun test --watch
  ```
- **Generate coverage report**:
  ```bash
  bun test --coverage
  ```

## 📂 Test Organization

Tests are co-located with the source code they test, using the `.test.ts` extension.

```text
src/
├─ core/
│  ├─ scanner.ts
│  └─ scanner.test.ts  # Tests for scanner.ts
```

## 📝 Writing Tests

### Unit Tests
Unit tests should focus on individual functions or classes. Mock external dependencies (like the filesystem) whenever possible to keep tests fast and deterministic.

```typescript
import { describe, it, expect, vi } from 'vitest'
import { myFunction } from './myFunction'

describe('myFunction', () => {
  it('should return expected result', () => {
    expect(myFunction('input')).toBe('output')
  })
})
```

### Integration Tests
Integration tests for the CLI and ecosystem adapters should verify that multiple components work together. For these, we often use temporary directories to simulate real repository structures.

## 🛠 Mocking & Utilities

Since `ai-agent-press` interacts heavily with the filesystem:
- Use `memfs` or temporary directories for filesystem-dependent tests.
- Mock `fast-glob` results when testing scanner logic.

## ✅ Pre-commit Hooks

We use [Husky](https://typicode.github.io/husky/) to run tests automatically before every commit. If your tests fail, the commit will be blocked. This ensures the `master` branch remains stable.

## 🔍 Continuous Integration

All Pull Requests are automatically tested via GitHub Actions. Ensure your local tests pass before pushing your code.
