/**
 * Wise API integration for real international wire transfers
 * Enables low-cost international money transfers
 */

export class WiseTransferService {
  private baseURL: string;
  private apiToken: string;
  private profileId: string;

  constructor() {
    this.baseURL = process.env.NODE_ENV === 'production' 
      ? 'https://api.transferwise.com' 
      : 'https://api.sandbox.transferwise.tech';
    this.apiToken = process.env.WISE_API_TOKEN || '';
    this.profileId = process.env.WISE_PROFILE_ID || '';
  }

  /**
   * Create a quote for international transfer
   */
  async createQuote(sourceCurrency: string, targetCurrency: string, amount: number, type = 'BALANCE_PAYOUT') {
    try {
      if (!this.apiToken) {
        throw new Error('WISE_API_TOKEN not configured');
      }

      const response = await fetch(`${this.baseURL}/v2/quotes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sourceCurrency,
          targetCurrency,
          sourceAmount: amount,
          type,
          profile: parseInt(this.profileId)
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Wise API error: ${response.status} - ${error}`);
      }

      const quote = await response.json();
      console.log(`✅ Wise quote created: ${sourceCurrency} ${amount} → ${targetCurrency} ${quote.targetAmount}`);
      return quote;
    } catch (error: any) {
      console.error('❌ Wise quote creation failed:', error.message);
      throw error;
    }
  }

  /**
   * Create recipient account for international transfer
   */
  async createRecipient(accountData: any) {
    try {
      if (!this.apiToken) {
        throw new Error('WISE_API_TOKEN not configured');
      }

      const response = await fetch(`${this.baseURL}/v1/accounts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          profile: parseInt(this.profileId),
          ...accountData
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Wise recipient creation failed: ${response.status} - ${error}`);
      }

      const recipient = await response.json();
      console.log(`✅ Wise recipient created: ${recipient.id}`);
      return recipient;
    } catch (error: any) {
      console.error('❌ Wise recipient creation failed:', error.message);
      throw error;
    }
  }

  /**
   * Execute real international wire transfer via Wise
   */
  async createTransfer(quoteId: string, targetAccount: string, reference?: string) {
    try {
      if (!this.apiToken) {
        throw new Error('WISE_API_TOKEN not configured');
      }

      // Create transfer
      const transferResponse = await fetch(`${this.baseURL}/v1/transfers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          targetAccount,
          quoteUuid: quoteId,
          customerTransactionId: `bf_${Date.now()}`,
          details: {
            reference: reference || 'BalanceFlow international transfer'
          }
        })
      });

      if (!transferResponse.ok) {
        const error = await transferResponse.text();
        throw new Error(`Wise transfer creation failed: ${transferResponse.status} - ${error}`);
      }

      const transfer = await transferResponse.json();

      // Fund the transfer
      const fundResponse = await fetch(`${this.baseURL}/v3/profiles/${this.profileId}/transfers/${transfer.id}/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'BALANCE'
        })
      });

      if (!fundResponse.ok) {
        const error = await fundResponse.text();
        throw new Error(`Wise transfer funding failed: ${fundResponse.status} - ${error}`);
      }

      console.log(`✅ REAL WISE TRANSFER: ${transfer.id} funded and processing`);
      return transfer;
    } catch (error: any) {
      console.error('❌ Wise transfer failed:', error.message);
      throw error;
    }
  }

  /**
   * Get transfer status
   */
  async getTransferStatus(transferId: string) {
    try {
      if (!this.apiToken) {
        throw new Error('WISE_API_TOKEN not configured');
      }

      const response = await fetch(`${this.baseURL}/v1/transfers/${transferId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get transfer status: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('❌ Failed to get Wise transfer status:', error.message);
      throw error;
    }
  }

  /**
   * Get supported currencies and corridors
   */
  async getSupportedCurrencies() {
    try {
      const response = await fetch(`${this.baseURL}/v1/currencies`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get currencies: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('❌ Failed to get Wise currencies:', error.message);
      return [];
    }
  }
}

export const wiseTransfer = new WiseTransferService();