import path from 'node:path'
import fg from 'fast-glob'
import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'
import type { ContentNode, Ecosystem } from '../shared/types'
import { ECOSYSTEMS, detectNodeType, findEcosystem } from './ecosystems'

export interface ScanOptions {
  cwd: string | string[]
  includeGlobal?: boolean
  includeRepo?: boolean
  ecosystems?: Ecosystem[]
}

/**
 * fast-glob requires forward slashes even on Windows.
 */
function normalizeGlob(pathName: string): string {
  return pathName.replaceAll('\\', '/')
}

function getInternalAgentsPath(): string {
  try {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    // Check if we're in dist/ or src/core/
    const isDistribution = __dirname.endsWith('dist') || __dirname.includes('dist/')
    return path.resolve(__dirname, isDistribution ? '..' : '../..')
  } catch {
    return ''
  }
}

export async function scan(options: ScanOptions): Promise<ContentNode[]> {
  const { cwd, ecosystems, includeGlobal = true, includeRepo = true } = options
  const roots = Array.isArray(cwd) ? cwd : [cwd]

  const repoSearchPaths = includeRepo
    ? roots.flatMap((root) => [
        ...ECOSYSTEMS.flatMap((ecosystem) =>
          ecosystem.localPatterns.map((pattern) =>
            normalizeGlob(path.join(root, pattern)),
          ),
        ),
        normalizeGlob(
          path.join(
            root,
            '.agents/**/*.{md,json,jsonc,json5,yml,yaml,ts,js,py,sh}',
          ),
        ),
      ])
    : []

  const home = path.resolve(homedir())
  let globalBasePaths = [home]

  // Add internal package root
  const internalRoot = getInternalAgentsPath()
  if (internalRoot && internalRoot !== home) {
    globalBasePaths.push(internalRoot)
  }

  // Add global node_modules locations
  if (process.platform === 'win32') {
    if (process.env.APPDATA) {
      globalBasePaths.push(
        path.resolve(path.join(process.env.APPDATA, 'npm/node_modules')),
      )
    }
  } else {
    globalBasePaths.push('/usr/local/lib/node_modules', '/usr/lib/node_modules')
  }

  // Deduplicate against roots to avoid double scanning when running in home or internal root
  const resolvedRoots = new Set(roots.map((r) => path.resolve(r)))
  globalBasePaths = [...new Set(globalBasePaths)].filter(
    (base) => !resolvedRoots.has(base),
  )

  const globalSearchPaths = includeGlobal
    ? ECOSYSTEMS.flatMap((ecosystem) =>
        ecosystem.globalPatterns.flatMap((pattern) =>
          globalBasePaths.flatMap((base) => {
            const paths = [normalizeGlob(path.join(base, pattern))]
            if (base.toLowerCase().includes('node_modules')) {
              paths.push(normalizeGlob(path.join(base, '*/', pattern)))
            }
            return paths
          }),
        ),
      )
    : []

  const [repoFiles, globalFiles] = await Promise.all([
    fg(repoSearchPaths, {
      absolute: true,
      ignore: ['**/node_modules/**', '**/README.md'],
    }),
    fg(globalSearchPaths, {
      absolute: true,
      ignore: ['**/node_modules/**', '**/README.md'],
    }),
  ])

  const nodes: ContentNode[] = []

  const processFile = async (file: string, scope: 'repo' | 'global') => {
    try {
      const rawContent = await readFile(file, 'utf8')
      const isMarkdown = path.extname(file).toLowerCase() === '.md'

      const { data, content: body } = isMarkdown
        ? matter(rawContent)
        : { data: {}, content: rawContent }

      const name = path.basename(file, path.extname(file))
      const ecosystemDefinition = findEcosystem(file)
      if (ecosystems?.length && !ecosystems.includes(ecosystemDefinition.id))
        return

      nodes.push({
        id: file,
        ecosystem: ecosystemDefinition.id,
        type: detectNodeType(file, ecosystemDefinition),
        scope,
        title: ((data as Record<string, unknown>).title as string) || name,
        path: file,
        content: body,
        metadata: {
          ...data,
          ecosystemConfig: {
            id: ecosystemDefinition.id,
            label: ecosystemDefinition.label,
            source: file,
            parsed: ecosystemDefinition.parse(file, rawContent, data, body),
          },
        },
      })
    } catch (error) {
      console.warn(`Failed to read file: ${file}`, error)
    }
  }

  await Promise.all([
    ...repoFiles.map((f) => processFile(f, 'repo')),
    ...globalFiles.map((f) => processFile(f, 'global')),
  ])

  return nodes
}
