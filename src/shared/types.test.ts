import { describe, it, expect } from 'bun:test'
import type { ContentNode, NodeType, SidebarItem } from './types'

describe('ContentNode', () => {
  it('both NodeType values are valid on a node', () => {
    const types: NodeType[] = ['skill', 'instruction']
    for (const type of types) {
      const node: ContentNode = {
        id: 'test',
        agent: 'gemini',
        type,
        title: 'Test',
        path: './test.md',
        content: '# Hello',
      }
      expect(node.type).toBe(type)
    }
  })

  it('scope is optional', () => {
    const node: ContentNode = {
      id: 'test',
      agent: 'claude',
      type: 'instruction',
      title: 'Test Agent',
      path: './test.md',
      content: '# Hello',
    }
    expect(node.scope).toBeUndefined()
  })

  it('metadata, references, and tags are optional', () => {
    const node: ContentNode = {
      id: 'test',
      agent: 'cursor',
      type: 'skill',
      title: 'Minimal',
      path: './rule.md',
      content: '',
    }
    expect(node.metadata).toBeUndefined()
    expect(node.references).toBeUndefined()
    expect(node.tags).toBeUndefined()
  })
})

describe('SidebarItem', () => {
  it('can represent a leaf link', () => {
    const item: SidebarItem = { text: 'Guide', link: '/guide' }
    expect(item.link).toBe('/guide')
    expect(item.items).toBeUndefined()
  })

  it('can nest items arbitrarily deep', () => {
    const item: SidebarItem = {
      text: 'Parent',
      items: [
        { text: 'Child', link: '/child' },
        { text: 'Nested', items: [{ text: 'Leaf', link: '/leaf' }] },
      ],
    }
    expect(item.items).toHaveLength(2)
    expect(item.items?.[1]?.items?.[0]?.link).toBe('/leaf')
  })
})
