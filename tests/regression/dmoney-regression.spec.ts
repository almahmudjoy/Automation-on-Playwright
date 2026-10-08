import { test, expect } from '@playwright/test';

import { SignupPage } from '../../pages/SignupPage';
import { LoginPage } from '../../pages/LoginPage';
import { AdminPage } from '../../pages/AdminPage';
import { SystemPage } from '../../pages/SystemPage';
import { AgentPage } from '../../pages/AgentPage';
import { GmailClient } from '../../utils/GmailClient';

import { PaymentPage } from '../../pages/PaymentPage';
import { customerData } from '../../data/testData';

import { PasswordResetPage } from '../../pages/PasswordResetPage';


import {
  agentData,
  adminCredentials,
  systemCredentials,
} from '../../data/testData';

test.describe('DMoney Agent Registration', () => {

  test('Register a new Agent successfully', async ({ page, request }) => {

    // =====================================================
    // STEP 1: Register New Agent
    // =====================================================

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

    // Verify registration success message
    await expect(
      page.getByText(
        'Registration successful. Your account is pending approval by an admin.'
      )
    ).toBeVisible();

    console.log('Agent registration successful');


    // =====================================================
    // STEP 2: Admin Login
    // =====================================================

    const adminLoginPage = new LoginPage(page);

    await adminLoginPage.goto();

    await adminLoginPage.login(
      adminCredentials.email,
      adminCredentials.password
    );

    console.log('ADMIN LOGIN SUCCESSFUL');


    // =====================================================
    // STEP 3: Open Admin User List
    // =====================================================

    const adminPage = new AdminPage(page);

    await adminPage.openUsers();


    // =====================================================
    // STEP 4: Search Newly Created Agent
    // =====================================================

    await adminPage.selectEmailSearch();

    await adminPage.searchByEmail(
      agentData.email
    );

    await adminPage.verifyAgentExists();

    // New agent should initially be pending
    await adminPage.verifyAgentPending();

    console.log('Agent found with PENDING status');


    // =====================================================
    // STEP 5: Activate Agent
    // =====================================================

    await adminPage.openAgentDetails();

    await adminPage.editUser();

    await adminPage.changeStatusToActive();

    await adminPage.saveChanges();

    await adminPage.verifyAgentActive();

    console.log('Agent activated successfully');


    // =====================================================
// STEP 6: Admin Logout
// =====================================================

await adminPage.logout();

console.log('ADMIN LOGGED OUT');


// =====================================================
// STEP 7: System Login
// =====================================================

const systemLoginPage = new LoginPage(page);

await systemLoginPage.goto();

await systemLoginPage.login(
  systemCredentials.email,
  systemCredentials.password
);

console.log(
  'SYSTEM LOGIN URL:',
  page.url()
);

// System account does NOT require OTP.
// DO NOT call GmailClient here.
// DO NOT click Verify OTP here.

await expect(page).toHaveURL(/.*\/profile/, {
  timeout: 10000,
});

await expect(
  page.getByRole('main').getByText('SYSTEM', {
    exact: true,
  })
).toBeVisible();

console.log('SYSTEM LOGIN SUCCESSFUL');
console.log(
  'SYSTEM PROFILE URL:',
  page.url()
);


// =====================================================
// STEP 8: System Cash In 2000 Tk to New Agent
// =====================================================

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


// =====================================================
// STEP 9: System Logout
// =====================================================

await systemPage.logout();

console.log('SYSTEM LOGGED OUT');


// =====================================================
// STEP 10: Agent Login After Deposit
// =====================================================

const agentLoginPage = new LoginPage(page);

await agentLoginPage.goto();

// Take timestamp BEFORE Agent login.
// This prevents picking an old OTP from Gmail.
const agentOtpSince = Date.now();

await agentLoginPage.login(
  agentData.email,
  agentData.password
);

console.log(
  'AGENT LOGIN AFTER DEPOSIT SUBMITTED'
);


// =====================================================
// STEP 11: Get Agent OTP from Gmail
// =====================================================

const gmailClient = new GmailClient(request);

console.log(
  'GMAIL ACCESS TOKEN EXISTS:',
  !!process.env.GMAIL_ACCESS_TOKEN
);

console.log(
  'AGENT OTP SINCE:',
  agentOtpSince
);

console.log(
  'WAITING FOR OTP FOR:',
  agentData.email
);


const agentOtp = await gmailClient.waitForOtp(
  agentOtpSince,
  agentData.email
);

console.log(
  'Agent OTP received:',
  agentOtp
);


// =====================================================
// STEP 12: Verify Agent OTP
// =====================================================

await agentLoginPage.verifyOtp(agentOtp);

console.log(
  'AGENT LOGIN AFTER DEPOSIT SUCCESSFUL'
);


// =====================================================
// STEP 13: Verify Agent Balance
// =====================================================

// =====================================================
// STEP 14: Verify Agent Balance
// =====================================================

const agentPage = new AgentPage(page);

await agentPage.verifyBalance('2000');

console.log('AGENT BALANCE VERIFIED: 2000 BDT');


// =====================================================
// STEP 14: Agent Balance Validation
// =====================================================

// TODO:
// After inspecting the actual Agent profile page,
// we will create the correct balance locator
// and verify that the balance is exactly 2000 Tk.




// STEP 15: Agent Cash In 500 BDT to Existing Customer

const customerPhone = '01760755786';

await agentPage.openCashIn();

let selectedCustomer: string | undefined;

for (const customer of customerAccounts) {
  try {
    console.log(
      'TRYING CUSTOMER FOR 500 BDT:',
      customer
    );

    await agentPage.cashInToCustomer(
      customer,
      '500'
    );

    selectedCustomer = customer;

    console.log(
      '500 BDT CASH IN SUCCESSFUL TO CUSTOMER:',
      customer
    );

    break;
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !error.message.startsWith(
        'DEPOSIT_REJECTED:'
      )
    ) {
      throw error;
    }

    console.log(
      'CUSTOMER LIMIT EXCEEDED:',
      customer
    );

    console.log(
      'TRYING NEXT CUSTOMER...'
    );

    await agentPage.page.reload();

    await agentPage.openCashIn();
  }
}

if (!selectedCustomer) {
  throw new Error(
    'No existing Customer account accepted the 500 BDT deposit.'
  );
}

console.log(
  'SELECTED CUSTOMER:',
  selectedCustomer
);

// =====================================================
// STEP 16: Agent Logout
// =====================================================

await agentPage.logout();

console.log('AGENT LOGOUT SUCCESSFUL');


// =====================================================
// STEP 16A: Open Forgot Password
// =====================================================

const resetLoginPage = new LoginPage(page);

await resetLoginPage.goto();

await resetLoginPage.openForgotPassword();

console.log('FORGOT PASSWORD PAGE READY');


// =====================================================
// STEP 16B: Request Agent Password Reset Link
// =====================================================

console.log('STEP 16B START');

const passwordResetPage =
  new PasswordResetPage(page);

const newAgentPassword =
  'NewPassword@123';

await passwordResetPage.reset(
  agentData.email,
  newAgentPassword,
  gmailClient
);

console.log(
  'AGENT PASSWORD RESET SUCCESSFUL'
);




  });

});