import { describe, it, expect, beforeEach } from 'vitest';
import { WiseWebhookHandler } from './webhooks-wise';

/**
 * Wise Webhook Integration Tests
 * Tests webhook handling for transfers, balances, and payouts
 */

describe('Wise Webhook Handler', () => {
  let handler: WiseWebhookHandler;

  beforeEach(() => {
    handler = new WiseWebhookHandler();
  });

  describe('Transfer Events', () => {
    it('should handle transfer state change to completed', async () => {
      const payload = {
        event_type: 'transfers#state-change',
        data: {
          resource: {
            id: 12345678,
            profile_id: 987654,
            account_id: 456789,
          },
          current_state: 'outgoing_payment_sent',
          previous_state: 'processing',
          occurred_at: new Date().toISOString(),
        },
      };

      await expect(handler.handleWebhook(payload)).resolves.not.toThrow();
    });

    it('should handle transfer refunded state', async () => {
      const payload = {
        event_type: 'transfers#state-change',
        data: {
          resource: {
            id: 12345679,
          },
          current_state: 'funds_refunded',
          previous_state: 'processing',
          occurred_at: new Date().toISOString(),
        },
      };

      await expect(handler.handleWebhook(payload)).resolves.not.toThrow();
    });

    it('should handle transfer cancelled state', async () => {
      const payload = {
        event_type: 'transfers#state-change',
        data: {
          resource: {
            id: 12345680,
          },
          current_state: 'cancelled',
          previous_state: 'processing',
          occurred_at: new Date().toISOString(),
        },
      };

      await expect(handler.handleWebhook(payload)).resolves.not.toThrow();
    });

    it('should handle transfer bounced back', async () => {
      const payload = {
        event_type: 'transfers#state-change',
        data: {
          resource: {
            id: 12345681,
          },
          current_state: 'bounced_back',
          previous_state: 'outgoing_payment_sent',
          occurred_at: new Date().toISOString(),
        },
      };

      await expect(handler.handleWebhook(payload)).resolves.not.toThrow();
    });

    it('should handle transfer active cases', async () => {
      const payload = {
        event_type: 'transfers#active-cases',
        data: {
          resource: {
            id: 12345682,
          },
          active_cases: [
            {
              type: 'DEPOSIT_AMOUNT_LESS_INVOICE',
              state: 'OPENED',
            },
          ],
        },
      };

      await expect(handler.handleWebhook(payload)).resolves.not.toThrow();
    });
  });

  describe('Balance Events', () => {
    it('should handle balance credit event', async () => {
      const payload = {
        event_type: 'balances#credit',
        data: {
          resource: {
            id: 111,
            profile_id: 222,
            currency: 'USD',
          },
          amount: {
            value: 1000.00,
            currency: 'USD',
          },
          post_transaction_balance_amount: {
            value: 5000.00,
            currency: 'USD',
          },
          occurred_at: new Date().toISOString(),
        },
      };

      await expect(handler.handleWebhook(payload)).resolves.not.toThrow();
    });

    it('should handle balance update event', async () => {
      const payload = {
        event_type: 'balances#update',
        data: {
          resource: {
            id: 111,
            profile_id: 222,
            currency: 'USD',
          },
          current_balance: {
            value: 4500.00,
            currency: 'USD',
          },
          occurred_at: new Date().toISOString(),
        },
      };

      await expect(handler.handleWebhook(payload)).resolves.not.toThrow();
    });
  });

  describe('Duplicate Handling', () => {
    it('should handle duplicate events gracefully', async () => {
      const payload = {
        event_type: 'transfers#state-change',
        data: {
          resource: {
            id: 99999999,
          },
          current_state: 'outgoing_payment_sent',
          previous_state: 'processing',
          occurred_at: new Date().toISOString(),
        },
      };

      // First call should process
      await handler.handleWebhook(payload);
      
      // Second call should be ignored (duplicate)
      await expect(handler.handleWebhook(payload)).resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed payload gracefully', async () => {
      const payload = {
        event_type: 'transfers#state-change',
        data: {
          // Missing resource
        },
      };

      await expect(handler.handleWebhook(payload)).resolves.not.toThrow();
    });

    it('should handle unknown event types', async () => {
      const payload = {
        event_type: 'unknown#event',
        data: {
          resource: {
            id: 123,
          },
        },
      };

      await expect(handler.handleWebhook(payload)).resolves.not.toThrow();
    });

    it('should handle missing transfer in database', async () => {
      const payload = {
        event_type: 'transfers#state-change',
        data: {
          resource: {
            id: 999999999, // Non-existent transfer
          },
          current_state: 'outgoing_payment_sent',
          previous_state: 'processing',
          occurred_at: new Date().toISOString(),
        },
      };

      await expect(handler.handleWebhook(payload)).resolves.not.toThrow();
    });
  });
});
