import path from 'node:path'
import type { Agent, NodeType } from '../shared/types'

export const ASSET_EXTENSIONS = [
  'md',
  'json',
  'jsonc',
  'json5',
  'yml',
  'yaml',
  'ts',
  'js',
  'py',
  'sh',
  'mdc',
  'txt',
]
export const ASSET_GLOB = `**/*.{${ASSET_EXTENSIONS.join(',')}}`

export type AgentConfig =
  | {
      kind: 'object'
      format: 'json' | 'markdown-frontmatter' | 'yaml'
      value: Record<string, unknown>
    }
  | {
      kind: 'text'
      format: 'markdown' | 'plain'
      value: string
    }
  | {
      kind: 'unparsed'
      format: 'json' | 'yaml'
      value: string
      error: string
    }

export interface AgentDefinition {
  id: Agent
  label: string
  localPatterns: string[]
  globalPatterns: string[]
  detect(path: string): boolean
  detectType(path: string): NodeType | undefined
  parse(
    path: string,
    content: string,
    frontmatter: Record<string, unknown>,
    body: string,
  ): AgentConfig
}

export const AGENTS: AgentDefinition[] = [
  createAgent({
    id: 'antigravity',
    label: 'Antigravity',
    localPatterns: ['.gemini/antigravity/brain/**/*.md'],
    globalPatterns: ['.gemini/antigravity/brain/**/*.md'],
    detect: ({ lowerPath }) =>
      /(^|\/)\.gemini\/antigravity\/brain\//.test(lowerPath) &&
      lowerPath.endsWith('.md'),
  }),
  createAgent({
    id: 'openclaw',
    label: 'OpenClaw',
    localPatterns: [
      'openclaw.json',
      'openclaw.json5',
      '.openclaw/' + ASSET_GLOB,
    ],
    globalPatterns: [
      'openclaw.json',
      'openclaw.json5',
      '.openclaw/' + ASSET_GLOB,
    ],
    detect: ({ lowerPath, name }) =>
      /(^|\/)\.openclaw(\/|$)/.test(lowerPath) ||
      name === 'openclaw.json' ||
      name === 'openclaw.json5',
  }),
  createAgent({
    id: 'openai',
    label: 'OpenAI',
    localPatterns: ['OPENAI.md', '.openai/' + ASSET_GLOB],
    globalPatterns: ['OPENAI.md', '.openai/skills/' + ASSET_GLOB],
    detect: ({ lowerPath, name }) =>
      /(^|\/)\.openai(\/|$)/.test(lowerPath) || name === 'openai.md',
  }),
  createAgent({
    id: 'agent',
    label: 'Agent',
    localPatterns: ['AGENTS.md', '.agents/' + ASSET_GLOB],
    globalPatterns: ['AGENTS.md', '.agents/skills/' + ASSET_GLOB],
    detect: ({ lowerPath, name }) =>
      /(^|\/)\.agents(\/|$)/.test(lowerPath) || name === 'agents.md',
  }),
  createAgent({
    id: 'codex',
    label: 'Codex',
    localPatterns: ['CODEX.md', '.codex/' + ASSET_GLOB],
    globalPatterns: ['CODEX.md', '.codex/skills/' + ASSET_GLOB],
    detect: ({ lowerPath, name }) =>
      /(^|\/)\.codex(\/|$)/.test(lowerPath) || name === 'codex.md',
  }),
  createAgent({
    id: 'claude',
    label: 'Claude',
    localPatterns: [
      'CLAUDE.md',
      '.claude/' + ASSET_GLOB,
      'claude_desktop_config.json',
    ],
    globalPatterns: [
      'CLAUDE.md',
      '.claude/skills/' + ASSET_GLOB,
      'claude_desktop_config.json',
    ],
    detect: ({ lowerPath, name }) =>
      /(^|\/)\.claude(\/|$)/.test(lowerPath) ||
      lowerPath.endsWith('claude.md') ||
      name === 'claude_desktop_config.json',
  }),
  createAgent({
    id: 'gemini',
    label: 'Gemini',
    localPatterns: ['GEMINI.md', '.gemini/' + ASSET_GLOB],
    globalPatterns: [
      '.gemini/GEMINI.md',
      '.gemini/skills/' + ASSET_GLOB,
      '.config/gemini/GEMINI.md',
      '.config/gemini/skills/' + ASSET_GLOB,
    ],
    detect: ({ lowerPath, name }) =>
      /(^|\/)\.gemini(\/|$)/.test(lowerPath) ||
      /(^|\/)\.config\/gemini(\/|$)/.test(lowerPath) ||
      name === 'gemini.md' ||
      name === 'memory.md',
  }),
  createAgent({
    id: 'cursor',
    label: 'Cursor',
    localPatterns: [
      '.cursor/rules/**/*.{md,ts,js,py,sh,mdc}',
      '.cursorrules',
    ],
    globalPatterns: [
      '.cursor/rules/**/*.{md,ts,js,py,sh,mdc}',
      '.cursorrules',
    ],
    detect: ({ lowerPath, name }) =>
      /(^|\/)\.cursor(\/|$)/.test(lowerPath) || name === '.cursorrules',
  }),
  createAgent({
    id: 'cline',
    label: 'Cline',
    localPatterns: [
      '.cline/' + ASSET_GLOB,
      '.clinerules',
      '.clinerules/' + ASSET_GLOB,
    ],
    globalPatterns: ['.cline/skills/' + ASSET_GLOB, '.clinerules'],
    detect: ({ lowerPath, name }) =>
      /(^|\/)\.cline(\/|$)/.test(lowerPath) ||
      name === '.clinerules' ||
      /(^|\/)\.clinerules(\/|$)/.test(lowerPath),
  }),
  createAgent({
    id: 'roo',
    label: 'Roo',
    localPatterns: [
      '.roo/' + ASSET_GLOB,
      '.roomodes',
      '.roorules',
      '.roorules-*',
      '.roo/rules/**/*.{md,txt}',
    ],
    globalPatterns: [
      '.roo/rules/**/*.{md,txt}',
      '.roomodes',
      '.roorules',
      'custom_modes.yaml',
    ],
    detect: ({ lowerPath, name }) =>
      /(^|\/)\.roo(\/|$)/.test(lowerPath) ||
      name === '.roomodes' ||
      name.startsWith('.roorules') ||
      name === 'custom_modes.yaml',
  }),
  createAgent({
    id: 'aider',
    label: 'Aider',
    localPatterns: ['.aider.conf.yml', '.aider.chat.history.md'],
    globalPatterns: ['.aider.conf.yml'],
    detect: ({ name }) =>
      name === '.aider.conf.yml' || name === '.aider.chat.history.md',
  }),
  // Simple agents from vercel-labs/skills
  ...createSimpleAgents([
    { id: 'aider-desk', label: 'AiderDesk', dir: '.aider-desk' },

    { id: 'augment', label: 'Augment', dir: '.augment' },
    { id: 'bob', label: 'IBM Bob', dir: '.bob' },
    { id: 'codearts-agent', label: 'CodeArts Agent', dir: '.codeartsdoer' },
    { id: 'codebuddy', label: 'CodeBuddy', dir: '.codebuddy' },
    { id: 'codemaker', label: 'Codemaker', dir: '.codemaker' },
    { id: 'codestudio', label: 'Code Studio', dir: '.codestudio' },
    { id: 'command-code', label: 'Command Code', dir: '.commandcode' },
    { id: 'continue', label: 'Continue', dir: '.continue' },
    { id: 'cortex', label: 'Cortex Code', dir: '.cortex' },
    { id: 'crush', label: 'Crush', dir: '.crush' },
    { id: 'devin', label: 'Devin', dir: '.devin' },
    { id: 'droid', label: 'Droid', dir: '.factory' },
    { id: 'forgecode', label: 'ForgeCode', dir: '.forge' },
    { id: 'github-copilot', label: 'GitHub Copilot', dir: '.copilot' },
    { id: 'goose', label: 'Goose', dir: '.goose' },
    { id: 'hermes-agent', label: 'Hermes Agent', dir: '.hermes' },
    { id: 'iflow-cli', label: 'iFlow CLI', dir: '.iflow' },
    { id: 'junie', label: 'Junie', dir: '.junie' },
    { id: 'kilo', label: 'Kilo Code', dir: '.kilocode' },
    { id: 'kimi-cli', label: 'Kimi Code CLI', dir: '.kimi' },
    { id: 'kiro-cli', label: 'Kiro CLI', dir: '.kiro' },
    { id: 'kode', label: 'Kode', dir: '.kode' },
    { id: 'mcpjam', label: 'MCPJam', dir: '.mcpjam' },
    { id: 'mistral-vibe', label: 'Mistral Vibe', dir: '.vibe' },
    { id: 'mux', label: 'Mux', dir: '.mux' },
    { id: 'neovate', label: 'Neovate', dir: '.neovate' },
    { id: 'openhands', label: 'OpenHands', dir: '.openhands' },
    { id: 'pi', label: 'Pi', dir: '.pi' },
    { id: 'qoder', label: 'Qoder', dir: '.qoder' },
    { id: 'qwen-code', label: 'Qwen Code', dir: '.qwen' },
    { id: 'rovodev', label: 'Rovo Dev', dir: '.rovodev' },
    { id: 'tabnine-cli', label: 'Tabnine CLI', dir: '.tabnine' },
    { id: 'trae', label: 'Trae', dir: '.trae' },
    { id: 'windsurf', label: 'Windsurf', dir: '.windsurf' },
    { id: 'zencoder', label: 'Zencoder', dir: '.zencoder' },
    { id: 'pochi', label: 'Pochi', dir: '.pochi' },
    { id: 'adal', label: 'AdaL', dir: '.adal' },
  ]),
]

