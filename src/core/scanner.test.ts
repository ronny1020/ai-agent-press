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
    expect(node.agent).toBe('gemini')
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
    expect(node.type).toBe('instruction') // Top-level .md is instruction
  })

  it('should detect core markdown agents correctly', async () => {
    await writeFile(path.join(testDirectory, 'OPENAI.md'), '# OpenAI')
    await writeFile(path.join(testDirectory, 'AGENTS.md'), '# Agent')
    await writeFile(path.join(testDirectory, 'CODEX.md'), '# Codex')
    await writeFile(path.join(testDirectory, 'CLAUDE.md'), '# Claude')
    const cursorDirectory = path.join(testDirectory, '.cursor', 'rules')
    await mkdir(cursorDirectory, { recursive: true })
    await writeFile(path.join(cursorDirectory, 'rule1.md'), '# Rule 1')

    const nodes = await scan({ cwd: testDirectory, includeGlobal: false })

    const openaiNode = nodes.find((n) => n.agent === 'openai')
    const agentNode = nodes.find((n) => n.agent === 'agent')
    const codexNode = nodes.find((n) => n.agent === 'codex')
    const claudeNode = nodes.find((n) => n.agent === 'claude')
    const cursorNode = nodes.find((n) => n.agent === 'cursor')

    expect(openaiNode).toBeDefined()
    expect(agentNode).toBeDefined()
    expect(codexNode).toBeDefined()
    expect(claudeNode).toBeDefined()
    expect(cursorNode).toBeDefined()
  })

  it('should detect all configured agent conventions', async () => {
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
    const agents = new Set(nodes.map((node) => node.agent))

    expect(agents).toEqual(
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
    expect(nodes.map((node) => node.agent).toSorted()).toEqual([
      'claude',
      'gemini',
    ])
  })

  it('should filter by agent', async () => {
    await writeFile(path.join(testDirectory, 'GEMINI.md'), '# Gemini')
    await writeFile(path.join(testDirectory, 'CLAUDE.md'), '# Claude')

    const nodes = await scan({ cwd: testDirectory, agents: ['claude'] })

    expect(nodes).toHaveLength(1)
    expect(nodes[0]?.agent).toBe('claude')
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

  it('should attach parsed agent config metadata', async () => {
    await writeFile(
      path.join(testDirectory, 'openclaw.json'),
      '{ agents: { defaults: { model: "openai/gpt-5.4" } } }',
    )

    const nodes = await scan({ cwd: testDirectory, agents: ['openclaw'] })

    expect(nodes).toHaveLength(1)
    expect(nodes[0]?.metadata?.agentConfig).toMatchObject({
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

  it('should ignore junk directories like browser extensions and build artifacts', async () => {
    // Setup a junk directory that should be ignored
    const extensionDirectory = path.join(testDirectory, 'Default', 'Extensions', 'some-id')
    await mkdir(extensionDirectory, { recursive: true })
    await writeFile(path.join(extensionDirectory, 'malicious.js'), 'console.log("ignore me")')

    // Setup a valid agent directory
    const agentsDirectory = path.join(testDirectory, '.agents')
    await mkdir(agentsDirectory)
    await writeFile(path.join(agentsDirectory, 'valid.md'), '# Valid Agent')

    const nodes = await scan({ cwd: testDirectory, includeGlobal: false })

    // Should only find the valid agent, not the extension file
    expect(nodes).toHaveLength(1)
    expect(nodes[0]?.title).toBe('valid')
  })

  it('should be precise in Gemini detection and avoid false positives', async () => {
    // This file contains "gemini" but is not in a .gemini folder or named gemini.md
    await writeFile(path.join(testDirectory, 'not-a-gemini-file.js'), 'const x = "gemini";')
    
    // This IS a gemini file because it's in .gemini/
    const geminiDirectory = path.join(testDirectory, '.gemini')
    await mkdir(geminiDirectory)
    await writeFile(path.join(geminiDirectory, 'real-agent.md'), '# Real Agent')

    const nodes = await scan({ cwd: testDirectory, includeGlobal: false })

    // Should only find the one in .gemini/
    expect(nodes).toHaveLength(1)
    expect(nodes[0]?.agent).toBe('gemini')
    expect(nodes[0]?.title).toBe('real-agent')
  })

  it('should discover new configuration files for Claude and Roo', async () => {
    await writeFile(path.join(testDirectory, 'claude_desktop_config.json'), '{ "mcpServers": {} }')
    await writeFile(path.join(testDirectory, '.roomodes'), '{ "customModes": [] }')

    const nodes = await scan({ cwd: testDirectory, includeGlobal: false })

    const claudeNode = nodes.find(n => n.agent === 'claude')
    const rooNode = nodes.find(n => n.agent === 'roo')

    expect(claudeNode).toBeDefined()
    expect(rooNode).toBeDefined()
  })

  it('should discover Antigravity brain files', async () => {
    // Setup a mock Antigravity brain path
    const brainDirectory = path.join(testDirectory, '.gemini', 'antigravity', 'brain', 'session-id')
    await mkdir(brainDirectory, { recursive: true })
    await writeFile(path.join(brainDirectory, 'task.md'), '# My Task')

    const nodes = await scan({ cwd: testDirectory, includeGlobal: false })

    const antigravityNode = nodes.find(n => n.agent === 'antigravity')
    expect(antigravityNode).toBeDefined()
    expect(antigravityNode?.title).toBe('task')
  })

  it('should handle nested files within categories properly', async () => {
    const nestedSkillDirectory = path.join(testDirectory, '.agents', 'skills', 'subfolder')
    await mkdir(nestedSkillDirectory, { recursive: true })
    await writeFile(path.join(nestedSkillDirectory, 'nested-skill.md'), '# Nested Skill')

    const nodes = await scan({ cwd: testDirectory, includeGlobal: false })

    const nestedNode = nodes.find(n => n.title === 'nested-skill')
    expect(nestedNode).toBeDefined()
    expect(nestedNode?.type).toBe('skill')
  })

  it('should detect mcp and tools directories as skills', async () => {
    const mcpDirectory = path.join(testDirectory, '.agents', 'mcp')
    const toolsDirectory = path.join(testDirectory, '.agents', 'tools')
    await mkdir(mcpDirectory, { recursive: true })
    await mkdir(toolsDirectory, { recursive: true })
    await writeFile(path.join(mcpDirectory, 'config.json'), '{ "mcp": true }')
    await writeFile(path.join(toolsDirectory, 'my-tool.sh'), 'echo "tool"')

    const nodes = await scan({ cwd: testDirectory, includeGlobal: false })

    const mcpNode = nodes.find(n => n.path.includes('/mcp/'))
    const toolNode = nodes.find(n => n.path.includes('/tools/'))

    expect(mcpNode).toBeDefined()
    expect(mcpNode?.type).toBe('skill')
    expect(toolNode).toBeDefined()
    expect(toolNode?.type).toBe('skill')
  })

  it('should handle invalid frontmatter gracefully', async () => {
    const agentsDirectory = path.join(testDirectory, '.agents')
    await mkdir(agentsDirectory, { recursive: true })
    const content = `---
name: Prefer scoped Conventional Commits
description: When committing, default to type(scope): subject form instead of bare type: subject
---
# Content`
    await writeFile(path.join(agentsDirectory, 'invalid-frontmatter.md'), content)

    const nodes = await scan({ cwd: testDirectory, includeGlobal: false })

    expect(nodes).toHaveLength(1)
    const node = nodes[0]
    if (!node) throw new Error('Node not found')

    expect(node.title).toBe('invalid-frontmatter')
    expect(node.content).toBe(content)
  })
})
