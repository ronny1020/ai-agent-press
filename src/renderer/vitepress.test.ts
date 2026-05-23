import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { prepareTemporaryDirectory, getBaseTemporaryDirectory } from './vitepress'
import type { ContentNode } from '../shared/types'

process.env.AI_AGENT_PRESS_CACHE_DIR = path.join(
  tmpdir(),
  'ai-agent-press-vitepress-tests',
)

describe('VitePress renderer', () => {
  const temporaryDirectory = path.join(getBaseTemporaryDirectory(), 'temp')

  beforeEach(async () => {
    await rm(temporaryDirectory, { recursive: true, force: true })
  })

  afterEach(async () => {
    await rm(temporaryDirectory, { recursive: true, force: true })
  })

  it('should use AGENTS.md as the index when GEMINI.md is absent', async () => {
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
        agent: 'claude',
      }),
      createNode({
        path: `${root}/repo/.openai/foo.md`,
        title: 'OpenAI Foo',
        content: '# OpenAI Foo',
        agent: 'openai',
      }),
    ])

    await expect(
      readFile(
        path.join(temporaryDirectory, 'repo/claude/instructions/foo.md'),
        'utf8',
      ),
    ).resolves.toContain('# Claude Foo')
    await expect(
      readFile(
        path.join(temporaryDirectory, 'repo/openai/instructions/foo.md'),
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
      path.join(temporaryDirectory, '.vitepress', 'config.js'),
      'utf8',
    )
    expect(config).toContain('export default')
    expect(config).toContain('"provider": "local"') // search
    expect(config).toContain('"outline"') // outline
    expect(config).toContain('"footer"') // footer
    expect(config).toContain('"lastUpdated": true') // lastUpdated
    expect(config).toContain('"cleanUrls": true') // cleanUrls
    expect(config).toContain('"lineNumbers": true') // markdown line numbers
  })

  it('should include instructions and skills in current mode (default)', async () => {
    const root = process.cwd().replaceAll('\\', '/')
    await prepareTemporaryDirectory(
      [
        createNode({
          path: `${root}/repo/agent.md`,
          type: 'instruction',
          title: 'Instruction',
        }),
        createNode({
          path: `${root}/repo/skill.md`,
          type: 'skill',
          title: 'Skill',
        }),
      ],
      { isAllMode: false },
    )

    const config = await readFile(
      path.join(temporaryDirectory, '.vitepress', 'config.js'),
      'utf8',
    )
    expect(config).toContain('Instruction')
    expect(config).toContain('Skill')
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
          agent: 'agent',
        }),
        createNode({
          path: `${root}/repo/CODEX.md`,
          type: 'instruction',
          title: 'Codex Instructions',
          agent: 'codex',
        }),
      ],
      { isAllMode: false },
    )

    const config = await readFile(
      path.join(temporaryDirectory, '.vitepress', 'config.js'),
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
    agent: 'gemini',
    type: 'instruction',
    scope: 'repo',
    title: 'Test',
    path: overrides.path ?? defaultPath,
    content: '# Test',
    ...overrides,
  }
}
