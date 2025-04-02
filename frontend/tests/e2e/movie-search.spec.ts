import { test, expect } from '@playwright/test';

test.describe('Movie Search Flow', () => {
  // Before each test, navigate to the home page
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the page to be fully loaded
    await page.waitForSelector('h1:has-text("Movie Explorer")');
  });

  test('should allow searching for movies and viewing details', async ({ page }) => {
    // Verify the search form is present
    await expect(page.locator('form')).toBeVisible();

    // Enter search query for a well-known movie
    await page.fill('input[id="query"]', 'Inception');

    // Submit the search form
    await page.click('button[type="submit"]');

    // Wait for search results to load
    await page.waitForSelector('div[class*="grid"]');

    // Verify search results are displayed
    const movieCards = page.locator('div[class*="transition-transform"]');
    const count = await movieCards.count();
    expect(count).toBeGreaterThan(0);

    // Verify the movie title we searched for appears in results
    const movieTitles = page.locator('h3:has-text("Inception")');
    await expect(movieTitles.first()).toBeVisible();

    // Click on the first movie card to view details
    await movieCards.first().click();

    // Wait for the details page to load
    await page.waitForSelector('h1:has-text("Inception")');

    // Verify details page elements are present
    await expect(page.locator('h2:has-text("Plot")')).toBeVisible();
    await expect(page.locator('h2:has-text("Details")')).toBeVisible();
    await expect(page.locator('h2:has-text("Ratings")')).toBeVisible();

    // Verify the favorite button is present
    const favoriteButton = page.locator('button:has-text("Add to Favorites")');
    await expect(favoriteButton).toBeVisible();

    // Add to favorites
    await favoriteButton.click();

    // Verify the button text changed
    await expect(page.locator('button:has-text("Remove from Favorites")')).toBeVisible();

    // Navigate to favorites page
    await page.click('a:has-text("Favorites")');

    // Wait for favorites page to load
    await page.waitForSelector('h1:has-text("Your Favorites")');

    // Verify the movie is in favorites
    await expect(page.locator('div:has-text("Inception")')).toBeVisible();

    // Remove from favorites
    await page.click('button:has-text("Remove from favorites")');

    // Verify the movie is removed from favorites
    await expect(page.locator('p:has-text("You haven\'t added any favorites yet")')).toBeVisible();
  });

  test('should handle searches with no results', async ({ page }) => {
    // Enter a search query that should not yield results
    await page.fill('input[id="query"]', 'asdfghjklqwertyuiopzxcvbnm');

    // Submit the search form
    await page.click('button[type="submit"]');

    // Wait for the error message
    await page.waitForSelector('div[class*="text-red-600"]');

    // Verify error message is shown
    await expect(page.locator('div[class*="text-red-600"] p')).toContainText('not found');
  });

  test('should navigate between pages of search results', async ({ page }) => {
    // Enter a search query that will yield multiple pages of results
    await page.fill('input[id="query"]', 'Star');

    // Submit the search form
    await page.click('button[type="submit"]');

    // Wait for search results to load
    await page.waitForSelector('div[class*="grid"]');

    // Verify pagination is visible
    await expect(page.locator('nav')).toBeVisible();

    // Get the initial set of results
    const initialResults = await page.locator('div[class*="transition-transform"]').count();

    // Click on the next page button
    await page.click('button[aria-label="Next page"]');

    // Wait for the new results to load
    await page.waitForTimeout(1000); // Give time for the new results to load

    // Get the new set of results
    const newResults = await page.locator('div[class*="transition-transform"]').count();

    // Verify we have results on the second page too
    expect(newResults).toBeGreaterThan(0);

    // Navigate back to the first page
    await page.click('button[aria-label="Previous page"]');

    // Wait for the results to load
    await page.waitForTimeout(1000);

    // Verify we have the initial set of results again
    const backToInitialResults = await page.locator('div[class*="transition-transform"]').count();
    expect(backToInitialResults).toBe(initialResults);
  });
}); 