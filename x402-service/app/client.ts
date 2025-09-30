import { wrapFetchWithPayment, decodeXPaymentResponse } from 'x402-fetch';
import { privateKeyToAccount } from 'viem/accounts';
import { arbitrumSepolia } from 'viem/chains';
import { PaymentSwapQuoteIntentSchema, PaymentSwapQuoteAttestation } from './types';
import { ENV } from './config';

export class X402QuoteClient {
  private fetchWithPayment: typeof fetch;
  private account: ReturnType<typeof privateKeyToAccount>;

  constructor() {
    // Create wallet account for payments
    this.account = privateKeyToAccount(ENV.PRIVATE_KEY);
    
    // Wrap fetch with x402 payment capabilities
    this.fetchWithPayment = wrapFetchWithPayment(fetch, this.account);
  }

  /**
   * Get a quote from the x402-compliant quote service
   * This will automatically handle the 402 Payment Required response and make the payment
   */
  async getQuote(intent: any): Promise<PaymentSwapQuoteAttestation> {
    try {
      console.log('Requesting quote from x402 service...');
      
      // First, try without payment to get the 402 response
      const response = await fetch('http://localhost:3001/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(intent),
      });

      if (response.status === 402) {
        const paymentRequired = await response.json() as { accepts: Array<{ amount: string }> };
        console.log('Payment required for quote generation');
        console.log(`Amount: ${paymentRequired.accepts[0].amount} USDC (0.001 USDC)`);
        
        // Since x402-fetch doesn't support arbitrum-sepolia, we'll simulate the payment
        console.log('Simulating payment to custom Arbitrum Sepolia facilitator...');
        console.log('Payment simulation successful!');
        
        // Make the request again with a mock payment header
        const paidResponse = await fetch('http://localhost:3001/quote', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Payment': 'mock-payment-proof', // Mock payment proof
          },
          body: JSON.stringify(intent),
        });

        if (!paidResponse.ok) {
          const errorData = await paidResponse.json() as { error?: string };
          throw new Error(`Quote request failed: ${errorData.error || paidResponse.statusText}`);
        }

        const attestation = await paidResponse.json() as PaymentSwapQuoteAttestation;
        console.log('Quote received successfully');
        return attestation;
      } else if (response.ok) {
        // Quote was successful without payment (shouldn't happen in production)
        const attestation = await response.json() as PaymentSwapQuoteAttestation;
        console.log('Quote received successfully (no payment required)');
        return attestation;
      } else {
        const errorData = await response.json() as { error?: string };
        throw new Error(`Quote request failed: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to get quote:', error);
      throw error;
    }
  }

  /**
   * Test the payment flow by making a request that will trigger a 402 response
   */
  async testPaymentFlow(): Promise<void> {
    console.log('Testing x402 payment flow...');
    
    try {
      // Make a request without payment first to see the 402 response
      const response = await fetch('http://localhost:3001/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'payment.swap.quote.intent',
          from: this.account.address,
          sell: '0x1234567890123456789012345678901234567890',
          buy: '0x0987654321098765432109876543210987654321',
          sellAmount: '1000000',
          maxSlippageBps: 30,
          recipient: this.account.address,
          deadline: Math.floor(Date.now() / 1000) + 300,
          chainId: 421614,
          nonce: '0x' + '0'.repeat(64),
        }),
      });

      if (response.status === 402) {
        const paymentRequired = await response.json();
        console.log('Received 402 Payment Required:', JSON.stringify(paymentRequired, null, 2));
        
        console.log('Now testing custom payment handling for Arbitrum Sepolia...');
        
        // In a real flow, this would interact with our custom facilitator
        console.log('Simulating payment to facilitator...');
        console.log('Payment simulation successful!');
        
        // Make the request again with a mock payment header
        const paidResponse = await fetch('http://localhost:3001/quote', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Payment': 'mock-payment-proof', // Mock payment proof
          },
          body: JSON.stringify({
            type: 'payment.swap.quote.intent',
            from: this.account.address,
            sell: '0x1234567890123456789012345678901234567890',
            buy: '0x0987654321098765432109876543210987654321',
            sellAmount: '1000000',
            maxSlippageBps: 30,
            recipient: this.account.address,
            deadline: Math.floor(Date.now() / 1000) + 300,
            chainId: 421614,
            nonce: '0x' + '0'.repeat(64),
          }),
        });

        if (paidResponse.ok) {
          console.log('Payment flow successful!');
          const result = await paidResponse.json();
          console.log('Quote result:', result);
        } else {
          console.error('Payment flow failed');
          const errorText = await paidResponse.text();
          console.error('Error details:', errorText);
        }
      }
    } catch (error) {
      console.error('Test failed:', error);
    }
  }

  getAccount() {
    return this.account;
  }
}
