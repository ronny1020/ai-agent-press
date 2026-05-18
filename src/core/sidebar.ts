import type { ContentNode, Ecosystem, SidebarItem } from '../shared/types'

export function groupByEcosystem(
  nodes: ContentNode[],
): Map<Ecosystem, ContentNode[]> {
  const groups = new Map<Ecosystem, ContentNode[]>()

  for (const node of nodes) {
    const existing = groups.get(node.ecosystem) ?? []
    existing.push(node)
    groups.set(node.ecosystem, existing)
  }

  return groups
}

export function splitNodesByScope(nodes: ContentNode[]) {
  const repoNodes = nodes.filter((n) => n.scope === 'repo')
  const globalNodes = nodes.filter((n) => n.scope === 'global')
  return { repoNodes, globalNodes }
}

export function buildSidebarItems(
  nodes: ContentNode[],
  scope: string,
  getLink: (node: ContentNode) => string,
) {
  const ecosystemGroups = groupByEcosystem(nodes)
  const sidebarItems: SidebarItem[] = []

  for (const [ecosystem, groupNodes] of ecosystemGroups) {
    const instructions = groupNodes.filter((n) => n.type === 'instruction')
    const skills = groupNodes.filter(
      (n) => n.type === 'skill' || n.type === 'rule',
    )
    const agents = groupNodes.filter((n) => n.type === 'agent')
    const resources = groupNodes.filter((n) => n.type === 'workflow')

    const categories: SidebarItem[] = []
    if (instructions.length > 0) {
      categories.push(
        buildHierarchicalCategory(instructions, 'Instructions', getLink),
      )
    }
    if (agents.length > 0) {
      categories.push(buildHierarchicalCategory(agents, 'Agents', getLink))
    }
    if (skills.length > 0) {
      categories.push(buildHierarchicalCategory(skills, 'Skills', getLink))
    }
    if (resources.length > 0) {
      categories.push(
        buildHierarchicalCategory(resources, 'Resources', getLink),
      )
    }

    sidebarItems.push({
      text: ecosystem,
      items: categories.length > 0 ? categories : undefined,
    })
  }

  // Ecosystem Flattening: If only one ecosystem, return its categories directly
  if (sidebarItems.length === 1) {
    return sidebarItems[0]!.items || []
  }

  return sidebarItems
}

function buildHierarchicalCategory(
  nodes: ContentNode[],
  categoryName: string,
  getLink: (node: ContentNode) => string,
): SidebarItem {
  const rootItems: SidebarItem[] = []
  const categoryMap: Record<string, string> = {
    agent: 'agents',
    skill: 'skills',
    rule: 'skills',
    instruction: 'instructions',
    workflow: 'resources',
  }

  for (const node of nodes) {
    const categoryFolderName = categoryMap[node.type] || node.type
    const normalizedPath = node.path.replaceAll('\\', '/')
    const searchString = `/${categoryFolderName}/`
    const lastIndex = normalizedPath.lastIndexOf(searchString)

    const relativeParts: string[] = []
    if (lastIndex !== -1) {
      const afterCategory = normalizedPath.slice(lastIndex + searchString.length)
      const segments = afterCategory.split('/')
      if (segments.length > 1) {
        relativeParts.push(...segments.slice(0, -1))
      }
    }

    let currentItems = rootItems
    for (const part of relativeParts) {
      let group = currentItems.find((item) => item.text === part && item.items)
      if (!group) {
        group = { text: part, items: [], collapsed: true }
        currentItems.push(group)
      }
      currentItems = group.items!
    }

    currentItems.push({ text: node.title, link: getLink(node) })
  }

  return {
    text: categoryName,
    items: rootItems,
  }
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
    })
  }

  if (repoSidebarItems.length > 0) {
    sidebar.push({
      text: 'Current Repo',
      items: repoSidebarItems,
    })
  }

  return sidebar
}
