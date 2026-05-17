#!/usr/bin/env node
import { cac } from 'cac'
import { version } from '../../package.json'

import { scan } from '../core/scanner'
import { ECOSYSTEM_IDS } from '../core/ecosystems'
import { render, serve } from '../renderer/vitepress'
import type { Ecosystem, SidebarItem } from '../shared/types'
import { buildSidebarItems, splitNodesByScope, consolidateSidebar } from '../core/sidebar'

const cli = cac('press')

// Global options
cli.option('--global', 'Include global agent configurations (~/.agents, etc.)')
cli.option('--repo', 'Include current repository configurations')
cli.option('--openai', 'Include OpenAI ecosystem')
cli.option('--claude', 'Include Claude ecosystem')
cli.option('--gemini', 'Include Gemini ecosystem')
cli.option('--cursor', 'Include Cursor ecosystem')
cli.option('--agent', 'Include Agent ecosystem')
cli.option('--codex', 'Include Codex ecosystem')
cli.option('--cline', 'Include Cline ecosystem')
cli.option('--roo', 'Include Roo ecosystem')
cli.option('--openclaw', 'Include OpenClaw ecosystem')
cli.option('--aider', 'Include Aider ecosystem')
cli.option('-p, --port <port>', 'Port to run the server on', { default: 5173 })
cli.option('--all', 'Include all ecosystems')
cli.option('--json', 'Output in JSON format')

type CliOptions = {
  global?: boolean
  repo?: boolean
  port?: string | number
  outDir?: string
  openai?: boolean
  claude?: boolean
  gemini?: boolean
  cursor?: boolean
  agent?: boolean
  codex?: boolean
  cline?: boolean
  roo?: boolean
  openclaw?: boolean
  aider?: boolean
  all?: boolean
  json?: boolean
}

const ecosystemFlags: Ecosystem[] = ECOSYSTEM_IDS

function resolveScanRoots(paths: string[] = []): string[] {
  return paths.length ? paths : [process.cwd()]
}

function selectedEcosystems(options: CliOptions): Ecosystem[] | undefined {
  if (options.all) return undefined
  const ecosystems = ecosystemFlags.filter(ecosystem => options[ecosystem])
  return ecosystems.length ? ecosystems : undefined
}

function resolvePort(options: CliOptions): number {
  return Number(options.port ?? 5173)
}

async function scanFromCli(paths: string[] = [], options: CliOptions) {
  const includeGlobal = options.global ?? !options.repo
  const includeRepo = options.repo ?? !options.global

  return scan({
    cwd: resolveScanRoots(paths),
    includeGlobal,
    includeRepo,
    ecosystems: selectedEcosystems(options),
  })
}

async function previewAction(paths: string[], options: CliOptions) {
  try {
    console.error('Scanning for AI content...')
    const nodes = await scanFromCli(paths, options)
    console.error(`Found ${nodes.length} nodes.`)
    
    await serve(nodes, resolvePort(options), { isAllMode: !!options.all })
  } catch (error) {
    console.error('Preview server failed:', error)
    process.exit(1)
  }
}

cli
  .command('[...paths]', 'Start local documentation server (Default)')
  .action(previewAction)

cli
  .command('preview [...paths]', 'Start local documentation server (Live Preview)')
  .action(previewAction)

cli
  .command('build [paths...]', 'Generate static documentation site')
  .option('--outDir <dir>', 'Output directory', { default: '.press/dist' })
  .action(async (paths: string[], options: CliOptions) => {
    try {
      console.error('Scanning for AI content...')
      const nodes = await scanFromCli(paths, options)
      console.error(`Found ${nodes.length} nodes.`)
      
      const outDir = options.outDir ?? '.press/dist'
      await render(nodes, outDir, { isAllMode: !!options.all })
      console.error(`Success! Site built to ${outDir}`)
    } catch (error) {
      console.error('Build failed:', error)
      process.exit(1)
    }
  })

cli
  .command('list', 'List all discovered agent files (Headless mode)')
  .action(async (options: CliOptions) => {
    const nodes = await scanFromCli([], options)
    
    const { repoNodes, globalNodes } = splitNodesByScope(nodes)

    const repoSidebar = buildSidebarItems(repoNodes, 'repo', n => n.path)
    const globalSidebar = buildSidebarItems(globalNodes, 'global', n => n.path)
    
    const sidebar = consolidateSidebar(repoSidebar, globalSidebar, !!options.all)

    if (options.json) {
      console.log(JSON.stringify(sidebar, null, 2))
    } else {
      console.log('\nDiscovered AI Agent Files:\n')
      
      const printSidebar = (items: SidebarItem[], indent: string = '') => {
        for (const item of items) {
          if (item.link) {
            console.log(`${indent}- ${item.text} (${item.link})`)
          } else {
            console.log(`${indent}- ${item.text}`)
          }
          if (item.items) {
            printSidebar(item.items, indent + '  ')
          }
        }
      }

      printSidebar(sidebar)
      
      console.log(`\nTotal: ${nodes.length} nodes found (${repoNodes.length} repo, ${globalNodes.length} global).\n`)
    }
  })

cli
  .command('validate', 'Validate ecosystem structures')
  .action(async (options: CliOptions) => {
    console.log('Validating...')
    const nodes = await scanFromCli([], options)
    const errors = nodes.filter(n => !n.content.trim())
    
    if (errors.length > 0) {
      console.error(`Validation failed: ${errors.length} empty files found.`)
      process.exit(1)
    }
    console.log('Validation successful.')
  })

cli
  .command('doctor', 'Diagnostics and environment checks')
  .action(() => {
    console.log('Running diagnostics...')
  })

cli.help()
cli.version(version)

cli.parse()
