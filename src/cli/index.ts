#!/usr/bin/env node
import path from 'node:path'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { cac } from 'cac'
import { version } from '../../package.json'

import { scan } from '../core/scanner'
import { AGENT_IDS } from '../core/agents'

import type { Agent, SidebarItem } from '../shared/types'
import { computeSidebar, splitNodesByScope } from '../core/sidebar'

export type CliOptions = {
  global?: boolean
  repo?: boolean
  port?: string | number
  outDirectory?: string
  agent?: string | string[]
  all?: boolean
  json?: boolean
}

export function resolveScanRoots(paths: string[] = []): string[] {
  return paths.length > 0 ? paths : [process.cwd()]
}

export function selectedAgents(options: CliOptions): Agent[] | undefined {
  if (options.all) return undefined

  if (!options.agent) return undefined
  const agentOptions = Array.isArray(options.agent)
    ? options.agent
    : options.agent.split(',')

  const parsed = agentOptions.map((a) => a.trim().toLowerCase())
  const valid = parsed.filter((a): a is Agent => AGENT_IDS.includes(a as Agent))
  const invalid = parsed.filter((a) => !AGENT_IDS.includes(a as Agent))

  if (invalid.length > 0) {
    console.warn(`Warning: unknown agent(s) ignored: ${invalid.join(', ')}`)
  }

  return valid.length > 0 ? valid : undefined
}

export function resolvePort(options: CliOptions): number {
  return Number(options.port ?? 5173)
}

export async function scanFromCli(paths: string[] = [], options: CliOptions) {
  // Default: load both. If only one is specified, load only that one.
  let includeGlobal = true
  let includeRepo = true

  if (options.global && !options.repo) {
    includeRepo = false
  } else if (options.repo && !options.global) {
    includeGlobal = false
  }

  const nodes = await scan({
    cwd: resolveScanRoots(paths),
    includeGlobal,
    includeRepo,
    agents: selectedAgents(options),
  })

  // Filter nodes that break build, are irrelevant, or have no parseable content
  return nodes.filter((n) => {
    const b = path.basename(n.path).toLowerCase()
    return (
      !b.includes('cache') &&
      !b.includes('auth.json') &&
      !b.includes('version.json') &&
      !b.includes('.lock') &&
      n.content.trim().length > 0
    )
  })
}

async function previewAction(paths: string[], options: CliOptions) {
  try {
    console.error('Scanning for AI content...')
    const nodes = await scanFromCli(paths, options)
    console.error(`Found ${nodes.length} nodes.`)

    const { serve } = await import('../renderer/vitepress')
    await serve(nodes, resolvePort(options), { isAllMode: !!options.all })
  } catch (error) {
    console.error('Preview server failed:', error)
    process.exit(1)
  }
}

export function createCli() {
  const cli = cac('press')

  // Global options
  cli.option('--global', 'Include global agent configurations (~/.agents, etc.)')
  cli.option('--repo', 'Include current repository configurations')
  cli.option(
    '-a, --agent <name>',
    'Filter by agent (e.g., gemini, claude). Can be specified multiple times.',
  )
  cli.option('-p, --port <port>', 'Port to run the server on', { default: 5173 })
  cli.option('--all', 'Include all agents')
  cli.option('--json', 'Output in JSON format')

  cli
    .command('[...paths]', 'Start local documentation server (Default)')
    .action(previewAction)

  cli
    .command(
      'preview [...paths]',
      'Start local documentation server (Live Preview)',
    )
    .action(previewAction)

  cli
    .command('build [...paths]', 'Generate static documentation site')
    .option('--outDirectory <dir>', 'Output directory', {
      default: '.press/dist',
    })
    .action(async (paths: string[], options: CliOptions) => {
      try {
        console.error('Scanning for AI content...')
        const nodes = await scanFromCli(paths, options)
        console.error(`Found ${nodes.length} nodes.`)

        const outDirectory = options.outDirectory ?? '.press/dist'
        const { render } = await import('../renderer/vitepress')
        await render(nodes, outDirectory, { isAllMode: !!options.all })
        console.error(`Success! Site built to ${outDirectory}`)
      } catch (error) {
        console.error('Build failed:', error)
        process.exit(1)
      }
    })

  cli
    .command('list [...paths]', 'List all discovered agent files (Headless mode)')
    .action(async (paths: string[], options: CliOptions) => {
      const nodes = await scanFromCli(paths, options)

      const { sidebar } = computeSidebar(nodes, { isAllMode: !!options.all })

      if (options.json) {
        console.log(JSON.stringify(sidebar, undefined, 2))
      } else {
        console.log('\nDiscovered AI Agent Files:\n')

        const printSidebar = (items: SidebarItem[], indent: string = '') => {
          // Truncate large lists in terminal for better readability
          const limit = 50
          const itemsToPrint = items.slice(0, limit)

          for (const item of itemsToPrint) {
            if (item.link) {
              console.log(`${indent}- ${item.text} (${item.link})`)
            } else {
              console.log(`${indent}- ${item.text}`)
            }
            if (item.items) {
              printSidebar(item.items, indent + '  ')
            }
          }

          if (items.length > limit) {
            console.log(
              `${indent}... and ${items.length - limit} more. Use --json for full list.`,
            )
          }
        }

        printSidebar(sidebar)

        const { repoNodes, globalNodes } = splitNodesByScope(nodes)
        console.log(
          `\nTotal: ${nodes.length} nodes found (${repoNodes.length} repo, ${globalNodes.length} global).\n`,
        )
      }
    })

  cli
    .command('validate [...paths]', 'Validate agent structures')
    .action(async (paths: string[], options: CliOptions) => {
      console.log('Validating...')
      const nodes = await scanFromCli(paths, options)
      const errors = nodes.filter((n) => !n.content.trim())

      if (errors.length > 0) {
        console.error(`Validation failed: ${errors.length} empty files found.`)
        process.exit(1)
      }
      console.log('Validation successful.')
    })

  cli.command('doctor', 'Diagnostics and environment checks').action(async () => {
    console.log('Running diagnostics...\n')

    console.log(`Node.js  : ${process.version}`)
    console.log(`Platform : ${process.platform} (${process.arch})`)

    const { getBaseTemporaryDirectory } = await import('../renderer/vitepress')
    console.log(`Cache dir: ${getBaseTemporaryDirectory()}`)

    if (process.env.AI_AGENT_PRESS_CACHE_DIR) {
      console.log(`AI_AGENT_PRESS_CACHE_DIR=${process.env.AI_AGENT_PRESS_CACHE_DIR}`)
    }
    if (process.env.PRESS_EXTRA_SKILLS_PATH) {
      console.log(`PRESS_EXTRA_SKILLS_PATH=${process.env.PRESS_EXTRA_SKILLS_PATH}`)
    }

    const request = createRequire(import.meta.url)
    try {
      const vpPackagePath = request.resolve('vitepress/package.json')
      const { version: vpVersion } = JSON.parse(
        await readFile(vpPackagePath, 'utf8'),
      ) as { version: string }
      console.log(`VitePress: ${vpVersion}`)
    } catch {
      console.error('VitePress: NOT FOUND')
    }

    console.log('\nDiagnostics complete.')
  })

  cli.help()
  cli.version(version)

  return cli
}

if (import.meta.main) {
  createCli().parse()
}
