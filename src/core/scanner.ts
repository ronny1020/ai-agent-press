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
  ecosystems?: Ecosystem[]
}

/**
 * fast-glob requires forward slashes even on Windows.
 */
function normalizeGlob(path: string): string {
  return path.replace(/\\/g, '/')
}

export async function scan(options: ScanOptions): Promise<ContentNode[]> {
  const { cwd, includeGlobal, ecosystems } = options
  const roots = Array.isArray(cwd) ? cwd : [cwd]

  const searchPaths = roots.flatMap(root => [
    ...ECOSYSTEMS.flatMap(ecosystem =>
      ecosystem.localPatterns.map(pattern => normalizeGlob(join(root, pattern)))
    ),
    normalizeGlob(join(root, '.agents/**/*.{md,json,jsonc,json5,yml,yaml}'))
  ])

  if (includeGlobal) {
    const home = homedir()
    searchPaths.push(
      ...ECOSYSTEMS.flatMap(ecosystem =>
        ecosystem.globalPatterns.map(pattern => normalizeGlob(join(home, pattern)))
      )
    )
  }

  const files = await fg(searchPaths, { 
    absolute: true,
    ignore: ['**/node_modules/**']
  })
  const nodes: ContentNode[] = []

  for (const file of files) {
    try {
      const content = await readFile(file, 'utf-8')
      const { data, content: body } = matter(content)
      const name = basename(file, extname(file))

      const ecosystemDefinition = findEcosystem(file)
      if (ecosystems?.length && !ecosystems.includes(ecosystemDefinition.id)) continue

      nodes.push({
        id: file,
        title: data.title || name,
        path: file,
        content: body,
        ecosystem: ecosystemDefinition.id,
        type: detectNodeType(file, ecosystemDefinition),
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

  return nodes
}
