// Simple Perplexity API client for business insights enrichment

/**
 * Query Perplexity AI API
 * Uses 'sonar' model for lightweight, cost-effective search with grounding
 * See: https://docs.perplexity.ai/getting-started/models
 * 
 * Available models (October 2025):
 * - sonar: Lightweight, cost-effective search model with grounding
 * - sonar-pro: Advanced search offering with complex queries support
 * - sonar-reasoning: Fast real-time reasoning with search
 * - sonar-reasoning-pro: Precise reasoning powered by DeepSeek-R1
 * - sonar-deep-research: Expert-level exhaustive research
 */
export async function queryPerplexity({ query, apiKey, signal }: { 
  query: string; 
  apiKey: string; 
  signal?: AbortSignal 
}) {
  try {
    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "sonar", // Current lightweight search model (Oct 2025)
        messages: [
          { 
            role: "system", 
            content: "You are a business analyst assistant. Provide comprehensive, detailed insights with actionable recommendations based on current market data." 
          },
          { role: "user", content: query },
        ],
        max_tokens: 2048, // Increased for more comprehensive market intelligence
        temperature: 0.7,
      }),
      signal, // Pass abort signal to fetch
    });
    
    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      console.error(`[Perplexity API Error] Status: ${res.status}, Response: ${errorText}`);
      throw new Error(`Perplexity API error: ${res.status} - ${errorText}`);
    }
    
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  } catch (error: any) {
    console.error("[Perplexity API] Request failed:", error);
    throw error;
  }
}
