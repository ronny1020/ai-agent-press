import { describe, it, expect, spyOn, beforeEach, afterEach } from 'bun:test'
import { resolvePort, selectedAgents, resolveScanRoots, scanFromCli } from './index'
import * as scanner from '../core/scanner'

describe('CLI Options Logic', () => {
  let scanSpy: ReturnType<typeof spyOn>

  beforeEach(() => {
    scanSpy = spyOn(scanner, 'scan').mockImplementation(() => Promise.resolve([]))
  })

  afterEach(() => {
    scanSpy.mockRestore()
  })
  describe('resolvePort', () => {
    it('should return default port 5173 when not specified', () => {
      expect(resolvePort({})).toBe(5173)
    })

    it('should return specified port from number', () => {
      expect(resolvePort({ port: 3000 })).toBe(3000)
    })

    it('should return specified port from string', () => {
      expect(resolvePort({ port: '4000' })).toBe(4000)
    })
  })

  describe('selectedAgents', () => {
    it('should return undefined when no agent specified', () => {
      expect(selectedAgents({})).toBeUndefined()
    })

    it('should return undefined when --all is set', () => {
      expect(selectedAgents({ agent: 'gemini', all: true })).toBeUndefined()
    })

    it('should parse single agent', () => {
      expect(selectedAgents({ agent: 'gemini' })).toEqual(['gemini'])
    })

    it('should parse comma-separated agents', () => {
      expect(selectedAgents({ agent: 'gemini,claude' })).toEqual(['gemini', 'claude'])
    })

    it('should handle array of agents (from repeated flags)', () => {
      expect(selectedAgents({ agent: ['gemini', 'claude'] })).toEqual(['gemini', 'claude'])
    })

    it('should lowercase agent names', () => {
      expect(selectedAgents({ agent: 'Gemini' })).toEqual(['gemini'])
    })
  })

  describe('resolveScanRoots', () => {
    it('should return current directory when no paths provided', () => {
      const roots = resolveScanRoots([])
      expect(roots).toHaveLength(1)
      expect(roots[0]).toBe(process.cwd())
    })

    it('should return provided paths', () => {
      const paths = ['./foo', './bar']
      expect(resolveScanRoots(paths)).toEqual(paths)
    })
  })

  describe('scanFromCli', () => {
    it('should default to both global and repo', async () => {
      await scanFromCli([], {})
      expect(scanner.scan).toHaveBeenCalledWith(expect.objectContaining({
        includeGlobal: true,
        includeRepo: true,
      }))
    })

    it('should load ONLY global when --global is set', async () => {
      await scanFromCli([], { global: true })
      expect(scanner.scan).toHaveBeenCalledWith(expect.objectContaining({
        includeGlobal: true,
        includeRepo: false,
      }))
    })

    it('should load ONLY repo when --repo is set', async () => {
      await scanFromCli([], { repo: true })
      expect(scanner.scan).toHaveBeenCalledWith(expect.objectContaining({
        includeGlobal: false,
        includeRepo: true,
      }))
    })

    it('should load both when both flags are set', async () => {
      await scanFromCli([], { global: true, repo: true })
      expect(scanner.scan).toHaveBeenCalledWith(expect.objectContaining({
        includeGlobal: true,
        includeRepo: true,
      }))
    })

    it('should pass agents to scanner', async () => {
      await scanFromCli([], { agent: 'gemini' })
      expect(scanner.scan).toHaveBeenCalledWith(expect.objectContaining({
        agents: ['gemini'],
      }))
    })

    it('should exclude nodes with empty or whitespace-only content', async () => {
      scanSpy.mockImplementation(() =>
        Promise.resolve([
          { id: '1', agent: 'gemini', type: 'skill', scope: 'repo', title: 'ok', path: 'ok.md', content: '# Hello' },
          { id: '2', agent: 'gemini', type: 'skill', scope: 'repo', title: 'empty', path: 'empty.md', content: '' },
          { id: '3', agent: 'gemini', type: 'skill', scope: 'repo', title: 'ws', path: 'ws.md', content: '   \n  ' },
        ] as never[]),
      )
      const result = await scanFromCli([], {})
      expect(result).toHaveLength(1)
      expect(result[0]?.id).toBe('1')
    })
  })
})
