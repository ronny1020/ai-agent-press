import { describe, expect, it } from 'bun:test'
import { ECOSYSTEMS, ECOSYSTEM_IDS } from './ecosystems'
import type { Ecosystem } from '../shared/types'

describe('Ecosystem registry', () => {
  const MIN_PATTERNS = 0

  it('should register every supported ecosystem once', () => {
    const expected: Ecosystem[] = [
      'openai',
      'claude',
      'gemini',
      'cursor',
      'agent',
      'codex',
      'cline',
      'roo',
      'aider',
      'openclaw',
    ]

    expect(new Set(ECOSYSTEM_IDS)).toEqual(new Set(expected))
    expect(ECOSYSTEMS).toHaveLength(expected.length)
  })

  it('should define discovery patterns for each ecosystem', () => {
    for (const ecosystem of ECOSYSTEMS) {
      expect(ecosystem.localPatterns.length).toBeGreaterThan(MIN_PATTERNS)
      expect(ecosystem.globalPatterns.length).toBeGreaterThan(MIN_PATTERNS)
    }
  })
})
