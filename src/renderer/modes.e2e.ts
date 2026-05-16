import { test, expect } from '@playwright/test';
import { execSync } from 'node:child_process';

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
    const output = execSync('bun src/cli/index.ts list --all --json', { encoding: 'utf-8' });
    const jsonStart = output.indexOf('[');
    if (jsonStart === -1) throw new Error(`No JSON array found in output: ${output}`);
    const nodes = JSON.parse(output.slice(jsonStart));
    const skill = nodes.find((n: any) => n.path.includes('github-pr.md'));
    expect(skill).toBeDefined();
    expect(skill.type).toBe('skill');
  } catch (error: any) {
    throw new Error(`Headless test failed: ${error.message}\nSTDOUT: ${error.stdout}\nSTDERR: ${error.stderr}`);
  }
});
