import path from 'node:path'
import { mkdir, writeFile, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import type { ContentNode, SidebarItem } from '../shared/types'
import { build as vitepressBuild, createServer } from 'vitepress'
import {
  buildSidebarItems,
  splitNodesByScope,
  consolidateSidebar,
} from '../core/sidebar'

export interface RenderOptions {
  isAllMode?: boolean
  port?: number
}

export async function render(
  nodes: ContentNode[],
  outDirectory: string,
  options: RenderOptions = {},
) {
  const temporaryDirectory = await prepareTemporaryDirectory(nodes, options)
  console.log('Building VitePress site...')
  await vitepressBuild(temporaryDirectory, {
    outDir: path.join(process.cwd(), outDirectory),
  })
}

export async function serve(
  nodes: ContentNode[],
  port: number,
  options: RenderOptions = {},
) {
  const temporaryDirectory = await prepareTemporaryDirectory(nodes, options)
  console.log(`Starting preview server on http://localhost:${port}...`)

  const server = await createServer(temporaryDirectory, { port })
  await server.listen()
  server.printUrls()
}

export async function prepareTemporaryDirectory(
  nodes: ContentNode[],
  options: RenderOptions = {},
): Promise<string> {
  const { isAllMode = false } = options

  // "it should only have agent in current mode"
  const indexNode = pickIndexNode(nodes)
  const activeNodes = (
    isAllMode
      ? nodes
      : nodes.filter(
          (n) =>
            n.type === 'agent' ||
            n.type === 'skill' ||
            n.type === 'rule' ||
            n.type === 'instruction' ||
            n === indexNode,
        )
  ).filter((n) => {
    const b = path.basename(n.path).toLowerCase()
    // Exclude large cache/system files that break VitePress build
    return (
      !b.includes('cache') &&
      !b.includes('auth.json') &&
      !b.includes('version.json') &&
      !b.includes('.lock')
    )
  })

  const root = process.cwd()
  const nodeModulesPath = path.join(root, 'node_modules')

  const baseTemporaryDirectory = existsSync(nodeModulesPath)
    ? path.join(nodeModulesPath, '.ai-agent-press')
    : path.join(homedir(), '.cache', 'ai-agent-press')

  const temporaryDirectory = path.join(baseTemporaryDirectory, 'temp')

  await rm(temporaryDirectory, { recursive: true, force: true })
  await mkdir(temporaryDirectory, { recursive: true })

  const usedPageIds = new Set<string>()
  const nodeToLink = new Map<ContentNode, string>()

  for (const node of activeNodes) {
    const link =
      node === indexNode ? '/' : `/${createPageId(node, usedPageIds)}`
    nodeToLink.set(node, link)
  }

  // Write files with rewritten links
  for (const node of activeNodes) {
    const link = nodeToLink.get(node)!
    const targetPath =
      link === '/'
        ? path.join(temporaryDirectory, 'index.md')
        : path.join(temporaryDirectory, `${link.slice(1)}.md`)

    let content = node.content

    // Rewrite relative links: [text](./other.md) -> [text](/slug)
    content = content.replaceAll(
      /(\[.*?\]|!\[.*?\])\((.*?)\)/g,
      (match, prefix, url) => {
        if (
          url.startsWith('http') ||
          url.startsWith('/') ||
          url.startsWith('#')
        )
          return match

        const absoluteUrlPath = path.join(path.dirname(node.path), url)
        const targetNode = nodes.find((n) => n.path === absoluteUrlPath)

        if (targetNode) {
          const targetLink = nodeToLink.get(targetNode)
          if (targetLink) {
            return `${prefix}(${targetLink})`
          }
        }
        return match
      },
    )

    await mkdir(path.dirname(targetPath), { recursive: true })

    let finalBody = content
    const isMarkdown = path.extname(node.path).toLowerCase() === '.md'

    if (isMarkdown) {
      // Escape Vue delimiters to prevent compilation errors
      finalBody = finalBody
        .replaceAll('{{', '&#123;&#123;')
        .replaceAll('}}', '&#125;&#125;')
    } else {
      const extension = path.extname(node.path).slice(1) || 'text'
      finalBody = `\n\n\`\`\`${extension}\n${content}\n\`\`\`\n\n`
    }

    // Only wrap in v-pre if it's likely to have Vue-breaking content
    const wrapVPre = !isMarkdown || content.includes('<')

    if (wrapVPre) {
      // Try to preserve H1 by putting it outside v-pre if possible
      const h1Match = finalBody.match(/^#\s+(.*)$/m)
      if (h1Match) {
        const title = h1Match[0]
        const rest = finalBody.slice(h1Match.index! + title.length)
        await writeFile(
          targetPath,
          `${title}\n\n<div v-pre>\n\n${rest}\n\n</div>\n`,
        )
      } else {
        await writeFile(targetPath, `<div v-pre>\n\n${finalBody}\n\n</div>\n`)
      }
    } else {
      await writeFile(targetPath, finalBody)
    }
  }

  const { repoNodes, globalNodes } = splitNodesByScope(activeNodes)

  const repoSidebarItems = buildSidebarItems(
    repoNodes,
    'repo',
    (n) => nodeToLink.get(n)!,
  )
  const globalSidebarItems = buildSidebarItems(
    globalNodes,
    'global',
    (n) => nodeToLink.get(n)!,
  )

  const sidebar = consolidateSidebar(
    repoSidebarItems,
    globalSidebarItems,
    isAllMode,
  )
  const shouldSplit = isAllMode || globalSidebarItems.length > 0

  const findFirstLink = (items: SidebarItem[]): string | undefined => {
    for (const item of items) {
      if (item.link) return item.link
      if (item.items) {
        const nested = findFirstLink(item.items)
        if (nested) return nested
      }
    }
    return undefined
  }

  // Build top nav
  const nav = shouldSplit
    ? [
        ...(globalSidebarItems.length > 0
          ? [{ text: 'Global', link: findFirstLink(globalSidebarItems) || '/' }]
          : []),
        ...(repoSidebarItems.length > 0
          ? [
              {
                text: 'Current Repo',
                link: findFirstLink(repoSidebarItems) || '/',
              },
            ]
          : []),
      ]
    : repoSidebarItems.map((item) => ({
        text: item.text,
        link: item.link || findFirstLink(item.items || []) || '/',
      }))

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
      [
        'link',
        {
          rel: 'icon',
          type: 'image/svg+xml',
          href: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🚀</text></svg>',
        },
      ],
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
        message:
          'Generated by <a href="https://github.com/nicepkg/ai-agent-press">ai-agent-press</a>',
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

export default defineConfig(${JSON.stringify(vitepressConfig, undefined, 2)})
`
  const configDirectory = path.join(temporaryDirectory, '.vitepress')
  await mkdir(configDirectory, { recursive: true })
  await writeFile(path.join(configDirectory, 'config.ts'), config)

  return temporaryDirectory
}

function pickIndexNode(nodes: ContentNode[]): ContentNode | undefined {
  return nodes[0]
}

function createPageId(node: ContentNode, usedPageIds: Set<string>): string {
  const stem = path.basename(node.path, path.extname(node.path))
  // Hierarchical structure: {scope}/{ecosystem}/{category}/{name}
  // Mapping internal types to URL category names
  const categoryMap: Record<string, string> = {
    agent: 'agents',
    skill: 'skills',
    rule: 'skills',
    instruction: 'instructions',
    workflow: 'resources',
  }
  const category = categoryMap[node.type] || node.type
  const parts = [node.scope, node.ecosystem, category, stem]
    .map((p) => p || 'unknown')
    .map((p) => slugify(p))
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

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replaceAll(/[^a-z0-9]+/g, '-')
      .replaceAll(/^-+|-+$/g, '') || 'page'
  )
}
