/**
 * Xero OAuth Callback Handler
 * 
 * Handles the OAuth 2.0 callback from Xero after user authorization
 */

import { Router } from 'express';
import xeroIntegration from './xero-integration';

export const xeroCallbackRouter = Router();

/**
 * OAuth callback endpoint
 * Xero redirects here after user authorizes the app
 */
xeroCallbackRouter.get('/api/xero/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;

    // Handle OAuth error
    if (error) {
      console.error('Xero OAuth error:', error);
      return res.redirect(`/?xero_error=${encodeURIComponent(error as string)}`);
    }

    // Validate code
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Missing authorization code' });
    }

    // Exchange code for token
    const { tokenData, tenants } = await xeroIntegration.exchangeCodeForToken(code);

    console.log('Xero connected successfully:', {
      tenants: tenants.map(t => t.tenantName),
      expiresIn: tokenData.expires_in,
    });

    // Redirect to settings page with success message
    res.redirect('/settings?tab=integrations&xero_connected=true');
  } catch (error: any) {
    console.error('Xero callback error:', error);
    res.redirect(`/?xero_error=${encodeURIComponent(error.message || 'Failed to connect Xero')}`);
  }
});

/**
 * Disconnect endpoint
 */
xeroCallbackRouter.post('/api/xero/disconnect', async (req, res) => {
  try {
    // This is handled by tRPC router
    res.json({ success: true });
  } catch (error: any) {
    console.error('Xero disconnect error:', error);
    res.status(500).json({ error: error.message || 'Failed to disconnect Xero' });
  }
});
