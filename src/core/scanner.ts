import fg from 'fast-glob'
import { readFile } from 'node:fs/promises'
import { join, basename, extname } from 'node:path'
import { homedir } from 'node:os'
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
function normalizeGlob(path: string): string {
  return path.replace(/\\/g, '/')
}

export async function scan(options: ScanOptions): Promise<ContentNode[]> {
  const { cwd, ecosystems, includeGlobal = true, includeRepo = true } = options
  const roots = Array.isArray(cwd) ? cwd : [cwd]

  const repoSearchPaths = includeRepo
    ? roots.flatMap(root => [
        ...ECOSYSTEMS.flatMap(ecosystem =>
          ecosystem.localPatterns.map(pattern => normalizeGlob(join(root, pattern)))
        ),
        normalizeGlob(join(root, '.agents/**/*.{md,json,jsonc,json5,yml,yaml}'))
      ])
    : []

  const home = homedir()
  const globalSearchPaths = includeGlobal
    ? ECOSYSTEMS.flatMap(ecosystem =>
        ecosystem.globalPatterns.map(pattern => normalizeGlob(join(home, pattern)))
      )
    : []

  const [repoFiles, globalFiles] = await Promise.all([
    fg(repoSearchPaths, { absolute: true, ignore: ['**/node_modules/**'] }),
    fg(globalSearchPaths, { absolute: true, ignore: ['**/node_modules/**'] })
  ])

  const nodes: ContentNode[] = []

  const processFile = async (file: string, scope: 'repo' | 'global') => {
    try {
      const content = await readFile(file, 'utf-8')
      const { data, content: body } = matter(content)
      const name = basename(file, extname(file))

      const ecosystemDefinition = findEcosystem(file)
      if (ecosystems?.length && !ecosystems.includes(ecosystemDefinition.id)) return

      nodes.push({
        id: file,
        ecosystem: ecosystemDefinition.id,
        type: detectNodeType(file, ecosystemDefinition),
        scope,
        title: data.title || name,
        path: file,
        content: body,
        metadata: {
          ...data,
          ecosystemConfig: {
            id: ecosystemDefinition.id,
            label: ecosystemDefinition.label,
            source: file,
            parsed: ecosystemDefinition.parse(file, content, data, body),
          },
        },
      })
    } catch (e) {
      console.warn(`Failed to read file: ${file}`, e)
    }
  }

  await Promise.all([
    ...repoFiles.map(f => processFile(f, 'repo')),
    ...globalFiles.map(f => processFile(f, 'global'))
  ])

  return nodes
}
