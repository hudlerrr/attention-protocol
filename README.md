# Payment Flow with x402 Standard on Arbitrum 

A complete implementation of the [x402 standard](https://www.x402.org/) for HTTP 402 Payment Required responses, demonstrating composable swap execution on Arbitrum Sepolia with automatic payment handling.

## What is X402?

[X402](https://www.x402.org/) is a protocol that activates `HTTP 402 Payment Required responses` for machine-to-machine payments. It enables:

- **Automatic payments** for API access using crypto
- **Gasless transactions** via EIP-3009 payment authorization
- **Standardized payment flows** across web services
- **AI agent payments** with seamless integration

This project showcases x402 by requiring payment for swap quote generation, then executing the swap on-chain.

## Architecture

```
┌─────────────────┐    HTTP 402     ┌─────────────────┐    Verify/Settle    ┌─────────────────┐
│                 │ ──────────────► │                 │ ──────────────────► │                 │
│  X402 Client    │                 │  Quote Service  │                     │Custom Facilitator│
│  (auto-pay)     │ ◄────────────── │  (requires pay) │ ◄────────────────── │(Arbitrum Sepolia)│
│                 │    Quote + Proof│                 │    Payment Confirmed│                 │
└─────────────────┘                 └─────────────────┘                     └─────────────────┘
         │                                   │                                       │
         │                                   │                                       │
         ▼                                   ▼                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 Arbitrum Sepolia Network                                     │
│  ┌─────────────────┐                                           ┌─────────────────┐          │
│  │                 │                                           │                 │          │
│  │   Swap Execution│                                           │ Smart Contracts │          │
│  │                 │                                           │ (Verify & Swap) │          │
│  └─────────────────┘                                           └─────────────────┘          │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

## Prerequisites

- [Node.js](https://nodejs.org/) 20+ and [pnpm](https://pnpm.io/)
- [Foundry](https://getfoundry.sh/) for smart contract deployment
- Arbitrum Sepolia ETH for gas fees
- Custom USDC and WETH contracts on Arbitrum Sepolia

## Installation

1. **Clone and install dependencies**:
```bash
git clone https://github.com/hummusonrails/x402-demo-arbitrum.git
cd x402-demo-arbitrum
pnpm install
```

2. **Set up environment variables**:
```bash
cp .env.example .env
```

Edit `.env` with your values:
```bash
# Required
ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
PRIVATE_KEY=0x... # Your wallet private key (needs Arbitrum Sepolia ETH for gas)
QUOTE_SERVICE_PRIVATE_KEY=0x... # Separate wallet private key for quote service signing
```

## Deployment

1. **Deploy smart contracts**:
```bash
pnpm run deploy
```

This deploys:
- TestUSDC and TestWETH tokens
- QuoteRegistry for replay protection
- MockAdapter for swaps
- ComposableExecutor for quote verification

2. **Seed with test tokens**:
```bash
pnpm run seed
```

This mints tokens to your wallet for testing.

3. **Verify deployment**:
```bash
cat out/addresses.sepolia.json
```

Should show deployed contract addresses.

## Usage

### 1. Start the Custom X402 Facilitator

```bash
pnpm dev:facilitator
```

The facilitator will start on `http://localhost:3002` and provide:
- Payment verification for Arbitrum Sepolia
- EIP-3009 payment settlement
- USDC transfer authorization handling

### 2. Start the X402 Quote Service

```bash
pnpm dev:service
```

The service will start on `http://localhost:3001` and:
- Return HTTP 402 for unpaid requests
- Accept payments via x402 protocol using the custom facilitator
- Provide signed quotes after payment

### 3. Test X402 Payment Flow

```bash
pnpm pay test-x402
```

This demonstrates:
1. Request without payment returns `HTTP 402 Payment Required`
2. Automatic payment handling via `x402-fetch`
3. Successful quote retrieval with payment proof

### 4. Execute Paid Swap

```bash
pnpm pay pay --swap --sell USDC --buy WETH --amount 25 --max-slippage 0.3
```

Full flow:
1. **Payment**: Automatically pays 0.001 USDC for quote
2. **Quote**: Receives signed swap quote
3. **Approval**: Approves token spending if needed
4. **Swap**: Executes on-chain swap with quote
5. **Verification**: Shows transaction details and events

### Available Commands

```bash
# Development
pnpm dev:facilitator      # Start custom x402 facilitator
pnpm dev:service          # Start x402 quote service
pnpm pay test-x402        # Test payment flow
pnpm build               # Compile TypeScript

# Smart Contracts  
pnpm run deploy          # Deploy contracts to Arbitrum Sepolia
pnpm seed                # Mint test tokens
pnpm test:sol            # Run Solidity tests

# Swaps
pnpm pay pay --swap --sell USDC --buy WETH --amount 25 --max-slippage 0.3
pnpm pay pay --swap --sell WETH --buy USDC --amount 0.01 --max-slippage 0.5
```

## Payment Flow Details

### 1. Initial Request (No Payment)
```bash
curl -X POST http://localhost:3001/quote \
  -H "Content-Type: application/json" \
  -d '{"from":"0x...","sell":"0x...","buy":"0x...","sellAmount":"1000000","maxSlippageBps":30,"deadline":1234567890,"chainId":421614,"nonce":"0x..."}'
```

**Response: HTTP 402**
```json
{
  "error": "Payment Required",
  "message": "This endpoint requires payment to access",
  "accepts": [{
    "scheme": "eip3009",
    "token": {
      "address": "0x...",
      "name": "USD Coin",
      "symbol": "USDC",
      "decimals": 6,
      "chainId": 421614
    },
    "amount": "1000",
    "recipient": "0x...",
    "description": "Payment for swap quote generation",
    "maxTimeoutSeconds": 300
  }],
  "facilitator": {
    "url": "http://localhost:3002"
  }
}
```

### 2. Automatic Payment (via x402-fetch)
The client automatically:
1. Creates EIP-3009 payment authorization
2. Signs with wallet private key
3. Retries request with `X-Payment` header
4. Receives quote with `X-Payment-Response` confirmation

## File Structure

```
├── app/
│   ├── agent.ts          # Swap orchestration logic
│   ├── cli.ts            # X402-compliant CLI interface
│   ├── client.ts         # X402 client with auto-payment
│   ├── config.ts         # Environment and contract config
│   └── types.ts          # TypeScript type definitions
├── contracts/
│   ├── ComposableExecutor.sol    # Main swap execution contract
│   ├── QuoteRegistry.sol         # Nonce tracking for replay protection
│   ├── Token/
│   │   ├── TestUSDC.sol         # Test USDC token (6 decimals)
│   │   └── TestWETH.sol         # Test WETH token (18 decimals)
│   └── adapters/
│       ├── IAdapter.sol         # Adapter interface
│       └── MockAdapter.sol      # Mock DEX adapter
├── services/
│   └── quote-service/
│       ├── server.ts            # X402-compliant quote service
│       ├── facilitator.ts       # X402 facilitator integration
│       └── signer.ts           # EIP-712 quote signing
├── script/
│   ├── Deploy.s.sol            # Contract deployment script
│   └── Seed.s.sol              # Token minting script
└── test/
    └── Executor.t.sol          # Smart contract tests
```

## Troubleshooting

### Common Issues

1. **"forge-std not found"**:
```bash
git submodule update --init --recursive
```

2. **"Contract addresses not found"**:
```bash
pnpm run deploy
```

3. **"Insufficient balance" during swap**:
```bash
pnpm seed
```

4. **"Payment verification failed"**:
- Ensure you have a USDC contract deployed on Arbitrum Sepolia: `pnpm run deploy`
- Check that the facilitator service is accessible: `pnpm dev:facilitator`
- Verify your private key has sufficient balance: `pnpm seed`

5. **"Transaction reverted"**:
- Check token approvals
- Verify slippage settings
- Ensure quote hasn't expired

## Development

### Running Tests

```bash
# Solidity tests
pnpm test:sol

# TypeScript compilation check
pnpm check

# Build project
pnpm build
```

### Adding New Payment Methods

1. Update `facilitator.ts` with new payment scheme
2. Add token configuration in `config.ts`
3. Update payment details in `server.ts`
4. Test with new token addresses

## Resources

- [X402 Protocol](https://www.x402.org/) - Official protocol documentation
- [X402 GitHub](https://github.com/coinbase/x402) - SDK and examples
- [Arbitrum Sepolia](https://sepolia.arbiscan.io/) - Block explorer
- [EIP-3009](https://eips.ethereum.org/EIPS/eip-3009) - Transfer with authorization standard

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.