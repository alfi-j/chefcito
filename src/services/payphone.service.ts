import axios from 'axios';
import CryptoJS from 'crypto-js';

export interface PayPhoneTransactionRequest {
  amount: number;
  currency: string;
  clientTransactionId: string;
  description?: string;
  returnUrl?: string;
  cancelUrl?: string;
  phoneNumber?: string;
  email?: string;
}

export interface PayPhoneTransactionResponse {
  transactionId: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  authorizationCode?: string;
  amount: number;
  currency: string;
  clientTransactionId: string;
  paymentUrl?: string;
  qrCode?: string;
}

export interface PayPhoneConfig {
  clientId: string;
  clientSecret: string;
  baseUrl: string;
  merchantId?: string;
}

export class PayPhoneService {
  private config: PayPhoneConfig;

  constructor(config: PayPhoneConfig) {
    this.config = config;
  }

  private generateSignature(payload: any): string {
    const jsonString = JSON.stringify(payload);
    return CryptoJS.HmacSHA256(jsonString, this.config.clientSecret).toString();
  }

  private getHeaders(signature: string) {
    return {
      'Authorization': `Bearer ${this.config.clientId}`,
      'Content-Type': 'application/json',
      'X-Signature': signature,
      'Accept': 'application/json'
    };
  }

  /**
   * Create a payment transaction
   */
  async createTransaction(request: PayPhoneTransactionRequest): Promise<PayPhoneTransactionResponse> {
    try {
      const payload = {
        amount: Math.round(request.amount * 100), // Convert to cents
        currency: request.currency || 'USD',
        clientTransactionId: request.clientTransactionId,
        description: request.description || 'Payment for order',
        returnUrl: request.returnUrl,
        cancelUrl: request.cancelUrl,
        phoneNumber: request.phoneNumber,
        email: request.email,
        lang: 'en'
      };

      // Add merchantId if provided
      if (this.config.merchantId) {
        (payload as any).storeId = this.config.merchantId;
      }

      const signature = this.generateSignature(payload);
      const headers = this.getHeaders(signature);

      const response = await axios.post(
        `${this.config.baseUrl}/api/Sale`,
        payload,
        { headers }
      );

      const data = response.data;
      
      return {
        transactionId: data.transactionId,
        status: this.mapStatus(data.status),
        authorizationCode: data.authorizationCode,
        amount: data.amount / 100, // Convert back to dollars
        currency: data.currency,
        clientTransactionId: data.clientTransactionId,
        paymentUrl: data.paymentUrl,
        qrCode: data.qrCode
      };
    } catch (error: any) {
      console.error('PayPhone transaction error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to create PayPhone transaction');
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(transactionId: string): Promise<PayPhoneTransactionResponse> {
    try {
      const payload = {
        transactionId: transactionId
      };

      // Add merchantId if provided
      if (this.config.merchantId) {
        (payload as any).storeId = this.config.merchantId;
      }

      const signature = this.generateSignature(payload);
      const headers = this.getHeaders(signature);

      const response = await axios.post(
        `${this.config.baseUrl}/api/Transactions/GetStatus`,
        payload,
        { headers }
      );

      const data = response.data;
      
      return {
        transactionId: data.transactionId,
        status: this.mapStatus(data.status),
        authorizationCode: data.authorizationCode,
        amount: data.amount / 100,
        currency: data.currency,
        clientTransactionId: data.clientTransactionId
      };
    } catch (error: any) {
      console.error('PayPhone status check error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to get transaction status');
    }
  }

  /**
   * Refund a transaction
   */
  async refundTransaction(transactionId: string, amount?: number): Promise<PayPhoneTransactionResponse> {
    try {
      const payload = {
        transactionId: transactionId,
        amount: amount ? Math.round(amount * 100) : undefined
      };

      // Add merchantId if provided
      if (this.config.merchantId) {
        (payload as any).storeId = this.config.merchantId;
      }

      const signature = this.generateSignature(payload);
      const headers = this.getHeaders(signature);

      const response = await axios.post(
        `${this.config.baseUrl}/api/Refund`,
        payload,
        { headers }
      );

      const data = response.data;
      
      return {
        transactionId: data.transactionId,
        status: this.mapStatus(data.status),
        authorizationCode: data.authorizationCode,
        amount: data.amount / 100,
        currency: data.currency,
        clientTransactionId: data.clientTransactionId
      };
    } catch (error: any) {
      console.error('PayPhone refund error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to process refund');
    }
  }

  /**
   * Map PayPhone status codes to our standard status
   */
  private mapStatus(status: string): PayPhoneTransactionResponse['status'] {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'approved';
      case 'rejected':
        return 'rejected';
      case 'cancelled':
        return 'cancelled';
      default:
        return 'pending';
    }
  }

  /**
   * Validate webhook signature
   */
  validateWebhookSignature(payload: any, signature: string): boolean {
    try {
      const expectedSignature = this.generateSignature(payload);
      return expectedSignature === signature;
    } catch (error) {
      console.error('Webhook signature validation error:', error);
      return false;
    }
  }
}

// Export singleton instance
let payPhoneService: PayPhoneService | null = null;

export function initializePayPhone(config: PayPhoneConfig): PayPhoneService {
  // Validate required credentials
  if (!config.clientId || !config.clientSecret) {
    throw new Error('PayPhone Cajita de Pagos requires clientId and clientSecret');
  }
  
  payPhoneService = new PayPhoneService(config);
  return payPhoneService;
}

export function getPayPhoneService(): PayPhoneService | null {
  return payPhoneService;
}