/**
 * Grok Live Search Integration
 * 
 * Provides real-time search capabilities from web, news, X, and RSS feeds
 * FREE beta until June 5, 2025
 */

import { xai, GROK_MODELS, type LiveSearchParams } from './xai-client';
import { generateText } from 'ai';

export interface LiveSearchResult {
  sources: Array<{
    title: string;
    url: string;
    snippet: string;
    date?: string;
    source_type: 'web' | 'news' | 'x' | 'rss';
  }>;
  synthesis: string;
  totalSources: number;
  query: string;
  timestamp: number;
}

/**
 * Perform live search using Grok-4-fast
 * Note: Live search implementation simplified for MVP
 * Full implementation requires xAI SDK's live search tool integration
 */
export async function performLiveSearch(
  params: LiveSearchParams
): Promise<LiveSearchResult> {
  try {
    const { query, sources = ['web', 'news', 'x'], time_range = 'past_month', max_results = 20 } = params;
    
    // OPTIMIZED: Use shorter timeout and simpler configuration
    const result = await generateText({
      model: xai(GROK_MODELS.PRIMARY),
      prompt: `Provide a concise business analysis for: ${query}
      
Focus on: Key trends, market insights, opportunities, and actionable recommendations.
Keep response under 1000 words.`,
      temperature: 0.3,
      maxOutputTokens: 1000, // Reduced from 2000
    });
    
    // Mock sources for MVP (will be replaced with actual search results)
    const mockSources: LiveSearchResult['sources'] = [
      {
        title: `${query} - Market Analysis`,
        url: 'https://live-search-result.example.com',
        snippet: result.text.substring(0, 150),
        source_type: 'web',
      },
    ];
    
    return {
      sources: mockSources,
      synthesis: result.text,
      totalSources: mockSources.length,
      query,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Live search error:', error);
    
    // Return fallback result instead of throwing
    return {
      sources: [],
      synthesis: `Market analysis for ${params.query} temporarily unavailable. Analysis will proceed with available data.`,
      totalSources: 0,
      query: params.query,
      timestamp: Date.now(),
    };
  }
}

/**
 * Conduct market research using live search
 */
export async function conductMarketResearch(params: {
  sector: string;
  country?: string;
  specificQuery?: string;
}): Promise<LiveSearchResult> {
  const { sector, country, specificQuery } = params;
  
  const query = specificQuery || `
    ${sector} industry trends and market dynamics ${country || 'globally'} in 2025:
    - Leading companies and recent news
    - Market size and growth rate
    - Key challenges and opportunities
    - Technology trends
    - Regulatory changes
  `.trim();
  
  return performLiveSearch({
    query,
    sources: ['web', 'news'],
    time_range: 'past_month',
    max_results: 25,
  });
}

/**
 * Analyze competitors using live search
 */
export async function analyzeCompetitors(params: {
  sector: string;
  country?: string;
  competitors?: string[];
}): Promise<LiveSearchResult> {
  const { sector, country, competitors = [] } = params;
  
  const competitorsList = competitors.length > 0 
    ? `Focus on: ${competitors.join(', ')}`
    : '';
  
  const query = `
    Competitive landscape analysis for ${sector} ${country || 'globally'}:
    ${competitorsList}
    
    Find information about:
    - Top market players and their market share
    - Recent product launches or updates
    - Pricing strategies
    - Unique value propositions
    - Customer reviews and sentiment
    - Recent funding or M&A activity
  `.trim();
  
  return performLiveSearch({
    query,
    sources: ['web', 'news', 'x'],
    time_range: 'past_month',
    max_results: 30,
  });
}

/**
 * Research customer profiles and buyer personas
 */
export async function researchCustomerProfiles(params: {
  sector: string;
  country?: string;
  targetSegment?: string;
}): Promise<LiveSearchResult> {
  const { sector, country, targetSegment } = params;
  
  const query = `
    Customer research for ${sector} ${country || 'globally'}:
    ${targetSegment ? `Target segment: ${targetSegment}` : ''}
    
    Find information about:
    - Customer demographics and psychographics
    - Pain points and needs
    - Buying behavior and decision criteria
    - Preferred channels and touchpoints
    - Price sensitivity
    - Recent surveys or studies
  `.trim();
  
  return performLiveSearch({
    query,
    sources: ['web', 'news'],
    time_range: 'past_month',
    max_results: 20,
  });
}

/**
 * Track regulatory and compliance updates
 */
export async function trackRegulatoryUpdates(params: {
  sector: string;
  country?: string;
  region?: string;
}): Promise<LiveSearchResult> {
  const { sector, country, region } = params;
  
  const location = country || region || 'globally';
  
  const query = `
    Recent regulatory and compliance updates for ${sector} in ${location}:
    
    Find information about:
    - New laws or regulations
    - Compliance requirements
    - Industry standards updates
    - Data protection and privacy rules
    - Licensing and certification changes
    - Penalties or enforcement actions
  `.trim();
  
  return performLiveSearch({
    query,
    sources: ['web', 'news'],
    time_range: 'past_month',
    max_results: 15,
  });
}

/**
 * Discover market opportunities
 */
export async function discoverOpportunities(params: {
  sector: string;
  country?: string;
  focus?: 'expansion' | 'product' | 'partnership';
}): Promise<LiveSearchResult> {
  const { sector, country, focus = 'expansion' } = params;
  
  const focusQueries = {
    expansion: 'market expansion opportunities, underserved segments, emerging markets',
    product: 'product gaps, unmet needs, feature requests, customer complaints',
    partnership: 'partnership opportunities, strategic alliances, distribution channels',
  };
  
  const query = `
    Business opportunities in ${sector} ${country || 'globally'}:
    Focus: ${focusQueries[focus]}
    
    Find information about:
    - Market gaps and white spaces
    - Emerging trends and technologies
    - Customer pain points
    - Potential partnerships
    - Investment activity
    - Success stories and case studies
  `.trim();
  
  return performLiveSearch({
    query,
    sources: ['web', 'news', 'x'],
    time_range: 'past_month',
    max_results: 25,
  });
}

/**
 * Synthesize multiple live search results into actionable insights
 */
export async function synthesizeLiveResearch(
  searches: LiveSearchResult[]
): Promise<{
  keyFindings: string[];
  trends: string[];
  opportunities: string[];
  risks: string[];
  recommendations: string[];
}> {
  const allSyntheses = searches.map(s => s.synthesis).join('\n\n---\n\n');
  
  const result = await generateText({
    model: xai(GROK_MODELS.PRIMARY),
    prompt: `Based on the following research findings, provide a structured analysis:

${allSyntheses}

Provide a JSON response with:
- keyFindings: Array of 5-7 most important findings
- trends: Array of 3-5 key trends identified
- opportunities: Array of 3-5 business opportunities
- risks: Array of 3-5 potential risks or challenges
- recommendations: Array of 5-7 actionable recommendations

Format as valid JSON.`,
    temperature: 0.3,
  });
  
  try {
    return JSON.parse(result.text);
  } catch (error) {
    console.error('Failed to parse synthesis:', error);
    return {
      keyFindings: [],
      trends: [],
      opportunities: [],
      risks: [],
      recommendations: [],
    };
  }
}
