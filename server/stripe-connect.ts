import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
});

export class StripeConnectService {
  /**
   * Create a Stripe Express Connected Account for real payouts
   */
  async createExpressAccount(email?: string, country = 'US') {
    try {
      const account = await stripe.accounts.create({
        type: 'express',
        country,
        email,
        capabilities: {
          transfers: { requested: true },
          card_payments: { requested: true },
        },
        business_type: 'individual',
        settings: {
          payouts: {
            schedule: {
              interval: 'manual'  // Platform controls payouts
            }
          }
        }
      });

      console.log(`✅ Created Express Account: ${account.id}`);
      return account;
    } catch (error: any) {
      console.error('❌ Failed to create Express account:', error.message);
      throw error;
    }
  }

  /**
   * Create onboarding link for Express account
   */
  async createAccountLink(accountId: string, returnUrl: string, refreshUrl: string) {
    try {
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      });

      console.log(`✅ Created Account Link for: ${accountId}`);
      return accountLink;
    } catch (error: any) {
      console.error('❌ Failed to create account link:', error.message);
      throw error;
    }
  }

  /**
   * Execute REAL payout to Express connected account
   */
  async createRealPayout(accountId: string, amount: number, currency = 'usd', description?: string) {
    try {
      // First check account balance
      const balance = await stripe.balance.retrieve({
        stripeAccount: accountId
      });

      const availableAmount = balance.available.find(b => b.currency === currency)?.amount || 0;
      
      if (availableAmount < amount) {
        throw new Error(`Insufficient balance. Available: ${availableAmount}, Requested: ${amount}`);
      }

      // Create instant payout to connected account's bank/card
      const payout = await stripe.payouts.create({
        amount,
        currency,
        description: description || `BalanceFlow payout $${(amount / 100).toFixed(2)}`,
        method: 'instant'  // Instant payout (within 30 minutes)
      }, {
        stripeAccount: accountId  // Critical: Send to connected account
      });

      console.log(`✅ REAL STRIPE CONNECT PAYOUT: $${(amount / 100).toFixed(2)} to account ${accountId}`);
      return payout;
    } catch (error: any) {
      console.error('❌ Stripe Connect payout failed:', error.message);
      throw error;
    }
  }

  /**
   * Transfer funds to Express account before payout
   */
  async transferToAccount(accountId: string, amount: number, currency = 'usd') {
    try {
      const transfer = await stripe.transfers.create({
        amount,
        currency,
        destination: accountId,
        description: `BalanceFlow transfer to ${accountId}`
      });

      console.log(`✅ TRANSFERRED: $${(amount / 100).toFixed(2)} to account ${accountId}`);
      return transfer;
    } catch (error: any) {
      console.error('❌ Transfer to account failed:', error.message);
      throw error;
    }
  }

  /**
   * Get account status and capabilities
   */
  async getAccountStatus(accountId: string) {
    try {
      const account = await stripe.accounts.retrieve(accountId);
      return {
        id: account.id,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        requirements: account.requirements,
        capabilities: account.capabilities,
        email: account.email
      };
    } catch (error: any) {
      console.error('❌ Failed to get account status:', error.message);
      throw error;
    }
  }
}

export const stripeConnect = new StripeConnectService();