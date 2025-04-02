import { test, expect } from '@playwright/test';

test.describe('Authentication and Favorites Flows', () => {
  // Test user credentials - ideally these would be in test environment variables
  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'Password123!'
  };

  test.beforeEach(async ({ page }) => {
    // Navigate to the home page before each test
    await page.goto('/');
    await page.waitForSelector('h1:has-text("Movie Explorer")');
  });

  test('should show auth modal and allow registration', async ({ page }) => {
    // Open auth modal
    await page.click('button:has-text("Sign In")');
    await page.waitForSelector('h2:has-text("Sign In")');
    
    // Switch to register mode
    await page.click('button:has-text("Need an account? Sign up")');
    await page.waitForSelector('h2:has-text("Create Account")');
    
    // Fill out registration form with unique email to avoid duplicates
    const uniqueEmail = `test${Date.now()}@example.com`;
    await page.fill('input#name', testUser.name);
    await page.fill('input#email', uniqueEmail);
    await page.fill('input#password', testUser.password);
    
    // Submit form
    await page.click('button:has-text("Create Account")');
    
    // Verify successful registration - header should now show user avatar/dropdown
    await page.waitForSelector('div[aria-label="User menu"]', { timeout: 5000 });
  });
  
  test('should allow login and logout', async ({ page }) => {
    // Open auth modal
    await page.click('button:has-text("Sign In")');
    await page.waitForSelector('h2:has-text("Sign In")');
    
    // Fill login form
    await page.fill('input#email', testUser.email);
    await page.fill('input#password', testUser.password);
    
    // Submit form
    await page.click('button:has-text("Sign In")');
    
    // Verify successful login - header should now show user menu
    await page.waitForSelector('div[aria-label="User menu"]', { timeout: 5000 });
    
    // Open user menu
    await page.click('div[aria-label="User menu"]');
    
    // Click logout
    await page.click('button:has-text("Sign Out")');
    
    // Verify logged out - Sign In button should be visible again
    await page.waitForSelector('button:has-text("Sign In")');
  });
  
  test('should prevent adding to favorites when not logged in', async ({ page }) => {
    // Search for a movie
    await page.fill('input[data-testid="search-input"]', 'Inception');
    await page.click('button[data-testid="search-button"]');
    
    // Wait for search results and click on first movie
    await page.waitForSelector('div[class*="grid"]');
    await page.locator('div[class*="transition-transform"]').first().click();
    
    // Wait for movie details to load
    await page.waitForSelector('h1:has-text("Inception")');
    
    // Set up dialog handler to accept the alert
    page.on('dialog', dialog => dialog.accept());
    
    // Try to add to favorites (should trigger alert)
    await page.click('button:has-text("Add to Favorites")');
    
    // Verify we're still on the same page (not redirected to login)
    await expect(page).toHaveURL(/.*\/tt/); // URL should contain movie ID (tt...)
    
    // Favorite button should still say "Add to Favorites" (not toggled)
    await expect(page.locator('button:has-text("Add to Favorites")')).toBeVisible();
  });
  
  test('should allow adding and removing favorites when logged in', async ({ page }) => {
    // Login first
    await page.click('button:has-text("Sign In")');
    await page.waitForSelector('h2:has-text("Sign In")');
    await page.fill('input#email', testUser.email);
    await page.fill('input#password', testUser.password);
    await page.click('button:has-text("Sign In")');
    
    // Verify successful login
    await page.waitForSelector('div[aria-label="User menu"]');
    
    // Search for a movie
    await page.fill('input[data-testid="search-input"]', 'The Matrix');
    await page.click('button[data-testid="search-button"]');
    
    // Wait for search results and click on first movie
    await page.waitForSelector('div[class*="grid"]');
    await page.locator('div[class*="transition-transform"]').first().click();
    
    // Wait for movie details to load
    await page.waitForSelector('h1:has-text("The Matrix")');
    
    // Add to favorites
    await page.click('button:has-text("Add to Favorites")');
    
    // Verify button changes to "Remove from Favorites"
    await expect(page.locator('button:has-text("Remove from Favorites")')).toBeVisible();
    
    // Navigate to favorites page
    await page.click('a:has-text("Favorites")');
    
    // Wait for favorites page to load
    await page.waitForSelector('h1:has-text("Your Favorites")');
    
    // Verify the movie is in favorites
    await expect(page.locator('h3:has-text("The Matrix")')).toBeVisible();
    
    // Remove from favorites
    await page.click('button:has-text("Remove from favorites")');
    
    // Verify the movie is removed and empty state shows
    await expect(page.locator('p:has-text("You haven\'t added any favorites yet")')).toBeVisible();
  });
  
  test('should persist favorites between sessions', async ({ page }) => {
    // First login and add a movie to favorites
    await page.click('button:has-text("Sign In")');
    await page.waitForSelector('h2:has-text("Sign In")');
    await page.fill('input#email', testUser.email);
    await page.fill('input#password', testUser.password);
    await page.click('button:has-text("Sign In")');
    await page.waitForSelector('div[aria-label="User menu"]');
    
    // Search for a specific movie
    await page.fill('input[data-testid="search-input"]', 'The Godfather');
    await page.click('button[data-testid="search-button"]');
    
    // Wait for search results and click on first movie
    await page.waitForSelector('div[class*="grid"]');
    await page.locator('div[class*="transition-transform"]').first().click();
    
    // Wait for movie details to load
    await page.waitForSelector('h1:has-text("The Godfather")');
    
    // Add to favorites
    await page.click('button:has-text("Add to Favorites")');
    
    // Verify button changes to "Remove from Favorites"
    await expect(page.locator('button:has-text("Remove from Favorites")')).toBeVisible();
    
    // Logout
    await page.click('div[aria-label="User menu"]');
    await page.click('button:has-text("Sign Out")');
    await page.waitForSelector('button:has-text("Sign In")');
    
    // Login again
    await page.click('button:has-text("Sign In")');
    await page.waitForSelector('h2:has-text("Sign In")');
    await page.fill('input#email', testUser.email);
    await page.fill('input#password', testUser.password);
    await page.click('button:has-text("Sign In")');
    await page.waitForSelector('div[aria-label="User menu"]');
    
    // Go directly to favorites page
    await page.click('a:has-text("Favorites")');
    
    // Wait for favorites page to load
    await page.waitForSelector('h1:has-text("Your Favorites")');
    
    // Verify the movie is still in favorites after re-login
    await expect(page.locator('h3:has-text("The Godfather")')).toBeVisible();
    
    // Cleanup: remove the favorite
    await page.click('button:has-text("Remove from favorites")');
  });
  
  test('should handle year filter correctly', async ({ page }) => {
    // Open advanced filters
    await page.click('button:has-text("Show filters")');
    
    // Fill search query
    await page.fill('input[data-testid="search-input"]', 'Star Wars');
    
    // Select year from dropdown
    await page.selectOption('select#year', '2015');
    
    // Submit the search form
    await page.click('button[data-testid="search-button"]');
    
    // Wait for search results to load
    await page.waitForSelector('div[class*="grid"]');
    
    // Verify all movies shown are from 2015
    const movieCards = page.locator('div[class*="transition-transform"]');
    const count = await movieCards.count();
    
    // Check that we have results
    expect(count).toBeGreaterThan(0);
    
    // Check the first movie's year
    const firstMovieYear = await page.locator('div[class*="transition-transform"]').first().locator('span:has-text("2015")').isVisible();
    expect(firstMovieYear).toBeTruthy();
    
    // Clear filters
    await page.click('button:has-text("Clear All")');
    
    // Verify year filter is cleared
    const yearSelect = await page.locator('select#year');
    const selectedYear = await yearSelect.evaluate((el) => (el as HTMLSelectElement).value);
    expect(selectedYear).toBe('');
  });
}); 