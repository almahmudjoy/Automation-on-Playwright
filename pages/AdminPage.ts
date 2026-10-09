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

    this.agentRow = page.locator('tr').filter({
      hasText: agentData.email,
    });

    this.agentEmail = this.agentRow.getByText(
      agentData.email,
      {
        exact: true,
      }
    );

    this.pendingStatus = this.agentRow.getByText(
      'PENDING',
      {
        exact: true,
      }
    );

    this.viewButton = this.agentRow.getByRole(
      'button',
      {
        name: /VIEW/i,
      }
    );

    this.editUserButton = page.getByRole(
      'button',
      {
        name: /Edit User/i,
      }
    );

    this.accountStatusDropdown = page
      .getByText('Account Status', {
        exact: true,
      })
      .locator('..')
      .getByRole('combobox');

    this.activeStatusOption = page
      .locator('[role="listbox"]')
      .getByText('Active', {
        exact: true,
      });

    this.saveChangesButton = page.getByRole(
      'button',
      {
        name: 'Save Changes',
        exact: true,
      }
    );

    this.activeStatus = page.getByText(
      'ACTIVE',
      {
        exact: true,
      }
    );
  }

  async openUsers() {
    await this.usersMenu.waitFor({
      state: 'visible',
      timeout: 10000,
    });

    await this.usersMenu.click();
  }

  async selectEmailSearch() {
    await this.searchTypeDropdown.waitFor({
      state: 'visible',
      timeout: 10000,
    });

    await this.searchTypeDropdown.click();

    await this.searchByEmailOption.waitFor({
      state: 'visible',
      timeout: 10000,
    });

    await this.searchByEmailOption.click();
  }

  async searchByEmail(email: string) {
    await this.emailInput.waitFor({
      state: 'visible',
      timeout: 10000,
    });

    await this.emailInput.fill(email);

    await expect(this.emailInput).toHaveValue(
      email
    );

    await this.searchButton.click();

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
    await expect(
      this.pendingStatus
    ).toBeVisible({
      timeout: 10000,
    });
  }

  async openAgentDetails() {
    await this.viewButton.waitFor({
      state: 'visible',
      timeout: 10000,
    });

    await this.viewButton.click();
  }

  async editUser() {
    await this.editUserButton.waitFor({
      state: 'visible',
      timeout: 10000,
    });

    await this.editUserButton.click();
  }

  async changeStatusToActive() {
    await this.accountStatusDropdown.waitFor({
      state: 'visible',
      timeout: 10000,
    });

    await this.accountStatusDropdown.click();

    await this.activeStatusOption.waitFor({
      state: 'visible',
      timeout: 10000,
    });

    await this.activeStatusOption.click();
  }

  async saveChanges() {
    await this.saveChangesButton.waitFor({
      state: 'visible',
      timeout: 10000,
    });

    await this.saveChangesButton.click();
  }

  async verifyAgentActive() {
    await expect(
      this.activeStatus
    ).toBeVisible({
      timeout: 10000,
    });
  }

  async findExistingCustomerAccounts(): Promise<string[]> {
    if (process.env.CUSTOMER_ACCOUNT) {
      return [process.env.CUSTOMER_ACCOUNT];
    }

    /*
     * IMPORTANT:
     * After activating the Agent we are on:
     *
     * /admin/users/:id
     *
     * The first combobox there is the disabled
     * Agent role dropdown.
     *
     * Therefore we MUST return to /admin/users
     * before searching Customer accounts.
     */

    await this.page.goto('/admin/users');

    await expect(
      this.page.locator('table')
    ).toBeVisible({
      timeout: 10000,
    });

    /*
     * Select "Search by Role"
     */
    const searchType =
      this.page.getByRole('combobox').first();

    await searchType.waitFor({
      state: 'visible',
      timeout: 10000,
    });

    await searchType.click();

    await this.page
      .getByRole('option', {
        name: /search by role/i,
      })
      .click();

    /*
     * Select Customer from second dropdown
     */
    const roleDropdown =
      this.page.getByRole('combobox').nth(1);

    await roleDropdown.waitFor({
      state: 'visible',
      timeout: 10000,
    });

    await roleDropdown.click();

    await this.page
      .getByRole('option', {
        name: /^customer$/i,
      })
      .click();

    /*
     * Search
     */
    const totalHeading =
      this.page.getByRole('heading', {
        name: /total:/i,
      });

    const totalBeforeSearch =
      await totalHeading.innerText();

    await this.searchButton.click();

    await expect
      .poll(
        async () =>
          totalHeading.innerText()
      )
      .not.toBe(totalBeforeSearch);

    /*
     * Customer table
     */
    const rows =
      this.page.locator('tbody tr');

    /*
     * Go to first page if pagination exists
     */
    const firstPage =
      this.page
        .getByRole('button', {
          name: /go to first page/i,
        })
        .first();

    if (
      await firstPage
        .isVisible()
        .catch(() => false) &&
      !(await firstPage.isDisabled())
    ) {
      await firstPage.click();
    }

    /*
     * Store unique customer accounts
     */
    const accounts =
      new Set<string>();

    /*
     * Pagination
     */
    const pagination =
      this.page.getByRole('navigation', {
        name: /pagination navigation/i,
      });

    while (true) {
      await expect(
        rows.first()
      ).toBeVisible({
        timeout: 10000,
      });

      const rowCount =
        await rows.count();

      for (
        let index = 0;
        index < rowCount;
        index++
      ) {
        const row =
          rows.nth(index);

        const cells =
          row.locator('td');

        /*
         * Expected user-list row has
         * at least 7 cells.
         */
        if (
          (await cells.count()) < 7
        ) {
          continue;
        }

        /*
         * Role is column index 5.
         */
        const role =
          (
            await cells
              .nth(5)
              .innerText()
          ).trim();

        if (
          role.toLowerCase() !==
          'customer'
        ) {
          continue;
        }

        const rowText =
          await row.innerText();

        /*
         * Prefer phone number.
         */
        
          const phone = rowText.match(/\b01\d{9}\b/)?.[0];

        // Cash In requires a customer phone number.
        // Never use an email as the customer account.
            if (phone) {
            accounts.add(phone);
        }
      }

      /*
       * Next page
       */
      const nextPage =
        this.page
          .getByRole('button', {
            name: /go to next page/i,
          })
          .last();

      if (
        !(await nextPage
          .isVisible()
          .catch(() => false)) ||
        await nextPage.isDisabled()
      ) {
        break;
      }

      /*
       * Remember current page.
       */
      const activePage =
        pagination
          .getByRole('button', {
            name: /^page \d+$/i,
          })
          .last();

      const currentPage =
        await activePage.getAttribute(
          'aria-label'
        ) ??
        await activePage.innerText();

      /*
       * Go next.
       */
      await nextPage.click();

      /*
       * Wait until page changes.
       */
      await expect
        .poll(async () => {
          const pageButton =
            pagination
              .getByRole('button', {
                name: /^page \d+$/i,
              })
              .last();

          return (
            await pageButton.getAttribute(
              'aria-label'
            ) ??
            await pageButton.innerText()
          );
        })
        .not.toBe(currentPage);
    }

    /*
     * No customers found
     */
    if (!accounts.size) {
      throw new Error(
        'No existing Customer account could be extracted from the Admin user list.'
      );
    }

    const result =
      [...accounts];

    console.log(
      'EXISTING CUSTOMER ACCOUNTS:',
      result
    );

    return result;
  }

  async logout() {
    await this.adminMenu.waitFor({
      state: 'visible',
      timeout: 10000,
    });

    await this.adminMenu.click();

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
      'ADMIN LOGGED OUT'
    );
  }
}