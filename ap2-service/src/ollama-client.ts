import { CONFIG } from './config.js';
import { OllamaGenerateRequest, OllamaGenerateResponse, OllamaGenerateResponseSchema } from './types.js';

/**
 * OllamaClient handles communication with local Ollama instance
 */
export class OllamaClient {
  private baseUrl: string;
  private model: string;

  constructor() {
    this.baseUrl = CONFIG.OLLAMA_URL;
    this.model = CONFIG.OLLAMA_MODEL;
  }

  /**
   * Generate a response from Ollama
   */
  async generate(params: {
    prompt: string;
    temperature?: number;
  }): Promise<OllamaGenerateResponse> {
    const request: OllamaGenerateRequest = {
      model: this.model,
      prompt: params.prompt,
      stream: false,
      options: {
        temperature: params.temperature || 0.7,
        num_predict: 50,      // Very short responses (50 tokens max)
        num_ctx: 512,         // Minimal context window
        num_thread: 4,        // Use 4 CPU threads
        num_gpu: 0,           // Force CPU only
        repeat_penalty: 1.1,  // Reduce repetition
      },
      keep_alive: '10m',      // Keep model loaded longer
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      // Validate response structure
      return OllamaGenerateResponseSchema.parse(data);
    } catch (error) {
      console.error('[Ollama] Generation error:', error);
      throw new Error(
        error instanceof Error 
          ? `Ollama generation failed: ${error.message}`
          : 'Unknown Ollama error'
      );
    }
  }

  /**
   * Check if Ollama is available and model is loaded
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) return false;

      const data = await response.json() as { models?: Array<{ name: string }> };
      const models = data.models || [];
      
      // Check if our model is available
      return models.some((m) => 
        m.name === this.model || 
        m.name === `${this.model}:latest` ||
        m.name.startsWith(`${this.model}:`)
      );
    } catch (error) {
      console.error('[Ollama] Health check failed:', error);
      return false;
    }
  }

  /**
   * Get model name
   */
  getModelName(): string {
    return this.model;
  }

  /**
   * Get available models
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) return [];

      const data = await response.json() as { models?: Array<{ name: string }> };
      return (data.models || []).map((m) => m.name);
    } catch (error) {
      console.error('[Ollama] Failed to get models:', error);
      return [];
    }
  }
}
