import { beforeAll, describe, it, expect } from 'bun:test'
import { execSync } from 'node:child_process'
import path from 'node:path'
import { version } from '../../package.json'

import type { SidebarItem } from '../shared/types'

describe('Build Bundle Validation', () => {
  const bundlePath = path.resolve('dist/index.js')

  beforeAll(() => {
    execSync('bun run build', { stdio: 'inherit' })
  })

  it('should be executable via node', () => {
    const output = runNode([bundlePath, '--version']).trim()
    expect(output).toContain(version)
  })

  it('should run list command from bundle', () => {
    // Run on current repo, should find at least GEMINI.md
    const output = runNode([bundlePath, 'list', '--repo'])
    expect(output).toContain('Discovered AI Agent Files')
    expect(output).toContain('gemini')
    expect(output).toContain('Instructions')
  })

  it('should output untruncated JSON from bundle', () => {
    const output = runNode([bundlePath, 'list', '--repo', '--json'])
    const data = JSON.parse(output) as SidebarItem[]
    expect(Array.isArray(data)).toBe(true)
    expect(hasSidebarText(data, 'Instructions')).toBe(true)
  })
})

function runNode(arguments_: string[]): string {
  const environment = { ...process.env }
  delete environment.NODE_OPTIONS

  const result = Bun.spawnSync(['node', ...arguments_], {
    env: environment,
    stderr: 'pipe',
    stdout: 'pipe',
  })

  if (result.exitCode !== 0) {
    throw new Error(
      `node ${arguments_.join(' ')} failed with exit ${result.exitCode}:\n${new TextDecoder().decode(result.stderr)}`,
    )
  }

  return new TextDecoder().decode(result.stdout)
}

function hasSidebarText(items: SidebarItem[], text: string): boolean {
  return items.some(
    (item) =>
      item.text === text || (item.items ? hasSidebarText(item.items, text) : false),
  )
}
