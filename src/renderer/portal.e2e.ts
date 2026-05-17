import { test, expect } from '@playwright/test'

test('portal loads and shows content', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/AI Agent Portal/)
  await page.waitForSelector('.vp-doc h1')
  await expect(
    page.getByRole('heading', { name: 'Gemini CLI Project Rules' }),
  ).toBeVisible()
})

test('portal shows ecosystem review pages for current repo', async ({
  page,
}) => {
  await page.goto('/repo/gemini')
  await page.waitForSelector('.vp-doc h1')
  await expect(
    page.getByRole('heading', { name: 'gemini Settings' }),
  ).toBeVisible()
  await expect(
    page.locator('code').filter({ hasText: 'GEMINI.md' }).first(),
  ).toBeVisible()

  await page.goto('/repo/agent')
  await page.waitForSelector('.vp-doc h1')
  await expect(
    page.getByRole('heading', { name: 'agent Settings' }),
  ).toBeVisible()
  await expect(
    page.locator('code').filter({ hasText: 'AGENTS.md' }).first(),
  ).toBeVisible()
})

test('all sidebar links are valid', async ({ page }) => {
  await page.goto('/')
  // Wait for sidebar to be visible
  await expect(page.locator('.VPSidebar')).toBeVisible()

  const links = await page.locator('.VPSidebar a.VPLink').all()
  const hrefs = await Promise.all(links.map((l) => l.getAttribute('href')))

  for (const href of hrefs) {
    if (!href || href.startsWith('http')) continue

    console.log(`Checking link: ${href}`)
    const response = await page.goto(href)
    expect(
      response?.status(),
      `Link ${href} returned ${response?.status()}`,
    ).toBe(200)
  }
})

test('all content links are valid', async ({ page }) => {
  await page.goto('/')
  // Wait for content to be loaded
  await expect(page.locator('.vp-doc')).toBeVisible()

  const links = await page.locator('.vp-doc a').all()
  const hrefs = await Promise.all(links.map((l) => l.getAttribute('href')))

  for (const href of hrefs) {
    if (!href || href.startsWith('http') || href.startsWith('#')) continue

    console.log(`Checking content link: ${href}`)
    const response = await page.goto(href)
    expect(
      response?.status(),
      `Link ${href} in content returned ${response?.status()}`,
    ).toBe(200)
    await page.goBack()
  }
})

test('sidebar shows global and repo sections when global files exist', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.locator('.VPSidebar')).toBeVisible()

  // In all mode, we should see both "Global" and "Current Repo" in the sidebar.
  const sidebar = page.locator('.VPSidebar')
  const text = (await sidebar.textContent()) ?? ''
  console.log('SIDEBAR TEXT:', text)
  await expect(sidebar).toContainText('Global')
  await expect(sidebar).toContainText('Current Repo')

  // Also verify that the global agent we created is present
  // Wait, we didn't create a global agent inside the test.
  // It relies on ~/.codex/AGENTS.md now.
})
