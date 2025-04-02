import { test, expect } from '@playwright/test';

test('should handle non-numeric year inputs gracefully', async ({ page }) => {
  // Open the homepage - use the correct base URL
  await page.goto('http://localhost:3000');

  // Show advanced filters
  await page.click('button:has-text("Show filters")');
  
  // Enter search query
  await page.fill('input[data-testid="search-input"]', 'Star Wars');
  
  // This would normally be selected from dropdown, but for testing we can directly modify the input
  // Here we're simulating a problematic value "Cuts" that could cause SQL conversion errors
  await page.evaluate(() => {
    const yearSelect = document.getElementById('year') as HTMLSelectElement;
    if (yearSelect) {
      const option = document.createElement('option');
      option.value = 'Cuts';
      option.text = 'Director\'s Cuts';
      yearSelect.add(option);
      yearSelect.value = 'Cuts';
    }
  });
  
  // Submit form (this would previously cause an error)
  await page.click('button[data-testid="search-button"]');
  
  // Wait for search results to load - the app should handle this gracefully
  await page.waitForSelector('div[class*="grid"]', { timeout: 5000 });
  
  // Verify search was performed (without crashing)
  const results = page.locator('div[class*="transition-transform"]');
  const count = await results.count();
  expect(count).toBeGreaterThan(0);
}); 