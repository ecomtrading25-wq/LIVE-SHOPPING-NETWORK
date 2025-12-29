import { describe, it, expect } from 'vitest';
import twilio from 'twilio';

/**
 * Twilio Integration Test
 * Validates Twilio credentials by making a lightweight API call
 */

describe('Twilio Integration', () => {
  it('should validate Twilio credentials', async () => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    expect(accountSid).toBeDefined();
    expect(authToken).toBeDefined();
    expect(accountSid).toMatch(/^AC[a-z0-9]{32}$/i);

    // Create Twilio client
    const client = twilio(accountSid, authToken);

    // Make a lightweight API call to validate credentials
    // Fetch account details - this is a simple GET request that validates auth
    const account = await client.api.accounts(accountSid).fetch();

    expect(account.sid).toBe(accountSid);
    expect(account.status).toBe('active');
  });

  it('should validate Twilio phone number format', () => {
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

    expect(phoneNumber).toBeDefined();
    // Phone number should be in E.164 format: +[country code][number]
    expect(phoneNumber).toMatch(/^\+[1-9]\d{1,14}$/);
  });

  it('should validate Twilio API credentials for video', () => {
    const apiKey = process.env.TWILIO_API_KEY;
    const apiSecret = process.env.TWILIO_API_SECRET;

    expect(apiKey).toBeDefined();
    expect(apiSecret).toBeDefined();
    expect(apiKey).toMatch(/^SK[a-z0-9]{32}$/i);
  });
});
