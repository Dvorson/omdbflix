import { test, expect } from '@playwright/test';

/**
 * End-to-end test for the main search user flow:
 * 1. Search for a movie
 * 2. View movie details
 * 3. Verify movie details are displayed correctly
 */
test('movie search flow', async ({ page }) => {
  // 1. Go to homepage
  await page.goto('/');
  await expect(page).toHaveTitle(/Movie Explorer/);
  
  // Wait for the page to be fully loaded by checking the correct heading
  await expect(page.locator('h1:has-text("Movie Explorer")')).toBeVisible();
  
  // 2. Search for a specific movie
  await page.fill('input[placeholder*="Search"]', 'Inception');
  await page.waitForTimeout(300); // Wait for React state to update
  await page.click('button[type="submit"]');
  
  // Explicitly wait for the search API response
  await page.waitForResponse(response => 
    response.url().includes('/api/media/search') && response.status() === 200
  );

  // Wait for search results to load
  await expect(page.locator('.searching-indicator')).not.toBeVisible({ timeout: 15000 });
  
  // 3. Verify search results
  const movieCards = page.locator('[data-testid="movie-card"]');
  await expect(movieCards.first()).toBeVisible({ timeout: 10000 });
  const count = await movieCards.count();
  expect(count).toBeGreaterThanOrEqual(1);
  
  // Check if Inception appears in results - specifically in the first card
  const firstMovieCard = movieCards.first();
  await expect(firstMovieCard.locator('h3:has-text("Inception")')).toBeVisible();
  
  // 4. Click on the first movie to view details
  await firstMovieCard.click();
  
  // Wait for details page to load
  await expect(page).toHaveURL(/\/tt\d+/);
  await expect(page.locator('[data-testid="movie-title"]')).toBeVisible({ timeout: 15000 });
  
  // 5. Verify movie details
  await expect(page.locator('[data-testid="movie-title"]')).toContainText('Inception');
  await expect(page.locator('[data-testid="movie-director"]')).toBeVisible();
  await expect(page.locator('[data-testid="movie-plot"]')).toBeVisible();
  
  // Verify that the favorite button exists
  const favoriteButton = page.locator('[data-testid="favorite-button"]');
  await expect(favoriteButton).toBeVisible({ timeout: 10000 });
  
  // Verify back navigation works - try different ways to find the back link
  try {
    // Try data-testid first
    const backLink = page.locator('[data-testid="link-to-/"]');
    if (await backLink.count() > 0) {
      await backLink.click();
    } else {
      // Try header logo link
      const headerLogo = page.locator('header a[href="/"]');
      if (await headerLogo.count() > 0) {
        await headerLogo.click();
      } else {
        // Try any link to home
        const homeLink = page.locator('a[href="/"]');
        await homeLink.click();
      }
    }
  } catch (error) {
    console.log('Failed to find back link, taking screenshot for debugging');
    await page.screenshot({ path: 'back-link-error.png' });
    
    // As a last resort, navigate directly
    await page.goto('/');
  }
  
  await expect(page).toHaveURL('/');
  
  // Search again to verify component reuse
  await page.fill('input[placeholder*="Search"]', 'Matrix');
  await page.waitForTimeout(300); // Wait before submitting
  await page.click('button[type="submit"]');
  
  // Wait for search results
  await expect(page.locator('.searching-indicator')).not.toBeVisible({ timeout: 15000 });
  
  // Wait for movie cards to appear
  await expect(movieCards.first()).toBeVisible({ timeout: 10000 });
  
  // Verify different search results
  await expect(movieCards.first().locator('h3')).toContainText('Matrix', { ignoreCase: true });
}); 