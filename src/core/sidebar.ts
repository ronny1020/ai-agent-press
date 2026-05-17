import type { ContentNode, Ecosystem, SidebarItem } from '../shared/types'

export function groupByEcosystem(nodes: ContentNode[]): Map<Ecosystem, ContentNode[]> {
  const groups = new Map<Ecosystem, ContentNode[]>()

  for (const node of nodes) {
    const existing = groups.get(node.ecosystem) ?? []
    existing.push(node)
    groups.set(node.ecosystem, existing)
  }

  return groups
}

export function splitNodesByScope(nodes: ContentNode[]) {
  const repoNodes = nodes.filter(n => n.scope === 'repo')
  const globalNodes = nodes.filter(n => n.scope === 'global')
  return { repoNodes, globalNodes }
}

export function buildSidebarItems(
  nodes: ContentNode[],
  scope: string,
  getLink: (node: ContentNode) => string,
  getEcosystemLink?: (ecosystem: Ecosystem, scope: string) => string
) {
  const ecosystemGroups = groupByEcosystem(nodes)
  const sidebarItems: SidebarItem[] = []

  for (const [ecosystem, groupNodes] of ecosystemGroups) {
    const ecosystemLink = getEcosystemLink ? getEcosystemLink(ecosystem, scope) : undefined

    const instructions = groupNodes.filter(n => n.type === 'instruction')
    const skills = groupNodes.filter(n => n.type === 'skill' || n.type === 'rule')
    const agents = groupNodes.filter(n => n.type === 'agent')
    const resources = groupNodes.filter(n => n.type === 'workflow')

    const categories: SidebarItem[] = []
    if (instructions.length) {
      categories.push({ text: 'Instructions', items: instructions.map(n => ({ text: n.title, link: getLink(n) })) })
    }
    if (agents.length) {
      categories.push({ text: 'Agents', items: agents.map(n => ({ text: n.title, link: getLink(n) })) })
    }
    if (skills.length) {
      categories.push({ text: 'Skills', items: skills.map(n => ({ text: n.title, link: getLink(n) })) })
    }
    if (resources.length) {
      categories.push({ text: 'Resources', items: resources.map(n => ({ text: n.title, link: getLink(n) })) })
    }

    sidebarItems.push({
      text: ecosystem,
      link: ecosystemLink,
      items: categories.length ? categories : undefined
    })
  }

  // Ecosystem Flattening: If only one ecosystem, return its categories directly
  if (sidebarItems.length === 1) {
    return sidebarItems[0]!.items || []
  }

  return sidebarItems
}

export function consolidateSidebar(
  repoSidebarItems: SidebarItem[],
  globalSidebarItems: SidebarItem[],
  isAllMode: boolean
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
      items: globalSidebarItems
    })
  }
  
  if (repoSidebarItems.length > 0) {
    sidebar.push({
      text: 'Current Repo',
      items: repoSidebarItems
    })
  }

  return sidebar
}
