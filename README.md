# Arbitrum x402 & AP2 Demo Repository

This repository contains two services demonstrating advanced payment and commerce protocols on Arbitrum:

## Services

### 1. x402-service
Implementation of the [x402 standard](https://www.x402.org/) for HTTP 402 Payment Required responses, demonstrating swap execution on Arbitrum Sepolia with automatic payment handling.

**Location:** `./x402-service/`

See [x402-service/README.md](./x402-service/README.md) for detailed documentation.

### 2. ap2-service
Agentic service with web frontend demonstrating the [AP2 protocol](https://github.com/google-agentic-commerce/AP2) (Agentic Protocol 2) from Google, integrated with the x402 service.

**Location:** `./ap2-service/`

TODO: To be implemented.

## Getting Started

This is a pnpm workspace monorepo. You can work with services in two ways:

### Option 1: From Root (Recommended)

Install all dependencies from the root:
```bash
pnpm install
```

Run commands using filters:
```bash
# x402 service commands
pnpm --filter x402-service dev:service
pnpm --filter x402-service dev:facilitator
pnpm --filter x402-service pay test-x402
pnpm --filter x402-service deploy
pnpm --filter x402-service seed
pnpm --filter x402-service check

# ap2 service commands (coming soon)
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
