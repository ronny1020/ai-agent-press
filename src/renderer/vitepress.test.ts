import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { prepareTempDir } from './vitepress'
import type { ContentNode } from '../shared/types'

describe('VitePress renderer', () => {
  const tempDir = join(process.cwd(), 'node_modules', '.ai-agent-press', 'temp')

  beforeEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  it('should use AGENTS.md as the index when GEMINI.md is absent', async () => {
    await prepareTempDir([
      createNode({
        path: '/repo/AGENTS.md',
        title: 'Agents',
        content: '# Agents Index',
      }),
    ])

    await expect(readFile(join(tempDir, 'index.md'), 'utf-8')).resolves.toBe('# Agents Index')
  })

  it('should generate unique page files for duplicate basenames', async () => {
    await prepareTempDir([
      createNode({
        path: '/repo/GEMINI.md',
        title: 'Home',
        content: '# Home',
      }),
      createNode({
        path: '/repo/.claude/foo.md',
        title: 'Claude Foo',
        content: '# Claude Foo',
        ecosystem: 'claude',
      }),
      createNode({
        path: '/repo/.openai/foo.md',
        title: 'OpenAI Foo',
        content: '# OpenAI Foo',
        ecosystem: 'openai',
      }),
    ])

    await expect(readFile(join(tempDir, 'claude-agent-foo.md'), 'utf-8')).resolves.toBe('# Claude Foo')
    await expect(readFile(join(tempDir, 'openai-agent-foo.md'), 'utf-8')).resolves.toBe('# OpenAI Foo')
  })

  it('should generate VitePress config with recommended settings', async () => {
    await prepareTempDir([
      createNode({
        path: '/repo/GEMINI.md',
        title: 'Home',
        content: '# Home',
      }),
    ])

    const config = await readFile(join(tempDir, '.vitepress', 'config.ts'), 'utf-8')
    expect(config).toContain('defineConfig')
    expect(config).toContain('"provider": "local"')       // search
    expect(config).toContain('"outline"')                  // outline
    expect(config).toContain('"footer"')                   // footer
    expect(config).toContain('"lastUpdated": true')        // lastUpdated
    expect(config).toContain('"cleanUrls": true')          // cleanUrls
    expect(config).toContain('"lineNumbers": true')        // markdown line numbers
  })

  it('should generate ecosystem review pages with parsed settings', async () => {
    await prepareTempDir([
      createNode({
        path: '/repo/openclaw.json',
        title: 'openclaw',
        content: '{ "agents": { "defaults": { "model": "openai/gpt-5.4" } } }',
        ecosystem: 'openclaw',
        type: 'workflow',
        metadata: {
          ecosystemConfig: {
            id: 'openclaw',
            label: 'OpenClaw',
            source: '/repo/openclaw.json',
            parsed: {
              kind: 'object',
              format: 'json',
              value: {
                agents: {
                  defaults: {
                    model: 'openai/gpt-5.4',
                  },
                },
              },
            },
          },
        },
      }),
    ], { isAllMode: true })

    const content = await readFile(join(tempDir, 'ecosystem-openclaw.md'), 'utf-8')
    expect(content).toContain('# openclaw Settings')
    expect(content).toContain('"model": "openai/gpt-5.4"')
  })

  it('should include agents, skills, and rules in current mode (default)', async () => {
    await prepareTempDir([
      createNode({ path: '/repo/agent.md', type: 'agent', title: 'Agent' }),
      createNode({ path: '/repo/skill.md', type: 'skill', title: 'Skill' }),
      createNode({ path: '/repo/workflow.json', type: 'workflow', title: 'Workflow' }),
    ], { isAllMode: false })

    const config = await readFile(join(tempDir, '.vitepress', 'config.ts'), 'utf-8')
    expect(config).toContain('Agent')
    expect(config).toContain('Skill')
    expect(config).not.toContain('Workflow')
  })
})

function createNode(overrides: Partial<ContentNode>): ContentNode {
  return {
    id: overrides.path ?? '/repo/GEMINI.md',
    ecosystem: 'gemini',
    type: 'agent',
    title: 'Test',
    path: '/repo/GEMINI.md',
    content: '# Test',
    ...overrides,
  }
}
