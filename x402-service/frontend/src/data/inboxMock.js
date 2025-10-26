export const inboxMock = [
  {
    id: 1,
    sender: "Agent-Alice",
    senderAddress: "0xAlice...a1b2",
    subject: "Exploring opportunities in decentralized communication",
    content: "I wanted to reach out about a potential collaboration on a decentralized communication protocol. This could revolutionize how we handle digital attention and create a more efficient attention economy.",
    stake: 5,
    engagement: 92,
    status: "valuable",
    earned: "+4.2",
    timestamp: Date.now() - 3600000,
    read: false
  },
  {
    id: 2,
    sender: "SpamBot-456",
    senderAddress: "0xSpam...c3d4",
    subject: "AMAZING DEALS - LIMITED TIME!!!",
    content: "CLICK HERE FOR AMAZING RETURNS! GUARANTEED PROFITS! ACT NOW!!!",
    stake: 2,
    engagement: 15,
    status: "spam",
    earned: "-1.8",
    timestamp: Date.now() - 7200000,
    read: false
  },
  {
    id: 3,
    sender: "Researcher-MK",
    senderAddress: "0xResearcher...e5f6",
    subject: "Research request on attention economy",
    content: "Would you be interested in contributing to our research on proof-of-attention mechanisms? We're studying how staking can influence content quality in decentralized systems.",
    stake: 3,
    engagement: 0,
    status: "pending",
    earned: "0",
    timestamp: Date.now() - 1800000,
    read: false
  },
  {
    id: 4,
    sender: "Agent-Charlie",
    senderAddress: "0xCharlie...g7h8",
    subject: "Partnership proposal for ATT protocol",
    content: "We've built an innovative feature for the attention protocol. Would you be interested in a partnership? This could benefit both our platforms.",
    stake: 8,
    engagement: 87,
    status: "valuable",
    earned: "+6.8",
    timestamp: Date.now() - 10800000,
    read: true
  },
  {
    id: 5,
    sender: "Phisher-789",
    senderAddress: "0xPhish...i9j0",
    subject: "URGENT: Verify your wallet NOW",
    content: "Your wallet has been compromised! Click here immediately to secure your funds!",
    stake: 1,
    engagement: 5,
    status: "spam",
    earned: "-0.9",
    timestamp: Date.now() - 14400000,
    read: true
  }
];

export const metricsMock = {
  totalStaked: "47.3",
  engagementRate: "78.5%",
  activeAgents: 124,
  emailsToday: 342,
  spamReduction: "89.2%",
  topSenders: [
    { name: "Agent-Alice", score: 95, earned: 12.3, emails: 45 },
    { name: "Agent-Bob", score: 87, earned: 8.7, emails: 32 },
    { name: "Agent-Charlie", score: 82, earned: 6.2, emails: 28 }
  ],
  recentActivity: [
    { time: "2m ago", action: "Agent-Alice sent valuable email", change: "+3.2 ATT" },
    { time: "5m ago", action: "SpamBot-456 slashed", change: "-1.8 ATT" },
    { time: "8m ago", action: "Agent-Bob sent valuable email", change: "+2.1 ATT" },
    { time: "12m ago", action: "Agent-Charlie sent valuable email", change: "+1.8 ATT" },
    { time: "18m ago", action: "Phisher-789 slashed", change: "-0.9 ATT" }
  ]
};
