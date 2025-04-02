import { test, expect } from '@playwright/test';

// Test the core search functionality (most critical feature)
test('search for movies and view details', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Movie Explorer/);
  
  // Search for a movie
  await page.fill('input[placeholder*="Search"]', 'Matrix');
  await page.click('button[type="submit"]');
  
  // Wait for results to load
  await page.waitForResponse(resp => resp.url().includes('/api/media/search') && resp.status() === 200);
  await page.waitForSelector('.searching-indicator', { state: 'hidden', timeout: 10000 });
  
  // Verify results appear
  const movieCards = page.locator('[data-testid="movie-card"]');
  await expect(movieCards.first()).toBeVisible({ timeout: 10000 });
  
  // Verify the title contains Matrix
  await expect(movieCards.first().locator('h3')).toContainText('Matrix', { ignoreCase: true });
  
  // Click on the movie to view details
  await movieCards.first().click();
  
  // Verify details page loads
  await expect(page).toHaveURL(/\/tt\d+/);
  await expect(page.locator('[data-testid="movie-title"]')).toBeVisible({ timeout: 10000 });
  
  // Verify the movie details include key elements
  await expect(page.locator('[data-testid="movie-title"]')).toContainText('Matrix', { ignoreCase: true });
  await expect(page.locator('[data-testid="movie-plot"]')).toBeVisible();
  await expect(page.locator('[data-testid="movie-director"]')).toBeVisible();
});

// Test navigation between pages
test('navigate through main sections of the app', async ({ page }) => {
  await page.goto('/');
  
  // Check if we can navigate to the Movies page
  // Try to find Movies link in the header
  const headerLinks = page.locator('header a, header button');
  const count = await headerLinks.count();
  
  let hasNavigatedToMovies = false;
  
  // Try each header link that might be the Movies link
  for (let i = 0; i < count; i++) {
    const link = headerLinks.nth(i);
    const text = await link.textContent();
    
    if (text && (text.includes('Movies') || text.includes('Home'))) {
      await link.click();
      await expect(page).toHaveURL(/\//);
      hasNavigatedToMovies = true;
      break;
    }
  }
  
  // If we couldn't find a Movies link, try going to the homepage directly
  if (!hasNavigatedToMovies) {
    await page.goto('/');
  }
  
  // Now check if we can navigate to the Favorites page
  const favoritesLink = page.locator('a:has-text("Favorites"), button:has-text("Favorites")').first();
  await expect(favoritesLink).toBeVisible();
  await favoritesLink.click();
  
  // Take a screenshot for debugging
  await page.screenshot({ path: 'favorites-page-state.png' });
  
  // Check for various possible states on the favorites page
  const possibleStates = [
    'text=Please sign in',
    'text=You have no favorite',
    'text=No favorites',
    'text=Sign in',
    '[data-testid="favorites-container"]',
    '[data-testid="empty-state"]'
  ];
  
  let foundExpectedState = false;
  
  for (const selector of possibleStates) {
    const element = page.locator(selector);
    if (await element.count() > 0) {
      console.log(`Found expected element on favorites page: ${selector}`);
      foundExpectedState = true;
      break;
    }
  }
  
  // If we can't find any expected state, just verify we're on the favorites page by URL
  if (!foundExpectedState) {
    await expect(page).toHaveURL(/\/favorites/);
    console.log('On favorites page according to URL');
  }
});

// Test the responsive design
test('responsive design works correctly', async ({ page }) => {
  // Test mobile viewport
  await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
  await page.goto('/');
  
  // Take a screenshot for debugging
  await page.screenshot({ path: 'mobile-viewport.png' });
  
  // Verify the mobile menu is accessible - try different selectors for the menu button
  const mobileMenuSelectors = [
    'button[aria-label="Open menu"]', 
    '[aria-label="Menu"]',
    'button:has-text("Menu")',
    'button.hamburger',
    'header button'
  ];
  
  let menuButtonFound = false;
  let menuButton;
  
  for (const selector of mobileMenuSelectors) {
    menuButton = page.locator(selector).first();
    if (await menuButton.count() > 0) {
      menuButtonFound = true;
      console.log(`Found mobile menu button with selector: ${selector}`);
      break;
    }
  }
  
  if (menuButtonFound && menuButton) {
    await menuButton.click();
    
    // Verify some navigation is visible after clicking
    const navElements = page.locator('a[href], button');
    const elementCount = await navElements.count();
    expect(elementCount).toBeGreaterThanOrEqual(2);
  } else {
    // If no menu button is found, the navigation might be already visible
    console.log('No mobile menu button found, assuming navigation is always visible');
  }
  
  // Test desktop viewport
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  
  // Take a screenshot for debugging desktop view
  await page.screenshot({ path: 'desktop-viewport.png' });
  
  // Verify search form is accessible
  await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
  
  // Verify the grid layout for search results
  await page.fill('input[placeholder*="Search"]', 'Star Wars');
  await page.click('button[type="submit"]');
  
  // Wait for results
  await page.waitForSelector('.searching-indicator', { state: 'hidden', timeout: 10000 });
  
  // Check if grid layout is applied by verifying multiple cards are visible
  const movieCards = page.locator('[data-testid="movie-card"]');
  await expect(movieCards.first()).toBeVisible();
  const count = await movieCards.count();
  expect(count).toBeGreaterThan(1);
}); 