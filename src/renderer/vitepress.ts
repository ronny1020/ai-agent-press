import { mkdir, writeFile, rm } from 'node:fs/promises'
import { join, dirname, basename, extname } from 'node:path'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import type { ContentNode, Ecosystem } from '../shared/types'
import { build as vitepressBuild, createServer } from 'vitepress'


export interface RenderOptions {
  isAllMode?: boolean
  port?: number
}

export async function render(nodes: ContentNode[], outDir: string, options: RenderOptions = {}) {
  const tempDir = await prepareTempDir(nodes, options)
  console.log('Building VitePress site...')
  await vitepressBuild(tempDir, { outDir: join(process.cwd(), outDir) })
}

export async function serve(nodes: ContentNode[], port: number, options: RenderOptions = {}) {
  const tempDir = await prepareTempDir(nodes, options)
  console.log(`Starting preview server on http://localhost:${port}...`)
  
  const server = await createServer(tempDir, { port })
  await server.listen()
  server.printUrls()
}

export async function prepareTempDir(nodes: ContentNode[], options: RenderOptions = {}): Promise<string> {
  const { isAllMode = false } = options
  
  // "it should only have agent in current mode"
  const indexNode = pickIndexNode(nodes)
  const activeNodes = isAllMode 
    ? nodes 
    : nodes.filter(n => n.type === 'agent' || n.type === 'skill' || n.type === 'rule' || n === indexNode)

  const root = process.cwd()
  const nodeModulesPath = join(root, 'node_modules')
  
  const baseTempDir = existsSync(nodeModulesPath) 
    ? join(nodeModulesPath, '.ai-agent-press')
    : join(homedir(), '.cache', 'ai-agent-press')

  const tempDir = join(baseTempDir, 'temp')
  
  await rm(tempDir, { recursive: true, force: true })
  await mkdir(tempDir, { recursive: true })

  const usedPageIds = new Set<string>()
  const nodeToLink = new Map<ContentNode, string>()

  for (const node of activeNodes) {
    const link = node === indexNode ? '/' : `/${createPageId(node, usedPageIds)}`
    nodeToLink.set(node, link)
  }

  // Write files with rewritten links
  for (const node of activeNodes) {
    const link = nodeToLink.get(node)!
    const targetPath = link === '/' ? join(tempDir, 'index.md') : join(tempDir, `${link.slice(1)}.md`)
    
    let content = node.content
    
    // Rewrite relative links: [text](./other.md) -> [text](/slug)
    content = content.replace(/(\[.*?\]|!\[.*?\])\((.*?)\)/g, (match, prefix, url) => {
      if (url.startsWith('http') || url.startsWith('/') || url.startsWith('#')) return match
      
      const absoluteUrlPath = join(dirname(node.path), url)
      const targetNode = nodes.find(n => n.path === absoluteUrlPath)
      
      if (targetNode) {
        const targetLink = nodeToLink.get(targetNode)
        if (targetLink) {
          return `${prefix}(${targetLink})`
        }
      }
      return match
    })

    await mkdir(dirname(targetPath), { recursive: true })
    await writeFile(targetPath, content)
  }

  const ecosystemGroups = groupByEcosystem(activeNodes)
  const ecosystemSidebarItems: any[] = []

  for (const [ecosystem, groupNodes] of ecosystemGroups) {
    const pageId = `ecosystem-${slugify(ecosystem)}`
    const targetPath = join(tempDir, `${pageId}.md`)
    await writeFile(targetPath, renderEcosystemPage(ecosystem, groupNodes))
    
    const ecosystemLink = `/${pageId}`
    
    const skills = groupNodes.filter(n => n.type === 'skill' || n.type === 'rule' || n.path.includes('rules'))
    const agents = groupNodes.filter(n => n.type === 'agent' && n !== indexNode)
    const resources = groupNodes.filter(n => !skills.includes(n) && !agents.includes(n) && n !== indexNode)

    const items: any[] = []
    if (agents.length) {
      items.push({ text: 'Agents', items: agents.map(n => ({ text: n.title, link: nodeToLink.get(n) })) })
    }
    if (skills.length) {
      items.push({ text: 'Skills', items: skills.map(n => ({ text: n.title, link: nodeToLink.get(n) })) })
    }
    if (resources.length) {
      items.push({ text: 'Resources', items: resources.map(n => ({ text: n.title, link: nodeToLink.get(n) })) })
    }

    ecosystemSidebarItems.push({
      text: ecosystem,
      link: ecosystemLink,
      items: items.length ? items : undefined
    })
  }

  let sidebar: any[] = []

  if (isAllMode) {
    // "ecosytems only show with all mode"
    sidebar = [
      {
        text: 'Ecosystems',
        items: ecosystemSidebarItems
      }
    ]
  } else {
    // Current mode: flat list of agents or grouped by ecosystem but no "Ecosystems" top level
    sidebar = ecosystemSidebarItems.map(item => ({
      text: item.text,
      items: item.items?.flatMap((sub: any) => sub.items) || []
    }))
  }

  // Build top nav
  const nav = isAllMode 
    ? (ecosystemSidebarItems[0] ? [{ text: 'Ecosystems', link: ecosystemSidebarItems[0].link }] : [])
    : ecosystemSidebarItems.map(item => ({ text: item.text, link: item.link }))

  // Generate config
  const vitepressConfig = {
    title: 'AI Agent Portal',
    description: 'AI Agent documentation generated by ai-agent-press',
    lastUpdated: true,
    cleanUrls: true,
    markdown: {
      lineNumbers: true,
    },
    head: [
      ['link', { rel: 'icon', type: 'image/svg+xml', href: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🚀</text></svg>' }],
    ],
    themeConfig: {
      siteTitle: 'AI Agent Portal',
      search: {
        provider: 'local',
      },
      nav,
      sidebar,
      outline: { level: [2, 3], label: 'On this page' },
      returnToTopLabel: 'Back to top',
      footer: {
        message: 'Generated by <a href="https://github.com/nicepkg/ai-agent-press">ai-agent-press</a>',
        copyright: 'MIT Licensed',
      },
      lastUpdatedText: 'Last updated',
      docFooter: {
        prev: 'Previous',
        next: 'Next',
      },
    },
  }

  const config = `import { defineConfig } from 'vitepress'

export default defineConfig(${JSON.stringify(vitepressConfig, null, 2)})
`
  const configDir = join(tempDir, '.vitepress')
  await mkdir(configDir, { recursive: true })
  await writeFile(join(configDir, 'config.ts'), config)

  return tempDir
}

function pickIndexNode(nodes: ContentNode[]): ContentNode | undefined {
  return (
    nodes.find(node => basename(node.path).toUpperCase() === 'GEMINI.MD') ??
    nodes.find(node => basename(node.path).toUpperCase() === 'AGENTS.MD') ??
    nodes[0]
  )
}

function createPageId(node: ContentNode, usedPageIds: Set<string>): string {
  const stem = basename(node.path, extname(node.path))
  const prefix = [node.ecosystem, node.type, stem].map(slugify).join('-')
  let pageId = prefix
  let suffix = 2

  while (usedPageIds.has(pageId)) {
    pageId = `${prefix}-${suffix}`
    suffix += 1
  }

  usedPageIds.add(pageId)
  return pageId
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'page'
}

function groupByEcosystem(nodes: ContentNode[]): Map<Ecosystem, ContentNode[]> {
  const groups = new Map<Ecosystem, ContentNode[]>()

  for (const node of nodes) {
    const existing = groups.get(node.ecosystem) ?? []
    existing.push(node)
    groups.set(node.ecosystem, existing)
  }

  return groups
}

function renderEcosystemPage(ecosystem: Ecosystem, nodes: ContentNode[]): string {
  const sections = nodes.map(node => {
    const parsed = getParsedConfig(node)
    const settings = parsed ? JSON.stringify(parsed, null, 2) : '{}'

    return [
      `## ${node.title}`,
      '',
      `- Type: \`${node.type}\``,
      `- Path: \`${node.path}\``,
      '',
      '```json',
      settings,
      '```',
    ].join('\n')
  })

  return [`# ${ecosystem} Settings`, '', ...sections].join('\n\n')
}

function getParsedConfig(node: ContentNode): unknown {
  const ecosystemConfig = node.metadata?.ecosystemConfig
  if (!isRecord(ecosystemConfig)) return undefined

  const parsed = ecosystemConfig.parsed
  if (!isRecord(parsed)) return undefined

  return {
    format: parsed.format,
    kind: parsed.kind,
    value: parsed.value,
    error: parsed.error,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
