import { Page, Locator, expect } from '@playwright/test';

export class SystemPage {
  readonly page: Page;

  readonly cashInLink: Locator;
  readonly customerPhoneInput: Locator;
  readonly amountInput: Locator;
  readonly cashInButton: Locator;

  readonly profileMenu: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.cashInLink = page.getByRole('link', {
      name: 'Cash In',
      exact: true,
    });

    this.customerPhoneInput = page.getByRole('textbox', {
      name: 'Customer Phone Number',
    });

    this.amountInput = page.getByLabel('Amount (BDT)');

    this.cashInButton = page.getByRole('button', {
      name: /Cash In/i,
    });

    this.profileMenu = page.getByText('SYSTEM', {
      exact: true,
    }).first();

    this.logoutButton = page.getByRole('menuitem', {
      name: '🚪 Logout',
    });
  }

  async openCashIn() {
    await this.cashInLink.click();

    await expect(this.page).toHaveURL(
      /.*\/agent\/cash-in/
    );
  }

  async cashIn(phone: string, amount: string) {
    await this.customerPhoneInput.fill(phone);

    await expect(
      this.customerPhoneInput
    ).toHaveValue(phone);

    await this.amountInput.fill(amount);

    await expect(
      this.amountInput
    ).toHaveValue(amount);

    await this.cashInButton.click();

    await expect(
      this.cashInButton
    ).toBeEnabled({
      timeout: 10000,
    });
  }

  async logout() {
    await this.profileMenu.click();

    await this.logoutButton.waitFor({
      state: 'visible',
      timeout: 10000,
    });

    await this.logoutButton.click();
  }
}