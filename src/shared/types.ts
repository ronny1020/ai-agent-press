export type Agent =
  | 'openai'
  | 'claude'
  | 'gemini'
  | 'cursor'
  | 'agent'
  | 'codex'
  | 'cline'
  | 'roo'
  | 'openclaw'
  | 'aider'
  | 'antigravity'
  | 'aider-desk'
  | 'augment'
  | 'bob'
  | 'codearts-agent'
  | 'codebuddy'
  | 'codemaker'
  | 'codestudio'
  | 'command-code'
  | 'continue'
  | 'cortex'
  | 'crush'
  | 'devin'
  | 'droid'
  | 'forgecode'
  | 'github-copilot'
  | 'goose'
  | 'hermes-agent'
  | 'iflow-cli'
  | 'junie'
  | 'kilo'
  | 'kimi-cli'
  | 'kiro-cli'
  | 'kode'
  | 'mcpjam'
  | 'mistral-vibe'
  | 'mux'
  | 'neovate'
  | 'openhands'
  | 'pi'
  | 'qoder'
  | 'qwen-code'
  | 'rovodev'
  | 'tabnine-cli'
  | 'trae'
  | 'windsurf'
  | 'zencoder'
  | 'pochi'
  | 'adal'

export type NodeType =
  | 'skill'
  | 'instruction'

export interface ContentNode {
  id: string
  agent: Agent
  type: NodeType
  scope?: 'repo' | 'global'
  title: string
  path: string
  content: string
  references?: string[]
  tags?: string[]
  metadata?: Record<string, unknown>
}
export interface SidebarItem {
  text?: string
  link?: string
  items?: SidebarItem[]
  collapsed?: boolean
}
