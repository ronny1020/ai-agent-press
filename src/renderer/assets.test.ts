import { describe, it, expect, afterEach } from 'bun:test'
import path from 'node:path'
import { readFile, rm } from 'node:fs/promises'
import { prepareTemporaryDirectory } from './vitepress'
import type { ContentNode } from '../shared/types'

describe('Universal Asset Support', () => {
  const root = process.cwd().replaceAll('\\', '/')
  let temporaryDirectory: string

  const createNode = (overrides: Partial<ContentNode>): ContentNode => ({
    id: overrides.path ?? `${root}/repo/test.md`,
    ecosystem: 'gemini',
    type: 'agent',
    scope: 'repo',
    title: 'Test',
    path: overrides.path ?? `${root}/repo/test.md`,
    content: '# Test',
    ...overrides,
  })

  afterEach(async () => {
    if (temporaryDirectory) {
      await rm(temporaryDirectory, { recursive: true, force: true })
    }
  })

  it('should wrap non-markdown files in code blocks', async () => {
    const nodes = [
      createNode({
        path: `${root}/repo/README.md`,
        content: '# Index',
      }),
      createNode({
        path: `${root}/repo/skills/tool.ts`,
        type: 'skill',
        title: 'TypeScript Skill',
        content: 'export const run = () => console.log("hello")',
      }),
      createNode({
        path: `${root}/repo/skills/script.py`,
        type: 'skill',
        title: 'Python Script',
        content: 'print("hello")',
      }),
      createNode({
        path: `${root}/repo/skills/install.sh`,
        type: 'skill',
        title: 'Shell Script',
        content: '#!/bin/bash\necho "hi"',
      }),
    ]

    temporaryDirectory = await prepareTemporaryDirectory(nodes, {
      isAllMode: true,
    })

    const tsContent = await readFile(
      path.join(temporaryDirectory, 'repo/gemini/skills/tool.md'),
      'utf8',
    )
    expect(tsContent).toContain('# TypeScript Skill')
    expect(tsContent).toContain('```ts')
    expect(tsContent).toContain('export const run')

    const pyContent = await readFile(
      path.join(temporaryDirectory, 'repo/gemini/skills/script.md'),
      'utf8',
    )
    expect(pyContent).toContain('# Python Script')
    expect(pyContent).toContain('```py')

    const shContent = await readFile(
      path.join(temporaryDirectory, 'repo/gemini/skills/install.md'),
      'utf8',
    )
    expect(shContent).toContain('# Shell Script')
    expect(shContent).toContain('```sh')
  })

  it('should escape Vue delimiters in all files', async () => {
    const nodes = [
      createNode({
        path: `${root}/repo/vue-content.md`,
        content: 'This is a {{ mustache }} template',
      }),
      createNode({
        path: `${root}/repo/script.ts`,
        type: 'skill',
        content: 'const template = `{{ value }}`',
      }),
    ]

    temporaryDirectory = await prepareTemporaryDirectory(nodes, {
      isAllMode: true,
    })

    const mdContent = await readFile(
      path.join(temporaryDirectory, 'index.md'),
      'utf8',
    )
    expect(mdContent).toContain('&#123;&#123; mustache &#125;&#125;')

    const tsContent = await readFile(
      path.join(temporaryDirectory, 'repo/gemini/skills/script.md'),
      'utf8',
    )
    expect(tsContent).toContain('&#123;&#123; value &#125;&#125;')
  })

  it('should support deeply nested scripts', async () => {
    const nodes = [
      createNode({
        path: `${root}/repo/README.md`,
        content: '# Index',
      }),
      createNode({
        path: `${root}/repo/skills/nested/deep/tool.ts`,
        type: 'skill',
        title: 'Deeply Nested Skill',
        content: 'console.log("deep")',
      }),
    ]

    temporaryDirectory = await prepareTemporaryDirectory(nodes, {
      isAllMode: true,
    })

    const content = await readFile(
      path.join(temporaryDirectory, 'repo/gemini/skills/nested/deep/tool.md'),
      'utf8',
    )
    expect(content).toContain('# Deeply Nested Skill')
    expect(content).toContain('```ts')
    expect(content).toContain('console.log("deep")')

    const config = await readFile(
      path.join(temporaryDirectory, '.vitepress', 'config.js'),
      'utf8',
    )
    expect(config).toContain('"text": "nested"')
    expect(config).toContain('"text": "deep"')
    expect(config).toContain('"text": "Deeply Nested Skill"')
  })

  it('should use v-pre for markdown with potential Vue conflicts', async () => {
    const nodes = [
      createNode({
        path: `${root}/repo/conflict.md`,
        content: '# Conflict\n\nSome <html-tag> and {{ vue_var }}',
      }),
    ]

    temporaryDirectory = await prepareTemporaryDirectory(nodes, {
      isAllMode: true,
    })

    const content = await readFile(
      path.join(temporaryDirectory, 'index.md'),
      'utf8',
    )
    expect(content).toContain('<div v-pre>')
    expect(content).toContain('# Conflict')
  })

  it('should not use v-pre for simple markdown', async () => {
    const nodes = [
      createNode({
        path: `${root}/repo/simple.md`,
        content: '# Simple\n\nJust text.',
      }),
    ]

    temporaryDirectory = await prepareTemporaryDirectory(nodes, {
      isAllMode: true,
    })

    const content = await readFile(
      path.join(temporaryDirectory, 'index.md'),
      'utf8',
    )
    expect(content).not.toContain('<div v-pre>')
  })
})
