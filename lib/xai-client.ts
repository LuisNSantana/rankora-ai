/**
 * xAI Grok-4-fast Client Configuration
 * 
 * Model: grok-4-fast-reasoning (2M context window)
 * Pricing: $0.20/1M input, $0.50/1M output, $0.05/1M cached
 * Live Search: FREE beta until June 5, 2025
 */

import { createXai } from '@ai-sdk/xai';

if (!process.env.XAI_API_KEY) {
  throw new Error('XAI_API_KEY environment variable is required');
}

export const xai = createXai({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});

/**
 * Model Configuration
 */
export const GROK_MODELS = {
  // Primary: Grok-4-fast with reasoning (2M context)
  PRIMARY: 'grok-4-fast-reasoning',
  
  // Alternative: Non-reasoning for faster responses
  FAST: 'grok-4-fast-non-reasoning',
  
  // Fallback: Original Grok-4 (256K context, premium)
  FLAGSHIP: 'grok-4-0709',
} as const;

/**
 * Context Window Limits
 */
export const CONTEXT_LIMITS = {
  GROK_4_FAST: 2_000_000, // 2M tokens - MASSIVE context window
  GPT_4O_MINI: 128_000,   // 128K tokens
  GPT_4O: 128_000,        // 128K tokens  
  GPT_4_1: 128_000,       // 128K tokens
} as const;

/**
 * Optimal token allocation for Grok-4-fast
 */
export const TOKEN_ALLOCATION = {
  // For 2M context, we can be much more generous
  MAX_INPUT_TOKENS: 1_800_000,    // 1.8M for input (documents + research)
  MAX_OUTPUT_TOKENS: 100_000,     // 100K for detailed output
  RESERVED_TOKENS: 100_000,       // 100K buffer for safety
} as const;

/**
 * Pricing per 1M tokens (USD)
 */
export const PRICING = {
  GROK_4_FAST: {
    input_small: 0.20,      // <128K context
    input_large: 0.40,      // >128K context
    output_small: 0.50,     // <128K context
    output_large: 1.00,     // >128K context
    cached: 0.05,           // Cached input tokens
  },
  GPT_4O_MINI: {
    input: 0.15,
    output: 0.60,
  },
  LIVE_SEARCH: {
    free_until: '2025-06-05', // Free in beta
    after_beta: 25.00,        // $25 per 1K sources
  },
} as const;

/**
 * Live Search Configuration
 */
export interface LiveSearchParams {
  query: string;
  sources?: ('web' | 'news' | 'x' | 'rss')[];
  time_range?: 'past_day' | 'past_week' | 'past_month' | 'past_year';
  max_results?: number; // 1-50
  from_date?: string;   // ISO8601 format
  to_date?: string;     // ISO8601 format
}

/**
 * Research Depth Tiers
 */
export enum ResearchDepth {
  BASIC = 'basic',       // Documents only, no live search
  STANDARD = 'standard', // Documents + industry benchmarks
  DEEP = 'deep',         // Documents + benchmarks + live search + competitive intel
}

/**
 * Use Cases for Insights
 */
export enum UseCase {
  MARKET_ENTRY = 'market-entry',
  LEAD_GENERATION = 'lead-gen',
  COMPETITIVE_ANALYSIS = 'competitive',
  PRODUCT_MARKET_FIT = 'product-market-fit',
  EXPANSION_STRATEGY = 'expansion',
  CUSTOMER_RESEARCH = 'customer-research',
}

/**
 * Calculate cost for a request
 */
export function calculateGrokCost(params: {
  inputTokens: number;
  outputTokens: number;
  cachedTokens?: number;
  usedLiveSearch?: boolean;
  liveSearchSources?: number;
}): number {
  const { inputTokens, outputTokens, cachedTokens = 0, usedLiveSearch = false, liveSearchSources = 0 } = params;
  
  // Determine if we're in large context (>128K)
  const totalInputTokens = inputTokens + cachedTokens;
  const isLargeContext = totalInputTokens > CONTEXT_LIMITS.GPT_4O_MINI;
  
  // Calculate input cost
  const inputRate = isLargeContext 
    ? PRICING.GROK_4_FAST.input_large 
    : PRICING.GROK_4_FAST.input_small;
  const inputCost = (inputTokens / 1_000_000) * inputRate;
  
  // Calculate cached input cost
  const cachedCost = (cachedTokens / 1_000_000) * PRICING.GROK_4_FAST.cached;
  
  // Calculate output cost
  const outputRate = isLargeContext 
    ? PRICING.GROK_4_FAST.output_large 
    : PRICING.GROK_4_FAST.output_small;
  const outputCost = (outputTokens / 1_000_000) * outputRate;
  
  // Calculate live search cost (free in beta until June 2025)
  const today = new Date();
  const betaEnd = new Date(PRICING.LIVE_SEARCH.free_until);
  const liveSearchCost = usedLiveSearch && today > betaEnd
    ? (liveSearchSources / 1000) * PRICING.LIVE_SEARCH.after_beta
    : 0;
  
  return inputCost + cachedCost + outputCost + liveSearchCost;
}

