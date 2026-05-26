import path from 'node:path'
import type { Agent, ContentNode, SidebarItem } from '../shared/types'

export function groupByAgent(
  nodes: ContentNode[],
): Map<Agent, ContentNode[]> {
  const groups = new Map<Agent, ContentNode[]>()

  for (const node of nodes) {
    const existing = groups.get(node.agent) ?? []
    existing.push(node)
    groups.set(node.agent, existing)
  }

  return groups
}

export function splitNodesByScope(nodes: ContentNode[]) {
  const repoNodes = nodes.filter((n) => n.scope === 'repo')
  const globalNodes = nodes.filter((n) => n.scope === 'global')
  return { repoNodes, globalNodes }
}

export interface SidebarResult {
  sidebar: SidebarItem[]
  nodeToLink: Map<ContentNode, string>
  indexNode?: ContentNode
  repoSidebarItems: SidebarItem[]
  globalSidebarItems: SidebarItem[]
}

export function pruneEmptySidebarGroups(items: SidebarItem[]): SidebarItem[] {
  return items.flatMap((item) => {
    if (!item.items) return [item]
    const pruned = pruneEmptySidebarGroups(item.items)
    if (pruned.length === 0 && !item.link) return []
    return [{ ...item, items: pruned }]
  })
}

/**
 * Computes the complete sidebar and node-to-link mapping.
 * This is the source of truth for both Portal and Headless (list) modes.
 */
export function computeSidebar(
  nodes: ContentNode[],
  options: { isAllMode?: boolean } = {},
): SidebarResult {
  const { isAllMode = false } = options

  const indexNode = pickIndexNode(nodes)
  const usedPageIds = new Set<string>()
  const nodeToLink = new Map<ContentNode, string>()

  // Deterministic link generation
  for (const node of nodes) {
    const link =
      node === indexNode ? '/' : `/${getNodeLink(node, usedPageIds)}`
    nodeToLink.set(node, link)
  }

  const { repoNodes, globalNodes } = splitNodesByScope(nodes)

  const repoSidebarItems = pruneEmptySidebarGroups(buildSidebarItems(
    repoNodes,
    'repo',
    (n) => nodeToLink.get(n)!,
  ))
  const globalSidebarItems = pruneEmptySidebarGroups(buildSidebarItems(
    globalNodes,
    'global',
    (n) => nodeToLink.get(n)!,
  ))

  const sidebar = consolidateSidebar(
    repoSidebarItems,
    globalSidebarItems,
    isAllMode,
  )

  return { sidebar, nodeToLink, indexNode, repoSidebarItems, globalSidebarItems }
}

export function buildSidebarItems(
  nodes: ContentNode[],
  scope: string,
  getLink: (node: ContentNode) => string,
) {
  const agentGroups = groupByAgent(nodes)
  const sidebarItems: SidebarItem[] = []

  for (const [agent, groupNodes] of agentGroups) {
    const instructions = groupNodes.filter((n) => n.type === 'instruction')
    const skills = groupNodes.filter((n) => n.type === 'skill')

    const categories: SidebarItem[] = []
    if (instructions.length > 0) {
      categories.push({
        ...buildHierarchicalCategory(instructions, 'Instructions', getLink),
        collapsed: false,
      })
    }
    if (skills.length > 0) {
      categories.push({
        ...buildHierarchicalCategory(skills, 'Skills', getLink),
        collapsed: false,
      })
    }

    sidebarItems.push({
      text: agent,
      items: categories.length > 0 ? categories : undefined,
      collapsed: false,
    })
  }

  // Agent Flattening: If only one agent, return its categories directly
  if (sidebarItems.length === 1) {
    return sidebarItems[0]!.items || []
  }

  return sidebarItems
}

export function getRelativeParts(node: ContentNode): string[] {
  if (node.type === 'instruction') {
    return []
  }

  const normalizedPath = node.path.replaceAll('\\', '/')
  
  // Find the last occurrence of any recognized category boundary
  const boundaries = ['/skills/', '/rules/']
  let lastIndex = -1
  let searchString = ''
  for (const boundary of boundaries) {
    const index = normalizedPath.lastIndexOf(boundary)
    if (index > lastIndex) {
      lastIndex = index
      searchString = boundary
    }
  }

  let parts: string[] = []

  if (lastIndex === -1) {
    // Fallback: if category folder not found (e.g. custom simple agents),
    // use the folder structure after the agent/scope part.
    const segments = normalizedPath.split('/')

    // Look for agent name in path to find root
    const agentSegment = node.agent.toLowerCase()
    const agentIndex = segments.findLastIndex(
      (s) => s.toLowerCase() === agentSegment || s.toLowerCase() === `.${agentSegment}`
    )

    if (agentIndex !== -1) {
      const afterAgent = segments.slice(agentIndex + 1)
      if (afterAgent.length > 1) {
        parts = afterAgent.slice(0, -1)
      }
    }
  } else {
    const afterCategory = normalizedPath.slice(lastIndex + searchString.length)
    const segments = afterCategory.split('/')
    if (segments.length > 1) {
      parts = segments.slice(0, -1)
    }
  }

  // Filter out hidden directory segments (e.g. .system) — these are internal
  // organisational folders that should not appear as sidebar entries.
  return parts.filter((p) => !p.startsWith('.'))
}

