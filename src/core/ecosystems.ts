import path from 'node:path'
import type { Ecosystem, NodeType } from '../shared/types'

export type EcosystemConfig =
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

export interface EcosystemDefinition {
  id: Ecosystem
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
  ): EcosystemConfig
}

export const ECOSYSTEMS: EcosystemDefinition[] = [
  createEcosystem({
    id: 'openclaw',
    label: 'OpenClaw',
    localPatterns: [
      'openclaw.json',
      'openclaw.json5',
      '.openclaw/**/*.{md,json,jsonc,json5,yml,yaml}',
    ],
    globalPatterns: [
      '.openclaw/openclaw.json',
      '.openclaw/**/*.{md,json,jsonc,json5,yml,yaml}',
    ],
    detect: ({ lowerPath, name }) =>
      lowerPath.includes('.openclaw') ||
      name === 'openclaw.json' ||
      name === 'openclaw.json5',
  }),
  createEcosystem({
    id: 'openai',
    label: 'OpenAI',
    localPatterns: ['OPENAI.md', '.openai/**/*.{md,json,jsonc,json5,yml,yaml}'],
    globalPatterns: ['.openai/**/*.{md,json,jsonc,json5,yml,yaml}'],
    detect: ({ lowerPath, name }) =>
      lowerPath.includes('.openai') || name === 'openai.md',
  }),
  createEcosystem({
    id: 'agent',
    label: 'Agent',
    localPatterns: ['AGENTS.md', '.agents/**/*.{md,json,jsonc,json5,yml,yaml}'],
    globalPatterns: ['.agents/**/*.{md,json,jsonc,json5,yml,yaml}'],
    detect: ({ lowerPath, name }) =>
      lowerPath.includes('.agents') || name === 'agents.md',
  }),
  createEcosystem({
    id: 'codex',
    label: 'Codex',
    localPatterns: ['CODEX.md', '.codex/**/*.{md,json,jsonc,json5,yml,yaml}'],
    globalPatterns: ['.codex/**/*.{md,json,jsonc,json5,yml,yaml}'],
    detect: ({ lowerPath, name }) =>
      lowerPath.includes('.codex') || name === 'codex.md',
  }),
  createEcosystem({
    id: 'claude',
    label: 'Claude',
    localPatterns: ['CLAUDE.md', '.claude/**/*.md'],
    globalPatterns: ['.claude/**/*.md'],
    detect: ({ lowerPath }) =>
      lowerPath.includes('.claude') || lowerPath.endsWith('claude.md'),
  }),
  createEcosystem({
    id: 'gemini',
    label: 'Gemini',
    localPatterns: ['GEMINI.md', '.gemini/**/*.md'],
    globalPatterns: ['.config/gemini/**/*.md'],
    detect: ({ lowerPath }) =>
      lowerPath.includes('.gemini') ||
      lowerPath.includes('gemini') ||
      lowerPath.endsWith('gemini.md'),
  }),
  createEcosystem({
    id: 'cursor',
    label: 'Cursor',
    localPatterns: ['.cursor/rules/**/*.md'],
    globalPatterns: ['.cursor/rules/**/*.md'],
    detect: ({ lowerPath }) => lowerPath.includes('.cursor'),
  }),
  createEcosystem({
    id: 'cline',
    label: 'Cline',
    localPatterns: ['.cline/**/*.md', '.clinerules', '.clinerules/**/*.md'],
    globalPatterns: ['.cline/**/*.md', '.clinerules'],
    detect: ({ lowerPath, name }) =>
      lowerPath.includes('.cline') || name === '.clinerules',
  }),
  createEcosystem({
    id: 'roo',
    label: 'Roo',
    localPatterns: ['.roo/**/*.md', '.roomodes', '.roorules', '.roorules-*'],
    globalPatterns: ['.roo/**/*.md', '.roomodes', '.roorules'],
    detect: ({ lowerPath, name }) =>
      lowerPath.includes('.roo') ||
      name === '.roomodes' ||
      name.startsWith('.roorules'),
  }),
  createEcosystem({
    id: 'aider',
    label: 'Aider',
    localPatterns: ['.aider.conf.yml', '.aider.chat.history.md'],
    globalPatterns: ['.aider.conf.yml'],
    detect: ({ name }) =>
      name === '.aider.conf.yml' || name === '.aider.chat.history.md',
  }),
]

export const ECOSYSTEM_IDS = ECOSYSTEMS.map((ecosystem) => ecosystem.id)

export function findEcosystem(path: string): EcosystemDefinition {
  return (
    ECOSYSTEMS.find((ecosystem) => ecosystem.detect(path)) ?? fallbackEcosystem
  )
}

export function detectNodeType(
  path: string,
  ecosystem: EcosystemDefinition,
): NodeType {
  return ecosystem.detectType(path) ?? defaultNodeType(path)
}

function createEcosystem(input: {
  id: Ecosystem
  label: string
  localPatterns: string[]
  globalPatterns: string[]
  detect: (parts: PathParts) => boolean
}): EcosystemDefinition {
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

const fallbackEcosystem = createEcosystem({
  id: 'gemini',
  label: 'Gemini',
  localPatterns: [],
  globalPatterns: [],
  detect: () => true,
})

function pathParts(filePath: string): PathParts {
  return {
    lowerPath: filePath.toLowerCase(),
    name: path.basename(filePath).toLowerCase(),
  }
}

function defaultNodeType(filePath: string): NodeType {
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
  if (lowerPath.includes('rules')) return 'rule'
  if (lowerPath.includes('skills')) return 'skill'
  if (isConfigExtension(filePath)) return 'workflow'
  return 'agent'
}

function parseConfig(
  filePath: string,
  content: string,
  frontmatter: Record<string, unknown>,
  body: string,
): EcosystemConfig {
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

function parseJsonLike(content: string): EcosystemConfig {
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

function parseYamlLike(content: string): EcosystemConfig {
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
