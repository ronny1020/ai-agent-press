import { describe, expect, it } from 'vitest'
import { ECOSYSTEM_IDS, ECOSYSTEMS } from './ecosystems'
import type { Ecosystem } from '../shared/types'

describe('Ecosystem registry', () => {
  it('should register every supported ecosystem once', () => {
    const expected: Ecosystem[] = [
      'openai',
      'claude',
      'gemini',
      'cursor',
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
      expect(ecosystem.localPatterns.length).toBeGreaterThan(0)
      expect(ecosystem.globalPatterns.length).toBeGreaterThan(0)
    }
  })
})
