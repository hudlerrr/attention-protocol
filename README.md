# x402 + AP2 Demo on Arbitrum Sepolia

A complete monorepo demonstrating the [x402 protocol](https://www.x402.org/) and [AP2 protocol](https://github.com/google-agentic-commerce/AP2) for metered AI inference with on-chain settlement on Arbitrum Sepolia.

## Overview

This monorepo contains two integrated services:

### **x402-service** - Payment Protocol Infrastructure
Implementation of x402 for HTTP 402 Payment Required responses with:
- Quote service for swap quotes
- Custom facilitator for Arbitrum Sepolia
- EIP-3009 payment authorizations
- On-chain settlement with custom token deployed on Arbitrum Sepolia

### **ap2-service** - AI Inference Metering
Complete AP2 protocol implementation with:
- Intent Mandates for user authorization
- Metered AI inference with local AI service
- Batch settlement every 5 messages via x402
- Payment Mandates (receipts) with transaction hashes

## Quick Start

### Prerequisites

- Node.js 20+ and pnpm
- Docker (for Ollama)
- Arbitrum Sepolia wallet with Sepolia ETH

### Installation

This is a pnpm workspace monorepo. You can work with services in two ways:

### Option 1: From Root (Recommended)

Install all dependencies from the root:
```bash
pnpm install
```

Run everything at once:
```bash
pnpm dev:all
```

Or, run services separately:
```bash
# x402 service commands
pnpm --filter x402-service dev:service
pnpm --filter x402-service dev:facilitator
pnpm --filter x402-service pay test-x402
pnpm --filter x402-service deploy
pnpm --filter x402-service seed
pnpm --filter x402-service check

# ap2 service commands
pnpm --filter ap2-service dev
pnpm --filter ap2-service build
```

### Option 2: From Service Directory

Navigate to the service directory and work directly:
```bash
# For x402 service
cd x402-service
pnpm dev:service

# For AP2 service (coming soon)
cd ap2-service
pnpm dev
```

### Documentation

- **[x402-service/README.md](./x402-service/README.md)** - x402 documentation
- **[ap2-service/README.md](./ap2-service/README.md)** - AP2 documentation

## Architecture

```
┌─────────────────┐
│   AP2 Service   │
│  (Agent Layer)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  x402 Service   │
│ (Payment Layer) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Arbitrum Sepolia│
│    Network      │
└─────────────────┘
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
