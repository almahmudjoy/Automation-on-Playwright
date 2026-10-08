import { Page, Locator, expect } from '@playwright/test';

export class AgentPage {
  readonly page: Page;

  // Balance
  readonly balanceLabel: Locator;
  readonly balanceInput: Locator;

  // Cash In
  readonly cashInLink: Locator;
  readonly customerPhoneInput: Locator;
  readonly amountInput: Locator;
  readonly cashInButton: Locator;

  // Logout
  readonly profileMenu: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // ==========================================
    // Balance locators
    // ==========================================

    this.balanceLabel = page.locator('label').filter({
      hasText: 'Current Balance (BDT)',
    });

    this.balanceInput = page.getByLabel(
      'Current Balance (BDT)'
    );

    // ==========================================
    // Cash In locators
    // ==========================================

    this.cashInLink = page.getByRole('link', {
      name: 'Cash In',
      exact: true,
    });

    this.customerPhoneInput = page.getByRole('textbox', {
      name: 'Customer Phone Number',
    });

    this.amountInput = page.getByLabel(
      'Amount (BDT)'
    );

    this.cashInButton = page.getByRole('button', {
      name: /Cash In/i,
    });


    this.profileMenu = page.locator('svg').nth(2);

this.logoutButton = page.getByRole('menuitem', {
  name: /Logout/i,
});




  }

  // ==========================================
  // Verify Agent Balance
  // ==========================================

  async verifyBalance(expectedBalance: string) {
    await expect(this.page).toHaveURL(
      /.*\/profile/,
      {
        timeout: 10000,
      }
    );

    await expect(this.balanceLabel).toHaveCount(1);

    await expect(this.balanceLabel).toBeVisible({
      timeout: 10000,
    });

    await expect(this.balanceInput).toBeVisible({
      timeout: 10000,
    });

    const actualBalance =
      await this.balanceInput.inputValue();

    console.log(
      'AGENT CURRENT BALANCE:',
      actualBalance
    );

    console.log(
      'EXPECTED BALANCE:',
      expectedBalance
    );

    const actual = Number(actualBalance);
    const expected = Number(expectedBalance);

    expect(actual).toBe(expected);

    console.log(
      `AGENT BALANCE VERIFIED: ${actualBalance} BDT`
    );
  }

  // ==========================================
  // Inspect Agent Page
  // ==========================================

  async inspectPage() {
    console.log(
      'AGENT PAGE URL:',
      this.page.url()
    );

    console.log(
      'AGENT PAGE:',
      await this.page
        .locator('body')
        .innerText()
    );
  }

  // ==========================================
  // Open Cash In
  // ==========================================

  async openCashIn() {
    await this.cashInLink.click();

    await expect(this.page).toHaveURL(
      /.*\/agent\/cash-in/,
      {
        timeout: 10000,
      }
    );

    await expect(
      this.customerPhoneInput
    ).toBeVisible({
      timeout: 10000,
    });

    console.log(
      'AGENT CASH IN PAGE OPENED'
    );
  }

  // ==========================================
  // Cash In to Customer
  // ==========================================

  async cashInToCustomer(
  phone: string,
  amount: string
) {
  await this.customerPhoneInput.fill(phone);

  await expect(
    this.customerPhoneInput
  ).toHaveValue(phone);

  await this.amountInput.fill(amount);

  await expect(
    this.amountInput
  ).toHaveValue(amount);

  await this.cashInButton.click();

  await this.page.waitForTimeout(1500);

  const bodyText =
    await this.page.locator('body').innerText();

  if (
    /limit exceeded|cannot deposit/i.test(
      bodyText
    )
  ) {
    throw new Error(
      `DEPOSIT_REJECTED: ${bodyText}`
    );
  }

  console.log(
    `AGENT CASH IN SUBMITTED: ${amount} BDT -> ${phone}`
  );
}



  async logout() {
  // Open profile/account menu
  await this.profileMenu.waitFor({
    state: 'visible',
    timeout: 10000,
  });

  await this.profileMenu.click();

  console.log('AGENT PROFILE MENU OPENED');

  // Wait for Logout menu item
  await this.logoutButton.waitFor({
    state: 'visible',
    timeout: 10000,
  });

  console.log('AGENT LOGOUT BUTTON VISIBLE');

  await this.logoutButton.click();

  // Verify logout redirected to login page
  await expect(this.page).toHaveURL(
    /.*\/login/,
    {
      timeout: 10000,
    }
  );

  console.log('AGENT LOGGED OUT');
}



  






}