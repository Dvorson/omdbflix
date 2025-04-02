import { test, expect } from '@playwright/test';

/**
 * End-to-end test for the main user flow:
 * 1. Search for a movie
 * 2. View movie details
 * 3. Add movie to favorites
 * 4. Verify movie is added to favorites
 * 5. Remove movie from favorites
 */
test('complete movie search and favorite flow', async ({ page }) => {
  // 1. Go to homepage
  await page.goto('/');
  await expect(page).toHaveTitle(/Movie Explorer/);
  
  // Wait for the page to be fully loaded by checking the correct heading
  await expect(page.locator('h1:has-text("Movie Explorer")')).toBeVisible();
  
  // 2. Search for a specific movie
  await page.fill('input[placeholder*="Search"]', 'Inception');
  // Add a small wait to allow React state to update
  await page.waitForTimeout(100); // Wait 100ms (adjust if needed)
  // Click immediately after filling
  await page.click('button[type="submit"]');
  
  // Explicitly wait for the search API response
  await page.waitForResponse(response => 
    response.url().includes('/api/media/search') && response.status() === 200
  );

  // Wait for search results to load (by waiting for indicator to disappear - this might be redundant now but keep for safety)
  await expect(page.locator('.searching-indicator')).not.toBeVisible({ timeout: 10000 });
  
  // 3. Verify search results
  const movieCards = page.locator('[data-testid="movie-card"]');
  const count = await movieCards.count();
  expect(count).toBeGreaterThanOrEqual(1);
  
  // Check if Inception appears in results - specifically in the first card
  const firstMovieCard = movieCards.first();
  await expect(firstMovieCard.locator('h3:has-text("Inception")')).toBeVisible();
  
  // 4. Click on the first movie to view details
  await firstMovieCard.click();
  
  // Wait for details page to load
  await expect(page).toHaveURL(/\/tt\d+/);
  // Wait using the data-testid for the title element
  await expect(page.locator('[data-testid="movie-title"]')).toBeVisible({ timeout: 10000 });
  
  // 5. Verify movie details
  await expect(page.locator('[data-testid="movie-title"]')).toContainText('Inception');
  await expect(page.locator('[data-testid="movie-director"]')).toBeVisible();
  await expect(page.locator('[data-testid="movie-plot"]')).toBeVisible();
  
  // 6. Add movie to favorites
  const favoriteButton = page.locator('[data-testid="favorite-button"]');
  await expect(favoriteButton).toBeVisible();
  
  // Check initial state - not in favorites
  await expect(favoriteButton).toHaveAttribute('aria-label', 'Add to favorites');
  
  // Click to add to favorites
  await favoriteButton.click();
  
  // Verify it's now marked as favorite
  await expect(favoriteButton).toHaveAttribute('aria-label', 'Remove from favorites');
  
  // 7. Go back to home page
  await page.click('[data-testid="link-to-/"]');
  await expect(page).toHaveURL('/');
  
  // 8. Search for the same movie again to verify favorites state is maintained
  await page.fill('input[placeholder*="Search"]', 'Inception');
  await page.click('button[type="submit"]');
  
  // Wait for search results
  await expect(page.locator('.searching-indicator')).not.toBeVisible({ timeout: 10000 });
  
  // Verify the movie card shows as favorite
  const firstMovieFavoriteIcon = movieCards.first().locator('[data-testid="favorite-icon"]');
  await expect(firstMovieFavoriteIcon).toHaveAttribute('data-is-favorite', 'true');
  
  // 9. Remove from favorites
  await firstMovieFavoriteIcon.click();
  
  // Verify it's removed from favorites
  await expect(firstMovieFavoriteIcon).toHaveAttribute('data-is-favorite', 'false');
}); 