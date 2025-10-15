
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { generateObject } from "ai";
import { xai, GROK_MODELS, createUsageRecord } from "@/lib/xai-client";
import { openai } from "@ai-sdk/openai";
import { BusinessInsightSchema } from "@/lib/insights-schema";
import { systemPromptForInsights } from "@/prompts/insight";
import type { Id } from "@/convex/_generated/dataModel";
import {
  detectIndustry,
  getIndustryBenchmarks,
  getIndustryTrends,
  getRegulatoryContext,
  benchmarkMetrics,
} from "@/lib/industry-intelligence";
import {
  conductMarketResearch,
  analyzeCompetitors,
  researchCustomerProfiles,
  discoverOpportunities,
  synthesizeLiveResearch,
} from "@/lib/grok-live-search";
import { queryPerplexity } from "@/lib/perplexity";
import { FirecrawlService } from "@/lib/firecrawl";
import { BusinessIntelligenceService } from "@/lib/business-intelligence";
import { LeadIntelligenceService } from "@/lib/lead-intelligence-service";
import type { LeadIntelligenceReportType } from "@/lib/lead-intelligence-schema";
import { 
  competitorAnalysisSchema, 
  marketAnalysisSchema, 
  websiteAuditSchema,
  industryResearchSchema,
  pricingAnalysisSchema 
} from "@/lib/firecrawl-schemas";

export const runtime = "nodejs";
// Increase maxDuration to allow fallbacks without premature termination
export const maxDuration = 300;

interface InsightRequest {
  type: string;
  prompt: string;
  sector?: string;
  country?: string;
  size?: string;
  useCase?: string;
  researchDepth?: "basic" | "standard" | "deep";
  enableLiveSearch?: boolean;
  provider?: "xai" | "perplexity"; // Which engine to use exclusively
}

/**
 * Generate business insights using enhanced flow:
 * 1. Perplexity for initial research and market intelligence
 * 2. Grok-4-fast with Live Search for comprehensive report generation
 * This combines the best of both platforms for robust insights
 */