function createSimpleAgents(
  items: { id: Agent; label: string; dir: string }[],
): AgentDefinition[] {
  return items.map((item) =>
    createAgent({
      id: item.id,
      label: item.label,
      localPatterns: [`${item.dir}/${ASSET_GLOB}`],
      // Global simple agents should only look in their specific hidden folder
      globalPatterns: [`${item.dir}/skills/${ASSET_GLOB}`, `${item.dir}/rules/${ASSET_GLOB}`],
      detect: ({ lowerPath }) => {
        const escapedDirectory = item.dir.replaceAll('.', String.raw`\.`)
        // Match if it's a folder segment or the folder itself
        const regex = new RegExp(`(^|/)${escapedDirectory}(/|$)`)
        return regex.test(lowerPath)
      },
    }),
  )
}

export const AGENT_IDS = AGENTS.map((agent) => agent.id)

export function findAgent(path: string): AgentDefinition {
  return (
    AGENTS.find((agent) => agent.detect(path)) ?? fallbackAgent
  )
}

export function detectNodeType(
  path: string,
  agent: AgentDefinition,
): NodeType | undefined {
  return agent.detectType(path) ?? defaultNodeType(path)
}

function createAgent(input: {
  id: Agent
  label: string
  localPatterns: string[]
  globalPatterns: string[]
  detect: (parts: PathParts) => boolean
}): AgentDefinition {
  return {
    ...input,
    detect: (path) => input.detect(pathParts(path)),
    detectType: defaultNodeType,
    parse: parseConfig,
  }
}

