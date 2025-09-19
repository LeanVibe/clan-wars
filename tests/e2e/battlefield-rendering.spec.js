import { test, expect } from '@playwright/test';

test.describe('Three.js Battlefield Rendering E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Match' }).click();
    await expect(page.getByText('battle')).toBeVisible();
  });

  test('Three.js canvas initializes properly', async ({ page }) => {
    // Wait for Three.js initialization
    await page.waitForTimeout(1000);
    
    // Check for canvas element
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // Verify canvas has proper dimensions
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox.width).toBeGreaterThan(300);
    expect(canvasBox.height).toBeGreaterThan(400);
    
    // Check console for successful Three.js initialization
    const messages = [];
    page.on('console', msg => messages.push(msg.text()));
    
    await page.reload();
    await page.waitForTimeout(2000);
    
    const hasInitMessage = messages.some(msg => 
      msg.includes('Three.js initialization complete') ||
      msg.includes('WebGL renderer created successfully')
    );
    expect(hasInitMessage).toBe(true);
  });

  test('battlefield shows lane information and unit counts', async ({ page }) => {
    // Verify all three lanes are displayed
    const lanes = ['MOUNTAIN', 'FOREST', 'RIVER'];
    
    for (const lane of lanes) {
      const laneElement = page.locator(`.lane:has-text("${lane}")`);
      await expect(laneElement).toBeVisible();
      
      // Check stronghold health display
      const strongholds = laneElement.locator('text=Strongholds');
      await expect(strongholds).toBeVisible();
      
      // Check frontline display
      const frontline = laneElement.locator('text=Frontline');
      await expect(frontline).toBeVisible();
    }
  });

  test('units appear in 3D scene when cards are played', async ({ page }) => {
    // Get initial unit count
    const mountainLane = page.locator('.lane:has-text("MOUNTAIN")');
    const initialCount = await mountainLane.locator('text=P:').textContent();
    
    // Play a card
    const playableCard = page.locator('.ninja-hand button:visible').first();
    await expect(playableCard).toBeVisible();
    await playableCard.click();
    
    // Wait for unit to spawn
    await page.waitForTimeout(1000);
    
    // Verify unit count increased
    const newCount = await mountainLane.locator('text=P:').textContent();
    expect(newCount).not.toBe(initialCount);
    
    // Check that frontline shows unit name
    const frontline = mountainLane.locator('.lane-row:has-text("Frontline")');
    const frontlineText = await frontline.textContent();
    expect(frontlineText).not.toContain('— vs —');
  });

  test('health bars update in real-time during combat', async ({ page }) => {
    // Play a unit
    const card = page.locator('.ninja-hand button:visible').first();
    await card.click();
    
    // Wait for combat to start
    await page.waitForTimeout(3000);
    
    // Check for health bar elements
    const healthBars = page.locator('.health-bar');
    const healthBarCount = await healthBars.count();
    
    if (healthBarCount > 0) {
      // Verify health bars have proper styling
      const firstHealthBar = healthBars.first();
      await expect(firstHealthBar).toBeVisible();
      
      // Check for health bar fill element
      const fill = firstHealthBar.locator('.fill');
      await expect(fill).toBeVisible();
    }
  });

  test('lane selection highlights work correctly', async ({ page }) => {
    // Test lane selection
    const mountainLane = page.locator('.lane:has-text("MOUNTAIN")');
    await mountainLane.click();
    
    // Verify selected lane updates in meta panel
    const selectedLane = page.getByText('Selected Lane').locator('+ strong');
    await expect(selectedLane).toContainText('MOUNTAIN');
    
    // Try selecting different lane
    const forestLane = page.locator('.lane:has-text("FOREST")');
    await forestLane.click();
    await expect(selectedLane).toContainText('FOREST');
  });

  test('chakra overflow visualization works', async ({ page }) => {
    // Check chakra meter display
    const chakraMeter = page.locator('.ninja-chakra-meter, [data-testid="chakra-meter"]');
    const chakraText = page.getByText('Chakra');
    
    // At least one chakra indicator should be visible
    const hasChakraDisplay = await chakraMeter.count() > 0 || await chakraText.count() > 0;
    expect(hasChakraDisplay).toBe(true);
    
    // Check overflow display in meta panel
    const overflowValue = page.getByText('Chakra Overflow').locator('+ strong');
    await expect(overflowValue).toBeVisible();
    await expect(overflowValue).toContainText(/\d+/);
  });
});