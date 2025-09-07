/**
 * Dots API integration for real CashApp payouts
 * Enables instant CashApp transfers to users
 */

export class DotsAPIService {
  private baseURL: string;
  private apiKey: string;

  constructor() {
    this.baseURL = process.env.NODE_ENV === 'production' 
      ? 'https://api.dots.dev' 
      : 'https://api.senddotssandbox.com';
    this.apiKey = process.env.DOTS_API_KEY || '';
  }

  /**
   * Create a real CashApp payout via Dots API
   */
  async createCashAppPayout(phoneNumber: string, amount: number, description?: string) {
    try {
      if (!this.apiKey) {
        throw new Error('DOTS_API_KEY not configured - CashApp payouts disabled');
      }

      const response = await fetch(`${this.baseURL}/api/v2/payouts/send-payout`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: amount * 100, // Convert to cents
          payee: {
            country_code: "1",
            phone_number: phoneNumber.replace(/\D/g, '') // Remove non-digits
          },
          metadata: {
            description: description || `BalanceFlow CashApp payout $${amount.toFixed(2)}`,
            source: 'BalanceFlow'
          }
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Dots API error: ${response.status} - ${error}`);
      }

      const result = await response.json();
      console.log(`✅ REAL CASHAPP PAYOUT: $${amount.toFixed(2)} sent to ${phoneNumber} via Dots API`);
      return result;
    } catch (error: any) {
      console.error('❌ Dots CashApp payout failed:', error.message);
      throw error;
    }
  }

  /**
   * Create a payout link for CashApp payments
   */
  async createPayoutLink(amount: number, description?: string) {
    try {
      if (!this.apiKey) {
        throw new Error('DOTS_API_KEY not configured');
      }

      const response = await fetch(`${this.baseURL}/api/payouts/create_payout_link`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          delivery: {
            method: "link"
          },
          amount: amount * 100, // Convert to cents
          metadata: {
            description: description || `BalanceFlow payout $${amount.toFixed(2)}`
          }
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Dots API error: ${response.status} - ${error}`);
      }

      const result = await response.json();
      console.log(`✅ Created Dots payout link: $${amount.toFixed(2)}`);
      return result;
    } catch (error: any) {
      console.error('❌ Dots payout link creation failed:', error.message);
      throw error;
    }
  }

  /**
   * Get payout status
   */
  async getPayoutStatus(payoutId: string) {
    try {
      if (!this.apiKey) {
        throw new Error('DOTS_API_KEY not configured');
      }

      const response = await fetch(`${this.baseURL}/api/v2/payouts/${payoutId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get payout status: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('❌ Failed to get Dots payout status:', error.message);
      throw error;
    }
  }
}

export const dotsAPI = new DotsAPIService();