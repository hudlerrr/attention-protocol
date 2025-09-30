import Fastify from 'fastify';
import cors from '@fastify/cors';
import { parseUnits } from 'viem';
import { PaymentSwapQuoteIntentSchema, PaymentSwapQuoteAttestation, QuoteStruct } from '../../app/types';
import { QuoteSigner } from './signer';
import { loadContractAddresses, ENV } from '../../app/config';
import { X402Facilitator } from './facilitator';

const fastify = Fastify({ logger: true });

fastify.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Payment'],
});

// Initialize signer and load addresses
const signer = new QuoteSigner();
const addresses = loadContractAddresses();

fastify.get('/health', async (request, reply) => {
  return { status: 'ok', signer: signer.getAddress() };
});

// x402 quote endpoint
fastify.post('/quote', async (request, reply) => {
  try {
    // Check for X-Payment header (x402 payment proof)
    const paymentHeader = request.headers['x-payment'] as string;
    
    if (!paymentHeader) {
      // Return HTTP 402 Payment Required with x402 payment details
      reply.status(402);
      return {
        error: 'Payment Required',
        message: 'This endpoint requires payment to access',
        accepts: [
          {
            scheme: 'exact',
            network: 'arbitrum-sepolia',
            x402Version: 1,
            resource: '/quote',
            mimeType: 'application/json',
            maxAmountRequired: '1000',
            payTo: signer.getAddress(),
            asset: {
              type: 'erc20',
              address: addresses.usdc,
              symbol: 'USDC',
              decimals: 6,
              chainId: 421614,
            },
            description: 'Payment for swap quote generation',
            maxTimeoutSeconds: 300,
          }
        ],
        facilitator: {
          url: 'http://localhost:3002',
        }
      };
    }

    fastify.log.info('Processing paid quote request with payment proof...');

    // Validate request body
    const intent = PaymentSwapQuoteIntentSchema.parse(request.body);
    
    // Calculate expected output based on mock rate
    const sellAmount = BigInt(intent.sellAmount);
    const expectedOut = (sellAmount * BigInt(ENV.MOCK_RATE_NUMERATOR)) / BigInt(ENV.MOCK_RATE_DENOMINATOR);
    
    // Apply slippage to get minimum buy amount
    const slippageFactor = BigInt(10000 - intent.maxSlippageBps);
    const minBuy = (expectedOut * slippageFactor) / BigInt(10000);
    
    // Create quote struct for EIP-712 signing
    const quote: QuoteStruct = {
      from: intent.from as `0x${string}`,
      sell: intent.sell as `0x${string}`,
      buy: intent.buy as `0x${string}`,
      sellAmount,
      minBuy,
      deadline: BigInt(intent.deadline),
      chainId: BigInt(intent.chainId),
      nonce: intent.nonce as `0x${string}`,
    };
    
    // Sign the quote
    const { signature, signer: signerAddress } = await signer.signQuote(quote, addresses.executor);
    
    // Compute intent hash
    const intentHash = signer.computeIntentHash(intent);
    
    // Build attestation response
    const attestation: PaymentSwapQuoteAttestation = {
      type: 'payment.swap.quote.attestation',
      route: {
        venues: ['mock:adapter'],
        expected_out: expectedOut.toString(),
        ttl: 300,
      },
      constraints: {
        max_fee_bps: 15,
      },
      signature,
      signer: signerAddress,
      intent_hash: intentHash,
      quote: {
        from: quote.from,
        sell: quote.sell,
        buy: quote.buy,
        sellAmount: quote.sellAmount.toString(),
        minBuy: quote.minBuy.toString(),
        deadline: Number(quote.deadline),
        chainId: Number(quote.chainId),
        nonce: quote.nonce,
      },
    };
    
    fastify.log.info({
      intent_hash: intentHash,
      sell_amount: sellAmount.toString(),
      expected_out: expectedOut.toString(),
      min_buy: minBuy.toString(),
      slippage_bps: intent.maxSlippageBps,
      payment_received: true,
    }, 'Generated paid quote');

    // Add X-Payment-Response header to indicate successful payment processing
    reply.header('X-Payment-Response', Buffer.from(JSON.stringify({
      status: 'completed',
      transactionHash: '0x' + '0'.repeat(64), // Mock a transaction hash
      amount: '1000',
      token: addresses.usdc,
    })).toString('base64'));
    
    return attestation;
  } catch (error) {
    fastify.log.error(error, 'Quote generation failed');
    
    if (error instanceof Error) {
      reply.status(400).send({ error: error.message });
    } else {
      reply.status(500).send({ error: 'Internal server error' });
    }
  }
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('x402-compliant Quote service running on http://localhost:3001');
    console.log('Accepts payments via x402 protocol');
    console.log('Signer address:', signer.getAddress());
    console.log('Executor address:', addresses.executor);
    console.log('Payment: 0.001 USDC per quote');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
