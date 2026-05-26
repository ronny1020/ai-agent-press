import path from 'node:path'
import fg from 'fast-glob'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'
import type { Agent, ContentNode } from '../shared/types'
import {
  AGENTS,
  detectNodeType,
  findAgent,
} from './agents'

export interface ScanOptions {
  cwd: string | string[]
  includeGlobal?: boolean
  includeRepo?: boolean
  agents?: Agent[]
}


function getInternalAgentsPath(): string {
  try {
    const __filename = fileURLToPath(import.meta.url)
    // Walk up until we find package.json — works from both dist/ and src/core/
    let directory = path.dirname(__filename)
    for (let index = 0; index < 4; index++) {
      if (existsSync(path.join(directory, 'package.json'))) return directory
      const parent = path.dirname(directory)
      if (parent === directory) break
      directory = parent
    }
    return ''
  } catch {
    return ''
  }
}

export async function scan(options: ScanOptions): Promise<ContentNode[]> {
  const { cwd, agents, includeGlobal = true, includeRepo = true } = options
  const roots = (Array.isArray(cwd) ? cwd : [cwd]).map((root) =>
    path.resolve(root),
  )

  const home = path.resolve(homedir())
  let globalBasePaths = [home]

  // Allow opt-in extra skills directory via env var (e.g. PRESS_EXTRA_SKILLS_PATH=~/projects/skills)
  const extraSkillsPath = process.env.PRESS_EXTRA_SKILLS_PATH
  if (extraSkillsPath) {
    globalBasePaths.push(path.resolve(extraSkillsPath.replace(/^~/, home)))
  }

  // Add internal package root
  const internalRoot = getInternalAgentsPath()
  if (internalRoot && internalRoot !== home) {
    globalBasePaths.push(internalRoot)
  }

  // Add global node_modules locations ONLY when explicitly enabled.
  if (process.env.INCLUDE_GLOBAL_NODE_MODULES === '1') {
    if (process.platform === 'win32') {
      if (process.env.APPDATA) {
        globalBasePaths.push(
          path.resolve(path.join(process.env.APPDATA, 'npm/node_modules')),
        )
      }
    } else {
      globalBasePaths.push('/usr/local/lib/node_modules', '/usr/lib/node_modules')
    }
  }

  // Deduplicate against roots to avoid double scanning,
  // but always keep the internal root so bundled docs are always discoverable
  // even when running `press` from inside the package directory itself.
  const resolvedRoots = new Set(roots)
  globalBasePaths = [...new Set(globalBasePaths)].filter(
    (base) => (internalRoot && base === internalRoot) || !resolvedRoots.has(base),
  )

  const ignorePatterns = [
    '**/node_modules/**',
    '**/.git/**',
    '**/.cache/**',
    // Temporary tool outputs and metadata
    '**/*.metadata',
    '**/*.metadata.json',
    '**/*.resolved',
    '**/*.resolved.*',
    '**/tmp/**',
    '**/temp/**',
    '**/.tmp/**',
    '**/tool-outputs/**',
    '**/playwright-report/**',
    '**/test-results/**',
    '**/.app/**',
    '**/.mcp/**',
    '**/plugin.lock',
    '**/*.orig',
    '**/*.bak',
    '**/.system_generated/**',
  ]

  const nodes: ContentNode[] = []

  const processFile = async (file: string, scope: 'repo' | 'global') => {
    try {
      const rawContent = await readFile(file, 'utf8')
      const isMarkdown = path.extname(file).toLowerCase() === '.md'

      let data: Record<string, unknown> = {}
      let body = rawContent

      if (isMarkdown) {
        try {
          const result = matter(rawContent)
          data = result.data
          body = result.content
        } catch {
          // If frontmatter parsing fails, treat the whole thing as body
        }
      }

      const name = path.basename(file, path.extname(file))
      const agentDefinition = findAgent(file)

      if (!agentDefinition) return // Skip files that don't match any known agent

      if (agents?.length && !agents.includes(agentDefinition.id))
        return

      const type = detectNodeType(file, agentDefinition)

      if (!type) return // Ignore files that don't match any node type

      nodes.push({
        id: file,
        agent: agentDefinition.id,
        type,
        scope,
        title: ((data as Record<string, unknown>).title as string) || name,
        path: file,
        content: body,
        metadata: {
          ...data,
          agentConfig: {
            id: agentDefinition.id,
            label: agentDefinition.label,
            source: file,
            parsed: agentDefinition.parse(file, rawContent, data, body),
          },
        },
      })
    } catch (error) {
      console.warn(`Failed to read file: ${file}`, error)
    }
  }

  const scanPath = async (base: string, scope: 'repo' | 'global') => {
    const patterns = AGENTS.flatMap((agent) =>
      scope === 'repo' ? agent.localPatterns : agent.globalPatterns,
    )

    const files = await fg(patterns, {
      cwd: base,
      absolute: true,
      ignore: ignorePatterns,
      dot: true,
    })

    await Promise.all(files.map((f) => processFile(f, scope)))
  }

  const tasks: Promise<void>[] = []
  if (includeRepo) {
    for (const root of roots) {
      tasks.push(scanPath(root, 'repo'))
    }
  }
  if (includeGlobal) {
    for (const base of globalBasePaths) {
      tasks.push(scanPath(base, 'global'))
    }
  }

  await Promise.all(tasks)

  // Return sorted by path for deterministic ordering across runs
  return nodes.toSorted((a, b) => a.path.localeCompare(b.path))
}
