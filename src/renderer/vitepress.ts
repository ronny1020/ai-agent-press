import path from 'node:path'
import { mkdir, writeFile, rm, symlink } from 'node:fs/promises'
import { homedir } from 'node:os'
import { existsSync } from 'node:fs'
import type { ContentNode, SidebarItem } from '../shared/types'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
import { build as vitepressBuild, createServer } from 'vitepress'
import { computeSidebar, pickIndexNode } from '../core/sidebar'

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

  // Filter nodes that break build or are irrelevant
  const filteredNodes = nodes.filter((n) => {
    const b = path.basename(n.path).toLowerCase()
    return (
      !b.includes('cache') &&
      !b.includes('auth.json') &&
      !b.includes('version.json') &&
      !b.includes('.lock')
    )
  })

  // Compute common sidebar and link structure
  const activeNodes = (
    isAllMode
      ? filteredNodes
      : filteredNodes.filter(
          (n) =>
            n.type === 'skill' ||
            n.type === 'instruction' ||
            n === pickIndexNode(filteredNodes),
        )
  )

  const { sidebar, nodeToLink } = computeSidebar(activeNodes, { isAllMode })

  const baseTemporaryDirectory = getBaseTemporaryDirectory()
  const temporaryDirectory = path.join(baseTemporaryDirectory, 'temp')

  await rm(temporaryDirectory, { recursive: true, force: true })
  await mkdir(temporaryDirectory, { recursive: true })

  let nodeModulesPath = ''
  // Link node_modules so VitePress can resolve dependencies from the temp directory
  try {
    const vitepressPackagePath = require.resolve('vitepress/package.json')
    nodeModulesPath = path.resolve(
      path.dirname(vitepressPackagePath),
      '..',
      '..',
    )
    if (existsSync(nodeModulesPath)) {
      await symlink(
        nodeModulesPath,
        path.join(temporaryDirectory, 'node_modules'),
        'dir',
      )
    }
  } catch (error) {
    console.warn('Could not symlink node_modules to temp directory:', error)
  }

  // Write files with rewritten links
  for (const node of activeNodes) {
    try {
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

      const isMarkdown = path.extname(node.path).toLowerCase() === '.md'
      let finalBody: string

      if (isMarkdown) {
        finalBody = content
      } else {
        const extension = path.extname(node.path).slice(1) || 'text'
        finalBody = `\n\n\`\`\`${extension}\n${content}\n\`\`\`\n\n`
      }

      // Escape Vue delimiters to prevent compilation errors
      finalBody = finalBody
        .replaceAll('{{', '&#123;&#123;')
        .replaceAll('}}', '&#125;&#125;')

      // Only wrap in v-pre if it's markdown and likely to have Vue-breaking content
      const wrapVPre =
        isMarkdown && (content.includes('<') || content.includes('{'))

      if (wrapVPre) {
        // Try to preserve H1 by putting it outside v-pre if possible
        let header = ''
        let bodyToWrap = finalBody

        const h1Match = finalBody.match(/^#\s+(.*)$/m)
        if (h1Match) {
          header = h1Match[0]
          bodyToWrap = finalBody.slice(h1Match.index! + header.length)
        }

        await writeFile(
          targetPath,
          `${header}\n\n<div v-pre>\n\n${bodyToWrap}\n\n</div>\n`,
        )
      } else {
        // For non-markdown files, we still want a title
        let header = ''
        if (!isMarkdown) {
          header = `# ${node.title}\n\n`
        }
        await writeFile(targetPath, `${header}${finalBody}`)
      }
    } catch (error) {
      console.warn(`Failed to process file for VitePress: ${node.path}`, error)
    }
  }

  const repoNodes = activeNodes.filter((n) => n.scope === 'repo')
  const globalNodes = activeNodes.filter((n) => n.scope === 'global')
  const globalSidebarItems = sidebar.find(s => s.text === 'Global')?.items || []
  const repoSidebarItems = sidebar.find(s => s.text === 'Current Repo')?.items || (globalSidebarItems.length === 0 ? sidebar : [])

  const shouldSplit = isAllMode || globalNodes.length > 0

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
        ...(globalNodes.length > 0
          ? [{ text: 'Global', link: findFirstLink(globalSidebarItems) || '/' }]
          : []),
        ...(repoNodes.length > 0
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
    vite: {
      cacheDir: path.join(temporaryDirectory, '.vite'),
      resolve: {
        preserveSymlinks: true,
        alias: [
          {
            find: '@vue/devtools-api',
            replacement: require.resolve('@vue/devtools-api'),
          },
          {
            find: '@vueuse/core',
            replacement: require.resolve('@vueuse/core'),
          },
          {
            find: '@vueuse/integrations/useFocusTrap',
            replacement: require.resolve('@vueuse/integrations/useFocusTrap'),
          },
          {
            find: 'mark.js/src/vanilla.js',
            replacement: require.resolve('mark.js/src/vanilla.js'),
          },
          {
            find: 'minisearch',
            replacement: require.resolve('minisearch'),
          },
        ],
      },
      server: {
        fs: {
          allow: [temporaryDirectory, nodeModulesPath].filter(Boolean),
        },
      },
    },
  }

  const config = `export default ${JSON.stringify(vitepressConfig, undefined, 2)}\n`
  const configDirectory = path.join(temporaryDirectory, '.vitepress')
  await mkdir(configDirectory, { recursive: true })
  await writeFile(path.join(configDirectory, 'config.js'), config)

  return temporaryDirectory
}

export function getBaseTemporaryDirectory(): string {
  if (process.env.AI_AGENT_PRESS_CACHE_DIR) {
    return process.env.AI_AGENT_PRESS_CACHE_DIR
  }

  if (process.platform === 'win32') {
    return path.join(
      process.env.LOCALAPPDATA || path.join(homedir(), 'AppData', 'Local'),
      'ai-agent-press',
    )
  }

  if (process.platform === 'darwin') {
    return path.join(homedir(), 'Library', 'Caches', 'ai-agent-press')
  }

  return (
    process.env.XDG_CACHE_HOME ||
    path.join(homedir(), '.cache', 'ai-agent-press')
  )
}
