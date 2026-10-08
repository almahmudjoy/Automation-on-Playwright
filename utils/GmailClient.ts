
import { APIRequestContext, expect } from '@playwright/test';

process.loadEnvFile('.env');

const GMAIL_API =
  'https://gmail.googleapis.com/gmail/v1/users/me/messages';

type GmailHeader = {
  name: string;
  value: string;
};

type GmailMessagePart = {
  mimeType?: string;
  headers?: GmailHeader[];
  body?: {
    data?: string;
  };
  parts?: GmailMessagePart[];
};

type GmailMessage = {
  id: string;
  internalDate: string;
  snippet?: string;
  payload?: GmailMessagePart;
};

export class GmailClient {
  private readonly headers = {
    Authorization: `Bearer ${process.env.GMAIL_ACCESS_TOKEN}`,
  };

  constructor(private readonly request: APIRequestContext) {}

  // =====================================================
  // OTP: Wait for a new email containing a 4-digit OTP
  // =====================================================

  async waitForOtp(
    since: number,
    recipient: string,
    timeoutMs = 180_000,
    intervalMs = 3_000
  ): Promise<string> {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const otp = await this.findOtpSince(since, recipient);

      if (otp) {
        return otp;
      }

      await new Promise((resolve) =>
        setTimeout(resolve, intervalMs)
      );
    }

    throw new Error(
      `No new DMoney OTP received for ${recipient} within ${
        timeoutMs / 1000
      } seconds`
    );
  }

  private async findOtpSince(
    since: number,
    recipient: string
  ): Promise<string | null> {
    const messages = await this.listMessages(
      `to:${recipient} newer_than:1d`
    );

    for (const { id } of messages) {
      const mail = await this.getMessage(id);

      if (Number(mail.internalDate) < since) {
        continue;
      }

      const to = this.getHeader(mail, 'To');

      if (!to.toLowerCase().includes(recipient.toLowerCase())) {
        continue;
      }

      const text = [
        mail.snippet ?? '',
        this.extractMessageBody(mail.payload),
      ].join('\n');

      const otp = this.extractOtp(text);

      if (otp) {
        console.log('OTP EMAIL FOUND:', mail.internalDate);
        return otp;
      }
    }

    return null;
  }

  private extractOtp(text: string): string | null {
    return text.match(/\b\d{4}\b/)?.[0] ?? null;
  }

  // =====================================================
  // Password Reset: Wait for a new reset email
  // =====================================================

  async waitForResetLink(
    since: number,
    recipient: string,
    timeoutMs = 60_000,
    intervalMs = 3_000
  ): Promise<string> {
    const deadline = Date.now() + timeoutMs;

    console.log('Waiting for password reset email:', recipient);

    while (Date.now() < deadline) {
      const resetLink = await this.findResetLinkSince(
        since,
        recipient
      );

      if (resetLink) {
        console.log('PASSWORD RESET LINK EMAIL FOUND');
        return resetLink;
      }

      await new Promise((resolve) =>
        setTimeout(resolve, intervalMs)
      );
    }

    throw new Error(
      `No password reset link email received for ${recipient} within ${
        timeoutMs / 1000
      } seconds`
    );
  }

  private async findResetLinkSince(
  since: number,
  recipient: string
): Promise<string | null> {
  const messages = await this.listMessages(
    `to:${recipient} newer_than:1d`
  );

  console.log(
    'RESET EMAIL SEARCH RESULT COUNT:',
    messages.length
  );

  for (const { id } of messages) {
    const mail = await this.getMessage(id);

    console.log(
      'CHECKING EMAIL:',
      id,
      'DATE:',
      mail.internalDate
    );

    const to = this.getHeader(mail, 'To');
    const subject = this.getHeader(mail, 'Subject');

    console.log('EMAIL TO:', to);
    console.log('EMAIL SUBJECT:', subject);

    if (
      !to
        .toLowerCase()
        .includes(recipient.toLowerCase())
    ) {
      console.log(
        'SKIPPED: RECIPIENT DOES NOT MATCH'
      );
      continue;
    }

    const body = this.extractMessageBody(
      mail.payload
    );

    console.log(
      'RESET EMAIL BODY LENGTH:',
      body.length
    );

    console.log(
      'RESET EMAIL BODY PREVIEW:',
      body.substring(0, 500)
    );

    if (!/reset|password|forgot/i.test(subject)) {
      console.log(
        'SKIPPED: SUBJECT DOES NOT LOOK LIKE RESET EMAIL'
      );
      continue;
    }

    const resetLink = this.extractResetLink(body);

    if (resetLink) {
      console.log(
        'RESET EMAIL SUBJECT:',
        subject
      );

      console.log(
        'RESET LINK EXTRACTED:',
        resetLink
      );

      return resetLink;
    }

    console.log(
      'NO RESET LINK FOUND IN THIS EMAIL'
    );
  }

  return null;
}

  private extractResetLink(text: string): string | null {
    const decodedText = text
      .replace(/&amp;/gi, '&')
      .replace(/&#x3D;/gi, '=')
      .replace(/&#61;/gi, '=');

    const urls =
      decodedText.match(/https?:\/\/[^\s"'<>]+/gi) ?? [];

    for (const url of urls) {
      const cleanedUrl = url.replace(/[),.;]+$/, '');

      if (
        /reset|password|token|forgot/i.test(cleanedUrl)
      ) {
        return cleanedUrl;
      }
    }

    return null;
  }

  // =====================================================
  // Shared Gmail API helpers
  // =====================================================

  private async listMessages(
    query: string
  ): Promise<Array<{ id: string }>> {
    const response = await this.request.get(GMAIL_API, {
      headers: this.headers,
      params: {
        maxResults: 20,
        q: query,
      },
    });

    expect(
      response.status(),
      await response.text()
    ).toBe(200);

    const data = await response.json();

    return data.messages ?? [];
  }

  private async getMessage(id: string): Promise<GmailMessage> {
    const response = await this.request.get(
      `${GMAIL_API}/${id}`,
      {
        headers: this.headers,
        params: {
          format: 'full',
        },
      }
    );

    expect(
      response.status(),
      await response.text()
    ).toBe(200);

    return (await response.json()) as GmailMessage;
  }

  private getHeader(
    mail: GmailMessage,
    headerName: string
  ): string {
    const header = mail.payload?.headers?.find(
      (item) =>
        item.name.toLowerCase() === headerName.toLowerCase()
    );

    return header?.value ?? '';
  }

  private extractMessageBody(
    payload?: GmailMessagePart
  ): string {
    if (!payload) {
      return '';
    }

    const chunks: string[] = [];

    if (payload.body?.data) {
      const base64 = payload.body.data
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      chunks.push(
        Buffer.from(base64, 'base64').toString('utf8')
      );
    }

    for (const part of payload.parts ?? []) {
      chunks.push(this.extractMessageBody(part));
    }

    return chunks.join('\n');
  }
}