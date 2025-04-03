import { test, expect } from '@playwright/test';
import { cleanupTestData } from './setup-for-ci';

/**
 * E2E Test: Guest user sees disabled favorite button.
 */
test('guest user sees disabled favorite button', async ({ page }) => {
    // 1. Go to a movie detail page - use a known ID that should work
    const movieId = 'tt0111161'; // The Shawshank Redemption
    await page.goto(`/${movieId}`);
    await page.waitForLoadState('networkidle');

    // Cleanup any existing auth to ensure we're testing as a guest
    await cleanupTestData(page);
    await page.reload();
    // Wait for a specific element instead of networkidle after reload
    // await page.waitForLoadState('networkidle'); 
    await expect(page.locator('[data-testid="movie-title"], h1').first()).toBeVisible({ timeout: 15000 });

    // Take a screenshot to debug
    await page.screenshot({ path: 'test-results/screenshots/guest-movie-detail.png' });

    // 2. Check if the favorite button exists and is disabled for guests
    const favoriteButton = page.locator('[data-testid="favorite-button"]');
    
    // Wait for the button to be present in the DOM
    await favoriteButton.waitFor({ state: 'attached', timeout: 15000 }); 
    
    // Assert that the button is visible
    await expect(favoriteButton, 'Favorite button should be visible').toBeVisible();
    
    // Assert that the button is disabled for guest users
    await expect(favoriteButton, 'Favorite button should be disabled for guest users').toBeDisabled();

    // Optional: Add a check for the title attribute explaining why it's disabled
    await expect(favoriteButton).toHaveAttribute('title', 'Sign in to add to favorites');
}); 