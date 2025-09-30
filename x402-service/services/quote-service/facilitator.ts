import { ENV } from '../../app/config';

interface PaymentPayload {
  scheme: string;
  networkId: number;
  token: string;
  amount: string;
  recipient: string;
  signature: string;
  nonce: string;
  deadline: number;
}

interface PaymentDetails {
  scheme: string;
  token: {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    chainId: number;
  };
  amount: string;
  recipient: string;
  description: string;
  maxTimeoutSeconds: number;
}

interface VerificationResponse {
  valid: boolean;
  error?: string;
  transactionHash?: string;
}

interface SettlementResponse {
  transactionHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
}

export class X402Facilitator {
  private facilitatorUrl: string;

  constructor(facilitatorUrl: string = 'http://localhost:3002') {
    this.facilitatorUrl = facilitatorUrl;
  }

  /**
   * Verify a payment payload with the facilitator
   */
  async verifyPayment(
    paymentPayload: PaymentPayload,
    paymentDetails: PaymentDetails
  ): Promise<VerificationResponse> {
    try {
      const response = await fetch(`${this.facilitatorUrl}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentPayload,
          paymentDetails,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        return {
          valid: false,
          error: errorData.error || 'Verification failed',
        };
      }

      const result = await response.json() as { valid: boolean; transactionHash?: string };
      return {
        valid: result.valid,
        transactionHash: result.transactionHash,
      };
    } catch (error) {
      console.error('Facilitator verification error:', error);
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown verification error',
      };
    }
  }

  /**
   * Settle a payment via the facilitator
   */
  async settlePayment(
    paymentPayload: PaymentPayload,
    paymentDetails: PaymentDetails
  ): Promise<SettlementResponse> {
    try {
      const response = await fetch(`${this.facilitatorUrl}/settle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentPayload,
          paymentDetails,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error || 'Settlement failed');
      }

      const result = await response.json() as { 
        transactionHash: string; 
        status: 'pending' | 'confirmed' | 'failed';
        blockNumber?: number;
      };
      return {
        transactionHash: result.transactionHash,
        status: result.status,
        blockNumber: result.blockNumber,
      };
    } catch (error) {
      console.error('Facilitator settlement error:', error);
      throw error;
    }
  }

  /**
   * Parse X-Payment header to extract payment payload
   */
  parsePaymentHeader(paymentHeader: string): PaymentPayload | null {
    try {
      const decoded = Buffer.from(paymentHeader, 'base64').toString('utf-8');
      const payload = JSON.parse(decoded);
      
      // Validate required fields
      if (!payload.scheme || !payload.networkId || !payload.token || 
          !payload.amount || !payload.recipient || !payload.signature) {
        return null;
      }

      return payload as PaymentPayload;
    } catch (error) {
      console.error('Failed to parse payment header:', error);
      return null;
    }
  }

  /**
   * Create payment details for the quote service
   */
  createPaymentDetails(): PaymentDetails {
    return {
      scheme: 'eip3009',
      token: {
        address: ENV.USDC_ADDRESS,
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        chainId: 421614,
      },
      amount: '1000', // 0.001 usdc
      recipient: ENV.QUOTE_SERVICE_SIGNER_ADDRESS,
      description: 'Payment for swap quote generation',
      maxTimeoutSeconds: 300,
    };
  }
}
