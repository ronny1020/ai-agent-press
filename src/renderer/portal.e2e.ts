import { test, expect } from '@playwright/test';

test('portal loads and shows content', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/AI Agent Portal/);
  await expect(page.getByRole('heading', { name: 'Gemini CLI Project Rules' })).toBeVisible();
});

test('portal shows ecosystem review pages for current repo', async ({ page }) => {
  await page.goto('/ecosystem-gemini');
  await expect(page.getByRole('heading', { name: 'gemini Settings' })).toBeVisible();
  await expect(page.locator('code').filter({ hasText: 'GEMINI.md' }).first()).toBeVisible();

  await page.goto('/ecosystem-codex');
  await expect(page.getByRole('heading', { name: 'codex Settings' })).toBeVisible();
  await expect(page.locator('code').filter({ hasText: 'AGENTS.md' }).first()).toBeVisible();

});

test('all sidebar links are valid', async ({ page }) => {
  await page.goto('/');
  // Wait for sidebar to be visible
  await expect(page.locator('.VPSidebar')).toBeVisible();
  
  const links = await page.locator('.VPSidebar a.VPLink').all();
  const hrefs = await Promise.all(links.map(l => l.getAttribute('href')));
  
  for (const href of hrefs) {
    if (!href || href.startsWith('http')) continue;
    
    console.log(`Checking link: ${href}`);
    const response = await page.goto(href);
    expect(response?.status(), `Link ${href} returned ${response?.status()}`).toBe(200);
  }
});

test('all content links are valid', async ({ page }) => {
  await page.goto('/');
  // Wait for content to be loaded
  await expect(page.locator('.vp-doc')).toBeVisible();
  
  const links = await page.locator('.vp-doc a').all();
  const hrefs = await Promise.all(links.map(l => l.getAttribute('href')));
  
  for (const href of hrefs) {
    if (!href || href.startsWith('http') || href.startsWith('#')) continue;
    
    console.log(`Checking content link: ${href}`);
    const response = await page.goto(href);
    expect(response?.status(), `Link ${href} in content returned ${response?.status()}`).toBe(200);
    await page.goBack();
  }
});
