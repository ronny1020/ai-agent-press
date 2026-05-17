import { describe, it, expect } from 'bun:test'
import type { ContentNode } from './types'

describe('ContentNode', () => {
  it('should be able to create a node', () => {
    const node: ContentNode = {
      id: 'test',
      ecosystem: 'claude',
      type: 'agent',
      title: 'Test Agent',
      path: './test.md',
      content: '# Hello',
    }
    expect(node.id).toBe('test')
  })
})
