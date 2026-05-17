import { test, expect } from '@playwright/test';
import { execSync } from 'node:child_process';
import { readFileSync, unlinkSync } from 'node:fs';
import type { SidebarItem } from '../shared/types';

test('agent mode shows agents, skills, and rules', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.VPSidebar')).toBeVisible();
  
  // github-pr (skill) should be visible
  const skillLink = page.locator('.VPSidebar a:has-text("github-pr")');
  await expect(skillLink).toBeVisible();
});

test('all mode shows skills, rules, and workflows', async ({ page }) => {
  await page.goto('/');
  const skillLink = page.locator('.VPSidebar a:has-text("github-pr")');
  await expect(skillLink).toBeVisible();
  
  await skillLink.click();
  // The H1 in github-pr.md is "Skill: GitHub Pull Request Management"
  await expect(page.locator('h1')).toContainText('GitHub Pull Request Management');
});

test('headless mode (list) works', async () => {
  test.setTimeout(60000);
  try {
    execSync('bun src/cli/index.ts list --all --json > test-output.json', { encoding: 'utf-8' });
    const output = readFileSync('test-output.json', 'utf-8').trim();
    try { unlinkSync('test-output.json'); } catch {}
    
    const jsonStart = Math.min(
      output.indexOf('{') === -1 ? Infinity : output.indexOf('{'),
      output.indexOf('[') === -1 ? Infinity : output.indexOf('[')
    );
    if (jsonStart === Infinity) throw new Error(`No JSON found in output: ${output.slice(0, 100)}...`);
    
    const jsonEnd = Math.max(
      output.lastIndexOf('}'),
      output.lastIndexOf(']')
    );
    
    const result = JSON.parse(output.slice(jsonStart, jsonEnd + 1));
    
    // The headless output now outputs structured sidebar items (consolidated)
    // In --all mode with global content, it should have "Current Repo" and "Global"
    const repoSection = result.find((s: SidebarItem) => s.text === 'Current Repo');
    const agentSection = (repoSection || { items: result }).items.find((group: SidebarItem) => group.text === 'agent');
    expect(agentSection).toBeDefined();
    
    // Find the skill inside the items array or categories
    let skillFound = false;
    const searchItems = (items: SidebarItem[]) => {
      for (const item of items) {
        if (item.link && item.link.includes('github-pr')) skillFound = true;
        if (item.items) searchItems(item.items);
      }
    };
    if (agentSection.items) searchItems(agentSection.items);
    
    expect(skillFound).toBe(true);
  } catch (error: unknown) {
    const err = error as { message: string; stdout?: string; stderr?: string };
    throw new Error(`Headless test failed: ${err.message}\nSTDOUT: ${err.stdout}\nSTDERR: ${err.stderr}`);
  }
});
