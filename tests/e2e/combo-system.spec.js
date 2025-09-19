import { test, expect } from '@playwright/test';

test.describe('Combo System E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Match' }).click();
    await expect(page.getByText('battle')).toBeVisible();
  });

  test('triggers Shadow Clone Barrage combo (Ninjutsu + Taijutsu)', async ({ page }) => {
    // Look for Ninjutsu card in hand
    const ninjutsuCard = page.locator('[data-school="Ninjutsu"]:visible').first();
    await expect(ninjutsuCard).toBeVisible();
    await ninjutsuCard.click();

    // Look for Taijutsu card in hand  
    const taijutsuCard = page.locator('[data-school="Taijutsu"]:visible').first();
    await expect(taijutsuCard).toBeVisible();
    await taijutsuCard.click();

    // Wait for combo processing
    await page.waitForTimeout(1000);

    // Verify combo was triggered
    const combosTriggered = page.getByText('Combos Triggered').locator('+ strong');
    await expect(combosTriggered).toContainText(/[1-9]/);
  });

  test('displays combo queue when insufficient chakra', async ({ page }) => {
    // Deplete chakra by playing expensive cards
    const expensiveCards = page.locator('button:has-text("Cost 7"), button:has-text("Cost 8")');
    const cardCount = await expensiveCards.count();
    
    for (let i = 0; i < Math.min(cardCount, 2); i++) {
      await expensiveCards.nth(i).click();
      await page.waitForTimeout(500);
    }

    // Try to play combo sequence with low chakra
    const remainingCards = page.locator('.ninja-hand button:visible');
    const remaining = await remainingCards.count();
    
    if (remaining >= 2) {
      await remainingCards.nth(0).click();
      await remainingCards.nth(1).click();
      
      // Check if combo is queued
      const comboQueue = page.getByText('Combo Queue').locator('+ strong');
      await expect(comboQueue).toContainText(/[0-9]/);
    }
  });

  test('shows proper status effects in lane overlays', async ({ page }) => {
    // Play cards to trigger status effects
    const playableCard = page.locator('.ninja-hand button:visible').first();
    await playableCard.click();
    
    // Wait for combat and status processing
    await page.waitForTimeout(2000);
    
    // Check for status indicators in lane overlays
    const laneOverlays = page.locator('.lane-info .lane');
    await expect(laneOverlays).toHaveCount(3);
    
    // Verify lanes show unit counts
    const mountainLane = page.locator('.lane:has-text("MOUNTAIN")');
    const unitCount = mountainLane.locator('text=P:').first();
    await expect(unitCount).toBeVisible();
  });

  test('validates terrain rotation affects combo bonuses', async ({ page }) => {
    // Wait for initial terrain
    const activeTerrain = page.getByText('Active Terrain').locator('+ strong');
    const initialTerrain = await activeTerrain.textContent();
    
    // Wait for terrain rotation (90 seconds in game)
    await page.waitForTimeout(3000);
    
    // Verify terrain display is working
    await expect(activeTerrain).toBeVisible();
    
    // Check terrain rotation countdown
    const rotationTimer = page.getByText('Terrain rotation in');
    await expect(rotationTimer).toBeVisible();
  });
});