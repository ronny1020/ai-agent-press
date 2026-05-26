import { test, expect } from '@playwright/test'
import { execSync } from 'node:child_process'
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import path from 'node:path'
import { tmpdir } from 'node:os'
import type { SidebarItem } from '../src/shared/types'

const getTestRepo = () =>
  path.join(tmpdir(), `press-e2e-${Math.random().toString(36).slice(2)}`)

describe('Agent Discovery & UI Structure', () => {

  test('should discover multiple agents and not flatten when multiple exist', async () => {
    const testRepo = getTestRepo()
    mkdirSync(testRepo, { recursive: true })
    try {
      // Setup Cursor rules
      const cursorDirectory = path.join(testRepo, '.cursor', 'rules')
      mkdirSync(cursorDirectory, { recursive: true })
      writeFileSync(
        path.join(cursorDirectory, 'cursor-rule.md'),
        '# Cursor Rule',
      )

      // Setup Roo rules
      const rooDirectory = path.join(testRepo, '.roo', 'rules')
      mkdirSync(rooDirectory, { recursive: true })
      writeFileSync(path.join(rooDirectory, 'roo-rule.md'), '# Roo Rule')

      // Setup Claude instructions
      writeFileSync(path.join(testRepo, 'CLAUDE.md'), '# Claude Instructions')

      const output = execSync(
        `bun src/cli/index.ts list "${testRepo}" --json --repo`,
        { encoding: 'utf8' },
      )
      const sidebar: SidebarItem[] = JSON.parse(output)

      // Should NOT be flattened because there are multiple agents (cursor, roo, claude)
      // The top level should be agents (since scope is flattened - only repo)
      const agentNames = sidebar.map((item) => item.text)
      expect(agentNames).toContain('cursor')
      expect(agentNames).toContain('roo')
      expect(agentNames).toContain('claude')
    } finally {
      rmSync(testRepo, { recursive: true, force: true })
    }
  })

  test('should flatten agent layer when only one agent exists', async () => {
    const testRepo = getTestRepo()
    mkdirSync(testRepo, { recursive: true })
    try {
      const cursorDirectory = path.join(testRepo, '.cursor', 'rules')
      mkdirSync(cursorDirectory, { recursive: true })
      writeFileSync(
        path.join(cursorDirectory, 'only-cursor.md'),
        '# Cursor Only',
      )

      const output = execSync(
        `bun src/cli/index.ts list "${testRepo}" --json --repo`,
        { encoding: 'utf8' },
      )
      const sidebar: SidebarItem[] = JSON.parse(output)

      // Should be flattened: Top level should be Categories (Skills), NOT the agent name
      expect(sidebar.some((item) => item.text === 'cursor')).toBe(false)
      expect(sidebar.some((item) => item.text === 'Skills')).toBe(true)
    } finally {
      rmSync(testRepo, { recursive: true, force: true })
    }
  })

  test('should discover internal agents', async () => {
    const output = execSync(`bun src/cli/index.ts list --json --global`, {
      encoding: 'utf8',
    })
    const sidebar: SidebarItem[] = JSON.parse(output)

    // Internal agents are usually under 'gemini' or 'agent' ecosystem in global scope
    const hasInternal = (items: SidebarItem[]): boolean => {
      for (const item of items) {
        if (
          item.text === 'Instructions' ||
          item.text === 'Skills'
        ) {
          return true
        }
        if (item.items && hasInternal(item.items)) return true
      }
      return false
    }

    expect(hasInternal(sidebar)).toBe(true)
  })
})

function describe(name: string, function_: () => void) {
  function_()
}