/**
 * Smart model selection based on task
 */
export function selectOptimalModel(params: {
  documentSize: number; // in tokens
  researchDepth: ResearchDepth;
  useCase: UseCase;
}): {
  model: typeof GROK_MODELS[keyof typeof GROK_MODELS] | 'gpt-4o-mini';
  reasoning: boolean;
  useLiveSearch: boolean;
} {
  const { documentSize, researchDepth, useCase } = params;
  
  // Use Grok-4-fast for deep research or large documents
  if (researchDepth === ResearchDepth.DEEP || documentSize > CONTEXT_LIMITS.GPT_4O_MINI) {
    return {
      model: GROK_MODELS.PRIMARY,
      reasoning: true,
      useLiveSearch: researchDepth === ResearchDepth.DEEP,
    };
  }
  
  // Use Grok-4-fast for competitive analysis and market entry
  if (useCase === UseCase.COMPETITIVE_ANALYSIS || useCase === UseCase.MARKET_ENTRY) {
    return {
      model: GROK_MODELS.PRIMARY,
      reasoning: true,
      useLiveSearch: researchDepth === ResearchDepth.STANDARD,
    };
  }
  
  // Use GPT-4o-mini for basic tasks
  return {
    model: 'gpt-4o-mini',
    reasoning: false,
    useLiveSearch: false,
  };
}

/**
 * Build Live Search parameters based on use case
 */
export function buildLiveSearchParams(params: {
  sector: string;
  country?: string;
  useCase: UseCase;
  customQuery?: string;
}): LiveSearchParams {
  const { sector, country, useCase, customQuery } = params;
  
  const queries: Record<UseCase, string> = {
    [UseCase.MARKET_ENTRY]: `${sector} market trends ${country || ''} competitors landscape 2025`,
    [UseCase.LEAD_GENERATION]: `${sector} buyer personas customer profiles ${country || ''} 2025`,
    [UseCase.COMPETITIVE_ANALYSIS]: `${sector} competitive analysis market leaders ${country || ''} recent news`,
    [UseCase.PRODUCT_MARKET_FIT]: `${sector} product trends customer needs pain points ${country || ''} 2025`,
    [UseCase.EXPANSION_STRATEGY]: `${sector} market growth opportunities expansion ${country || ''} 2025`,
    [UseCase.CUSTOMER_RESEARCH]: `${sector} customer behavior trends preferences ${country || ''} 2025`,
  };
  
  return {
    query: customQuery || queries[useCase],
    sources: ['web', 'news', 'x'],
    time_range: 'past_month',
    max_results: 20,
  };
}

/**
 * Usage tracking for analytics
 */
export interface ModelUsageRecord {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  cost: number;
  timestamp: number;
  insightId?: string;
  usedLiveSearch: boolean;
  liveSearchSources: number;
}

/**
 * Format usage record for storage
 */
export function createUsageRecord(params: {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cachedTokens?: number;
  insightId?: string;
  usedLiveSearch?: boolean;
  liveSearchSources?: number;
}): ModelUsageRecord {
  const cost = calculateGrokCost({
    inputTokens: params.inputTokens,
    outputTokens: params.outputTokens,
    cachedTokens: params.cachedTokens,
    usedLiveSearch: params.usedLiveSearch,
    liveSearchSources: params.liveSearchSources,
  });
  
  return {
    model: params.model,
    inputTokens: params.inputTokens,
    outputTokens: params.outputTokens,
    cachedTokens: params.cachedTokens || 0,
    cost,
    timestamp: Date.now(),
    insightId: params.insightId,
    usedLiveSearch: params.usedLiveSearch || false,
    liveSearchSources: params.liveSearchSources || 0,
  };
}
