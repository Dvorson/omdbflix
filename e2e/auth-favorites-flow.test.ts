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
    await page.waitForLoadState('networkidle');

    // Take a screenshot to debug
    await page.screenshot({ path: 'test-results/screenshots/guest-movie-detail.png' });

    // 2. Check if there's a favorite button at all 
    // If not, the test should fail but be more descriptive
    const buttonExists = await page.locator('[data-testid="favorite-button"], button:has-text("Add to Favorites")').count() > 0;
    
    if (buttonExists) {
        // If the button exists, check if it's disabled
        const favoriteButton = page.locator('[data-testid="favorite-button"], button:has-text("Add to Favorites")');
        const isDisabled = await favoriteButton.isDisabled();
        expect(isDisabled).toBeTruthy();
    } else {
        // If button doesn't exist, take a screenshot and fail the test
        await page.screenshot({ path: 'test-results/screenshots/missing-favorite-button.png' });
        
        // Add extra information to the DOM to help debugging
        await page.evaluate(() => {
            const info = document.createElement('div');
            info.style.background = 'red';
            info.style.padding = '20px';
            info.style.color = 'white';
            info.style.position = 'fixed';
            info.style.top = '0';
            info.style.left = '0';
            info.style.zIndex = '9999';
            info.textContent = 'TEST INFO: Favorite button not found in the DOM';
            document.body.prepend(info);
        });
        
        await page.screenshot({ path: 'test-results/screenshots/missing-favorite-button-annotated.png' });
        throw new Error('Favorite button not found in the DOM');
    }
}); 