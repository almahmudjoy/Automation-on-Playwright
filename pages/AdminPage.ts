import { Page, Locator, expect } from '@playwright/test';
import { agentData } from '../data/testData';

export class AdminPage {
  readonly page: Page;

  readonly usersMenu: Locator;
  

  readonly searchTypeDropdown: Locator;
  readonly searchByEmailOption: Locator;
  readonly emailInput: Locator;
  readonly searchButton: Locator;
  readonly resetButton: Locator;

  readonly agentRow: Locator;
  readonly agentEmail: Locator;
  readonly pendingStatus: Locator;

  readonly viewButton: Locator;

  readonly editUserButton: Locator;

readonly accountStatusDropdown: Locator;
readonly activeStatusOption: Locator;
readonly saveChangesButton: Locator;

readonly activeStatus: Locator;

readonly adminMenu: Locator;
readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.usersMenu = page.getByRole('link', {
      name: 'User List',
      exact: true,
    });

    this.adminMenu = page.getByText('Admin').nth(1);

    this.logoutButton = page.getByRole('menuitem', {
      name: '🚪 Logout',
    });

    this.searchTypeDropdown = page
      .getByRole('combobox')
      .first();

    this.searchByEmailOption = page
      .locator('[role="listbox"]')
      .getByText('Search by Email', {
        exact: true,
      });

    this.emailInput = page.getByRole('textbox', {
      name: 'Enter Email',
    });

    this.searchButton = page.getByRole('button', {
      name: 'Search',
      exact: true,
    });

    this.resetButton = page.getByRole('button', {
      name: 'Reset',
      exact: true,
    });

    // Agent row
    this.agentRow = page.locator('tr').filter({
      hasText: agentData.email,
    });

    // Agent email inside that row
    this.agentEmail = this.agentRow.getByText(agentData.email, {
      exact: true,
    });

    // Newly registered Agent should be PENDING
    this.pendingStatus = this.agentRow.getByText('PENDING', {
      exact: true,
    });

    this.viewButton = this.agentRow.getByRole('button', {
      name: /VIEW/i,
    });

    this.editUserButton = page.getByRole('button', {
    name: /Edit User/i,
    });


    this.accountStatusDropdown = page
    .getByText('Account Status', { exact: true })
    .locator('..')
    .getByRole('combobox');

    this.activeStatusOption = page
    .locator('[role="listbox"]')
    .getByText('Active', {
    exact: true,
    });

    this.saveChangesButton = page.getByRole('button', {
    name: 'Save Changes',
    exact: true,
    });


    this.activeStatus = page.getByText('ACTIVE', {
    exact: true,
    });

  }

  async openUsers() {
    await this.usersMenu.click();
  }

  async selectEmailSearch() {
    await this.searchTypeDropdown.click();
    await this.searchByEmailOption.click();
  }

  async searchByEmail(email: string) {
    await this.emailInput.fill(email);

    await expect(this.emailInput).toHaveValue(email);

    await this.searchButton.click();

    // Wait for search result
    await this.agentRow.waitFor({
      state: 'visible',
      timeout: 10000,
    });
  }

  async verifyAgentExists() {
    await expect(this.agentRow).toBeVisible({
      timeout: 10000,
    });
  }

  async verifyAgentPending() {
    await expect(this.pendingStatus).toBeVisible({
      timeout: 10000,
    });
  }

  async openAgentDetails() {
  await this.viewButton.click();
  }

  async editUser() {
    await this.editUserButton.click();
  }

  async changeStatusToActive() {
  await this.accountStatusDropdown.click();

  await this.activeStatusOption.click();
}

  async saveChanges() {
  await this.saveChangesButton.click();
}

async verifyAgentActive() {
  await expect(this.activeStatus).toBeVisible({
    timeout: 10000,
  });
}

async findExistingCustomerAccounts(): Promise<string[]> {
  const searchTypeDropdown = this.page
    .getByRole('combobox')
    .first();

  await searchTypeDropdown.click();

  await this.page
    .locator('[role="listbox"]')
    .getByText('Search by Role', {
      exact: true,
    })
    .click();

  // Role dropdown
  const roleDropdown = this.page
    .getByRole('combobox')
    .nth(1);

  await roleDropdown.click();

  await this.page
    .locator('[role="listbox"]')
    .getByText('Customer', {
      exact: true,
    })
    .click();

  await this.searchButton.click();

  await this.page.waitForTimeout(1000);

  const rows = this.page.locator('tbody tr');

  await expect(rows.first()).toBeVisible({
    timeout: 10000,
  });

  const customers = new Set<string>();

  const rowCount = await rows.count();

  for (let i = 0; i < rowCount; i++) {
    const row = rows.nth(i);

    const rowText = await row.innerText();

    const phone = rowText.match(
      /\b01\d{9}\b/
    )?.[0];

    if (phone) {
      customers.add(phone);
    }
  }

  if (customers.size === 0) {
    throw new Error(
      'No existing Customer account found.'
    );
  }

  console.log(
    'AVAILABLE CUSTOMER ACCOUNTS:',
    [...customers]
  );

  return [...customers];
}




  async logout() {
  await this.adminMenu.click();

  await this.logoutButton.waitFor({
    state: 'visible',
    timeout: 10000,
  });

  await this.logoutButton.click();
}
}