interface PathParts {
  lowerPath: string
  name: string
}

const fallbackAgent = createAgent({
  id: 'gemini',
  label: 'Gemini',
  localPatterns: [],
  globalPatterns: [],
  detect: () => true,
})


function pathParts(filePath: string): PathParts {
  const normalized = filePath.replaceAll('\\', '/')
  return {
    lowerPath: normalized.toLowerCase(),
    name: path.basename(filePath).toLowerCase(),
  }
}

function defaultNodeType(filePath: string): NodeType | undefined {
  const name = path.basename(filePath).toUpperCase()
  if (
    name === 'GEMINI.MD' ||
    name === 'AGENTS.MD' ||
    name === 'CODEX.MD' ||
    name === 'CLAUDE.MD' ||
    name === 'OPENAI.MD'
  )
    return 'instruction'
  
  const lowerPath = filePath.toLowerCase()
  
  // Skill detection: must be in a recognized skill-like folder
  if (
    lowerPath.includes('/skills/') || 
    lowerPath.includes('/rules/') ||
    lowerPath.includes('/mcp/') ||
    lowerPath.includes('/tools/') ||
    lowerPath.includes('/antigravity/brain/')
  ) {
    return 'skill'
  }

  // Instruction detection: markdown files
  if (lowerPath.endsWith('.md')) {
    return 'instruction'
  }

  // Known agent configuration files that are skills (but not MD)
  const filename = path.basename(filePath).toLowerCase()
  if (
    filename === '.roomodes' ||
    filename === '.roorules' ||
    filename === '.cursorrules' ||
    filename === '.clinerules' ||
    filename === 'openclaw.json' ||
    filename === 'openclaw.json5' ||
    filename === 'claude_desktop_config.json' ||
    filename === 'custom_modes.yaml' ||
    filename === '.aider.conf.yml'
  ) {
    return 'skill'
  }

  // Catch-all for config files that were explicitly found via patterns
  if (isConfigExtension(filePath)) {
    return 'skill'
  }

  return undefined
}

