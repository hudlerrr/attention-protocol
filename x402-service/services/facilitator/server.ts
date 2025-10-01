import { config } from "dotenv";
import express, { Request, Response } from "express";
import { X402Facilitator } from "../quote-service/facilitator";
import { createWalletClient, http, publicActions } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { arbitrumSepolia } from 'viem/chains';

// Define Arb Sepolia payment kind
interface ArbitrumSupportedPaymentKind {
  x402Version: number;
  scheme: "exact";
  network: "arbitrum-sepolia";
}

config();

const EVM_PRIVATE_KEY = process.env.QUOTE_SERVICE_PRIVATE_KEY || "";
const USDC_ADDRESS = process.env.USDC_ADDRESS || "";

if (!EVM_PRIVATE_KEY) {
  console.error("Missing QUOTE_SERVICE_PRIVATE_KEY environment variable");
  process.exit(1);
}

if (!USDC_ADDRESS) {
  console.error("Missing USDC_ADDRESS environment variable");
  process.exit(1);
}

const app = express();
app.use(express.json());

// Initialize the facilitator
const facilitator = new X402Facilitator();

// Set up viem client for on-chain transactions
const account = privateKeyToAccount(EVM_PRIVATE_KEY as `0x${string}`);
const client = createWalletClient({
  account,
  chain: arbitrumSepolia,
  transport: http(),
}).extend(publicActions);

// Define our own types for the facilitator service
interface PaymentPayload {
  scheme: string;
  network: string;
  payload: {
    from: string;
    to: string;
    value: string;
    validAfter: number;
    validBefore: number;
    nonce: string;
    v: number;
    r: string;
    s: string;
  };
}

interface PaymentRequirements {
  scheme: string;
  network: string;
  token: string;
  amount: string;
  recipient: string;
  description: string;
  maxTimeoutSeconds: number;
}

type VerifyRequest = {
  paymentPayload: PaymentPayload;
  paymentRequirements: PaymentRequirements;
};

type SettleRequest = {
  paymentPayload: PaymentPayload;
  paymentRequirements: PaymentRequirements;
};

app.get("/verify", (req: Request, res: Response) => {
  res.json({
    endpoint: "/verify",
    description: "POST to verify x402 payments",
    body: {
      paymentPayload: "PaymentPayload",
      paymentRequirements: "PaymentRequirements",
    },
  });
});

app.post("/verify", async (req: Request, res: Response) => {
  try {
    const body: VerifyRequest = req.body;
    const paymentRequirements = body.paymentRequirements;
    const paymentPayload = body.paymentPayload;

    // Check if this is Arbitrum Sepolia (421614)
    if (paymentRequirements.network !== "arbitrum-sepolia") {
      throw new Error("Invalid network - only arbitrum-sepolia is supported");
    }

    // For verify endpoint, just validate the structure
    // In production, this would verify signatures
    console.log('[Facilitator] Verifying payment...');
    console.log('[Facilitator] Payment requirements:', paymentRequirements);
    console.log('[Facilitator] Payment payload:', paymentPayload);
    
    const verificationResult = {
      valid: true,
      message: 'Payment payload is valid',
    };
    
    res.json(verificationResult);
  } catch (error) {
    console.error("error", error);
    res.status(400).json({ error: "Invalid request" });
  }
});

app.get("/settle", (req: Request, res: Response) => {
  res.json({
    endpoint: "/settle",
    description: "POST to settle x402 payments",
    body: {
      paymentPayload: "PaymentPayload",
      paymentRequirements: "PaymentRequirements",
    },
  });
});

app.get("/supported", async (req: Request, res: Response) => {
  const kinds: ArbitrumSupportedPaymentKind[] = [];

  // Support Arbitrum Sepolia
  if (EVM_PRIVATE_KEY) {
    kinds.push({
      x402Version: 1,
      scheme: "exact",
      network: "arbitrum-sepolia",
    });
  }

  res.json({
    kinds,
  });
});

app.post("/settle", async (req: Request, res: Response) => {
  try {
    console.log('[Facilitator] Received settle request');
    console.log('[Facilitator] Body:', JSON.stringify(req.body, null, 2));
    
    const body: SettleRequest = req.body;
    const paymentRequirements = body.paymentRequirements;
    const paymentPayload = body.paymentPayload;

    console.log('[Facilitator] Payment requirements:', paymentRequirements);
    console.log('[Facilitator] Payment payload:', paymentPayload);

    // Check if this is Arbitrum Sepolia
    if (paymentRequirements.network !== "arbitrum-sepolia") {
      throw new Error("Invalid network - only arbitrum-sepolia is supported");
    }

    // Execute on-chain settlement
    // For demo: merchant pulls funds using transferFrom (requires user approval)
    // In production with EIP-7702: would use transferWithAuthorization with delegated signing
    console.log('[Facilitator] Executing settlement via transferFrom...');
    console.log('[Facilitator] From:', paymentPayload.payload.from);
    console.log('[Facilitator] To:', paymentPayload.payload.to);
    console.log('[Facilitator] Amount:', paymentRequirements.amount);
    console.log('[Facilitator] Token:', paymentRequirements.token);
    
    // ERC-20 transferFrom ABI
    const transferFromAbi = [{
      name: 'transferFrom',
      type: 'function',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
      ],
      outputs: [{ name: '', type: 'bool' }],
    }] as const;
    
    // Execute the transfer (merchant pulls funds with user's prior approval)
    const hash = await client.writeContract({
      address: paymentRequirements.token as `0x${string}`,
      abi: transferFromAbi,
      functionName: 'transferFrom',
      args: [
        paymentPayload.payload.from as `0x${string}`,
        paymentPayload.payload.to as `0x${string}`,
        BigInt(paymentPayload.payload.value),
      ],
    });
    
    console.log('[Facilitator] Transaction submitted:', hash);
    
    // Wait for confirmation
    const receipt = await client.waitForTransactionReceipt({ hash });
    
    console.log('[Facilitator] Transaction confirmed in block:', receipt.blockNumber);
    
    const settlementResult = {
      success: true,
      transactionHash: receipt.transactionHash,
      blockNumber: Number(receipt.blockNumber),
      status: 'confirmed' as const,
    };
    
    console.log('[Facilitator] Settlement result:', settlementResult);
    res.json(settlementResult);
  } catch (error) {
    console.error("error", error);
    res.status(400).json({ error: `Invalid request: ${error}` });
  }
});

app.listen(process.env.PORT || 3002, () => {
  console.log(`X402-Compliant Facilitator listening at http://localhost:${process.env.PORT || 3002}`);
  console.log(`Network: Arbitrum Sepolia`);
  console.log('');
  console.log('Endpoints:');
  console.log('  GET  /verify     - Verify endpoint info');
  console.log('  POST /verify     - Verify payment payload');
  console.log('  GET  /settle     - Settle endpoint info');
  console.log('  POST /settle     - Execute payment settlement');
  console.log('  GET  /supported  - Supported payment kinds');
});
