import Firecrawl from '@mendable/firecrawl-js';

// Initialize Firecrawl client with optimized settings
const firecrawl = new Firecrawl({ 
  apiKey: process.env.FIRECRAWL_API_KEY!
});

// Timeout configuration for different operations
const TIMEOUTS = {
  SEARCH: 30000,      // 30 seconds for search operations
  EXTRACT: 45000,     // 45 seconds for structured extraction
  SCRAPE: 20000,      // 20 seconds for simple scraping
  ENHANCED: 60000     // 60 seconds for enhanced research
};

// Helper function to create timeout wrapper
const withTimeout = async <T>(
  promise: Promise<T>, 
  timeoutMs: number, 
  operation: string
): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`${operation} timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  
  return Promise.race([promise, timeoutPromise]);
};

// Types for structured data extraction
export interface CompetitorData {
  companyName: string;
  description: string;
  pricing: {
    plans: Array<{
      name: string;
      price: string;
      features: string[];
    }>;
  };
  features: string[];
  teamSize?: string;
  funding?: string;
  testimonials?: Array<{
    text: string;
    author: string;
    company?: string;
  }>;
  contactInfo?: {
    website?: string;
    email?: string;
    phone?: string;
  };
}

export interface WebsiteAnalysis {
  metadata: {
    title: string;
    description: string;
    keywords: string[];
  };
  content: {
    headings: string[];
    mainContent: string;
    ctaElements: string[];
  };
  technical: {
    loadTime?: number;
    technologies?: string[];
    seoScore?: number;
  };
  businessInfo: {
    industry: string;
    targetAudience: string;
    valueProposition: string;
    businessModel?: string;
  };
}

export interface MarketResearchData {
  industryOverview: {
    marketSize: string;
    growthRate: string;
    keyTrends: string[];
  };
  competitors: CompetitorData[];
  customerInsights: {
    demographics: string;
    painPoints: string[];
    preferences: string[];
  };
  opportunities: string[];
  threats: string[];
}

// Firecrawl service utilities
export class FirecrawlService {
  /**
   * Extract structured competitor data from URLs
   */
  static async extractCompetitorData(urls: string[]): Promise<CompetitorData[]> {
    try {
      // Limit URLs for performance (Hobby plan efficiency)
      const limitedUrls = urls.slice(0, 3);
      
      const schema = {
        type: "object",
        properties: {
          competitors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                companyName: { type: "string" },
                description: { type: "string" },
                pricing: {
                  type: "object",
                  properties: {
                    plans: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          price: { type: "string" },
                          features: {
                            type: "array",
                            items: { type: "string" }
                          }
                        },
                        required: ["name", "price", "features"]
                      }
                    }
                  },
                  required: ["plans"]
                },
                features: {
                  type: "array",
                  items: { type: "string" }
                },
                teamSize: { type: "string" },
                funding: { type: "string" },
                testimonials: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      text: { type: "string" },
                      author: { type: "string" },
                      company: { type: "string" }
                    },
                    required: ["text", "author"]
                  }
                },
                contactInfo: {
                  type: "object",
                  properties: {
                    website: { type: "string" },
                    email: { type: "string" },
                    phone: { type: "string" }
                  }
                }
              },
              required: ["companyName", "description", "pricing", "features"]
            }
          }
        },
        required: ["competitors"]
      };

      const extractPromise = firecrawl.extract({
        urls: limitedUrls,
        schema,
        prompt: "Extract comprehensive competitor information including company details, pricing plans, features, team information, funding status, customer testimonials, and contact details. Focus on business intelligence data that would be valuable for competitive analysis."
      });

      const result = await withTimeout(extractPromise, TIMEOUTS.EXTRACT, 'Competitor extraction');
      const extractedData = result.data as any;
      return extractedData?.competitors || [];
    } catch (error) {
      console.error('Firecrawl competitor extraction error:', error);
      return [];
    }
  }

  /**
   * Analyze website for comprehensive business intelligence
   */
  static async analyzeWebsite(url: string): Promise<WebsiteAnalysis | null> {
    try {
      const schema = {
        type: "object",
        properties: {
          metadata: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              keywords: {
                type: "array",
                items: { type: "string" }
              }
            },
            required: ["title", "description", "keywords"]
          },
          content: {
            type: "object",
            properties: {
              headings: {
                type: "array",
                items: { type: "string" }
              },
              mainContent: { type: "string" },
              ctaElements: {
                type: "array",
                items: { type: "string" }
              }
            },
            required: ["headings", "mainContent", "ctaElements"]
          },
          technical: {
            type: "object",
            properties: {
              technologies: {
                type: "array",
                items: { type: "string" }
              },
              seoScore: { type: "number" }
            }
          },
          businessInfo: {
            type: "object",
            properties: {
              industry: { type: "string" },
              targetAudience: { type: "string" },
              valueProposition: { type: "string" },
              businessModel: { type: "string" }
            },
            required: ["industry", "targetAudience", "valueProposition"]
          }
        },
        required: ["metadata", "content", "businessInfo"]
      };

      const result = await firecrawl.extract({
        urls: [url],
        schema,
        prompt: "Analyze this website comprehensively for business intelligence. Extract metadata, content structure, technical details, and business information including industry, target audience, value proposition, and business model."
      });

      return result.data as WebsiteAnalysis;
    } catch (error) {
      console.error('Firecrawl website analysis error:', error);
      return null;
    }
  }

  /**
   * Conduct market research using web search and extraction
   */
  static async conductMarketResearch(
    industry: string, 
    competitorUrls: string[] = []
  ): Promise<MarketResearchData | null> {
    try {
      // Use enableWebSearch for broader market research
      const schema = {
        type: "object",
        properties: {
          industryOverview: {
            type: "object",
            properties: {
              marketSize: { type: "string" },
              growthRate: { type: "string" },
              keyTrends: {
                type: "array",
                items: { type: "string" }
              }
            },
            required: ["marketSize", "growthRate", "keyTrends"]
          },
          competitors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                companyName: { type: "string" },
                description: { type: "string" },
                pricing: {
                  type: "object",
                  properties: {
                    plans: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          price: { type: "string" },
                          features: {
                            type: "array",
                            items: { type: "string" }
                          }
                        }
                      }
                    }
                  }
                },
                features: {
                  type: "array",
                  items: { type: "string" }
                }
              },
              required: ["companyName", "description"]
            }
          },
          customerInsights: {
            type: "object",
            properties: {
              demographics: { type: "string" },
              painPoints: {
                type: "array",
                items: { type: "string" }
              },
              preferences: {
                type: "array",
                items: { type: "string" }
              }
            },
            required: ["demographics", "painPoints", "preferences"]
          },
          opportunities: {
            type: "array",
            items: { type: "string" }
          },
          threats: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["industryOverview", "competitors", "customerInsights", "opportunities", "threats"]
      };

      const result = await firecrawl.extract({
        urls: competitorUrls.length > 0 ? competitorUrls : [],
        schema,
        prompt: `Conduct comprehensive market research for the ${industry} industry. Extract market size, growth rate, key trends, competitor analysis, customer insights including demographics and pain points, market opportunities, and potential threats. Use web search to gather current market data.`,
        enableWebSearch: true
      });

      return result.data as MarketResearchData;
    } catch (error) {
      console.error('Firecrawl market research error:', error);
      return null;
    }
  }

  /**
   * Extract specific data using natural language prompts
   */
  static async extractWithPrompt(
    urls: string[], 
    prompt: string, 
    enableWebSearch: boolean = false
  ): Promise<any> {
    try {
      const result = await firecrawl.extract({
        urls,
        prompt,
        enableWebSearch
      });

      return result.data;
    } catch (error) {
      console.error('Firecrawl prompt extraction error:', error);
      return null;
    }
  }

  /**
   * Scrape single URL and convert to clean markdown
   */
  static async scrapeToMarkdown(url: string): Promise<string | null> {
    try {
      const result = await firecrawl.scrape(url, {
        formats: ['markdown']
      });

      return result.markdown || null;
    } catch (error) {
      console.error('Firecrawl scraping error:', error);
      return null;
    }
  }

  /**
   * Map website structure to find all relevant URLs
   */
  static async mapWebsite(baseUrl: string, limit: number = 50): Promise<string[]> {
    try {
      const result = await firecrawl.map(baseUrl, { limit });
      return result.links?.map((link: any) => link.url || link) || [];
    } catch (error) {
      console.error('Firecrawl mapping error:', error);
      return [];
    }
  }

  /**
   * Search web and extract structured data (OPTIMIZED)
   */
  static async searchAndExtract(
    query: string, 
    schema?: any, 
    prompt?: string
  ): Promise<any> {
    try {
      const searchPromise = firecrawl.search(query, {
        limit: 3, // Reduced from 10 for faster results
        ...(schema && { schema }),
        ...(prompt && { prompt })
      });

      const result = await withTimeout(searchPromise, TIMEOUTS.SEARCH, 'Search and extract');
      return (result as any).data || result;
    } catch (error) {
      console.error('Firecrawl search error:', error);
      return null;
    }
  }

  /**
   * Enhanced research flow combining Perplexity, Firecrawl, and Grok (OPTIMIZED)
   */
  static async enhancedResearch(
    query: string,
    enableWebSearch: boolean = true
  ): Promise<{
    structuredData: any;
    markdownContent: string[];
    urls: string[];
  }> {
    try {
      // Step 1: Use search to find relevant URLs (OPTIMIZED: reduced limit)
      const searchPromise = firecrawl.search(query, { limit: 3 });
      const searchResults = await withTimeout(searchPromise, TIMEOUTS.SEARCH, 'Enhanced research search');
      
      const searchData = searchResults as any;
      const urls = searchData?.results?.map((item: any) => item.url) || 
                   searchData?.data?.map((item: any) => item.url) || [];

      // Step 2: Extract structured data with web search enabled (OPTIMIZED: limit URLs)
      const limitedUrls = urls.slice(0, 2);
      const structuredPromise = this.extractWithPrompt(
        limitedUrls,
        `Extract comprehensive business intelligence data related to: ${query}. Focus on market insights, competitor information, pricing, features, and strategic insights.`,
        enableWebSearch
      );

      // Step 3: Get clean markdown content for token-efficient processing (OPTIMIZED: only 1 URL)
      const markdownPromise = limitedUrls[0] ? this.scrapeToMarkdown(limitedUrls[0]) : Promise.resolve(null);

      // Execute in parallel for better performance
      const [structuredData, markdownResult] = await Promise.allSettled([
        withTimeout(structuredPromise, TIMEOUTS.EXTRACT, 'Structured data extraction'),
        withTimeout(markdownPromise, TIMEOUTS.SCRAPE, 'Markdown extraction')
      ]);

      return {
        structuredData: structuredData.status === 'fulfilled' ? structuredData.value : null,
        markdownContent: markdownResult?.status === 'fulfilled' && markdownResult.value 
          ? [markdownResult.value] 
          : [],
        urls: limitedUrls
      };
    } catch (error) {
      console.error('Enhanced research error:', error);
      return {
        structuredData: null,
        markdownContent: [],
        urls: []
      };
    }
  }
}

// Utility functions for data validation and processing
export const validateFirecrawlData = (data: any): boolean => {
  return data && typeof data === 'object' && Object.keys(data).length > 0;
};

export const sanitizeUrls = (urls: string[]): string[] => {
  return urls.filter(url => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  });
};

export const estimateTokens = (content: string): number => {
  // Rough estimation: 1 token ≈ 4 characters
  return Math.ceil(content.length / 4);
};

export default FirecrawlService;