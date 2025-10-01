export interface IntentMandate {
  mandateId: string;
  createdAt: number;
  expiresAt: number;
  userAddress: string;
  merchantAddress: string;
  dailyCapMicroUsdc: number;
  pricePerMessageMicroUsdc: number;
  batchThreshold: number;
  serviceType: 'ai-inference';
  modelName: string;
}

export interface InferenceResponse {
  eventId: string;
  response: string;
  priceMicroUsdc: number;
  dailyUsageMicroUsdc: number;
  dailyCapMicroUsdc: number;
  messagesUntilSettlement: number;
  settlementTriggered: boolean;
  batchId?: string;
  transactionHash?: string;
  explorerUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  eventId?: string;
  priceMicroUsdc?: number;
  settlementInfo?: {
    batchId: string;
    transactionHash: string;
    explorerUrl: string;
  };
}

export interface UsageStats {
  dailyUsage: number;
  dailyCap: number;
  messagesUntilSettlement: number;
  totalMessages: number;
}
