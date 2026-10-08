
import { Page, Locator, expect } from '@playwright/test';

export class PaymentPage {
  readonly page: Page;
  readonly paymentLink: Locator;
  readonly merchantPhoneInput: Locator;
  readonly amountInput: Locator;
  readonly makePaymentButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.paymentLink = page.getByRole('link', {
      name: 'Payment',
      exact: true,
    });

    this.merchantPhoneInput = page.getByPlaceholder(
      "Enter merchant's phone number"
    );

    this.amountInput = page.getByLabel('Amount (BDT)');

    this.makePaymentButton = page.getByRole('button', {
      name: /Make Payment/i,
    });
  }

  async openPayment() {
    await this.paymentLink.click();

    await expect(this.page).toHaveURL(/\/agent\/payment/);

    await expect(this.merchantPhoneInput).toBeVisible();
    await expect(this.amountInput).toBeVisible();
  }

  async makePayment(phone: string, amount: string) {
    await this.merchantPhoneInput.fill(phone);
    await this.amountInput.fill(amount);

    await expect(this.merchantPhoneInput).toHaveValue(phone);
    await expect(this.amountInput).toHaveValue(amount);

    await this.makePaymentButton.click();
    
    console.log('PAYMENT PAGE URL:', this.page.url());

console.log(
  'PAYMENT RESULT:',
  await this.page.locator('body').innerText()
);
await this.page.pause();
  }
}