import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { readFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { prepareTemporaryDirectory } from './vitepress'
import type { ContentNode } from '../shared/types'

describe('VitePress renderer', () => {
  const temporaryDirectory = path.join(
    process.cwd(),
    'node_modules',
    '.ai-agent-press',
    'temp',
  )

  beforeEach(async () => {
    await rm(temporaryDirectory, { recursive: true, force: true })
  })

  afterEach(async () => {
    await rm(temporaryDirectory, { recursive: true, force: true })
  })
  it('should use README.md as the index when available', async () => {
    const root = process.cwd().replaceAll('\\', '/')
    await prepareTemporaryDirectory([
      createNode({
        path: `${root}/repo/README.md`,
        title: 'Readme Home',
        content: '# Readme Home',
      }),
      createNode({
        path: `${root}/repo/GEMINI.md`,
        title: 'Gemini',
        content: '# Gemini',
      }),
    ])

    await expect(
      readFile(path.join(temporaryDirectory, 'index.md'), 'utf8'),
    ).resolves.toContain('# Readme Home')
  })

  it('should use AGENTS.md as the index when GEMINI.md is absent', async () => {
    // ...

    const root = process.cwd().replaceAll('\\', '/')
    await prepareTemporaryDirectory([
      createNode({
        path: `${root}/repo/AGENTS.md`,
        title: 'Agents',
        content: '# Agents Index',
      }),
    ])

    await expect(
      readFile(path.join(temporaryDirectory, 'index.md'), 'utf8'),
    ).resolves.toContain('# Agents Index')
  })

  it('should generate unique page files for duplicate basenames', async () => {
    const root = process.cwd().replaceAll('\\', '/')
    await prepareTemporaryDirectory([
      createNode({
        path: `${root}/repo/GEMINI.md`,
        title: 'Home',
        content: '# Home',
      }),
      createNode({
        path: `${root}/repo/.claude/foo.md`,
        title: 'Claude Foo',
        content: '# Claude Foo',
        ecosystem: 'claude',
      }),
      createNode({
        path: `${root}/repo/.openai/foo.md`,
        title: 'OpenAI Foo',
        content: '# OpenAI Foo',
        ecosystem: 'openai',
      }),
    ])

    await expect(
      readFile(
        path.join(temporaryDirectory, 'repo/claude/agents/foo.md'),
        'utf8',
      ),
    ).resolves.toContain('# Claude Foo')
    await expect(
      readFile(
        path.join(temporaryDirectory, 'repo/openai/agents/foo.md'),
        'utf8',
      ),
    ).resolves.toContain('# OpenAI Foo')
  })

  it('should generate VitePress config with recommended settings', async () => {
    const root = process.cwd().replaceAll('\\', '/')
    await prepareTemporaryDirectory([
      createNode({
        path: `${root}/repo/GEMINI.md`,
        title: 'Home',
        content: '# Home',
      }),
    ])

    const config = await readFile(
      path.join(temporaryDirectory, '.vitepress', 'config.ts'),
      'utf8',
    )
    expect(config).toContain('defineConfig')
    expect(config).toContain('"provider": "local"') // search
    expect(config).toContain('"outline"') // outline
    expect(config).toContain('"footer"') // footer
    expect(config).toContain('"lastUpdated": true') // lastUpdated
    expect(config).toContain('"cleanUrls": true') // cleanUrls
    expect(config).toContain('"lineNumbers": true') // markdown line numbers
  })

  it('should include agents, skills, and rules in current mode (default)', async () => {
    const root = process.cwd().replaceAll('\\', '/')
    await prepareTemporaryDirectory(
      [
        createNode({
          path: `${root}/repo/agent.md`,
          type: 'agent',
          title: 'Agent',
        }),
        createNode({
          path: `${root}/repo/skill.md`,
          type: 'skill',
          title: 'Skill',
        }),
        createNode({
          path: `${root}/repo/workflow.json`,
          type: 'workflow',
          title: 'Workflow',
        }),
      ],
      { isAllMode: false },
    )

    const config = await readFile(
      path.join(temporaryDirectory, '.vitepress', 'config.ts'),
      'utf8',
    )
    expect(config).toContain('Agent')
    expect(config).toContain('Skill')
    expect(config).not.toContain('Workflow')
  })

  it('should include instruction nodes (AGENTS.md/GEMINI.md) in the sidebar', async () => {
    const root = process.cwd().replaceAll('\\', '/')
    await prepareTemporaryDirectory(
      [
        createNode({
          path: `${root}/repo/GEMINI.md`,
          type: 'instruction',
          title: 'Gemini Instructions',
        }),
        createNode({
          path: `${root}/repo/AGENTS.md`,
          type: 'instruction',
          title: 'Agent Instructions',
          ecosystem: 'agent',
        }),
        createNode({
          path: `${root}/repo/CODEX.md`,
          type: 'instruction',
          title: 'Codex Instructions',
          ecosystem: 'codex',
        }),
      ],
      { isAllMode: false },
    )

    const config = await readFile(
      path.join(temporaryDirectory, '.vitepress', 'config.ts'),
      'utf8',
    )
    expect(config).toContain('Gemini Instructions')
    expect(config).toContain('Agent Instructions')
    expect(config).toContain('Codex Instructions')
  })
})

function createNode(overrides: Partial<ContentNode>): ContentNode {
  const root = process.cwd().replaceAll('\\', '/')
  const defaultPath = `${root}/repo/GEMINI.md`
  return {
    id: overrides.path ?? defaultPath,
    ecosystem: 'gemini',
    type: 'agent',
    scope: 'repo',
    title: 'Test',
    path: overrides.path ?? defaultPath,
    content: '# Test',
    ...overrides,
  }
}