function buildHierarchicalCategory(
  nodes: ContentNode[],
  categoryName: string,
  getLink: (node: ContentNode) => string,
): SidebarItem {
  const rootItems: SidebarItem[] = []

  for (const node of nodes) {
    const relativeParts = getRelativeParts(node)

    let currentItems = rootItems
    for (const relativePart of relativeParts) {
      const part = relativePart!
      let group = currentItems.find((item) => item.text === part && item.items)
      if (!group) {
        // If a non-group item with this name already exists, merge it into a group
        const existingItemIndex = currentItems.findIndex((item) => item.text === part)
        if (existingItemIndex === -1) {
          group = { text: part, items: [], collapsed: false }
          currentItems.push(group)
        } else {
          const existing = currentItems[existingItemIndex]!
          group = { text: part, items: [], collapsed: false, link: existing.link }
          currentItems.splice(existingItemIndex, 1, group)
        }
      }
      currentItems = group.items!
    }

    const stem = path.basename(node.path, path.extname(node.path))
    const stemUpper = stem.toUpperCase()
    const lastFolder = relativeParts.at(-1)
    const lastFolderUpper = lastFolder?.toUpperCase()

    const nodeTitle = typeof node.title === 'string' ? node.title : stem

    // Redundancy elimination: 
    // If the file name is generic (SKILL, README, INDEX, TASK, IMPLEMENTATION_PLAN, WALKTHROUGH) 
    // OR matches the folder name, and we have a folder to attach it to, we elevate the link.
    const isGeneric = [
      'SKILL', 'SKILLS', 'README', 'INDEX', 'TASK', 
      'IMPLEMENTATION_PLAN', 'WALKTHROUGH', 'RULE', 'RULES', 'GOAL', 'CONFIG'
    ].includes(stemUpper)
    
    const matchesFolder = lastFolderUpper && stemUpper === lastFolderUpper

    if ((isGeneric || matchesFolder) && relativeParts.length > 0) {
      const parentItems = relativeParts.length === 1 ? rootItems : 
        findItemsForPath(rootItems, relativeParts.slice(0, -1))
      
      const folderItem = parentItems?.find(item => item.text === lastFolder)
      if (folderItem && !folderItem.link) {
        folderItem.link = getLink(node)
        continue 
      }
    }

    // Merge logic for leaf nodes: if an item with same text exists (maybe as a group), use it or skip
    const existing = currentItems.find(item => item.text === nodeTitle)
    if (existing) {
      if (existing.link === undefined) {
        existing.link = getLink(node)
      }
    } else {
      currentItems.push({ text: nodeTitle, link: getLink(node) })
    }
  }

  return {
    text: categoryName,
    items: rootItems,
  }
}

function findItemsForPath(items: SidebarItem[], parts: string[]): SidebarItem[] | undefined {
  let current = items
  for (const part of parts) {
    const found = current.find(item => item.text === part && item.items)
    if (!found) return undefined
    current = found.items!
  }
  return current
}

export function consolidateSidebar(
  repoSidebarItems: SidebarItem[],
  globalSidebarItems: SidebarItem[],
  isAllMode: boolean,
): SidebarItem[] {
  // If we only have repo items and no global items, and not in all mode,
  // we flatten the scope layer.
  if (!isAllMode && globalSidebarItems.length === 0) {
    return repoSidebarItems
  }

  // If we only have global items and no repo items, we flatten the scope layer.
  if (!isAllMode && repoSidebarItems.length === 0) {
    return globalSidebarItems
  }

  const sidebar: SidebarItem[] = []

  if (globalSidebarItems.length > 0) {
    sidebar.push({
      text: 'Global',
      items: globalSidebarItems,
      collapsed: false,
    })
  }

  if (repoSidebarItems.length > 0) {
    sidebar.push({
      text: 'Current Repo',
      items: repoSidebarItems,
      collapsed: false,
    })
  }

  return sidebar
}

export function pickIndexNode(nodes: ContentNode[]): ContentNode | undefined {
  if (nodes.length === 0) return undefined

  const repoNodes = nodes.filter((n) => n.scope === 'repo')
  const globalNodes = nodes.filter((n) => n.scope === 'global')

  // Priority 1: Generic names in repo root
  const priorities = ['GEMINI.MD', 'AGENTS.MD', 'README.MD', 'SKILL.MD', 'INDEX.MD']

  for (const priority of priorities) {
    const found = repoNodes.find(
      (n) => path.basename(n.path).toUpperCase() === priority,
    )
    if (found) return found
  }

  // Priority 2: Generic names anywhere in repo
  for (const priority of priorities) {
    const found = repoNodes.find(
      (n) => path.basename(n.path).toUpperCase().includes(priority),
    )
    if (found) return found
  }

  // Priority 3: First repo node
  if (repoNodes.length > 0) return repoNodes[0]

  // Priority 4: Generic names in global
  for (const priority of priorities) {
    const found = globalNodes.find(
      (n) => path.basename(n.path).toUpperCase() === priority,
    )
    if (found) return found
  }

  // Priority 5: Generic names anywhere in global
  for (const priority of priorities) {
    const found = globalNodes.find(
      (n) => path.basename(n.path).toUpperCase().includes(priority),
    )
    if (found) return found
  }

  return nodes[0]
}

export function getNodeLink(node: ContentNode, usedPageIds: Set<string>): string {
  // Mapping internal types to URL category names
  const category = node.type === 'instruction' ? 'instructions' : 'skills'

  const relativeParts = getRelativeParts(node).map((p) => slugify(p))

  const stem = path.basename(node.path, path.extname(node.path))
  const parts = [
    slugify(node.scope || 'unknown'),
    slugify(node.agent || 'unknown'),
    slugify(category || 'unknown'),
    ...relativeParts,
    slugify(stem || 'unknown'),
  ]
  const prefix = parts.join('/')
  let pageId = prefix
  let suffix = 2

  while (usedPageIds.has(pageId)) {
    pageId = `${prefix}-${suffix}`
    suffix += 1
  }

  usedPageIds.add(pageId)
  return pageId
}

export function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replaceAll(/[^a-z0-9]+/g, '-')
      .replaceAll(/^-+|-+$/g, '') || 'page'
  )
}