async function generateInsightWithCombinedFlow(params: InsightRequest, jobId: string): Promise<any> {
  const { prompt, sector, country, size, useCase = "market-entry", researchDepth = "deep", enableLiveSearch = true } = params;
  
  const startTime = Date.now();
  
  // 1. Detect or use provided sector
  const detectedSector = sector || detectIndustry(prompt) || "General";
  console.log(`[Insight Job ${jobId}] Starting Combined Flow - Sector: ${detectedSector}`);

  // STEP 1: Perplexity Initial Research (if available)
  let perplexityEnrichment: any = null;
  let perplexityUsed = false;
  
  if (process.env.PERPLEXITY_API_KEY && researchDepth !== "basic") {
    try {
      console.log(`[Insight Job ${jobId}] STEP 1: Conducting Perplexity research...`);
      
      const queries = [
        `Market intelligence for: ${prompt}. Sector: ${detectedSector}. Country: ${country || "Global"}. Focus on market size, trends, and key players.`,
        `Competitive analysis for: ${prompt} in ${detectedSector} sector. Include companies and opportunities.`
      ];

      const results: string[] = [];
      for (const [i, q] of queries.entries()) {
        try {
          const abortController = new AbortController();
          const timeoutId = setTimeout(() => abortController.abort(), 35000); // Increased to 35s
          
          const r = await queryPerplexity({ 
            query: q, 
            apiKey: process.env.PERPLEXITY_API_KEY!,
            signal: abortController.signal 
          });
          
          clearTimeout(timeoutId);
          results.push(r || "");
        } catch (e: any) {
          console.warn(`[Insight Job ${jobId}] Perplexity Q${i+1} failed/timed out:`, e?.message || e);
          results.push("");
        }
      }
      
      const [marketIntelligence, competitiveAnalysis] = results;
      perplexityEnrichment = {
        marketIntelligence,
        competitiveAnalysis, 
        sources: "Perplexity AI with real-time web search"
      };      perplexityUsed = true;
      console.log(`[Insight Job ${jobId}] ✓ STEP 1 Complete: Perplexity research gathered`);
    } catch (err: any) {
      console.warn(`[Insight Job ${jobId}] Perplexity research failed:`, err?.message || err);
      // Continue without Perplexity enrichment
    }
  }

  // STEP 2: Firecrawl Enhanced Data Extraction (OPTIMIZED)
  let firecrawlData: any = null;
  let firecrawlUsed = false;
  
  if (researchDepth !== "basic") {
    try {
      console.log(`[Insight Job ${jobId}] STEP 2: Firecrawl Business Intelligence extraction...`);
      
      // OPTIMIZED: Single focused service call with 30s timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Firecrawl timeout")), 30000)
      );
      
      const intelligencePromise = BusinessIntelligenceService.customIntelligenceGathering(
        prompt,
        detectedSector,
        `Use case: ${useCase}, Target: ${size}, Country: ${country}`,
        true // Prioritize speed
      );
      
      firecrawlData = await Promise.race([intelligencePromise, timeoutPromise]);
      
      if (firecrawlData) {
        firecrawlUsed = true;
        console.log(`[Insight Job ${jobId}] ✓ STEP 2 Complete: Business Intelligence data extracted`);
      }
    } catch (err: any) {
      console.warn(`[Insight Job ${jobId}] Business Intelligence extraction failed:`, err?.message || err);
      // Continue without Business Intelligence data
    }
  }

  // STEP 2.5: Lead Intelligence (Phase 1) - Real company leads (non-blocking)
  let leadGenReport: LeadIntelligenceReportType | null = null;
  let leadGenUsed = false;
  if ((useCase || "").toLowerCase() === "lead-gen") {
    try {
      console.log(`[Insight Job ${jobId}] STEP 2.5: Generating Lead Intelligence (Phase 1)...`);

      const timeoutPromise = new Promise<LeadIntelligenceReportType>((_, reject) =>
        setTimeout(() => reject(new Error("Lead generation timeout")), 60000)
      );

      const leadPromise = LeadIntelligenceService.generateLeads(
        detectedSector,
        useCase,
        country || "Global",
        18
      );

      leadGenReport = await Promise.race([leadPromise, timeoutPromise]).catch(() => null);
      if (leadGenReport && leadGenReport.qualified_leads.length > 0) {
        leadGenUsed = true;
        console.log(`[Insight Job ${jobId}] ✓ STEP 2.5 Complete: ${leadGenReport.qualified_leads.length} leads generated`);
      }
    } catch (e: any) {
      console.warn(`[Insight Job ${jobId}] Lead Intelligence failed (non-critical):`, e?.message || e);
    }
  }

  // STEP 3: Grok Live Search (OPTIONAL - Non-blocking)
  let liveResearchData: any = null;
  let liveSearchUsed = false;
  
  if (enableLiveSearch && researchDepth !== "basic") {
    try {
      console.log(`[Insight Job ${jobId}] STEP 3: Conducting Grok Live Search for ${useCase}...`);
      
      // SIMPLIFIED: Only do market research to avoid multiple API calls
      const researchPromise = conductMarketResearch({ 
        sector: detectedSector, 
        country: country || "Global" 
      });
      
      // Add 20 second timeout for live search
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Live search timeout")), 35000) // Increased to 35s
      );
      
      const researchResult = await Promise.race([researchPromise, timeoutPromise]) as any;
      
      liveResearchData = {
        sector: detectedSector,
        useCase,
        research: [researchResult?.synthesis || "Market research completed"],
        synthesis: researchResult?.synthesis || "Market research completed", 
        totalSources: researchResult?.totalSources || 1,
      };
      
      liveSearchUsed = true;
      console.log(`[Insight Job ${jobId}] ✓ STEP 3 Complete: Live search completed (${liveResearchData.totalSources} sources)`);
    } catch (liveErr: any) {
      console.warn(`[Insight Job ${jobId}] Live search failed (non-critical):`, liveErr?.message || liveErr);
      // Continue without live research - this is NOT a critical failure
    }
  }

  // STEP 3: Build Enhanced Prompt with all research data
  console.log(`[Insight Job ${jobId}] STEP 3: Building enhanced prompt with research data...`);
  
  let enhancedPrompt = `
Business Insight Request:
- Type: ${params.type}
- Use Case: ${useCase}
- Prompt: ${prompt}
- Sector: ${detectedSector}
- Country: ${country || "Global"}
- Company Size: ${size || "All sizes"}
- Research Depth: ${researchDepth}

Instructions:
Generate a comprehensive business insight report focusing on ${useCase} for the ${detectedSector} sector.
Provide specific, actionable recommendations based on current market conditions.
`;

  // Add Perplexity research data if available
  if (perplexityEnrichment) {
    enhancedPrompt += `

PERPLEXITY MARKET INTELLIGENCE:
Market Intelligence: ${(perplexityEnrichment.marketIntelligence || "").substring(0, 2000)}

Competitive Analysis: ${(perplexityEnrichment.competitiveAnalysis || "").substring(0, 2000)}

Source: ${perplexityEnrichment.sources || "Perplexity AI"}
`;
  }

  // Add Grok Live Search data if available
  if (liveResearchData) {
    // Truncate research findings to prevent excessive prompt size
    const truncatedResearch = liveResearchData.research
      .map((r: string) => r.substring(0, 1500)) // Limit each research block to 1500 chars
      .slice(0, 3); // Keep only first 3 research blocks
    
    // Safely extract structured synthesis lists when available
    const syn: any = liveResearchData?.synthesis;
    const keyFindings = Array.isArray(syn?.keyFindings) ? syn.keyFindings.slice(0, 5).join(', ') : 'N/A';
    const opportunities = Array.isArray(syn?.opportunities) ? syn.opportunities.slice(0, 5).join(', ') : 'N/A';
    const risks = Array.isArray(syn?.risks) ? syn.risks.slice(0, 3).join(', ') : 'N/A';
    const trends = Array.isArray(syn?.trends) ? syn.trends.slice(0, 5).join(', ') : 'N/A';
    const recommendations = Array.isArray(syn?.recommendations) ? syn.recommendations.slice(0, 5).join(', ') : 'N/A';

    enhancedPrompt += `

GROK LIVE SEARCH DATA (Real-time from web, news, and X):
Sector: ${liveResearchData.sector}
Use Case: ${liveResearchData.useCase}
Total Sources: ${liveResearchData.totalSources}

Research Findings (Top 3 summaries):
${truncatedResearch.join('\n\n---\n\n')}

Key Insights Summary:
- Key Findings: ${keyFindings}
- Market Opportunities: ${opportunities}
- Potential Risks: ${risks}
- Current Trends: ${trends}
- Recommended Actions: ${recommendations}
`;
  }

  // Add Firecrawl structured data if available
  if (firecrawlData && firecrawlData.length > 0) {
    enhancedPrompt += `

## 🔍 FIRECRAWL BUSINESS INTELLIGENCE (91-98% Accuracy)

**Data Sources:** ${firecrawlData.length} verified business extractions
**Focus Area:** ${useCase} analysis for ${detectedSector} sector

### Structured Competitive Data:
\`\`\`json
${JSON.stringify(firecrawlData, null, 2).substring(0, 2500)}
\`\`\`

**CRITICAL:** Use this high-precision data to:
- Extract EXACT pricing models, features, and competitive positioning
- Identify specific market opportunities with verified company data
- Reference real testimonials, case studies, and success metrics
- Analyze actual technology stacks, integrations, and capabilities
- Compare verified business models, funding, and growth metrics

### Enhanced Analysis Requirements:
- **Competitive Benchmarking:** Use exact pricing, features, and positioning data
- **Market Gaps:** Identify opportunities based on real competitor limitations
- **Strategic Insights:** Leverage verified business metrics and customer feedback
- **Trend Analysis:** Connect structured data patterns to market implications
- **Actionable Intelligence:** Generate recommendations backed by precise data points
`;
  }

  // Add Lead Intelligence quick summary to guide model formatting (keep it light)
  if (leadGenReport && leadGenReport.qualified_leads?.length > 0) {
    const topLeads = leadGenReport.qualified_leads.slice(0, 10).map((l: any) => {
      const name = l?.company?.company_name || "Unknown";
      const dm = l?.decision_maker || {};
      const dmName = dm.name ? ` — ${dm.name}` : "";
      const dmTitle = dm.title ? ` (${dm.title})` : "";
      const email = dm.email ? ` <${dm.email}>` : "";
      return `- ${name}${dmName}${dmTitle}${email}`;
    });

    enhancedPrompt += `

## 🎯 Actionable Lead Intelligence (Phase 1)
- Total Qualified Leads: ${leadGenReport.qualified_leads.length}
- Data Source: Firecrawl Extract API (web intelligence)

Top 10 Leads Preview:
${topLeads.join("\n")}

Instructions:
- Include a short "Actionable Leads" section summarizing segments and outreach angles.
- Do NOT invent contacts; use only summarized insights. Full list is attached separately in meta.
`;
  }

  enhancedPrompt += `

## 📋 CONTENT GENERATION REQUIREMENTS

### Executive Summary Enhancement:
- **Use Rich Markdown:** Headers (##, ###), bullet points, **bold**, *emphasis*, tables, and code blocks
- **Visual Structure:** Organize content with clear sections, subsections, and visual hierarchies
- **Data-Driven Insights:** Reference specific metrics, percentages, and quantified findings
- **Professional Formatting:** Use numbered lists, tables, and structured presentations

### Firecrawl Data Integration:
- **Priority 1:** Incorporate exact pricing, features, and competitive data from Firecrawl extractions
- **Priority 2:** Reference verified business metrics, funding rounds, and company information
- **Priority 3:** Use real customer testimonials, case studies, and success stories
- **Priority 4:** Analyze actual technology implementations and integration capabilities

### Dynamic Content Sections:
1. **📊 Market Intelligence Dashboard** - Quantified market data with specific metrics
2. **🏢 Competitive Landscape Analysis** - Real competitor data with exact positioning
3. **💰 Pricing Strategy Insights** - Verified pricing models and optimization opportunities
4. **🚀 Growth Opportunities Matrix** - Data-backed expansion and revenue opportunities
5. **🎯 Customer Acquisition Playbook** - Strategies based on real success patterns
6. **⚡ Quick Wins Implementation** - Immediate actions with estimated impact
7. **📈 ROI Projection Framework** - Financial analysis with benchmark comparisons

### Visualization Requirements:
- Generate 8-12 detailed visualizations using Firecrawl data points
- Include comparison tables with exact competitor features and pricing
- Create trend charts with real market evolution data
- Design strategic frameworks with verified industry benchmarks

**Final Output:** Professional consulting-grade report with rich Markdown formatting, 
specific data citations, and actionable intelligence backed by verified Firecrawl extractions.

---

**Focus Areas for ${useCase} in ${detectedSector}:**
- Leverage structured competitor intelligence for strategic positioning
- Use verified pricing data for market optimization recommendations  
- Reference real customer success patterns for growth strategies
- Incorporate actual technology capabilities for implementation planning
`;

  // Log prompt size for debugging
  const promptSizeKB = (enhancedPrompt.length / 1024).toFixed(2);
  console.log(`[Insight Job ${jobId}] Enhanced prompt size: ${promptSizeKB}KB`);
  
  // STEP 4: Generate Final Report - REPLICATE WORKING DOCUMENT FLOW
  console.log(`[Insight Job ${jobId}] STEP 4: Generating with proven document flow...`);
  
  // Use EXACT same model progression as documents (this works!)
  const modelCandidates = [
    { provider: "xai", model: GROK_MODELS.PRIMARY, label: "grok-4-fast-reasoning" }, // Primary - 2M context
    { provider: "openai", model: "gpt-4o-mini", label: "gpt-4o-mini" },              // Fallback 1 - cost optimized
    { provider: "openai", model: "gpt-4o", label: "gpt-4o" },                        // Fallback 2 - higher quality
  ];

  // Use progressive schemas with ENHANCED capacity; prioritize richer output for lead-gen
  const minimalSchema = { 
    label: "minimal", 
    schema: BusinessInsightSchema.pick({ 
      type: true, 
      summary: true, 
      metrics: true, 
      recommendations: true, 
      sources: true, 
      generated_at: true 
    }) as any, 
    maxTokens: 75000
  } as const;
  const standardSchema = { 
    label: "standard", 
    schema: BusinessInsightSchema.pick({
      type: true,
      summary: true,
      summary_points: true,
      metrics: true,
      recommendations: true,
      visualizations: true,
      sources: true,
      generated_at: true,
      meta: true
    }) as any,
    maxTokens: 125000
  } as const;
  const premiumSchema = { 
    label: "premium", 
    schema: BusinessInsightSchema as any, 
    maxTokens: 200000
  } as const;

  const progressiveSchemas: Array<{ label: string; schema: any; maxTokens: number }> = [
    minimalSchema, 
    standardSchema, 
    premiumSchema
  ];

  console.log(
    `[Insight Job ${jobId}] Schema order: ${progressiveSchemas
      .map((p) => p.label)
      .join(" -> ")}; useCase=${useCase}`
  );

  let insight: any = null;
  let lastErr: any = null;
  let usageRecord: any = null;

  // Try by model first (e.g., grok-4-fast) across phases, then fall back to other models
  for (const candidate of modelCandidates) {
    console.log(`[Insight Job ${jobId}] Trying model: ${candidate.label}`);
    for (const phase of progressiveSchemas) {
      try {
        console.log(`[Insight Job ${jobId}] Phase ${phase.label} with ${candidate.label}`);

        const result = await generateObject({
          model: candidate.provider === "xai" ? xai(candidate.model) : openai(candidate.model),
          system: systemPromptForInsights(),
          prompt: enhancedPrompt,
          schema: phase.schema,
          maxOutputTokens: phase.maxTokens,
        });

        insight = result.object;

        const usage = (result as any).usage || { promptTokens: 0, completionTokens: 0 };
        if (candidate.provider === "xai") {
          usageRecord = createUsageRecord({
            model: candidate.label,
            inputTokens: usage.promptTokens || 0,
            outputTokens: usage.completionTokens || 0,
            insightId: jobId,
            usedLiveSearch: liveSearchUsed,
            liveSearchSources: liveResearchData?.totalSources || 0,
          });
        }

        insight.meta = {
          ...(insight.meta || {}),
          generation: {
            model: candidate.label,
            provider: candidate.provider,
            phase: phase.label,
            usage: usage,
            cost: usageRecord?.cost,
            elapsedMs: Date.now() - startTime,
            generatedAt: new Date().toISOString(),
            liveSearchUsed: liveSearchUsed,
            liveSearchSources: liveResearchData?.totalSources || 0,
            perplexityUsed: perplexityUsed,
            useCase,
            researchDepth,
          },
          liveResearch: liveResearchData,
          perplexityEnrichment: perplexityEnrichment,
          leadIntelligence: leadGenReport || undefined,
        };

        console.log(
          `[Insight Job ${jobId}] ✅ SUCCESS with ${candidate.label} phase ${phase.label} (cost: $${usageRecord?.cost?.toFixed(4) || 'N/A'})`
        );
        break;
      } catch (phaseErr: any) {
        const rsn = phaseErr?.reason || phaseErr?.message || String(phaseErr);
        console.warn(`[Insight Job ${jobId}] Phase ${phase.label} failed on ${candidate.label}: ${rsn}`);
        lastErr = phaseErr;
      }
    }

    if (insight) {
      console.log(`[Insight Job ${jobId}] ✓ Success with ${candidate.label}`);
      break;
    } else {
      console.warn(`[Insight Job ${jobId}] Exhausted phases for ${candidate.label}`);
    }
  }
  
  if (!insight) {
    const errorMsg = `All models failed. Last error: ${lastErr?.reason || lastErr?.message || String(lastErr)}`;
    console.error(`[Insight Job ${jobId}] ❌ COMPLETE FAILURE: ${errorMsg}`);
    throw new Error(errorMsg);
  }
  
  return insight;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    
    // Map old "type" to new "useCase" for backward compatibility
    const typeToUseCaseMap: Record<string, string> = {
      "clients": "lead-gen",
      "sales": "market-entry",
      "marketing": "competitive",
      "product": "product-market-fit",
    };
    
    const params: InsightRequest = {
      type: body.type || "general",
      prompt: body.prompt || "",
      sector: body.sector,
      country: body.country,
      size: body.size,
      useCase: body.useCase || typeToUseCaseMap[body.type] || "market-entry",
      researchDepth: body.researchDepth || "deep",
      enableLiveSearch: body.enableLiveSearch !== false, // Default to true
    };

    if (!params.prompt.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    console.log(`[Insight Request] Type: ${params.type}, Use Case: ${params.useCase}, Research: ${params.researchDepth}`);

    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    // Create insight job
    const jobId: Id<"insightReports"> = await convex.mutation(api.insightReports.createInsightReport, {
      userId,
      originalPrompt: params.prompt,
      analysisPrompt: `Business insight request: ${params.prompt} (${params.useCase})`,
      status: "pending",
      results: [],
      insightReport: undefined,
      error: undefined,
      createdAt: Date.now(),
      completedAt: undefined,
      archived: false,
    });

    try {
      // Update status to analyzing
      await convex.mutation(api.insightReports.patchInsightReport, { 
        id: jobId, 
        patch: { status: "analyzing" } 
      });

      console.log(`[Insight Job ${jobId}] Starting generation with Grok-4-fast...`);

      // Generate insight with combined flow (Perplexity + Grok-4-fast)
      const insight = await generateInsightWithCombinedFlow(params, jobId);
      
      // Validate result
      const parsed = BusinessInsightSchema.safeParse(insight);
      if (!parsed.success) {
        console.error(`[Insight Job ${jobId}] Validation failed:`, parsed.error.issues);
        await convex.mutation(api.insightReports.patchInsightReport, { 
          id: jobId, 
          patch: { 
            status: "failed", 
            error: "Invalid insight structure", 
            completedAt: Date.now() 
          } 
        });
        return NextResponse.json({ 
          error: "Invalid insight structure", 
          details: parsed.error.issues 
        }, { status: 400 });
      }

      console.log(`[Insight Job ${jobId}] ✓ Generation successful, saving to database...`);

      // Save completed insight
      await convex.mutation(api.insightReports.patchInsightReport, {
        id: jobId,
        patch: {
          status: "completed",
          insightReport: parsed.data,
          completedAt: Date.now(),
          error: undefined,
        },
      });

      const result = { 
        ...parsed.data, 
        _id: jobId, 
        meta: { 
          ...(parsed.data.meta || {}), 
          title: parsed.data.title || params.prompt 
        } 
      };
      
      console.log(`[Insight Job ${jobId}] ✓ Complete - returning result`);
      return NextResponse.json(result);
    } catch (err: any) {
      console.error(`[Insight Job ${jobId}] Generation failed:`, err);
      
      try {
        await convex.mutation(api.insightReports.patchInsightReport, { 
          id: jobId, 
          patch: { 
            status: "failed", 
            error: err.message || String(err), 
            completedAt: Date.now() 
          } 
        });
      } catch (e) {
        console.warn("Failed to mark insight as failed:", e);
      }
      
      return NextResponse.json({ 
        error: "Insight generation failed", 
        details: err.message || String(err) 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Insight generation error:", error);
    return NextResponse.json({ 
      error: "Server error", 
      details: error.message || String(error) 
    }, { status: 500 });
  }
}
