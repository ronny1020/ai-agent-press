export type Ecosystem =
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

export type NodeType =
  | 'agent'
  | 'skill'
  | 'instruction'
  | 'workflow'
  | 'rule'
  | 'prompt'

export interface ContentNode {
  id: string
  ecosystem: Ecosystem
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
