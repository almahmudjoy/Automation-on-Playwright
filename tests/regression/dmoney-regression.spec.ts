import { test, expect } from '@playwright/test';

import {
  mkdir,
  readFile,
  writeFile,
} from 'node:fs/promises';

import path from 'node:path';

import { SignupPage } from '../../pages/SignupPage';
import { LoginPage } from '../../pages/LoginPage';
import { AdminPage } from '../../pages/AdminPage';
import { SystemPage } from '../../pages/SystemPage';
import { AgentPage } from '../../pages/AgentPage';
import { GmailClient } from '../../utils/GmailClient';
import { PasswordResetPage } from '../../pages/PasswordResetPage';

import {
  agentData,
  adminCredentials,
  systemCredentials,
} from '../../data/testData';

test.describe('DMoney Agent Registration', () => {
  test('Register a new Agent successfully', async ({
    page,
    request,
  }) => {
    // =========================================================
    // STEP 1 — REGISTER AGENT
    // =========================================================

    const signupPage = new SignupPage(page);

    await signupPage.goto();

    console.log(
      'REGISTERING AGENT EMAIL:',
      agentData.email
    );

    await signupPage.fillRegistrationData(
      agentData.fullName,
      agentData.email,
      agentData.password,
      agentData.phone,
      agentData.nid
    );

    await signupPage.selectAgentRole();
    await signupPage.createAccount();

    await expect(
      page.getByText(
        'Registration successful. Your account is pending approval by an admin.'
      )
    ).toBeVisible();

    console.log('Agent registration successful');

    // =========================================================
    // STEP 2 — ADMIN LOGIN
    // =========================================================

    const adminLoginPage = new LoginPage(page);

    await adminLoginPage.goto();

    await adminLoginPage.login(
      adminCredentials.email,
      adminCredentials.password
    );

    console.log('ADMIN LOGIN SUCCESSFUL');

    // =========================================================
    // STEP 3 — OPEN USER LIST
    // =========================================================

    const adminPage = new AdminPage(page);

    await adminPage.openUsers();

    // =========================================================
    // STEP 4 — FIND AGENT AND VERIFY PENDING STATUS
    // =========================================================

    await adminPage.selectEmailSearch();

    await adminPage.searchByEmail(agentData.email);

    await adminPage.verifyAgentExists();
    await adminPage.verifyAgentPending();

    console.log('Agent found with PENDING status');

    // =========================================================
    // STEP 5 — ACTIVATE AGENT
    // =========================================================

    await adminPage.openAgentDetails();
    await adminPage.editUser();
    await adminPage.changeStatusToActive();
    await adminPage.saveChanges();

    await adminPage.verifyAgentActive();

    console.log('Agent activated successfully');

    // =========================================================
    // STEP 5A — VERIFY ACTIVE STATUS AFTER RELOAD
    // =========================================================

    await page.reload();

    await adminPage.verifyAgentActive();

    console.log(
      'AGENT ACTIVE STATUS VERIFIED AFTER RELOAD'
    );

    // =========================================================
    // STEP 5B — FIND EXISTING CUSTOMER ACCOUNTS
    // =========================================================

    const customerAccounts =
      await adminPage.findExistingCustomerAccounts();

    expect(
      customerAccounts.length,
      'At least one existing Customer account should be available'
    ).toBeGreaterThan(0);

    console.log(
      'CUSTOMER ACCOUNTS FOUND:',
      customerAccounts
    );

    // =========================================================
    // STEP 6 — ADMIN LOGOUT
    // =========================================================

    await adminPage.logout();

    console.log('ADMIN LOGGED OUT SUCCESSFULLY');

    // =========================================================
    // STEP 7 — SYSTEM LOGIN
    // =========================================================

    const systemLoginPage = new LoginPage(page);

    await systemLoginPage.goto();

    await systemLoginPage.login(
      systemCredentials.email,
      systemCredentials.password
    );

    await expect(page).toHaveURL(
      /.*\/profile/,
      { timeout: 10000 }
    );

    await expect(
      page
        .getByRole('main')
        .getByText('SYSTEM', { exact: true })
    ).toBeVisible();

    console.log('SYSTEM LOGIN SUCCESSFUL');

    // =========================================================
    // STEP 8 — SYSTEM CASH-IN 2000 BDT TO AGENT
    // =========================================================

    const systemPage = new SystemPage(page);

    await systemPage.openCashIn();

    console.log('CASH IN PAGE OPENED');

    await systemPage.cashIn(
      agentData.phone,
      '2000'
    );

    console.log(
      `2000 BDT deposited to Agent: ${agentData.phone}`
    );

    // =========================================================
    // STEP 9 — SYSTEM LOGOUT
    // =========================================================

    await systemPage.logout();

    console.log('SYSTEM LOGGED OUT');

    // =========================================================
    // STEP 10 — AGENT LOGIN
    // =========================================================

    const agentLoginPage = new LoginPage(page);

    const agentOtpSince = Date.now();

    await agentLoginPage.goto();

    await agentLoginPage.login(
      agentData.email,
      agentData.password
    );

    console.log(
      'AGENT LOGIN AFTER DEPOSIT SUBMITTED'
    );

    // =========================================================
    // STEP 11 — GET AGENT OTP
    // =========================================================

    const gmailClient = new GmailClient(request);

    console.log(
      'GMAIL ACCESS TOKEN EXISTS:',
      !!process.env.GMAIL_ACCESS_TOKEN
    );

    console.log('AGENT OTP SINCE:', agentOtpSince);

    console.log(
      'WAITING FOR OTP FOR:',
      agentData.email
    );

    const agentOtp = await gmailClient.waitForOtp(
      agentOtpSince,
      agentData.email
    );

    console.log('Agent OTP received:', agentOtp);

    // =========================================================
    // STEP 12 — VERIFY AGENT OTP
    // =========================================================

    await agentLoginPage.verifyOtp(agentOtp);

    console.log(
      'AGENT LOGIN AFTER DEPOSIT SUCCESSFUL'
    );

    // =========================================================
    // STEP 13 — VERIFY AGENT BALANCE = 2000 BDT
    // =========================================================

    const agentPage = new AgentPage(page);

    await agentPage.verifyBalance('2000');

    console.log(
      'AGENT BALANCE VERIFIED: 2000 BDT'
    );

    // =========================================================
    // STEP 14 — CASH-IN 500 BDT TO AN EXISTING CUSTOMER
    // =========================================================

    await agentPage.openCashIn();

    const successfulCustomer =
      await agentPage.cashInToAnyCustomer(
        customerAccounts,
        '500'
      );

    console.log(
      '500 BDT CASH IN SUCCESSFUL TO CUSTOMER:',
      successfulCustomer
    );

    // Verify the balance after the customer transaction.
    // The agent receives 12.50 BDT commission for this transaction.
    // Return to the Agent profile before verifying the balance.
await page.goto('/profile');

await expect(page).toHaveURL(
  /.*\/profile/,
  { timeout: 10000 }
);

// Verify the balance after the customer transaction.
await agentPage.verifyBalance('1512.50');

console.log(
  'AGENT BALANCE VERIFIED AFTER CUSTOMER CASH-IN: 1512.50 BDT'
);

    // =========================================================
    // STEP 15 — AGENT LOGOUT
    // =========================================================

    await agentPage.logout();

    console.log('AGENT LOGOUT SUCCESSFUL');

    // =========================================================
    // STEP 16 — OPEN FORGOT PASSWORD
    // =========================================================

    const resetLoginPage = new LoginPage(page);

    await resetLoginPage.goto();
    await resetLoginPage.openForgotPassword();

    console.log('FORGOT PASSWORD PAGE READY');

    // =========================================================
    // STEP 17 — RESET AGENT PASSWORD
    // =========================================================

    const passwordResetPage = new PasswordResetPage(page);

    const newAgentPassword = 'NewPassword@123';

    await passwordResetPage.reset(
      agentData.email,
      newAgentPassword,
      gmailClient
    );

    console.log('AGENT PASSWORD RESET SUCCESSFUL');

    // =========================================================
    // STEP 18 — VERIFY OLD PASSWORD IS REJECTED
    // =========================================================

    const oldPasswordLogin = new LoginPage(page);

    await oldPasswordLogin.goto();

    await oldPasswordLogin.login(
      agentData.email,
      agentData.password
    );

    // Do not match the static "Password" field label.
    // Match a meaningful login rejection message instead.
    const rejectionMessage = page.getByText(
      /invalid credentials|invalid email|invalid phone|incorrect password|wrong password|password (?:is )?(?:incorrect|invalid|wrong|does not match)|login failed|account is deactivated/i
    ).first();

    await expect(
      rejectionMessage,
      'The old password should produce a login rejection message'
    ).toBeVisible({
      timeout: 10000,
    });

    // Failed login should leave the user on the login page.
    await expect(page).toHaveURL(
      /\/login(?:[?#].*)?$/,
      { timeout: 10000 }
    );

    console.log(
      'OLD PASSWORD LOGIN REJECTED AS EXPECTED'
    );

    // =========================================================
    // STEP 19 — LOGIN USING NEW PASSWORD
    // =========================================================

    const newPasswordLogin = new LoginPage(page);

    await newPasswordLogin.goto();

    const newPasswordOtpSince = Date.now();

    await newPasswordLogin.login(
      agentData.email,
      newAgentPassword
    );

    console.log('NEW PASSWORD LOGIN SUBMITTED');

    // =========================================================
    // STEP 20 — GET OTP FOR NEW-PASSWORD LOGIN
    // =========================================================

    const newPasswordOtp = await gmailClient.waitForOtp(
      newPasswordOtpSince,
      agentData.email
    );

    console.log(
      'NEW PASSWORD LOGIN OTP:',
      newPasswordOtp
    );

    // =========================================================
    // STEP 21 — VERIFY OTP FOR NEW-PASSWORD LOGIN
    // =========================================================

    await newPasswordLogin.verifyOtp(newPasswordOtp);

    console.log('NEW PASSWORD LOGIN SUCCESSFUL');

    // =========================================================
    // STEP 22 — OPEN SELF STATEMENT
    // =========================================================

    const agentPageAfterReset = new AgentPage(page);

    await agentPageAfterReset.openSelfStatement();

    console.log('SELF STATEMENT PAGE OPENED');

    const statementTable = page.locator('table');

    await expect(statementTable).toBeVisible({
      timeout: 10000,
    });

    // =========================================================
    // STEP 23 — EXTRACT STATEMENT HEADERS AND ROWS
    // =========================================================

    const headers = (
      await statementTable
        .locator('thead th')
        .allInnerTexts()
    ).map((value) => value.trim());

    expect(
      headers.length,
      'Self Statement should contain table headers'
    ).toBeGreaterThan(0);

    const bodyRows = statementTable.locator('tbody tr');

    const extractedRows: string[][] = [];
    const seenRows = new Set<string>();

    // Collect visible rows and follow pagination when present.
    while (true) {
      const rowCount = await bodyRows.count();

      for (let i = 0; i < rowCount; i++) {
        const row = bodyRows.nth(i);

        const cells = (
          await row.locator('td').allInnerTexts()
        ).map((value) => value.trim());

        // Ignore empty-state rows or rows with a different column count.
        if (
          cells.length !== headers.length ||
          cells.join(' ')
            .toLowerCase()
            .includes('no transactions found')
        ) {
          continue;
        }

        const rowKey = cells.join('\u001f');

        // Prevent duplicate rows from entering the CSV.
        if (!seenRows.has(rowKey)) {
          seenRows.add(rowKey);
          extractedRows.push(cells);
        }
      }

      const nextPage = page
        .getByRole('button', {
          name: /go to next page/i,
        })
        .last();

      const nextPageVisible = await nextPage
        .isVisible()
        .catch(() => false);

      if (
        !nextPageVisible ||
        await nextPage.isDisabled()
      ) {
        break;
      }

      const firstRowBefore = rowCount > 0
        ? (await bodyRows.first().innerText()).trim()
        : '';

      await nextPage.click();

      if (firstRowBefore) {
        await expect.poll(
          async () => (
            await bodyRows.first().innerText()
          ).trim()
        ).not.toBe(firstRowBefore);
      } else {
        await expect(bodyRows.first()).toBeVisible();
      }
    }

    console.log('SELF STATEMENT HEADERS:', headers);

    console.log(
      'SELF STATEMENT EXTRACTED ROWS:',
      extractedRows
    );

    // =========================================================
    // STEP 24 — VERIFY THE 500 BDT CUSTOMER TRANSACTION
    // =========================================================

    const customerTransaction = extractedRows.find(
      (row) =>
        row[1].replace(/\s/g, '') ===
          agentData.phone.replace(/\s/g, '') &&
        row[2].replace(/\s/g, '') ===
          successfulCustomer.replace(/\s/g, '') &&
        /deposit/i.test(row[3]) &&
        Number(row[4].replace(/,/g, '')) === 500
    );

    expect(
      customerTransaction,
      'Expected the 500 BDT customer transaction in Self Statement'
    ).toBeDefined();

    // Verify the resulting balance recorded in the statement.
    expect(
      Number(
        customerTransaction?.[6]?.replace(/,/g, '')
      ),
      'Expected Agent balance 1512.50 after customer cash-in'
    ).toBe(1512.5);

    // =========================================================
    // STEP 25 — VERIFY THE 2000 BDT SYSTEM TOP-UP
    // =========================================================

    const systemTopUp = extractedRows.find(
      (row) =>
        row[1].trim().toUpperCase() === 'SYSTEM' &&
        row[2].replace(/\s/g, '') ===
          agentData.phone.replace(/\s/g, '') &&
        /top-up/i.test(row[3]) &&
        Number(row[5].replace(/,/g, '')) === 2000
    );

    expect(
      systemTopUp,
      'Expected the 2000 BDT System top-up in Self Statement'
    ).toBeDefined();

    // At least the System top-up and customer transaction must exist.
    expect(
      extractedRows.length,
      'Expected both required transactions in Self Statement'
    ).toBeGreaterThanOrEqual(2);

    // =========================================================
    // STEP 26 — GENERATE SELF STATEMENT CSV
    // =========================================================

    // Use the local machine date for the required filename format.
    const now = new Date();

    const today = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('-');

    const csvEscape = (value: string): string =>
      `"${value.replace(/"/g, '""')}"`;

    const csvContent = [
      headers.map(csvEscape).join(','),
      ...extractedRows.map(
        (row) => row.map(csvEscape).join(',')
      ),
    ].join('\r\n') + '\r\n';

    const outputDir = path.resolve('reports');

    await mkdir(outputDir, {
      recursive: true,
    });

    const csvPath = path.join(
      outputDir,
      `self_statement_${today}.csv`
    );

    await writeFile(
      csvPath,
      csvContent,
      'utf8'
    );

    console.log('CSV FILE SAVED:', csvPath);

    console.log(
      'CSV TRANSACTION ROW COUNT:',
      extractedRows.length
    );

    // =========================================================
    // STEP 27 — VERIFY SAVED CSV
    // =========================================================

    expect(
      path.basename(csvPath)
    ).toMatch(
      /^self_statement_\d{4}-\d{2}-\d{2}\.csv$/
    );

    const savedCsv = await readFile(
      csvPath,
      'utf8'
    );

    // Confirm that the saved file matches the exported data.
    expect(
      savedCsv,
      'Saved CSV content should match the extracted statement'
    ).toBe(csvContent);

    // Confirm both transaction accounts are included in the CSV.
    expect(savedCsv).toContain(
      csvEscape(agentData.phone)
    );

    expect(savedCsv).toContain(
      csvEscape(successfulCustomer)
    );

    expect(
      savedCsv,
      'CSV should include the 2000 BDT System top-up'
    ).toContain(
      csvEscape('Top-up from SYSTEM')
    );

    expect(
      savedCsv,
      'CSV should include the 500 BDT customer transaction'
    ).toMatch(/deposit commission/i);

    console.log(
      'SELF STATEMENT DATA VERIFIED AND CSV EXPORT CONFIRMED'
    );

    console.log(
      'DMONEY REGRESSION FLOW COMPLETED'
    );
  });
});











// import { test, expect } from '@playwright/test';

// import { mkdir, writeFile } from 'node:fs/promises';
// import path from 'node:path';

// import { SignupPage } from '../../pages/SignupPage';
// import { LoginPage } from '../../pages/LoginPage';
// import { AdminPage } from '../../pages/AdminPage';
// import { SystemPage } from '../../pages/SystemPage';
// import { AgentPage } from '../../pages/AgentPage';
// import { GmailClient } from '../../utils/GmailClient';
// import { PasswordResetPage } from '../../pages/PasswordResetPage';

// import {
//   agentData,
//   adminCredentials,
//   systemCredentials,
// } from '../../data/testData';

// test.describe('DMoney Agent Registration', () => {

//   test('Register a new Agent successfully', async ({
//     page,
//     request,
//   }) => {

//     // =========================================================
//     // STEP 1 — REGISTER AGENT
//     // =========================================================

//     const signupPage = new SignupPage(page);

//     await signupPage.goto();

//     console.log(
//       'REGISTERING AGENT EMAIL:',
//       agentData.email
//     );

//     await signupPage.fillRegistrationData(
//       agentData.fullName,
//       agentData.email,
//       agentData.password,
//       agentData.phone,
//       agentData.nid
//     );

//     await signupPage.selectAgentRole();
//     await signupPage.createAccount();

//     await expect(
//       page.getByText(
//         'Registration successful. Your account is pending approval by an admin.'
//       )
//     ).toBeVisible();

//     console.log(
//       'Agent registration successful'
//     );


//     // =========================================================
//     // STEP 2 — ADMIN LOGIN
//     // =========================================================

//     const adminLoginPage = new LoginPage(page);

//     await adminLoginPage.goto();

//     await adminLoginPage.login(
//       adminCredentials.email,
//       adminCredentials.password
//     );

//     console.log(
//       'ADMIN LOGIN SUCCESSFUL'
//     );


//     // =========================================================
//     // STEP 3 — OPEN USER LIST
//     // =========================================================

//     const adminPage = new AdminPage(page);

//     await adminPage.openUsers();


//     // =========================================================
//     // STEP 4 — FIND AGENT
//     // =========================================================

//     await adminPage.selectEmailSearch();

//     await adminPage.searchByEmail(
//       agentData.email
//     );

//     await adminPage.verifyAgentExists();

//     await adminPage.verifyAgentPending();

//     console.log(
//       'Agent found with PENDING status'
//     );


//     // =========================================================
//     // STEP 5 — ACTIVATE AGENT
//     // =========================================================

//     await adminPage.openAgentDetails();

//     await adminPage.editUser();

//     await adminPage.changeStatusToActive();

//     await adminPage.saveChanges();

//     await adminPage.verifyAgentActive();

//     console.log(
//       'Agent activated successfully'
//     );


//     // =========================================================
//     // STEP 5A — VERIFY ACTIVE AFTER RELOAD
//     // =========================================================

//     await page.reload();

//     await adminPage.verifyAgentActive();

//     console.log(
//       'AGENT ACTIVE STATUS VERIFIED AFTER RELOAD'
//     );


//     // =========================================================
//     // STEP 5B — FIND EXISTING CUSTOMER ACCOUNTS
//     // =========================================================
//     //
//     // IMPORTANT:
//     // We collect customers BEFORE admin logout.
//     // Later Agent will try these customers one by one.
//     //

//     const customerAccounts =
//       await adminPage.findExistingCustomerAccounts();

//     console.log(
//       'CUSTOMER ACCOUNTS FOUND:',
//       customerAccounts
//     );


//     // =========================================================
//     // STEP 6 — ADMIN LOGOUT
//     // =========================================================

//     await adminPage.logout();

//     console.log(
//       'ADMIN LOGGED OUT SUCCESSFULLY'
//     );


//     // =========================================================
//     // STEP 7 — SYSTEM LOGIN
//     // =========================================================

//     const systemLoginPage =
//       new LoginPage(page);

//     await systemLoginPage.goto();

//     await systemLoginPage.login(
//       systemCredentials.email,
//       systemCredentials.password
//     );

//     await expect(
//       page
//     ).toHaveURL(
//       /.*\/profile/,
//       {
//         timeout: 10000,
//       }
//     );

//     await expect(
//       page
//         .getByRole('main')
//         .getByText('SYSTEM', {
//           exact: true,
//         })
//     ).toBeVisible();

//     console.log(
//       'SYSTEM LOGIN SUCCESSFUL'
//     );


//     // =========================================================
//     // STEP 8 — SYSTEM CASH IN 2000 TO AGENT
//     // =========================================================

//     const systemPage =
//       new SystemPage(page);

//     await systemPage.openCashIn();

//     console.log(
//       'CASH IN PAGE OPENED'
//     );

//     await systemPage.cashIn(
//       agentData.phone,
//       '2000'
//     );

//     console.log(
//       `2000 BDT deposited to Agent: ${agentData.phone}`
//     );


//     // =========================================================
//     // STEP 9 — SYSTEM LOGOUT
//     // =========================================================

//     await systemPage.logout();

//     console.log(
//       'SYSTEM LOGGED OUT'
//     );


//     // =========================================================
//     // STEP 10 — AGENT LOGIN
//     // =========================================================

//     const agentLoginPage =
//       new LoginPage(page);

//     await agentLoginPage.goto();

//     const agentOtpSince =
//       Date.now();

//     await agentLoginPage.login(
//       agentData.email,
//       agentData.password
//     );

//     console.log(
//       'AGENT LOGIN AFTER DEPOSIT SUBMITTED'
//     );


//     // =========================================================
//     // STEP 11 — GET AGENT OTP
//     // =========================================================

//     const gmailClient =
//       new GmailClient(request);

//     console.log(
//       'GMAIL ACCESS TOKEN EXISTS:',
//       !!process.env.GMAIL_ACCESS_TOKEN
//     );

//     console.log(
//       'AGENT OTP SINCE:',
//       agentOtpSince
//     );

//     console.log(
//       'WAITING FOR OTP FOR:',
//       agentData.email
//     );

//     const agentOtp =
//       await gmailClient.waitForOtp(
//         agentOtpSince,
//         agentData.email
//       );

//     console.log(
//       'Agent OTP received:',
//       agentOtp
//     );


//     // =========================================================
//     // STEP 12 — VERIFY AGENT OTP
//     // =========================================================

//     await agentLoginPage.verifyOtp(
//       agentOtp
//     );

//     console.log(
//       'AGENT LOGIN AFTER DEPOSIT SUCCESSFUL'
//     );


//     // =========================================================
//     // STEP 13 — VERIFY AGENT BALANCE = 2000
//     // =========================================================

//     const agentPage =
//       new AgentPage(page);

//     await agentPage.verifyBalance(
//       '2000'
//     );

//     console.log(
//       'AGENT BALANCE VERIFIED: 2000 BDT'
//     );


//     // =========================================================
//     // STEP 14 — CASH IN 500 TO EXISTING CUSTOMER
//     // =========================================================

//     await agentPage.openCashIn();

//     const successfulCustomer =
//       await agentPage.cashInToAnyCustomer(
//         customerAccounts,
//         '500'
//       );

//       //await page.pause();

//     console.log(
//       '500 BDT CASH IN SUCCESSFUL TO CUSTOMER:',
//       successfulCustomer
//     );


//     // =========================================================
//     // STEP 15 — AGENT LOGOUT
//     // =========================================================

//     await agentPage.logout();

//     console.log(
//       'AGENT LOGOUT SUCCESSFUL'
//     );


//     // =========================================================
//     // STEP 16 — FORGOT PASSWORD
//     // =========================================================

//     const resetLoginPage =
//       new LoginPage(page);

//     await resetLoginPage.goto();

//     await resetLoginPage.openForgotPassword();

//     console.log(
//       'FORGOT PASSWORD PAGE READY'
//     );


//     // =========================================================
//     // STEP 17 — PASSWORD RESET
//     // =========================================================

//     const passwordResetPage =
//       new PasswordResetPage(page);

//     const newAgentPassword =
//       'NewPassword@123';

//     await passwordResetPage.reset(
//       agentData.email,
//       newAgentPassword,
//       gmailClient
//     );

//     console.log(
//       'AGENT PASSWORD RESET SUCCESSFUL'
//     );


//     // =========================================================
//     // STEP 18 — OLD PASSWORD SHOULD FAIL
//     // =========================================================

//     const oldPasswordLogin =
//       new LoginPage(page);

//     await oldPasswordLogin.goto();

//     await oldPasswordLogin.login(
//       agentData.email,
//       agentData.password
//     );

//     await expect(
//       page.getByText(
//         /invalid|incorrect|wrong|password/i
//       ).first()
//     ).toBeVisible({
//       timeout: 10000,
//     });

//     console.log(
//       'OLD PASSWORD LOGIN FAILED AS EXPECTED'
//     );


//     // =========================================================
//     // STEP 19 — NEW PASSWORD LOGIN
//     // =========================================================

//     const newPasswordLogin =
//       new LoginPage(page);

//     await newPasswordLogin.goto();

//     const newPasswordOtpSince =
//       Date.now();

//     await newPasswordLogin.login(
//       agentData.email,
//       newAgentPassword
//     );

//     console.log(
//       'NEW PASSWORD LOGIN SUBMITTED'
//     );


//     // =========================================================
//     // STEP 20 — NEW PASSWORD OTP
//     // =========================================================

//     const newPasswordOtp =
//       await gmailClient.waitForOtp(
//         newPasswordOtpSince,
//         agentData.email
//       );

//     console.log(
//       'NEW PASSWORD LOGIN OTP:',
//       newPasswordOtp
//     );

//     await newPasswordLogin.verifyOtp(
//       newPasswordOtp
//     );

//     console.log(
//       'NEW PASSWORD LOGIN SUCCESSFUL'
//     );


//     const agentPageAfterReset = new AgentPage(page);

//     await agentPageAfterReset.openSelfStatement();


// const statementTable = page.locator('table');

// await expect(statementTable).toBeVisible({
//   timeout: 10000,
// });

// const headers = await statementTable
//   .locator('thead th')
//   .allInnerTexts();

// const bodyRows = statementTable.locator('tbody tr');
// const extractedRows: string[][] = [];

// for (let i = 0; i < await bodyRows.count(); i++) {
//   const row = bodyRows.nth(i);
//   const cells = (await row.locator('td').allInnerTexts())
//     .map((value) => value.trim());

//   // Ignore the empty-state row.
//   if (
//     cells.length !== headers.length ||
//     cells.join(' ').toLowerCase().includes('no transactions found')
//   ) {
//     continue;
//   }

//   extractedRows.push(cells);
// }

// console.log('SELF STATEMENT HEADERS:', headers);
// console.log('SELF STATEMENT EXTRACTED ROWS:', extractedRows);

// // Verify the Agent's 500 BDT customer deposit.
// const customerTransaction = extractedRows.find((row) =>
//   row[1].replace(/\s/g, '') === agentData.phone &&
//   row[2].replace(/\s/g, '') === successfulCustomer &&
//   /deposit/i.test(row[3]) &&
//   Number(row[4].replace(/,/g, '')) === 500
// );

// expect(
//   customerTransaction,
//   'Expected the 500 BDT customer transaction in Self Statement'
// ).toBeDefined();

// // Verify the original 2000 BDT System top-up is present.
// const systemTopUp = extractedRows.find((row) =>
//   row[1].trim().toUpperCase() === 'SYSTEM' &&
//   row[2].replace(/\s/g, '') === agentData.phone &&
//   /top-up/i.test(row[3]) &&
//   Number(row[5].replace(/,/g, '')) === 2000
// );

// expect(
//   systemTopUp,
//   'Expected the 2000 BDT System top-up in Self Statement'
// ).toBeDefined();

// // Use local date for the required filename.
// const now = new Date();
// const today = [
//   now.getFullYear(),
//   String(now.getMonth() + 1).padStart(2, '0'),
//   String(now.getDate()).padStart(2, '0'),
// ].join('-');

// const csvEscape = (value: string) =>
//   `"${value.replace(/"/g, '""')}"`;

// const csvContent = [
//   headers.map(csvEscape).join(','),
//   ...extractedRows.map((row) => row.map(csvEscape).join(',')),
// ].join('\r\n') + '\r\n';

// const outputDir = path.resolve('reports');
// await mkdir(outputDir, { recursive: true });

// const csvPath = path.join(
//   outputDir,
//   `self_statement_${today}.csv`
// );

// await writeFile(csvPath, csvContent, 'utf8');

// console.log('CSV FILE SAVED:', csvPath);
// console.log('CSV TRANSACTION ROW COUNT:', extractedRows.length);

// expect(extractedRows.length).toBeGreaterThanOrEqual(2);

// console.log('SELF STATEMENT DATA VERIFIED AND EXPORTED');
// await page.pause();

// console.log(
//   'DMONEY REGRESSION FLOW COMPLETED'

//     );
//   });
// });
