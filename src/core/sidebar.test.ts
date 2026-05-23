import { describe, it, expect } from 'bun:test'
import { buildSidebarItems, getRelativeParts, getNodeLink , computeSidebar } from './sidebar'
import type { ContentNode } from '../shared/types'

describe('Sidebar Nesting', () => {
  it('should build hierarchical categories for nested files', () => {
    const nodes: ContentNode[] = [
      {
        id: '1',
        agent: 'gemini',
        type: 'skill',
        scope: 'repo',
        title: 'child',
        path: '/root/.gemini/skills/parent/child.md',
        content: '',
      } as ContentNode,
      {
        id: '2',
        agent: 'gemini',
        type: 'skill',
        scope: 'repo',
        title: 'grandchild',
        path: '/root/.gemini/skills/parent/sub/grandchild.md',
        content: '',
      } as ContentNode,
    ]

    const sidebar = buildSidebarItems(nodes, 'repo', (n) => `/${n.title}`)

    // Agent flattening: returns categories directly because only one agent
    expect(sidebar).toHaveLength(1)
    const skillsCategory = sidebar[0]
    expect(skillsCategory?.text).toBe('Skills')
    expect(skillsCategory?.items).toHaveLength(1)

    const parentFolder = skillsCategory?.items?.[0]
    expect(parentFolder?.text).toBe('parent')
    expect(parentFolder?.items).toHaveLength(2)

    const childItem = parentFolder?.items?.find(item => item.text === 'child')
    const subFolder = parentFolder?.items?.find(item => item.text === 'sub')

    expect(childItem?.link).toBe('/child')
    expect(subFolder?.text).toBe('sub')
    expect(subFolder?.items).toHaveLength(1)
    expect(subFolder?.items?.[0]?.text).toBe('grandchild')
    expect(subFolder?.items?.[0]?.link).toBe('/grandchild')
  })

  it('should support MCP and Tools categorized as nested Skills', () => {
    const nodes: ContentNode[] = [
      {
        id: '1',
        agent: 'claude',
        type: 'skill',
        scope: 'repo',
        title: 'server',
        path: '/root/claude/skills/mcp/server.json',
        content: '',
      } as ContentNode,
      {
        id: '2',
        agent: 'claude',
        type: 'skill',
        scope: 'repo',
        title: 'script',
        path: '/root/claude/skills/tools/script.sh',
        content: '',
      } as ContentNode,
    ]

    const sidebar = buildSidebarItems(nodes, 'repo', (n) => `/${n.title}`)

    // Agent flattening: returns categories directly
    expect(sidebar).toHaveLength(1)
    const skillsCat = sidebar[0]
    expect(skillsCat?.text).toBe('Skills')

    const mcpFolder = skillsCat?.items?.find(index => index.text === 'mcp')
    const toolFolder = skillsCat?.items?.find(index => index.text === 'tools')

    expect(mcpFolder?.items?.[0]?.text).toBe('server')
    expect(toolFolder?.items?.[0]?.text).toBe('script')
  })

  it('should collapse generic filenames (SKILL, README) into their folder name', () => {
    const nodes: ContentNode[] = [
      {
        id: '1',
        agent: 'claude',
        type: 'skill',
        scope: 'repo',
        title: 'SKILL',
        path: '/root/claude/skills/my-plugin/SKILL.md',
        content: '',
      } as ContentNode,
    ]

    const sidebar = buildSidebarItems(nodes, 'repo', (n) => `/${n.id}`)
    
    // Agent flattening: returns categories directly
    const skillsCat = sidebar[0]
    expect(skillsCat?.text).toBe('Skills')
    
    // my-plugin folder should now have the link directly, and NO sub-items
    const pluginItem = skillsCat?.items?.[0]
    expect(pluginItem?.text).toBe('my-plugin')
    expect(pluginItem?.link).toBe('/1')
    expect(pluginItem?.items).toHaveLength(0)
  })

  it('should extract relative parts and generate consistent node links for custom folders', () => {
    const node: ContentNode = {
      id: 'custom-skill',
      agent: 'antigravity',
      type: 'skill',
      scope: 'global',
      title: 'task',
      path: '/home/user/.gemini/antigravity/brain/UUID/task.md',
      content: '',
    } as ContentNode

    const relative = getRelativeParts(node)
    expect(relative).toEqual(['brain', 'UUID'])

    const used = new Set<string>()
    const link = getNodeLink(node, used)
    expect(link).toBe('global/antigravity/skills/brain/uuid/task')
  })
})


describe('Sidebar Computation', () => {
  const repoNode: ContentNode = {
    id: 'repo-1',
    agent: 'gemini',
    type: 'instruction',
    scope: 'repo',
    title: 'Repo File',
    path: '/root/GEMINI.md',
    content: '',
  }

  const globalNode: ContentNode = {
    id: 'global-1',
    agent: 'claude',
    type: 'instruction',
    scope: 'global',
    title: 'Global File',
    path: '/home/user/.claude/CLAUDE.md',
    content: '',
  }

  it('should flatten scope when only repo exists', () => {
    const { sidebar } = computeSidebar([repoNode], { isAllMode: false })
    // No "Current Repo" top level, returns agent categories directly if only one agent
    // or agent list if multiple. In this case, one agent, so returns categories.
    expect(sidebar[0]?.text).toBe('Instructions')
  })

  it('should NOT flatten scope when isAllMode is true even if only repo exists', () => {
    const { sidebar } = computeSidebar([repoNode], { isAllMode: true })
    expect(sidebar[0]?.text).toBe('Current Repo')
  })

  it('should show both sections when repo and global exist', () => {
    const { sidebar } = computeSidebar([repoNode, globalNode], { isAllMode: false })
    expect(sidebar.map(s => s.text)).toContain('Global')
    expect(sidebar.map(s => s.text)).toContain('Current Repo')
  })
})
