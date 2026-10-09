import { Page, Locator, expect } from '@playwright/test';

export class AgentPage {
  readonly page: Page;

  readonly balanceLabel: Locator;
  readonly balanceInput: Locator;

  readonly cashInLink: Locator;
  readonly customerPhoneInput: Locator;
  readonly amountInput: Locator;
  readonly cashInButton: Locator;

  readonly profileMenu: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.balanceLabel = page.locator('label').filter({
      hasText: 'Current Balance (BDT)',
    });

    this.balanceInput = page.getByLabel(
      'Current Balance (BDT)'
    );

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

  async verifyBalance(expectedBalance: string) {
    await expect(this.page).toHaveURL(
      /.*\/profile/,
      {
        timeout: 10000,
      }
    );

    await expect(
      this.balanceLabel
    ).toHaveCount(1);

    await expect(
      this.balanceLabel
    ).toBeVisible({
      timeout: 10000,
    });

    await expect(
      this.balanceInput
    ).toBeVisible({
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

    const actual =
      Number(actualBalance);

    const expected =
      Number(expectedBalance);

    expect(actual).toBe(expected);

    console.log(
      `AGENT BALANCE VERIFIED: ${actualBalance} BDT`
    );
  }

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
      await this.page
        .locator('body')
        .innerText();

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

  
async cashInToAnyCustomer(
  customerAccounts: string[],
  amount: string
): Promise<string> {
  let lastError = '';

  for (const customer of customerAccounts) {
    console.log(`TRYING CUSTOMER ACCOUNT: ${customer}`);

    try {
      await this.customerPhoneInput.fill('');
      await this.customerPhoneInput.fill(customer);
      await this.amountInput.fill('');
      await this.amountInput.fill(amount);

      await this.cashInButton.click();
      await this.page.waitForTimeout(1500);

      const bodyText = await this.page.locator('body').innerText();

      const rejected =
        /user\s+does(?:n['’]?t| not)\s+exist|user\s+not\s+found|customer\s+not\s+found|account\s+not\s+found|limit\s+exceeded|cannot\s+deposit|insufficient\s+balance/i;

      if (rejected.test(bodyText)) {
        lastError = bodyText;
        console.log(`CUSTOMER REJECTED: ${customer}`);
        console.log(
          'REJECTION MESSAGE:',
          bodyText.match(rejected)?.[0]
        );
        continue;
      }

      console.log(`CUSTOMER DEPOSIT ACCEPTED: ${customer}`);
      return customer;
    } catch (error) {
      lastError =
        error instanceof Error ? error.message : String(error);

      console.log(`CUSTOMER ATTEMPT FAILED: ${customer}`);
    }
  }

  throw new Error(
    `NO CUSTOMER ACCOUNT ACCEPTED ${amount} BDT. Last error: ${lastError}`
  );
}

  async logout() {

    await this.profileMenu.waitFor({
      state: 'visible',
      timeout: 10000,
    });

    await this.profileMenu.click();

    console.log(
      'AGENT PROFILE MENU OPENED'
    );

    await this.logoutButton.waitFor({
      state: 'visible',
      timeout: 10000,
    });

    await this.logoutButton.click();

    await expect(
      this.page
    ).toHaveURL(
      /.*\/login/,
      {
        timeout: 10000,
      }
    );

    console.log(
      'AGENT LOGGED OUT'
    );

  }

  async openSelfStatement() {
  const selfStatementLink =
    this.page.getByRole('link', {
      name: /Self Statement/i,
    });

  await selfStatementLink.waitFor({
    state: 'visible',
    timeout: 10000,
  });

  await selfStatementLink.click();

  await expect(this.page).toHaveURL(
    /.*self-statement.*/i,
    {
      timeout: 10000,
    }
  );

  console.log(
    'SELF STATEMENT PAGE OPENED'
  );
}
















}