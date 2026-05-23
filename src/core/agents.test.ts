import { describe, expect, it } from 'bun:test'
import { AGENTS, AGENT_IDS } from './agents'
import type { Agent } from '../shared/types'

describe('Agent registry', () => {
  const MIN_PATTERNS = 0

  it('should register every supported agent once', () => {
    const expected: Agent[] = [
      'antigravity',
      'openclaw',
      'openai',
      'agent',
      'codex',
      'claude',
      'gemini',
      'cursor',
      'cline',
      'roo',
      'aider',
      'aider-desk',
      'augment',
      'bob',
      'codearts-agent',
      'codebuddy',
      'codemaker',
      'codestudio',
      'command-code',
      'continue',
      'cortex',
      'crush',
      'devin',
      'droid',
      'forgecode',
      'github-copilot',
      'goose',
      'hermes-agent',
      'iflow-cli',
      'junie',
      'kilo',
      'kimi-cli',
      'kiro-cli',
      'kode',
      'mcpjam',
      'mistral-vibe',
      'mux',
      'neovate',
      'openhands',
      'pi',
      'qoder',
      'qwen-code',
      'rovodev',
      'tabnine-cli',
      'trae',
      'windsurf',
      'zencoder',
      'pochi',
      'adal',
    ]

    expect(new Set(AGENT_IDS)).toEqual(new Set(expected))
    expect(AGENTS).toHaveLength(expected.length)
  })

  it('should define discovery patterns for each agent', () => {
    for (const agent of AGENTS) {
      expect(agent.localPatterns.length).toBeGreaterThan(MIN_PATTERNS)
      expect(agent.globalPatterns.length).toBeGreaterThan(MIN_PATTERNS)
    }
  })
})
