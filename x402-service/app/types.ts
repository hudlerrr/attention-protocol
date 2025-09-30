import { z } from 'zod';
import type { Address } from 'viem';

// Zod schemas for validation
export const PaymentSwapQuoteIntentSchema = z.object({
  type: z.literal('payment.swap.quote.intent'),
  from: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  sell: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  buy: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  sellAmount: z.string(),
  maxSlippageBps: z.number().min(0).max(10000),
  recipient: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  deadline: z.number(),
  chainId: z.number(),
  nonce: z.string().regex(/^0x[a-fA-F0-9]{64}$/)
});

export const PaymentSwapQuoteAttestationSchema = z.object({
  type: z.literal('payment.swap.quote.attestation'),
  route: z.object({
    venues: z.array(z.string()),
    expected_out: z.string(),
    ttl: z.number()
  }),
  constraints: z.object({
    max_fee_bps: z.number()
  }),
  signature: z.string().regex(/^0x[a-fA-F0-9]{130}$/),
  signer: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  intent_hash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  quote: z.object({
    from: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    sell: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    buy: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    sellAmount: z.string(),
    minBuy: z.string(),
    deadline: z.number(),
    chainId: z.number(),
    nonce: z.string().regex(/^0x[a-fA-F0-9]{64}$/)
  })
});

// TypeScript types
export type PaymentSwapQuoteIntent = z.infer<typeof PaymentSwapQuoteIntentSchema>;
export type PaymentSwapQuoteAttestation = z.infer<typeof PaymentSwapQuoteAttestationSchema>;

// EIP-712 Quote struct matching Solidity
export interface QuoteStruct {
  from: Address;
  sell: Address;
  buy: Address;
  sellAmount: bigint;
  minBuy: bigint;
  deadline: bigint;
  chainId: bigint;
  nonce: `0x${string}`;
}

// Contract addresses type
export interface ContractAddresses {
  usdc: Address;
  weth: Address;
  quoteRegistry: Address;
  mockAdapter: Address;
  executor: Address;
  quoteServiceSigner: Address;
}

// CLI options
export interface SwapOptions {
  sell: string;
  buy: string;
  amount: string;
  maxSlippage: string;
  recipient?: string;
}

// EIP-712 domain and types
export const EIP712_DOMAIN = {
  name: 'X402Quote',
  version: '1',
  chainId: 421614, // Arbitrum Sepolia
} as const;

export const EIP712_TYPES = {
  Quote: [
    { name: 'from', type: 'address' },
    { name: 'sell', type: 'address' },
    { name: 'buy', type: 'address' },
    { name: 'sellAmount', type: 'uint256' },
    { name: 'minBuy', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
    { name: 'chainId', type: 'uint256' },
    { name: 'nonce', type: 'bytes32' }
  ]
} as const;
