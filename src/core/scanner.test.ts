import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test'
import { scan } from './scanner'
import { writeFile, mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { tmpdir } from 'node:os'

import * as os from 'node:os'

mock.module('node:os', () => {
  return {
    ...os,
    homedir: () => path.join(os.tmpdir(), 'mock-home'),
  }
})

describe('Scanner', () => {
  const testDirectory = path.join(tmpdir(), 'ai-agent-press-test')

  beforeEach(async () => {
    await rm(testDirectory, { recursive: true, force: true })
    await mkdir(testDirectory, { recursive: true })
  })

  afterEach(async () => {
    await rm(testDirectory, { recursive: true, force: true })
  })

  it('should discover local GEMINI.md', async () => {
    const content = '---\ntitle: My Gemini\n---\n# Content'
    await writeFile(path.join(testDirectory, 'GEMINI.md'), content)

    const nodes = await scan({ cwd: testDirectory, includeGlobal: false })

    expect(nodes).toHaveLength(1)
    const node = nodes[0]
    if (!node) throw new Error('Node not found')

    expect(node.title).toBe('My Gemini')
    expect(node.ecosystem).toBe('gemini')
  })

  it('should discover files in .agents directory', async () => {
    const agentsDirectory = path.join(testDirectory, '.agents')
    await mkdir(agentsDirectory)
    await writeFile(path.join(agentsDirectory, 'my-skill.md'), '# My Skill')

    const nodes = await scan({ cwd: testDirectory, includeGlobal: false })

    expect(nodes).toHaveLength(1)
    const node = nodes[0]
    if (!node) throw new Error('Node not found')

    expect(node.title).toBe('my-skill')
    expect(node.type).toBe('agent') // Default for .agents
  })

  it('should detect core markdown ecosystems correctly', async () => {
    await writeFile(path.join(testDirectory, 'OPENAI.md'), '# OpenAI')
    await writeFile(path.join(testDirectory, 'AGENTS.md'), '# Agent')
    await writeFile(path.join(testDirectory, 'CODEX.md'), '# Codex')
    await writeFile(path.join(testDirectory, 'CLAUDE.md'), '# Claude')
    const cursorDirectory = path.join(testDirectory, '.cursor', 'rules')
    await mkdir(cursorDirectory, { recursive: true })
    await writeFile(path.join(cursorDirectory, 'rule1.md'), '# Rule 1')

    const nodes = await scan({ cwd: testDirectory, includeGlobal: false })

    const openaiNode = nodes.find((n) => n.ecosystem === 'openai')
    const agentNode = nodes.find((n) => n.ecosystem === 'agent')
    const codexNode = nodes.find((n) => n.ecosystem === 'codex')
    const claudeNode = nodes.find((n) => n.ecosystem === 'claude')
    const cursorNode = nodes.find((n) => n.ecosystem === 'cursor')

    expect(openaiNode).toBeDefined()
    expect(agentNode).toBeDefined()
    expect(codexNode).toBeDefined()
    expect(claudeNode).toBeDefined()
    expect(cursorNode).toBeDefined()
  })

  it('should detect all configured ecosystem conventions', async () => {
    await writeFile(path.join(testDirectory, 'OPENAI.md'), '# OpenAI')
    await writeFile(path.join(testDirectory, 'GEMINI.md'), '# Gemini')
    await writeFile(path.join(testDirectory, 'AGENTS.md'), '# Agent')
    await writeFile(path.join(testDirectory, 'CODEX.md'), '# Codex')
    await writeFile(path.join(testDirectory, 'CLAUDE.md'), '# Claude')
    await writeFile(
      path.join(testDirectory, 'openclaw.json'),
      '{ "agents": {} }',
    )

    const cursorDirectory = path.join(testDirectory, '.cursor', 'rules')
    const clineDirectory = path.join(testDirectory, '.cline', 'rules')
    const rooDirectory = path.join(testDirectory, '.roo', 'rules')
    await mkdir(cursorDirectory, { recursive: true })
    await mkdir(clineDirectory, { recursive: true })
    await mkdir(rooDirectory, { recursive: true })
    await writeFile(path.join(cursorDirectory, 'rule.md'), '# Cursor')
    await writeFile(path.join(clineDirectory, 'rule.md'), '# Cline')
    await writeFile(path.join(rooDirectory, 'rule.md'), '# Roo')

    const nodes = await scan({ cwd: testDirectory, includeGlobal: false })
    const ecosystems = new Set(nodes.map((node) => node.ecosystem))

    expect(ecosystems).toEqual(
      new Set([
        'openai',
        'gemini',
        'agent',
        'codex',
        'claude',
        'cursor',
        'cline',
        'roo',
        'openclaw',
      ]),
    )
  })

  it('should scan multiple roots', async () => {
    const firstRoot = path.join(testDirectory, 'first')
    const secondRoot = path.join(testDirectory, 'second')
    await mkdir(firstRoot, { recursive: true })
    await mkdir(secondRoot, { recursive: true })
    await writeFile(path.join(firstRoot, 'GEMINI.md'), '# Gemini')
    await writeFile(path.join(secondRoot, 'CLAUDE.md'), '# Claude')

    const nodes = await scan({
      cwd: [firstRoot, secondRoot],
      includeGlobal: false,
    })

    expect(nodes).toHaveLength(2)
    expect(nodes.map((node) => node.ecosystem).toSorted()).toEqual([
      'claude',
      'gemini',
    ])
  })

  it('should filter by ecosystem', async () => {
    await writeFile(path.join(testDirectory, 'GEMINI.md'), '# Gemini')
    await writeFile(path.join(testDirectory, 'CLAUDE.md'), '# Claude')

    const nodes = await scan({ cwd: testDirectory, ecosystems: ['claude'] })

    expect(nodes).toHaveLength(1)
    expect(nodes[0]?.ecosystem).toBe('claude')
  })

  it('should respect includeGlobal and includeRepo options', async () => {
    // Setup repo file
    await writeFile(path.join(testDirectory, 'GEMINI.md'), '# Repo')

    // Setup global file (mocked home)
    const home = path.join(tmpdir(), 'mock-home')
    const globalAgentsDirectory = path.join(home, '.agents')
    await mkdir(globalAgentsDirectory, { recursive: true })
    await writeFile(path.join(globalAgentsDirectory, 'global.md'), '# Global')

    // Test default (both)
    const allNodes = await scan({ cwd: testDirectory })
    expect(allNodes.some((n) => n.scope === 'repo')).toBe(true)
    expect(allNodes.some((n) => n.scope === 'global')).toBe(true)

    // Test only repo
    const repoNodes = await scan({ cwd: testDirectory, includeGlobal: false })
    expect(repoNodes.every((n) => n.scope === 'repo')).toBe(true)
    expect(repoNodes.some((n) => n.scope === 'repo')).toBe(true)
    expect(repoNodes.some((n) => n.scope === 'global')).toBe(false)

    // Test only global
    const globalNodes = await scan({ cwd: testDirectory, includeRepo: false })
    expect(globalNodes.every((n) => n.scope === 'global')).toBe(true)
    expect(globalNodes.some((n) => n.scope === 'global')).toBe(true)
    expect(globalNodes.some((n) => n.scope === 'repo')).toBe(false)

    // Test none
    const noNodes = await scan({
      cwd: testDirectory,
      includeGlobal: false,
      includeRepo: false,
    })
    expect(noNodes).toHaveLength(0)
  })

  it('should attach parsed ecosystem config metadata', async () => {
    await writeFile(
      path.join(testDirectory, 'openclaw.json'),
      '{ agents: { defaults: { model: "openai/gpt-5.4" } } }',
    )

    const nodes = await scan({ cwd: testDirectory, ecosystems: ['openclaw'] })

    expect(nodes).toHaveLength(1)
    expect(nodes[0]?.metadata?.ecosystemConfig).toMatchObject({
      id: 'openclaw',
      label: 'OpenClaw',
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
    })
  })
})
