import { test, expect } from './fixtures';

test.describe('File Analysis Pipeline App', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should display the application window', async ({ app, page }) => {
    expect(app).toBeTruthy();
    expect(page).toBeTruthy();
    await expect(page).toHaveTitle('File Analysis Pipeline');
  });

  test('should show sign in button when not authenticated', async ({ page }) => {
    await page.waitForSelector('button, a');
    const btn = page.getByRole('link', { name: /sign in/i });
    await expect(btn).toBeVisible();
    await expect(btn).toHaveAttribute('href', 'http://localhost:8080/v1/google/init');
  });

  test('should display correct message when no folder is selected', async ({ page }) => {
    const msg = page.getByText(/select a folder to watch/i);
    await expect(msg).toBeVisible();
  });

  test('should show folder selection button when authenticated', async ({ page }) => {
    await page.evaluate(() => {
      sessionStorage.setItem('token', 'mock-test-token');
    });
    await page.waitForTimeout(600);
    const btn = page.getByRole('button', { name: /select folder/i });
    await expect(btn).toBeVisible();
  });

  test('should show sign out button when authenticated', async ({ page }) => {
    await page.evaluate(() => {
      sessionStorage.setItem('token', 'mock-test-token');
    });
    await page.waitForTimeout(600);
    const btn = page.getByRole('button', { name: /sign out/i });
    await expect(btn).toBeVisible();
  });

  test('should sign out when sign out button is clicked', async ({ page }) => {
    await page.evaluate(() => {
      sessionStorage.setItem('token', 'mock-test-token');
    });
    await page.waitForTimeout(600);
    const btn = page.getByRole('button', { name: /sign out/i });
    await btn.click();
    await page.waitForTimeout(600);
    const token = await page.evaluate(() => sessionStorage.getItem('token'));
    expect(token).toBeNull();
    const signIn = page.getByRole('link', { name: /sign in/i });
    await expect(signIn).toBeVisible();
  });

  test('should display watched folder path when set', async ({ page }) => {
    const p = '/home/user/test-folder';
    await page.evaluate((path) => {
      sessionStorage.setItem('token', 'mock-test-token');
      localStorage.setItem('watchedFolder', path);
    }, p);
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(600);
    const msg = page.getByText(/ready to upload/i);
    await expect(msg).toBeVisible();
    const el = page.locator('code', { hasText: p });
    await expect(el).toBeVisible();
  });

  test('should have close button in window controls', async ({ page }) => {
    const btn = page.getByRole('button', { name: /✕/ });
    await expect(btn).toBeVisible();
  });
});
