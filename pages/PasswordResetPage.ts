import { expect, Page } from '@playwright/test';
import { GmailClient } from '../utils/GmailClient';

export class PasswordResetPage {
  constructor(private readonly page: Page) {}

  async reset(
    email: string,
    newPassword: string,
    gmail: GmailClient
  ) {
    const browser = this.page.context().browser();

    if (!browser) {
      throw new Error(
        'Cannot create an isolated browser context for password reset.'
      );
    }

    const context = await browser.newContext();
    const resetPage = await context.newPage();

    try {
      const forgotPasswordUrl = new URL(
        '/forgot-password',
        this.page.url()
      ).toString();

      for (let attempt = 0; attempt < 2; attempt++) {
        console.log(
          `PASSWORD RESET ATTEMPT: ${attempt + 1}`
        );

        await resetPage.goto(forgotPasswordUrl);

        const emailInput = resetPage.getByRole('textbox', {
          name: 'Email or Phone Number',
        });

        await emailInput.waitFor({
          state: 'visible',
          timeout: 15000,
        });

        await emailInput.fill(email);

        await expect(emailInput).toHaveValue(email);

        console.log(
          'PASSWORD RESET EMAIL FILLED:',
          email
        );

        const requestedAt = Date.now();

        const sendResetButton = resetPage.getByRole(
          'button',
          {
            name: 'Send Reset Link →',
          }
        );

        await sendResetButton.waitFor({
          state: 'visible',
          timeout: 10000,
        });

        await sendResetButton.click();

        console.log(
          'PASSWORD RESET LINK REQUESTED'
        );

        const resetLink =
          await gmail.waitForResetLink(
            requestedAt,
            email
          );

        console.log(
          'PASSWORD RESET LINK RECEIVED:',
          resetLink
        );

        await resetPage.goto(resetLink);

        console.log(
          'RESET PASSWORD PAGE OPENED:',
          resetPage.url()
        );

        const passwordFields = resetPage.locator(
          'input[type="password"], input[placeholder*="password" i], input[aria-label*="password" i], input[name*="password" i]'
        );

        await passwordFields
          .first()
          .waitFor({
            state: 'visible',
            timeout: 10000,
          })
          .catch(() => undefined);

        const invalidLink = resetPage
          .getByText(
            /invalid reset link|request a new password reset|need a new link/i
          )
          .first();

        const passwordVisible =
          await passwordFields
            .first()
            .isVisible()
            .catch(() => false);

        const invalidVisible =
          await invalidLink
            .isVisible()
            .catch(() => false);

        if (!passwordVisible && invalidVisible) {
          console.log(
            'RESET LINK INVALID'
          );

          if (attempt === 1) {
            throw new Error(
              'Password reset link remained invalid after retry.'
            );
          }

          continue;
        }

        let firstPassword =
          passwordFields.first();

        if (
          !(await firstPassword
            .isVisible()
            .catch(() => false))
        ) {
          const fallback =
            resetPage
              .getByLabel(
                /new password|confirm password|password/i
              )
              .first();

          if (
            await fallback
              .isVisible()
              .catch(() => false)
          ) {
            firstPassword = fallback;
          }
        }

        await expect(firstPassword).toBeVisible({
          timeout: 10000,
        });

        await firstPassword.fill(newPassword);

        const secondPassword =
          passwordFields.nth(1);

        if (
          await secondPassword
            .isVisible()
            .catch(() => false)
        ) {
          await secondPassword.fill(
            newPassword
          );
        } else {
          const confirmPassword =
            resetPage
              .getByLabel(
                /confirm password|repeat password/i
              )
              .first();

          if (
            await confirmPassword
              .isVisible()
              .catch(() => false)
          ) {
            await confirmPassword.fill(
              newPassword
            );
          }
        }

        const submitButton =
          resetPage
            .getByRole('button', {
              name: /reset|change|update password|submit/i,
            })
            .last();

        await submitButton.click();

        await expect(
          resetPage
            .getByText(
              /success|updated|reset|password changed/i
            )
            .first()
        ).toBeVisible({
          timeout: 15000,
        });

        console.log(
          'PASSWORD RESET SUCCESSFUL'
        );

        return;
      }
    } finally {
      await context.close();
    }
  }
}