function parseConfig(
  filePath: string,
  content: string,
  frontmatter: Record<string, unknown>,
  body: string,
): AgentConfig {
  const extension = path.extname(filePath).toLowerCase()

  if (Object.keys(frontmatter).length > 0) {
    return {
      kind: 'object',
      format: 'markdown-frontmatter',
      value: frontmatter,
    }
  }

  if (
    extension === '.json' ||
    extension === '.jsonc' ||
    extension === '.json5'
  ) {
    return parseJsonLike(content)
  }

  if (extension === '.yml' || extension === '.yaml') {
    return parseYamlLike(content)
  }

  if (extension === '.md') {
    return {
      kind: 'text',
      format: 'markdown',
      value: body,
    }
  }

  return {
    kind: 'text',
    format: 'plain',
    value: content,
  }
}

function parseJsonLike(content: string): AgentConfig {
  try {
    return {
      kind: 'object',
      format: 'json',
      value: JSON.parse(stripJsonComments(content)) as Record<string, unknown>,
    }
  } catch (error) {
    return {
      kind: 'unparsed',
      format: 'json',
      value: content,
      error:
        error instanceof Error ? error.message : 'Unknown JSON parse error',
    }
  }
}

function parseYamlLike(content: string): AgentConfig {
  const value: Record<string, unknown> = {}
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const match = /^([A-Za-z0-9_.-]+):\s*(.*)$/.exec(trimmed)
    if (!match) continue

    const key = match[1]
    if (!key) continue
    const rawValue = match[2] ?? ''
    value[key] = parseScalar(rawValue)
  }

  if (Object.keys(value).length === 0 && content.trim()) {
    return {
      kind: 'unparsed',
      format: 'yaml',
      value: content,
      error: 'No simple key-value settings found',
    }
  }

  return {
    kind: 'object',
    format: 'yaml',
    value,
  }
}

function parseScalar(value: string): unknown {
  const trimmed = value.trim()
  if (trimmed === 'true') return true
  if (trimmed === 'false') return false
  if (trimmed === 'undefined') return undefined
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed)
  return trimmed.replaceAll(/^["']|["']$/g, '')
}

function stripJsonComments(content: string): string {
  return content
    .replaceAll(/\/\*[\s\S]*?\*\//g, '')
    .replaceAll(/^\s*\/\/.*$/gm, '')
    .replaceAll(/([{,]\s*)([A-Za-z_$][\w$.-]*)(\s*:)/g, '$1"$2"$3')
    .replaceAll(/'([^']*)'/g, (_, value: string) => JSON.stringify(value))
    .replaceAll(/,\s*([}\]])/g, '$1')
}

function isConfigExtension(pathString: string): boolean {
  return ['.json', '.json5', '.jsonc', '.yml', '.yaml'].includes(
    path.extname(pathString).toLowerCase(),
  )
}
