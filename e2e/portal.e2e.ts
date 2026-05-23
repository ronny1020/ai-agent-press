import { test, expect } from '@playwright/test'

test('portal loads and shows content', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/AI Agent Portal/)
  await page.waitForSelector('.vp-doc h1')
  await expect(
    page.getByRole('heading', { name: 'Gemini CLI Project Rules' }),
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

  const sidebar = page.locator('.VPSidebar')
  await expect(sidebar).toContainText('Global')
  await expect(sidebar).toContainText('Current Repo')
})

test('can navigate to a skill page', async ({ page }) => {
  await page.goto('/')
  
  // Find a skill link in the sidebar. github-pr should be there.
  const skillLink = page.getByRole('link', { name: 'github-pr' }).first()
  await expect(skillLink).toBeVisible()
  await skillLink.click()

  // Verify the page content
  await expect(page).toHaveURL(/.*github-pr/)
  await expect(page.locator('.vp-doc h1')).toContainText('github-pr')
  // It should contain something from the file
  await expect(page.locator('.vp-doc')).toContainText('example skill', { ignoreCase: true })
})
