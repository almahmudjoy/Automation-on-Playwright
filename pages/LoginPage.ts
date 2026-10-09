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




















}

