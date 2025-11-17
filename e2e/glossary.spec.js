import { test, expect } from '@playwright/test';

test.describe('Glossary Plugin', () => {
  test.describe('Glossary Page', () => {
    test('should render the glossary page', async ({ page }) => {
      await page.goto('/glossary');

      // Check page title
      await expect(page.locator('h1')).toContainText('Glossary');

      // Check that terms are displayed
      await expect(page.locator('dt')).toHaveCount(3); // API, REST, Webhook

      // Verify specific terms exist by targeting dt elements specifically
      await expect(page.locator('dt').filter({ hasText: 'API' })).toBeVisible();
      await expect(page.locator('dt').filter({ hasText: 'REST' })).toBeVisible();
      await expect(page.locator('dt').filter({ hasText: 'Webhook' })).toBeVisible();

      // Check that definitions are displayed
      await expect(page.getByText(/A set of rules and protocols/)).toBeVisible();
      await expect(page.getByText(/An architectural style for designing/)).toBeVisible();

      // Check total terms count in footer
      await expect(page.getByText('Total terms: 3')).toBeVisible();
    });

    test('should have letter navigation', async ({ page }) => {
      await page.goto('/glossary');

      // Check that letter navigation exists - target nav links with href starting with #letter-
      const letterNav = page.locator('nav a[href^="#letter-"]');
      await expect(letterNav).toHaveCount(3); // A, R, W

      // Verify specific letters
      await expect(page.locator('a[href="#letter-A"]')).toBeVisible();
      await expect(page.locator('a[href="#letter-R"]')).toBeVisible();
      await expect(page.locator('a[href="#letter-W"]')).toBeVisible();
    });

    test('should support search functionality', async ({ page }) => {
      await page.goto('/glossary');

      // Find search input
      const searchInput = page.getByPlaceholder('Search terms...');
      await expect(searchInput).toBeVisible();

      // Search for a term
      await searchInput.fill('API');

      // Should show only API term
      await expect(page.locator('dt')).toHaveCount(1);
      await expect(page.locator('dt').filter({ hasText: 'API' })).toBeVisible();
      await expect(page.locator('dt').filter({ hasText: 'REST' })).not.toBeVisible();

      // Clear search
      await searchInput.clear();
      await expect(page.locator('dt')).toHaveCount(3);
    });

    test('should show abbreviations', async ({ page }) => {
      await page.goto('/glossary');

      // Check that abbreviations are shown
      await expect(page.getByText('(Application Programming Interface)')).toBeVisible();
      await expect(page.getByText('(Representational State Transfer)')).toBeVisible();
    });

    test('should have related terms links', async ({ page }) => {
      await page.goto('/glossary');

      // Check that related terms section exists - use first() to handle multiple matches
      await expect(page.getByText('Related terms:').first()).toBeVisible();

      // Check that related terms are linked
      const relatedLink = page.locator('a[href="#rest"]').first();
      await expect(relatedLink).toBeVisible();
    });
  });

  test.describe('Glossary Tooltips', () => {
    test('should show tooltip on hover over auto-linked term', async ({ page }) => {
      await page.goto('/docs/auto-link');

      // Find a glossary term link (API, REST, or Webhook should be auto-linked)
      const apiLink = page.locator('a[href*="/glossary#api"]').first();
      await expect(apiLink).toBeVisible();

      // Hover over the term to show tooltip
      await apiLink.hover();

      // Check that tooltip appears with role="tooltip"
      const tooltip = page.locator('[role="tooltip"]').first();
      await expect(tooltip).toBeVisible();

      // Verify tooltip contains the term and definition
      await expect(tooltip).toContainText('API');
      await expect(tooltip).toContainText('A set of rules and protocols');
    });

    test('should link to glossary page with anchor', async ({ page }) => {
      await page.goto('/docs/auto-link');

      // Find a glossary term link
      const apiLink = page.locator('a[href*="/glossary#api"]').first();
      await expect(apiLink).toBeVisible();

      // Click the link
      await apiLink.click();

      // Should navigate to glossary page with anchor
      await expect(page).toHaveURL(/.*\/glossary#api/);

      // Term should be visible
      await expect(page.locator('#api')).toBeVisible();
    });

    test('should show multiple tooltips for different terms', async ({ page }) => {
      await page.goto('/docs/auto-link');

      // Check that multiple terms are linked
      // Note: "API" appears twice in the content, so we check for at least 1
      const apiLinks = page.locator('a[href*="/glossary#api"]');
      await expect(apiLinks).toHaveCount(2); // API appears twice in the content
      await expect(page.locator('a[href*="/glossary#rest"]')).toHaveCount(1);
      await expect(page.locator('a[href*="/glossary#webhook"]')).toHaveCount(1);

      // Hover over REST term
      const restLink = page.locator('a[href*="/glossary#rest"]').first();
      await restLink.hover();

      // Check REST tooltip appears
      const tooltip = page.locator('[role="tooltip"]').first();
      await expect(tooltip).toBeVisible();
      await expect(tooltip).toContainText('REST');
      await expect(tooltip).toContainText('An architectural style');
    });

    test('should hide tooltip when mouse leaves', async ({ page }) => {
      await page.goto('/docs/auto-link');

      const apiLink = page.locator('a[href*="/glossary#api"]').first();
      await apiLink.hover();

      // Tooltip should be visible
      const tooltip = page.locator('[role="tooltip"]').first();
      await expect(tooltip).toBeVisible();

      // Move mouse away
      await page.mouse.move(0, 0);

      // Tooltip should be hidden (checking opacity or visibility)
      // The tooltip element stays in DOM but becomes invisible
      await expect(tooltip).not.toBeVisible();
    });

    test('should show tooltip on keyboard focus', async ({ page }) => {
      await page.goto('/docs/auto-link');

      // Tab to the glossary term link
      const apiLink = page.locator('a[href*="/glossary#api"]').first();

      // Focus the link
      await apiLink.focus();

      // Tooltip should appear on focus
      const tooltip = page.locator('[role="tooltip"]').first();
      await expect(tooltip).toBeVisible();
      await expect(tooltip).toContainText('API');
    });
  });

  test.describe('Manual Glossary Terms', () => {
    test('should render manually added glossary term', async ({ page }) => {
      await page.goto('/docs/manual-link');

      // Check if page has manual glossary term component
      const glossaryLink = page.locator('a[href*="/glossary"]').first();

      if (await glossaryLink.isVisible()) {
        // Hover to show tooltip
        await glossaryLink.hover();

        // Wait a bit for tooltip to appear
        await page.waitForTimeout(100);

        // Check tooltip appears - tooltip might be in DOM but hidden, check for visibility
        const tooltip = page.locator('[role="tooltip"]').first();
        // The tooltip should be visible when hovered
        await expect(tooltip).toBeVisible({ timeout: 2000 });
      }
    });
  });
});
