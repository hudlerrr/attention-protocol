#!/usr/bin/env node

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3004;

app.use(cors());
app.use(express.json());

// Mock data for the attention economy
let emails: Array<{
  id: string;
  content: string;
  sender: string;
  recipient: string;
  stake: number;
  status: 'pending' | 'valuable' | 'spam';
  timestamp: number;
}> = [];

let stats = {
  totalStaked: 0,
  valuableCount: 0,
  spamCount: 0,
  totalEmails: 0
};

// Send email with staking
app.post('/api/send-email', (req, res) => {
  const { content, recipient, stake = 0.001 } = req.body;
  
  const emailId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const sender = '0xe41A6Ed73DBd7CC6aB8eDC0Ed4Ea9707b13e2A4E'; // Mock sender
  
  const email = {
    id: emailId,
    content,
    sender,
    recipient: recipient || '0x742d35Cc6634C0532925a3b8D0C4C4C4C4C4C4C4',
    stake,
    status: 'pending' as const,
    timestamp: Date.now()
  };
  
  emails.push(email);
  stats.totalStaked += stake;
  stats.totalEmails++;
  
  res.json({
    success: true,
    emailId,
    message: 'Email sent with attention staking',
    stake,
    status: 'pending'
  });
});

// Evaluate email
app.post('/api/evaluate-email', (req, res) => {
  const { emailId, verdict } = req.body;
  
  const email = emails.find(e => e.id === emailId);
  if (!email) {
    return res.status(404).json({ error: 'Email not found' });
  }
  
  const isValuable = verdict === 'valuable' || Math.random() > 0.3; // 70% valuable
  
  email.status = isValuable ? 'valuable' : 'spam';
  
  if (isValuable) {
    stats.valuableCount++;
  } else {
    stats.spamCount++;
  }
  
  res.json({
    success: true,
    emailId,
    verdict: isValuable ? 'valuable' : 'spam',
    stakeAction: isValuable ? 'released' : 'slashed',
    message: isValuable 
      ? 'Content is valuable - stake released to sender' 
      : 'Content is spam - stake slashed'
  });
});

// Get dashboard stats
app.get('/api/dashboard', (req, res) => {
  const valuableRate = stats.totalEmails > 0 ? (stats.valuableCount / stats.totalEmails * 100).toFixed(1) : '0';
  const spamReduction = stats.totalEmails > 0 ? ((stats.totalEmails - stats.spamCount) / stats.totalEmails * 100).toFixed(1) : '100';
  
  res.json({
    totalStaked: stats.totalStaked.toFixed(3),
    valuableRate: `${valuableRate}%`,
    spamReduction: `${spamReduction}%`,
    activeAgents: Math.floor(Math.random() * 20 + 15),
    emailsToday: stats.totalEmails,
    recentEmails: emails.slice(-5).reverse()
  });
});

// Get all emails
app.get('/api/emails', (req, res) => {
  res.json(emails.reverse());
});

// Get specific email
app.get('/api/emails/:id', (req, res) => {
  const email = emails.find(e => e.id === req.params.id);
  if (!email) {
    return res.status(404).json({ error: 'Email not found' });
  }
  res.json(email);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'attention-protocol-api' });
});

app.listen(PORT, () => {
  console.log(`🚀 Attention Protocol API running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/api/dashboard`);
  console.log(`📧 Send email: POST http://localhost:${PORT}/api/send-email`);
  console.log(`🤖 Evaluate: POST http://localhost:${PORT}/api/evaluate-email`);
});

