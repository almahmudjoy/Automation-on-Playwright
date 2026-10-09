
import { test, expect } from '@playwright/test';

test.describe('DMoney Smoke Test @smoke', () => {
  test('Login page loads successfully', async ({ page }) => {
    await page.goto('/login');

    await expect(page).toHaveURL(/\/login/);

    await expect(
      page.getByPlaceholder('Enter email or phone number')
    ).toBeVisible();

    await expect(
      page.getByRole('button', { name: /login/i })
    ).toBeVisible();

    console.log('SMOKE PASS: Login page loaded');
  });


test('Registration page loads successfully', async ({ page }) => {
  await page.goto('/register');

  await expect(page).toHaveURL(/\/register/);

  console.log(
    'REGISTER PAGE HEADINGS:',
    await page.locator('h1, h2, h3').allInnerTexts()
  );

  console.log(
    'REGISTER PAGE TEXT:',
    (await page.locator('body').innerText()).slice(0, 1500)
  );

  await expect(page.locator('input').first()).toBeVisible();

  console.log('SMOKE PASS: Registration page loaded');
});



  test('Forgot password page loads successfully', async ({ page }) => {
    await page.goto('/forgot-password');

    await expect(page).toHaveURL(/\/forgot-password/);

    await expect(
      page.getByRole('textbox', {
        name: 'Email or Phone Number',
      })
    ).toBeVisible();

    console.log('SMOKE PASS: Forgot password page loaded');
  });
});