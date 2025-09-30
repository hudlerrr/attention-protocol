import { config } from "dotenv";
import express, { Request, Response } from "express";
import { X402Facilitator } from "../quote-service/facilitator";

// Define Arb Sepolia payment kind
interface ArbitrumSupportedPaymentKind {
  x402Version: number;
  scheme: "exact";
  network: "arbitrum-sepolia";
}

config();

const EVM_PRIVATE_KEY = process.env.QUOTE_SERVICE_PRIVATE_KEY || "";

if (!EVM_PRIVATE_KEY) {
  console.error("Missing QUOTE_SERVICE_PRIVATE_KEY environment variable");
  process.exit(1);
}

const app = express();
app.use(express.json());

// Initialize the facilitator
const facilitator = new X402Facilitator();

// Define our own types for the facilitator service
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

    // Convert PaymentRequirements to PaymentDetails format expected by facilitator
    const paymentDetails = {
      scheme: paymentRequirements.scheme,
      token: {
        address: paymentRequirements.token,
        name: 'Token',
        symbol: 'TOKEN',
        decimals: 18,
        chainId: 421614,
      },
      amount: paymentRequirements.amount,
      recipient: paymentRequirements.recipient,
      description: paymentRequirements.description,
      maxTimeoutSeconds: paymentRequirements.maxTimeoutSeconds,
    };

    // verify using custom local facilitator
    const verificationResult = await facilitator.verifyPayment(paymentPayload, paymentDetails);
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
    const body: SettleRequest = req.body;
    const paymentRequirements = body.paymentRequirements;
    const paymentPayload = body.paymentPayload;

    // Check if this is Arbitrum Sepolia
    if (paymentRequirements.network !== "arbitrum-sepolia") {
      throw new Error("Invalid network - only arbitrum-sepolia is supported");
    }

    // Convert PaymentRequirements to PaymentDetails format expected by facilitator
    const paymentDetails = {
      scheme: paymentRequirements.scheme,
      token: {
        address: paymentRequirements.token,
        name: 'Token',
        symbol: 'TOKEN',
        decimals: 18,
        chainId: 421614,
      },
      amount: paymentRequirements.amount,
      recipient: paymentRequirements.recipient,
      description: paymentRequirements.description,
      maxTimeoutSeconds: paymentRequirements.maxTimeoutSeconds,
    };

    // settle using local facilitator
    const settlementResult = await facilitator.settlePayment(paymentPayload, paymentDetails);
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
