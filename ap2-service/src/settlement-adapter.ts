import { createWalletClient, http, createPublicClient, parseUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { arbitrumSepolia } from 'viem/chains';
import { CONFIG, ARBITRUM_SEPOLIA_CHAIN_ID } from './config.js';
import { X402SettlementResult } from './types.js';
import { DelegatedSigner } from './delegated-signer.js';

/**
 * SettlementAdapter integrates with x402 quote-service and facilitator
 */
export class SettlementAdapter {
  private account;
  private walletClient;
  private publicClient;
  private delegatedSigner;

  constructor() {
    // Validate required environment variables
    if (!CONFIG.MERCHANT_PRIVATE_KEY) {
      throw new Error('MISSING_ENV: MERCHANT_PRIVATE_KEY is required. Set it in your .env file.');
    }
    
    if (!CONFIG.USDC_ADDRESS) {
      throw new Error('MISSING_ENV: USDC_ADDRESS is required. Set it in your .env file.');
    }
    
    this.account = privateKeyToAccount(CONFIG.MERCHANT_PRIVATE_KEY);
    
    this.walletClient = createWalletClient({
      account: this.account,
      chain: arbitrumSepolia,
      transport: http(CONFIG.ARBITRUM_SEPOLIA_RPC_URL),
    });

    this.publicClient = createPublicClient({
      chain: arbitrumSepolia,
      transport: http(CONFIG.ARBITRUM_SEPOLIA_RPC_URL),
    });

    this.delegatedSigner = new DelegatedSigner();
  }

  /**
   * Execute settlement via x402 facilitator
   */
  async settlePayment(params: {
    from: string; // User address
    amountMicroUsdc: number;
    batchId: string;
  }): Promise<X402SettlementResult> {
    try {
      console.log(`[Settlement] Starting settlement for batch ${params.batchId}`);
      console.log(`[Settlement] Amount: ${params.amountMicroUsdc} micro-USDC (${params.amountMicroUsdc / 1_000_000} USDC)`);
      console.log(`[Settlement] From: ${params.from}`);
      console.log(`[Settlement] To: ${this.account.address}`);

      // Convert micro-USDC to USDC base units (6 decimals)
      const amountUsdc = params.amountMicroUsdc.toString();

      // Generate EIP-3009 payment authorization using delegated signing
      // After user signs the Intent Mandate, we can generate payment signatures
      // within the authorized limits
      console.log(`[Settlement] Generating EIP-3009 payment authorization...`);
      const authorization = await this.delegatedSigner.generatePaymentAuthorization({
        from: params.from as `0x${string}`,
        to: this.account.address,
        value: amountUsdc,
        batchId: params.batchId,
        tokenAddress: CONFIG.USDC_ADDRESS,
        tokenName: 'TestUSDC',
        tokenVersion: '1',
      });

      console.log(`[Settlement] Authorization generated with nonce: ${authorization.nonce}`);

      const paymentPayload = {
        scheme: 'exact' as const,
        network: 'arbitrum-sepolia' as const,
        payload: authorization,
      };

      const paymentRequirements = {
        scheme: 'exact',
        network: 'arbitrum-sepolia',
        token: CONFIG.USDC_ADDRESS,
        amount: amountUsdc,
        recipient: this.account.address,
        description: `AI inference batch payment: ${params.batchId}`,
        maxTimeoutSeconds: 300,
      };

      const settlementRequest = {
        paymentPayload,
        paymentRequirements,
      };

      console.log(`[Settlement] Calling facilitator at ${CONFIG.FACILITATOR_URL}/settle`);
      console.log(`[Settlement] Using EIP-3009 transferWithAuthorization`);
      console.log(`[Settlement] Payment authorized via delegated signing`);

      // Call x402 facilitator to execute settlement
      const response = await fetch(`${CONFIG.FACILITATOR_URL}/settle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settlementRequest),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Facilitator returned ${response.status}: ${errorText}`);
      }

      const result = await response.json() as {
        success?: boolean;
        transactionHash?: string;
        error?: string;
      };

      console.log(`[Settlement] Facilitator response:`, result);

      if (result.success && result.transactionHash) {
        // Wait for transaction confirmation
        console.log(`[Settlement] Waiting for transaction confirmation: ${result.transactionHash}`);
        
        const receipt = await this.publicClient.waitForTransactionReceipt({
          hash: result.transactionHash as `0x${string}`,
          confirmations: 1,
        });

        console.log(`[Settlement] Transaction confirmed in block ${receipt.blockNumber}`);
        console.log(`[Settlement] EIP-3009 gasless payment successful`);

        return {
          success: true,
          transactionHash: receipt.transactionHash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed,
        };
      } else {
        throw new Error(result.error || 'Settlement failed without error message');
      }
    } catch (error) {
      console.error(`[Settlement] Error:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown settlement error',
      };
    }
  }

  /**
   * Get the merchant address
   */
  getMerchantAddress(): string {
    return this.account.address;
  }

  /**
   * Check if facilitator is available
   */
  async checkFacilitatorHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${CONFIG.FACILITATOR_URL}/supported`);
      if (!response.ok) return false;
      
      const data = await response.json() as {
        kinds?: Array<{ network: string; scheme: string }>;
      };
      return data.kinds?.some((k) => 
        k.network === 'arbitrum-sepolia' && k.scheme === 'exact'
      ) || false;
    } catch (error) {
      console.error('[Settlement] Facilitator health check failed:', error);
      return false;
    }
  }

  /**
   * Check if quote service is available
   */
  async checkQuoteServiceHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${CONFIG.QUOTE_SERVICE_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error('[Settlement] Quote service health check failed:', error);
      return false;
    }
  }
}
