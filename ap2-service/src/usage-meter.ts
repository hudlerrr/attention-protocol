import { randomBytes } from 'crypto';
import { UsageEvent, BatchInvoice, UsageEventSchema, BatchInvoiceSchema } from './types.js';
import { CONFIG } from './config.js';

/**
 * UsageMeter tracks AI inference usage, enforces caps, and manages batch invoices
 */
export class UsageMeter {
  private events: Map<string, UsageEvent> = new Map();
  private batches: Map<string, BatchInvoice> = new Map();
  private userEvents: Map<string, string[]> = new Map(); // userAddress -> eventIds
  private mandateEvents: Map<string, string[]> = new Map(); // mandateId -> eventIds

  /**
   * Record a new usage event
   */
  recordUsage(params: {
    mandateId: string;
    userAddress: string;
    prompt: string;
    response: string;
    modelName: string;
    tokensUsed?: number;
    priceMicroUsdc: number;
  }): UsageEvent {
    const eventId = this.generateEventId();
    const timestamp = Math.floor(Date.now() / 1000);

    const event: UsageEvent = {
      eventId,
      mandateId: params.mandateId,
      userAddress: params.userAddress.toLowerCase(),
      timestamp,
      prompt: params.prompt,
      response: params.response,
      modelName: params.modelName,
      tokensUsed: params.tokensUsed,
      priceMicroUsdc: params.priceMicroUsdc,
      batchId: null,
      settled: false,
    };

    // Validate event structure
    UsageEventSchema.parse(event);

    // Store event
    this.events.set(eventId, event);

    // Index by user
    const userEventIds = this.userEvents.get(params.userAddress.toLowerCase()) || [];
    userEventIds.push(eventId);
    this.userEvents.set(params.userAddress.toLowerCase(), userEventIds);

    // Index by mandate
    const mandateEventIds = this.mandateEvents.get(params.mandateId) || [];
    mandateEventIds.push(eventId);
    this.mandateEvents.set(params.mandateId, mandateEventIds);

    return event;
  }

  /**
   * Get daily usage for a user (in micro-USDC)
   */
  getDailyUsage(userAddress: string): number {
    const now = Math.floor(Date.now() / 1000);
    const dayStart = now - (now % 86400); // Start of current day

    const eventIds = this.userEvents.get(userAddress.toLowerCase()) || [];
    
    return eventIds
      .map(id => this.events.get(id))
      .filter((e): e is UsageEvent => e !== undefined && e.timestamp >= dayStart)
      .reduce((sum, e) => sum + e.priceMicroUsdc, 0);
  }

  /**
   * Check if user has exceeded daily cap
   */
  hasExceededDailyCap(userAddress: string, dailyCapMicroUsdc: number): boolean {
    const dailyUsage = this.getDailyUsage(userAddress);
    return dailyUsage >= dailyCapMicroUsdc;
  }

  /**
   * Get unsettled events for a mandate
   */
  getUnsettledEvents(mandateId: string): UsageEvent[] {
    const eventIds = this.mandateEvents.get(mandateId) || [];
    
    return eventIds
      .map(id => this.events.get(id))
      .filter((e): e is UsageEvent => e !== undefined && !e.settled);
  }

  /**
   * Check if batch threshold is reached for a mandate
   */
  shouldTriggerBatch(mandateId: string, batchThreshold: number): boolean {
    const unsettled = this.getUnsettledEvents(mandateId);
    return unsettled.length >= batchThreshold;
  }

  /**
   * Create a batch invoice from unsettled events
   */
  createBatchInvoice(params: {
    mandateId: string;
    userAddress: string;
    merchantAddress: string;
  }): BatchInvoice | null {
    const unsettledEvents = this.getUnsettledEvents(params.mandateId);
    
    if (unsettledEvents.length === 0) {
      return null;
    }

    const batchId = this.generateBatchId();
    const now = Math.floor(Date.now() / 1000);

    const eventIds = unsettledEvents.map(e => e.eventId);
    const totalMicroUsdc = unsettledEvents.reduce((sum, e) => sum + e.priceMicroUsdc, 0);

    const batch: BatchInvoice = {
      batchId,
      mandateId: params.mandateId,
      userAddress: params.userAddress.toLowerCase(),
      merchantAddress: params.merchantAddress.toLowerCase(),
      eventIds,
      eventCount: eventIds.length,
      totalMicroUsdc,
      createdAt: now,
      settledAt: null,
      status: 'pending',
      transactionHash: null,
      blockNumber: null,
      errorMessage: null,
    };

    // Validate batch structure
    BatchInvoiceSchema.parse(batch);

    // Store batch
    this.batches.set(batchId, batch);

    // Mark events as assigned to batch
    for (const event of unsettledEvents) {
      event.batchId = batchId;
      this.events.set(event.eventId, event);
    }

    return batch;
  }

  /**
   * Update batch status after settlement attempt
   */
  updateBatchStatus(params: {
    batchId: string;
    status: 'settling' | 'settled' | 'failed';
    transactionHash?: string;
    blockNumber?: number;
    errorMessage?: string;
  }): void {
    const batch = this.batches.get(params.batchId);
    if (!batch) {
      throw new Error(`Batch not found: ${params.batchId}`);
    }

    batch.status = params.status;
    batch.transactionHash = params.transactionHash || null;
    batch.blockNumber = params.blockNumber || null;
    batch.errorMessage = params.errorMessage || null;

    if (params.status === 'settled') {
      batch.settledAt = Math.floor(Date.now() / 1000);
      
      // Mark all events in batch as settled
      for (const eventId of batch.eventIds) {
        const event = this.events.get(eventId);
        if (event) {
          event.settled = true;
          this.events.set(eventId, event);
        }
      }
    }

    this.batches.set(params.batchId, batch);
  }

  /**
   * Get a batch by ID
   */
  getBatch(batchId: string): BatchInvoice | undefined {
    return this.batches.get(batchId);
  }

  /**
   * Get all batches for a user
   */
  getUserBatches(userAddress: string): BatchInvoice[] {
    return Array.from(this.batches.values())
      .filter(b => b.userAddress.toLowerCase() === userAddress.toLowerCase());
  }

  /**
   * Get all batches for a mandate
   */
  getMandateBatches(mandateId: string): BatchInvoice[] {
    return Array.from(this.batches.values())
      .filter(b => b.mandateId === mandateId);
  }

  /**
   * Get count of unsettled messages for a mandate
   */
  getUnsettledCount(mandateId: string): number {
    return this.getUnsettledEvents(mandateId).length;
  }

  /**
   * Get messages until next settlement
   */
  getMessagesUntilSettlement(mandateId: string, batchThreshold: number): number {
    const unsettledCount = this.getUnsettledCount(mandateId);
    return Math.max(0, batchThreshold - unsettledCount);
  }

  /**
   * Generate a unique event ID
   */
  private generateEventId(): string {
    return `event_${randomBytes(16).toString('hex')}`;
  }

  /**
   * Generate a unique batch ID
   */
  private generateBatchId(): string {
    return `batch_${randomBytes(16).toString('hex')}`;
  }

  /**
   * Get all events (for admin/debugging)
   */
  getAllEvents(): UsageEvent[] {
    return Array.from(this.events.values());
  }

  /**
   * Get all batches (for admin/debugging)
   */
  getAllBatches(): BatchInvoice[] {
    return Array.from(this.batches.values());
  }
}
