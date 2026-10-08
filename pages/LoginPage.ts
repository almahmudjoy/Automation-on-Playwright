import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;

  readonly emailOrPhoneInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly signupLink: Locator;

  readonly otpInput: Locator;
  readonly verifyOtpButton: Locator;
  

  readonly resetEmailOrPhoneInput: Locator;
  readonly sendResetLinkButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.emailOrPhoneInput = page.getByPlaceholder(
      'Enter email or phone number'
    );

    this.passwordInput = page.getByRole('textbox', {
      name: 'Password',
    });

    this.loginButton = page.getByRole('button', {
      name: /Login/i,
    });

    this.forgotPasswordLink = page.getByText('Forgot password?', {
      exact: true,
    });

    this.signupLink = page.getByRole('link', {
      name: /Sign Up Free/i,
    });

    this.otpInput = page.getByRole('textbox', {
      name: 'Enter 4-Digit OTP',
    });

    this.verifyOtpButton = page.getByRole('button', {
      name: /Verify OTP/i,
    });

    this.resetEmailOrPhoneInput = page.getByRole('textbox', {
  name: 'Email or Phone Number',
});

this.sendResetLinkButton = page.getByRole('button', {
  name: 'Send Reset Link →',
});






  }





  async goto() {
    await this.page.goto('/login');

    console.log('LOGIN PAGE URL AFTER GOTO:', this.page.url());

    console.log(
      'LOGIN PAGE BODY:',
      await this.page.locator('body').innerText()
    );
  }

  async login(emailOrPhone: string, password: string) {
    await this.emailOrPhoneInput.waitFor({
      state: 'visible',
      timeout: 15000,
    });

    await this.emailOrPhoneInput.fill(emailOrPhone);

    await this.passwordInput.fill(password);

    await this.loginButton.click();
  }

  async verifyOtp(otp: string) {
    await this.otpInput.waitFor({
      state: 'visible',
      timeout: 15000,
    });

    await this.otpInput.fill(otp);

    await expect(
      this.otpInput
    ).toHaveValue(otp);

    await this.verifyOtpButton.waitFor({
      state: 'visible',
      timeout: 15000,
    });

    await this.verifyOtpButton.click();

    await expect(
      this.page
    ).not.toHaveURL(/.*\/login/, {
      timeout: 10000,
    });
  }


  async openForgotPassword() {
  await this.forgotPasswordLink.waitFor({
    state: 'visible',
    timeout: 10000,
  });

  await this.forgotPasswordLink.click();

  await expect(
      this.page.getByRole('textbox', {
      name: 'Email or Phone Number',
    })
  ).toBeVisible({
    timeout: 10000,
  });

  console.log('FORGOT PASSWORD PAGE OPENED');
}





async requestPasswordReset(emailOrPhone: string) {
  console.log('STEP 15B-1: Forgot Password page opened');

  await this.resetEmailOrPhoneInput.waitFor({
    state: 'visible',
    timeout: 10000,
  });

  console.log('STEP 15B-2: Email/Phone input is visible');

  await this.resetEmailOrPhoneInput.fill(emailOrPhone);

  console.log(
    'STEP 15B-3: Agent email filled:',
    emailOrPhone
  );

  await expect(this.resetEmailOrPhoneInput).toHaveValue(
    emailOrPhone
  );

  console.log('STEP 15B-4: Email value verified');

  await this.sendResetLinkButton.waitFor({
    state: 'visible',
    timeout: 10000,
  });

  console.log(
    'STEP 15B-5: Send Reset Link button is visible'
  );

  await this.sendResetLinkButton.click();

  console.log('STEP 15B-6: Send Reset Link clicked');

  // Wait for the success message shown by the application.
  await expect(
    this.page.getByText(
      'Password reset link has been sent to your registered email address.',
      { exact: false }
    )
  ).toBeVisible({
    timeout: 15000,
  });

  console.log(
    'STEP 15B-7: Password reset success message displayed'
  );
}






















}

