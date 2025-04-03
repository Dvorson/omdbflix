// This file contains helpers to set up test state for E2E tests in CI
import { Page } from '@playwright/test';

/**
 * Sets a mock auth token in localStorage to simulate a logged-in user
 * This is useful for CI where the real login flow might be unreliable
 */
export async function setupTestUser(page: Page): Promise<void> {
  // Create a mock token that will be recognized by the frontend
  const mockToken = 'test-jwt-token';
  const mockUser = {
    id: 'test123',
    name: 'Test User',
    email: 'test@example.com'
  };

  // Set up localStorage with token and user
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }, { token: mockToken, user: mockUser });

  // Reload the page to let the app pick up the token
  await page.reload();
  
  console.log('Test user set up with mock authentication token');
}

/**
 * Sets up mock favorite movies in localStorage
 */
export async function setupFavorites(page: Page, movieIds: string[]): Promise<void> {
  await page.evaluate((ids) => {
    localStorage.setItem('favorites', JSON.stringify(ids));
  }, movieIds);
  
  console.log(`Set up ${movieIds.length} favorite movies in localStorage`);
}

/**
 * Clears authentication and favorites from localStorage
 */
export async function cleanupTestData(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('favorites');
  });
} 