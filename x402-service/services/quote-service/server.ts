import Fastify from 'fastify';
import cors from '@fastify/cors';
import { parseUnits } from 'viem';
import { PaymentSwapQuoteIntentSchema, PaymentSwapQuoteAttestation, QuoteStruct } from '../../app/types';
import { QuoteSigner } from './signer';
import { loadContractAddresses, ENV, ARBITRUM_SEPOLIA_CHAIN_ID } from '../../app/config';
import { X402Facilitator } from './facilitator';
import { decodePaymentHeader, verifyTransferAuthorization } from '../../app/eip3009';
import { SettlementService } from '../../app/settlement';

const fastify = Fastify({ logger: true });

fastify.register(cors as any, {
  origin: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Payment'],
  exposedHeaders: ['X-Payment-Response'],
});

// Initialize signer, settlement service, and load addresses
const signer = new QuoteSigner();
const addresses = loadContractAddresses();
const settlementService = ENV.ENABLE_SETTLEMENT ? new SettlementService(ENV.QUOTE_SERVICE_PRIVATE_KEY) : null;

fastify.get('/health', async (request, reply) => {
  return { status: 'ok', signer: signer.getAddress() };
});

// x402 quote endpoint
fastify.post('/quote', async (request, reply) => {
  try {
    // Check for X-Payment header (x402 payment proof)
    const paymentHeader = request.headers['x-payment'] as string;
    
    if (!paymentHeader) {
      // Return HTTP 402 Payment Required with x402-compliant payment details
      reply.status(402);
      return {
        x402Version: 1,
        error: 'Payment Required',
        accepts: [
          {
            scheme: 'exact',
            network: 'arbitrum-sepolia',
            maxAmountRequired: '1000', // 0.001 USDC
            resource: '/quote',
            description: 'Payment for swap quote generation',
            mimeType: 'application/json',
            outputSchema: null,
            payTo: signer.getAddress(),
            maxTimeoutSeconds: 300,
            asset: addresses.usdc, // Token contract address as string
            extra: {
              name: 'TestUSDC',
              version: '1',
            },
          }
        ],
        facilitator: {
          url: 'http://localhost:3002',
        }
      };
    }

    fastify.log.info('Processing paid quote request with payment proof...');

    // Decode and verify payment
    const paymentPayload = decodePaymentHeader(paymentHeader);
    if (!paymentPayload) {
      reply.status(402);
      return {
        x402Version: 1,
        error: 'Invalid payment header format',
        accepts: [{
          scheme: 'exact',
          network: 'arbitrum-sepolia',
          maxAmountRequired: '1000',
          resource: '/quote',
          description: 'Payment for swap quote generation',
          mimeType: 'application/json',
          outputSchema: null,
          payTo: signer.getAddress(),
          maxTimeoutSeconds: 300,
          asset: addresses.usdc,
          extra: { name: 'TestUSDC', version: '1' },
        }],
      };
    }

    // Verify payment scheme and network
    if (paymentPayload.scheme !== 'exact' || paymentPayload.network !== 'arbitrum-sepolia') {
      reply.status(402);
      return {
        x402Version: 1,
        error: 'Unsupported payment scheme or network',
        accepts: [{
          scheme: 'exact',
          network: 'arbitrum-sepolia',
          maxAmountRequired: '1000',
          resource: '/quote',
          description: 'Payment for swap quote generation',
          mimeType: 'application/json',
          outputSchema: null,
          payTo: signer.getAddress(),
          maxTimeoutSeconds: 300,
          asset: addresses.usdc,
          extra: { name: 'TestUSDC', version: '1' },
        }],
      };
    }

    // Verify payment amount
    const paymentAmount = BigInt(paymentPayload.payload.value);
    const requiredAmount = BigInt('1000');
    if (paymentAmount < requiredAmount) {
      reply.status(402);
      return {
        x402Version: 1,
        error: `Insufficient payment amount. Required: ${requiredAmount}, provided: ${paymentAmount}`,
        accepts: [{
          scheme: 'exact',
          network: 'arbitrum-sepolia',
          maxAmountRequired: '1000',
          resource: '/quote',
          description: 'Payment for swap quote generation',
          mimeType: 'application/json',
          outputSchema: null,
          payTo: signer.getAddress(),
          maxTimeoutSeconds: 300,
          asset: addresses.usdc,
          extra: { name: 'TestUSDC', version: '1' },
        }],
      };
    }

    // Verify payment recipient
    if (paymentPayload.payload.to.toLowerCase() !== signer.getAddress().toLowerCase()) {
      reply.status(402);
      return {
        x402Version: 1,
        error: 'Payment recipient mismatch',
        accepts: [{
          scheme: 'exact',
          network: 'arbitrum-sepolia',
          maxAmountRequired: '1000',
          resource: '/quote',
          description: 'Payment for swap quote generation',
          mimeType: 'application/json',
          outputSchema: null,
          payTo: signer.getAddress(),
          maxTimeoutSeconds: 300,
          asset: addresses.usdc,
          extra: { name: 'TestUSDC', version: '1' },
        }],
      };
    }

    // Verify EIP-3009 signature
    const authorization = {
      from: paymentPayload.payload.from,
      to: paymentPayload.payload.to,
      value: paymentPayload.payload.value,
      validAfter: paymentPayload.payload.validAfter,
      validBefore: paymentPayload.payload.validBefore,
      nonce: paymentPayload.payload.nonce,
    };

    const paymentSignature = {
      v: paymentPayload.payload.v,
      r: paymentPayload.payload.r,
      s: paymentPayload.payload.s,
    };

    const recoveredSigner = await verifyTransferAuthorization(
      authorization,
      paymentSignature,
      addresses.usdc,
      'TestUSDC',
      '1',
      ARBITRUM_SEPOLIA_CHAIN_ID
    );

    fastify.log.info({
      recoveredSigner,
      expectedSigner: paymentPayload.payload.from,
      match: recoveredSigner?.toLowerCase() === paymentPayload.payload.from.toLowerCase(),
    }, 'Signature verification result');

    if (!recoveredSigner || recoveredSigner.toLowerCase() !== paymentPayload.payload.from.toLowerCase()) {
      fastify.log.error({
        recoveredSigner,
        expectedSigner: paymentPayload.payload.from,
      }, 'Signature verification failed');
      reply.status(402);
      return {
        x402Version: 1,
        error: 'Invalid payment signature',
        accepts: [{
          scheme: 'exact',
          network: 'arbitrum-sepolia',
          maxAmountRequired: '1000',
          resource: '/quote',
          description: 'Payment for swap quote generation',
          mimeType: 'application/json',
          outputSchema: null,
          payTo: signer.getAddress(),
          maxTimeoutSeconds: 300,
          asset: addresses.usdc,
          extra: { name: 'TestUSDC', version: '1' },
        }],
      };
    }

    // Check time validity
    const now = Math.floor(Date.now() / 1000);
    if (now < paymentPayload.payload.validAfter || now > paymentPayload.payload.validBefore) {
      reply.status(402);
      return {
        x402Version: 1,
        error: 'Payment authorization expired or not yet valid',
        accepts: [{
          scheme: 'exact',
          network: 'arbitrum-sepolia',
          maxAmountRequired: '1000',
          resource: '/quote',
          description: 'Payment for swap quote generation',
          mimeType: 'application/json',
          outputSchema: null,
          payTo: signer.getAddress(),
          maxTimeoutSeconds: 300,
          asset: addresses.usdc,
          extra: { name: 'TestUSDC', version: '1' },
        }],
      };
    }

    fastify.log.info({
      payer: paymentPayload.payload.from,
      amount: paymentPayload.payload.value,
      nonce: paymentPayload.payload.nonce,
    }, 'Payment verified successfully');

    // Execute settlement if enabled
    let settlementResult = null;
    if (settlementService && ENV.ENABLE_SETTLEMENT) {
      fastify.log.info('Executing on-chain settlement...');
      settlementResult = await settlementService.settlePayment(
        addresses.usdc,
        paymentPayload
      );

      if (!settlementResult.success) {
        fastify.log.error({ error: settlementResult.error }, 'Settlement failed');
        reply.status(402);
        return {
          x402Version: 1,
          error: `Settlement failed: ${settlementResult.error}`,
          accepts: [{
            scheme: 'exact',
            network: 'arbitrum-sepolia',
            maxAmountRequired: '1000',
            resource: '/quote',
            description: 'Payment for swap quote generation',
            mimeType: 'application/json',
            outputSchema: null,
            payTo: signer.getAddress(),
            maxTimeoutSeconds: 300,
            asset: addresses.usdc,
            extra: { name: 'TestUSDC', version: '1' },
          }],
        };
      }

      fastify.log.info({
        transactionHash: settlementResult.transactionHash,
        blockNumber: settlementResult.blockNumber?.toString(),
        gasUsed: settlementResult.gasUsed?.toString(),
      }, 'Settlement executed successfully');
    }

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
    const { signature: quoteSignature, signer: signerAddress } = await signer.signQuote(quote, addresses.executor);
    
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
      signature: quoteSignature,
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
    const paymentResponse = {
      status: settlementResult?.success ? 'completed' : 'verified',
      transactionHash: settlementResult?.transactionHash || null,
      blockNumber: settlementResult?.blockNumber ? Number(settlementResult.blockNumber) : null,
      gasUsed: settlementResult?.gasUsed ? settlementResult.gasUsed.toString() : null,
      amount: paymentPayload.payload.value,
      token: addresses.usdc,
      settled: !!settlementResult?.success,
    };
    
    reply.header('X-Payment-Response', Buffer.from(JSON.stringify(paymentResponse)).toString('base64'));
    
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
    console.log('Settlement:', ENV.ENABLE_SETTLEMENT ? 'ENABLED (on-chain)' : 'DISABLED (verification only)');
    if (settlementService) {
      console.log('Settlement facilitator:', settlementService.getAddress());
    }
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
