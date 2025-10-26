# 🧠 The Attention Protocol

**Exploring new incentive mechanisms for attention/trust @ Encode**

A Proof-of-Attention Protocol where AI agents stake to prove content value, and recipients claim value back if it's useful.

## 🎯 What It Is

A decentralized reputation system for communications where:
- **Senders stake** to prove their content deserves engagement
- **Recipients claim value** back if it's useful
- **AI agents** auto-filter, claim, or refund based on user preferences
- **On-chain incentive layer** powers trust scoring

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm
- Git

### Install & Run

```bash
# Install dependencies
pnpm install

# Start the frontend (http://localhost:3005)
cd x402-service/frontend && npm run dev

# Optional: Start the API server (http://localhost:3004)
cd x402-service && pnpm run dev:api
```

### CLI Commands

```bash
cd x402-service

# Send email with attention staking
pnpm pay send-email --content "Hello" --recipient 0x123... --stake 0.001

# Evaluate email and determine refund/slash
pnpm pay evaluate-email --email-id abc123 --verdict valuable

# View dashboard stats
pnpm pay dashboard
```

## 📁 Project Structure

```
attention-protocol/
├── x402-service/
│   ├── app/
│   │   └── cli.ts          # CLI commands for attention protocol
│   ├── api-server.ts       # REST API for frontend
│   ├── frontend/           # React frontend (Vite)
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── Inbox.jsx       # Email inbox view
│   │   │   │   └── Metrics.jsx     # Protocol metrics dashboard
│   │   │   ├── components/
│   │   │   │   ├── Navbar.jsx      # Header navigation
│   │   │   │   └── ComposeModal.jsx # 5-step compose flow
│   │   │   └── data/
│   │   │       └── inboxMock.js    # Mock data for demo
│   │   └── dist/           # Production build
│   └── contracts/          # Solidity smart contracts
└── README.md
```

## 🎨 Features

### Frontend
- **Dark cyberpunk theme** with neon colors (teal, purple, pink)
- **Gmail-style interface** with sidebar navigation
- **5-step compose flow**:
  1. Select recipients & compose
  2. Get quote (agent negotiation)
  3. Review stake amount
  4. Broadcast transaction
  5. Success & auto-close
- **Metrics dashboard** with stats, leaderboard, and meme cards
- **Terminal monospace fonts** and smooth animations

### Backend
- **CLI tool** (`attention-protocol`) for sending/evaluating emails
- **REST API** for frontend integration
- **Mock staking logic** for demo purposes
- **x402 protocol** compatible (Arbitrum Sepolia)

## 🚢 Deployment

### Option 1: Vercel (Recommended)

```bash
cd x402-service/frontend
npx vercel
```

### Option 2: Netlify

```bash
cd x402-service/frontend
npx netlify deploy --prod --dir=dist
```

### Option 3: Serve Locally

```bash
cd x402-service/frontend/dist
npx serve
```

## 🧪 Demo

1. Click **"Compose"** in the sidebar
2. Fill in subject, select recipients, type message
3. Click **"Get Quote"** → wait for agent negotiation
4. Review stake amount and click **"Stake & Send"**
5. Watch transaction broadcast
6. Success modal appears → redirects to inbox

Switch to **"Protocol Metrics"** to see:
- Total ATT staked
- Engagement rate
- Top agents leaderboard
- Recent activity feed
- Meme cards

## 🔧 Tech Stack

- **Frontend**: React + Vite + Framer Motion
- **Backend**: Node.js + TypeScript + Commander.js
- **Smart Contracts**: Solidity + Foundry
- **Network**: Arbitrum Sepolia
- **Styling**: Custom CSS (monospace font, neon colors)

## 📚 Protocol Details

### Core Concepts
- **ATT Token**: Attention token used for staking
- **Slashing**: Penalty for spam/low-value content
- **Refunding**: Return stake for valuable content
- **Trust Score**: On-chain reputation based on engagement

### Architecture
- Smart contracts for on-chain settlement
- AI agents for content evaluation
- CLI/API for interaction
- Frontend for user experience

## 🤝 Built For

Encode Hackathon - Exploring incentive mechanisms for attention and trust

## 📝 License

MIT

---

**Made with ❤️ by the Attention Protocol team**