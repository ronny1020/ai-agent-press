import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { scan } from './scanner'
import { writeFile, mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

describe('Scanner', () => {
  const testDir = join(tmpdir(), 'ai-agent-press-test')

  beforeEach(async () => {
    await rm(testDir, { recursive: true, force: true })
    await mkdir(testDir, { recursive: true })
  })

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true })
  })

  it('should discover local GEMINI.md', async () => {
    const content = '---\ntitle: My Gemini\n---\n# Content'
    await writeFile(join(testDir, 'GEMINI.md'), content)

    const nodes = await scan({ cwd: testDir })
    
    expect(nodes).toHaveLength(1)
    const node = nodes[0]
    if (!node) throw new Error('Node not found')
    
    expect(node.title).toBe('My Gemini')
    expect(node.ecosystem).toBe('gemini')
  })

  it('should discover files in .agents directory', async () => {
    const agentsDir = join(testDir, '.agents')
    await mkdir(agentsDir)
    await writeFile(join(agentsDir, 'my-skill.md'), '# My Skill')

    const nodes = await scan({ cwd: testDir })
    
    expect(nodes).toHaveLength(1)
    const node = nodes[0]
    if (!node) throw new Error('Node not found')

    expect(node.title).toBe('my-skill')
    expect(node.type).toBe('agent') // Default for .agents
  })

  it('should detect core markdown ecosystems correctly', async () => {
    await writeFile(join(testDir, 'OPENAI.md'), '# OpenAI')
    await writeFile(join(testDir, 'AGENTS.md'), '# Codex')
    await writeFile(join(testDir, 'CLAUDE.md'), '# Claude')
    const cursorDir = join(testDir, '.cursor', 'rules')
    await mkdir(cursorDir, { recursive: true })
    await writeFile(join(cursorDir, 'rule1.md'), '# Rule 1')

    const nodes = await scan({ cwd: testDir })
    
    const openaiNode = nodes.find(n => n.ecosystem === 'openai')
    const codexNode = nodes.find(n => n.ecosystem === 'codex')
    const claudeNode = nodes.find(n => n.ecosystem === 'claude')
    const cursorNode = nodes.find(n => n.ecosystem === 'cursor')

    expect(openaiNode).toBeDefined()
    expect(codexNode).toBeDefined()
    expect(claudeNode).toBeDefined()
    expect(cursorNode).toBeDefined()
  })

  it('should detect all configured ecosystem conventions', async () => {
    await writeFile(join(testDir, 'OPENAI.md'), '# OpenAI')
    await writeFile(join(testDir, 'GEMINI.md'), '# Gemini')
    await writeFile(join(testDir, 'AGENTS.md'), '# Codex')
    await writeFile(join(testDir, 'CLAUDE.md'), '# Claude')
    await writeFile(join(testDir, 'openclaw.json'), '{ "agents": {} }')

    const cursorDir = join(testDir, '.cursor', 'rules')
    const clineDir = join(testDir, '.cline', 'rules')
    const rooDir = join(testDir, '.roo', 'rules')
    await mkdir(cursorDir, { recursive: true })
    await mkdir(clineDir, { recursive: true })
    await mkdir(rooDir, { recursive: true })
    await writeFile(join(cursorDir, 'rule.md'), '# Cursor')
    await writeFile(join(clineDir, 'rule.md'), '# Cline')
    await writeFile(join(rooDir, 'rule.md'), '# Roo')

    const nodes = await scan({ cwd: testDir })
    const ecosystems = new Set(nodes.map(node => node.ecosystem))

    expect(ecosystems).toEqual(
      new Set(['openai', 'gemini', 'codex', 'claude', 'cursor', 'cline', 'roo', 'openclaw'])
    )
  })

  it('should scan multiple roots', async () => {
    const firstRoot = join(testDir, 'first')
    const secondRoot = join(testDir, 'second')
    await mkdir(firstRoot, { recursive: true })
    await mkdir(secondRoot, { recursive: true })
    await writeFile(join(firstRoot, 'GEMINI.md'), '# Gemini')
    await writeFile(join(secondRoot, 'CLAUDE.md'), '# Claude')

    const nodes = await scan({ cwd: [firstRoot, secondRoot] })

    expect(nodes).toHaveLength(2)
    expect(nodes.map(node => node.ecosystem).sort()).toEqual(['claude', 'gemini'])
  })

  it('should filter by ecosystem', async () => {
    await writeFile(join(testDir, 'GEMINI.md'), '# Gemini')
    await writeFile(join(testDir, 'CLAUDE.md'), '# Claude')

    const nodes = await scan({ cwd: testDir, ecosystems: ['claude'] })

    expect(nodes).toHaveLength(1)
    expect(nodes[0]?.ecosystem).toBe('claude')
  })

  it('should attach parsed ecosystem config metadata', async () => {
    await writeFile(join(testDir, 'openclaw.json'), '{ agents: { defaults: { model: "openai/gpt-5.4" } } }')

    const nodes = await scan({ cwd: testDir, ecosystems: ['openclaw'] })

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
