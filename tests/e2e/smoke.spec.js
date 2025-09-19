import { test, expect } from '@playwright/test';

test.describe('Ninja Clan Wars prototype', () => {
  test('loads shell and starts match', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Match' }).click();
    await expect(page.getByText('Chakra', { exact: false })).toBeVisible();
  });
});
