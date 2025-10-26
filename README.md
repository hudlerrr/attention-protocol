# 🧠 Proof-of-Attention Protocol Demo

**"AI agents stake to prove their content deserves attention"**

An experiment in autonomous value exchange where AI agents can pay or penalize each other for digital attention. Built on Arbitrum Sepolia with x402 payment protocol integration.

## 🎯 What This Demo Shows

This is a **proof-of-concept** for a "proof-of-attention protocol" where:

1. **Senders stake USDC** to prove their content deserves attention
2. **AI agents evaluate** content automatically 
3. **Smart contracts enforce** the economic logic (refund/slash)
4. **Real-time dashboard** shows the "state of the attention economy"

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (works with v18 despite warnings)
- Arbitrum Sepolia ETH for gas fees
- Deployed smart contracts (already done!)

### 1. Install Dependencies
```bash
cd x402-service
pnpm install
cd frontend
pnpm install
```

### 2. Start the Demo
```bash
# Terminal 1: Start API server
pnpm dev:api

# Terminal 2: Start frontend
pnpm dev:frontend
```

### 3. Access the Demo
- **Frontend**: http://localhost:3005
- **API**: http://localhost:3004

## 🎮 How to Use the Demo

### Send Email Tab
1. Write email content
2. Set stake amount (default: 0.001 USDC)
3. Click "Stake & Send"
4. Watch the email appear in the dashboard

### Evaluate Tab  
1. Select a pending email
2. Choose verdict: "Valuable" or "Spam"
3. Click "Evaluate & Process Stake"
4. See stake released (valuable) or slashed (spam)

### Dashboard Tab
- View real-time stats
- See recent email activity
- Monitor attention economy metrics

## 🛠️ CLI Commands

```bash
# Send email with staking
pnpm pay send-email --content "Hello world!" --stake 0.001

# Evaluate email
pnpm pay evaluate-email --email-id email_123 --verdict valuable

# Show dashboard
pnpm pay dashboard

# Test x402 payment flow
pnpm pay test-x402
```

## 🏗️ Architecture

```
┌─────────────────┐    HTTP API    ┌─────────────────┐
│                 │ ──────────────► │                 │
│  React Frontend │                 │  Express API    │
│  (Port 3005)    │ ◄────────────── │  (Port 3004)    │
│                 │   JSON Data     │                 │
└─────────────────┘                 └─────────────────┘
         │                                   │
         │                                   │ Mock Data
         │                                   ▼
         │                           ┌─────────────────┐
         │                           │  In-Memory      │
         │                           │  Email Store    │
         │                           └─────────────────┘
         │
         ▼
┌─────────────────┐
│  Smart Contracts│
│  (Arbitrum      │
│   Sepolia)      │
└─────────────────┘
```

## 📊 Smart Contract Addresses

- **TestUSDC**: `0xe606F56a482f6668489ade1a1FFd489fc0AD431C`
- **QuoteRegistry**: `0x16c130bf15e048E00C62A17021DB73F0168873Ed`
- **ComposableExecutor**: `0x6564FBBD6Fc2BfeC87a10137f5241bE67bf1bf5a`



**"We built a proof-of-attention protocol where AI agents handle message evaluation and payment staking between senders and recipients — an experiment in AI-to-AI value exchange on Arbitrum."**

### Key Features Demonstrated:
- ✅ **Attention Staking**: Senders stake USDC to prove content value
- ✅ **AI Evaluation**: Automated content assessment 
- ✅ **Economic Enforcement**: Smart contracts handle refund/slash
- ✅ **Real-time Dashboard**: Live attention economy metrics
- ✅ **Arbitrum Integration**: Deployed on Arbitrum Sepolia
- ✅ **x402 Protocol**: Payment infrastructure

### Technical Stack:
- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js + Node.js
- **Blockchain**: Arbitrum Sepolia + Solidity
- **Payment**: x402 protocol + EIP-3009 signatures

## 🔮 Future Enhancements

- Real AI model integration (Ollama)
- On-chain reputation system
- Multi-token support
- Advanced spam detection
- Agent-to-agent communication protocols

## 📝 Flow

1. **Show the concept**: "AI agents stake to prove content value"
2. **Send an email**: Demonstrate staking mechanism
3. **Evaluate content**: Show AI decision making
4. **View dashboard**: Real-time attention economy stats
5. **Explain the vision**: "This is how we reimagine digital attention"

---

**Built for hackathon demo purposes. Not production ready.**

