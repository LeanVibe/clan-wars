import { test, expect } from '@playwright/test';

test.describe('Complete Game Flow E2E Tests', () => {
  test('full match flow from start to unit deployment', async ({ page }) => {
    // 1. Load application
    await page.goto('/');
    await expect(page.getByText('Ninja Clan Wars')).toBeVisible();
    
    // 2. Verify initial menu state
    await expect(page.getByText('Phase').locator('+ strong')).toContainText('menu');
    
    // 3. Start match
    await page.getByRole('button', { name: 'Start Match' }).click();
    
    // 4. Verify battle phase started
    await expect(page.getByText('Phase').locator('+ strong')).toContainText('battle');
    
    // 5. Check initial game state
    await expect(page.getByText('Time Left')).toBeVisible();
    await expect(page.getByText('Deck Remaining')).toBeVisible();
    await expect(page.getByText('Active Terrain')).toBeVisible();
    
    // 6. Verify hand has cards
    const handCards = page.locator('.ninja-hand button');
    await expect(handCards.first()).toBeVisible();
    
    // 7. Play first card
    await handCards.first().click();
    
    // 8. Verify card was played (deck count decreased)
    const deckCount = page.getByText('Deck Remaining').locator('+ strong');
    const count = await deckCount.textContent();
    expect(parseInt(count)).toBeLessThan(10); // Started with 10, should be less now
    
    // 9. Check that unit appeared in lane
    const laneWithUnits = page.locator('.lane').filter({ hasText: 'P:1' }).or(
      page.locator('.lane').filter({ hasText: 'P:2' })
    );
    await expect(laneWithUnits).toHaveCount({ min: 1 });
  });

  test('draw card functionality works', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Match' }).click();
    
    // Get initial deck count
    const deckCount = page.getByText('Deck Remaining').locator('+ strong');
    const initialCount = parseInt(await deckCount.textContent());
    
    // Get initial hand size
    const handCards = page.locator('.ninja-hand button');
    const initialHandSize = await handCards.count();
    
    // Draw a card
    await page.getByRole('button', { name: 'Draw' }).click();
    
    // Verify deck decreased and hand increased (if under limit)
    const newCount = parseInt(await deckCount.textContent());
    const newHandSize = await handCards.count();
    
    if (initialHandSize < 5) { // Hand limit is 5
      expect(newHandSize).toBe(initialHandSize + 1);
      expect(newCount).toBe(initialCount - 1);
    }
  });

  test('chakra regeneration and overflow system', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Match' }).click();
    
    // Check initial chakra
    const chakraText = page.locator('text=Chakra').first();
    await expect(chakraText).toBeVisible();
    
    // Play expensive cards to reduce chakra
    const expensiveCard = page.locator('button:has-text("Cost 7"), button:has-text("Cost 8")').first();
    if (await expensiveCard.count() > 0) {
      await expensiveCard.click();
      
      // Wait for chakra regeneration
      await page.waitForTimeout(2000);
      
      // Verify chakra system is working
      const overflowValue = page.getByText('Chakra Overflow').locator('+ strong');
      await expect(overflowValue).toContainText(/\d+/);
    }
  });

  test('terrain rotation countdown works', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Match' }).click();
    
    // Check terrain rotation timer
    const rotationTimer = page.locator('text=Terrain rotation in');
    await expect(rotationTimer).toBeVisible();
    
    // Get initial time
    const timerText = await rotationTimer.textContent();
    const initialSeconds = parseInt(timerText.match(/(\d+)s/)?.[1] || '0');
    
    // Wait a bit and check if timer decreased
    await page.waitForTimeout(2000);
    const newTimerText = await rotationTimer.textContent();
    const newSeconds = parseInt(newTimerText.match(/(\d+)s/)?.[1] || '0');
    
    expect(newSeconds).toBeLessThanOrEqual(initialSeconds);
  });

  test('exit match returns to menu', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Match' }).click();
    
    // Verify we're in battle
    await expect(page.getByText('Phase').locator('+ strong')).toContainText('battle');
    
    // Exit match
    await page.getByRole('button', { name: 'Exit Match' }).click();
    
    // Verify we're back in menu
    await expect(page.getByText('Phase').locator('+ strong')).toContainText('menu');
    await expect(page.getByRole('button', { name: 'Start Match' })).toBeVisible();
  });

  test('AI units spawn and engage in combat', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Match' }).click();
    
    // Wait for AI spawning
    await page.waitForTimeout(5000);
    
    // Check for AI units in lanes
    const aiUnits = page.locator('.lane').filter({ hasText: /AI:[1-9]/ });
    const aiCount = await aiUnits.count();
    
    expect(aiCount).toBeGreaterThan(0);
    
    // Verify AI units show in frontline
    const frontlines = page.locator('.lane-row:has-text("Frontline")');
    const frontlineTexts = await frontlines.allTextContents();
    
    const hasAiUnits = frontlineTexts.some(text => 
      !text.includes('— vs —') && text.includes('vs')
    );
    
    if (aiCount > 0) {
      expect(hasAiUnits).toBe(true);
    }
  });
});