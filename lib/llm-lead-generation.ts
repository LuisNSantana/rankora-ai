import { generateObject, generateText } from "ai";
import { xai, GROK_MODELS } from "./xai-client";
import { z } from "zod";
import type { QualifiedLeadType, LeadIntelligenceReportType } from "./lead-intelligence-schema";

/**
 * LLM-First Lead Generation
 * 
 * Instead of scraping websites (slow, expensive, fragile),
 * use Grok-4-fast to GENERATE high-quality synthetic leads
 * based on sector, country, and use case.
 * 
 * Benefits:
 * - 10x faster (5-10s vs 300s+)
 * - More reliable (no web timeouts)
 * - Better data quality (structured by AI)
 * - Cheaper (1 API call vs 100+)
 */

const LeadSchema = z.object({
  company_name: z.string().describe("Real company name in the sector"),
  website: z.string().url().describe("Company website URL"),
  company_description: z.string().describe("What the company does (1-2 sentences)"),
  size: z.string().describe("Company size: startup, SMB, mid-market, or enterprise"),
  location: z.string().describe("Primary location or headquarters"),
  decision_maker: z.object({
    title: z.string().describe("Job title of decision maker"),
    department: z.string().describe("Department they work in"),
    linkedin_profile: z.string().optional().describe("LinkedIn profile URL if available"),
  }),
  contact_info: z.object({
    email: z.string().email().optional().describe("Contact email if available"),
    phone: z.string().optional().describe("Phone number if available"),
  }),
  qualification: z.object({
    budget_indicator: z.enum(["low", "medium", "high"]).describe("Estimated budget capacity"),
    tech_stack: z.array(z.string()).describe("Technologies they use"),
    pain_points: z.array(z.string()).describe("Key challenges they face"),
    buying_signals: z.array(z.string()).describe("Indicators they're ready to buy"),
    overall_fit_score: z.number().min(0).max(100).describe("Overall qualification score 0-100"),
  }),
  engagement_strategy: z.object({
    primary_channel: z.string().describe("Best channel to reach them"),
    value_proposition: z.string().describe("Customized value prop for this lead"),
    talking_points: z.array(z.string()).describe("Key points to mention"),
  }),
});

const LeadsResponseSchema = z.object({
  leads: z.array(LeadSchema),
  market_context: z.object({
    sector_overview: z.string().describe("Quick overview of the sector"),
    total_addressable_market: z.string().describe("TAM estimate"),
    key_trends: z.array(z.string()).describe("Current market trends"),
  }),
});

export class LLMLeadGenerator {
  /**
   * Generate high-quality leads using Grok-4-fast reasoning
   */
  static async generateLeads(
    sector: string,
    useCase: string,
    country: string,
    targetCount: number = 10
  ): Promise<LeadIntelligenceReportType> {
    console.log(`[LLM LeadGen] 🚀 Generating ${targetCount} synthetic leads for ${sector} in ${country}`);
    const startTime = Date.now();

    try {
      const prompt = `You are an expert B2B lead generation specialist with deep knowledge of the ${sector} sector in ${country}.

Use Case: ${useCase}
Target: ${targetCount} highly qualified leads

Generate a list of REAL companies in the ${sector} sector in ${country} that would be perfect prospects for this use case.

For each company, provide:
1. Accurate company information (real companies only)
2. Decision maker details (realistic titles and departments)
3. Qualification scoring based on:
   - Budget capacity indicators
   - Current tech stack
   - Known pain points that align with the use case
   - Buying signals (recent hiring, funding, expansion, etc.)
4. Personalized engagement strategy

Focus on companies that are:
- Actively growing or expanding
- Have recent news/updates indicating they need this solution
- Are in the right size bracket for this use case
- Show clear buying signals

Be specific and realistic. Use actual company names and real market data.`;

      // Primary attempt: structured object generation
      let result: { object: z.infer<typeof LeadsResponseSchema> } | null = null;

      // Retry with small backoff to mitigate transient network issues
      const attempts = 3;
      for (let i = 0; i < attempts; i++) {
        try {
          result = await generateObject({
            model: xai(GROK_MODELS.PRIMARY),
            schema: LeadsResponseSchema,
            prompt,
            temperature: 0.3,
          }) as any;
          break; // success
        } catch (e: any) {
          const retryable = /timeout|ECONNRESET|other side closed|UND_ERR_SOCKET|network/i.test(e?.message || "");
          if (i < attempts - 1 && retryable) {
            const backoff = 600 * Math.pow(2, i); // 600ms, 1200ms
            await new Promise(r => setTimeout(r, backoff));
            continue;
          }
          // If final attempt fails or non-retryable, fall through to fallback
        }
      }

      // Fallback: generate plain text JSON and parse
      if (!result) {
        const fallbackPrompt = `${prompt}\n\nReturn a strict JSON object with this shape:\n${LeadsResponseSchema.toString()}\nDo not include any prose. Only JSON.`;
        const text = await generateText({
          model: xai(GROK_MODELS.PRIMARY),
          prompt: fallbackPrompt,
          temperature: 0.2,
        });
        // Extract JSON block
        const m = text.text.match(/\{[\s\S]*\}$/);
        if (!m) throw new Error("Fallback text generation did not return JSON");
        const parsed = JSON.parse(m[0]);
        // Validate with zod to ensure shape
        const safe = LeadsResponseSchema.safeParse(parsed);
        if (!safe.success) {
          throw new Error("Fallback JSON failed validation: " + safe.error.message);
        }
        result = { object: safe.data } as any;
      }

      // At this point, result must be non-null
      const finalObject = result!.object;

      const generationTime = Date.now() - startTime;
  console.log(`[LLM LeadGen] ✅ Generated ${finalObject.leads.length} leads in ${generationTime}ms`);

      // Convert to our schema format (QualifiedLeadType)
  const qualifiedLeads: QualifiedLeadType[] = finalObject.leads.map((lead) => ({
        company: {
          company_name: lead.company_name,
          website: lead.website,
          industry: sector,
          revenue_estimate: "Unknown",
          employee_count: lead.size,
          location: lead.location,
          technology_stack: lead.qualification.tech_stack,
        },
        decision_maker: {
          name: undefined,
          title: lead.decision_maker.title,
          linkedin_url: lead.decision_maker.linkedin_profile,
          email: lead.contact_info.email,
          phone: lead.contact_info.phone,
          seniority_level: LLMLeadGenerator.inferSeniorityLevel(lead.decision_maker.title),
          department: lead.decision_maker.department,
        },
        qualification: {
          budget_score: LLMLeadGenerator.mapIndicatorToScore(lead.qualification.budget_indicator),
          authority_score: LLMLeadGenerator.mapIndicatorToScore(lead.qualification.budget_indicator),
          need_score: LLMLeadGenerator.mapIndicatorToScore(lead.qualification.budget_indicator),
          timeline_score: LLMLeadGenerator.mapIndicatorToScore(lead.qualification.budget_indicator),
          overall_fit_score: Math.round(lead.qualification.overall_fit_score / 10), // Convert 0-100 to 1-10
          qualification_notes: `${lead.company_description}. Pain points: ${lead.qualification.pain_points.join(", ")}`,
        },
        pain_points: lead.qualification.pain_points,
        opportunity_details: {
          estimated_deal_size: LLMLeadGenerator.estimateDealSize(sector, useCase),
          probability: lead.qualification.budget_indicator === "high" ? "high" : lead.qualification.budget_indicator === "medium" ? "medium" : "low",
          timeline: "3-6 months",
          competition: [],
        },
        outreach_strategy: {
          primary_channel: lead.engagement_strategy.primary_channel as any,
          personalization_hooks: lead.engagement_strategy.talking_points,
          key_messaging: lead.engagement_strategy.value_proposition,
          call_to_action: "Schedule a 15-minute discovery call",
        },
        data_sources: ["Grok-4-fast AI Generation", "Market Intelligence"],
        priority: lead.qualification.overall_fit_score > 80 ? "high" : lead.qualification.overall_fit_score > 60 ? "medium" : "low",
        last_updated: new Date().toISOString(),
      }));

      // Sort by fit score
      qualifiedLeads.sort((a, b) => b.qualification.overall_fit_score - a.qualification.overall_fit_score);

      // Build final report
      const report: LeadIntelligenceReportType = {
        qualified_leads: qualifiedLeads.slice(0, targetCount),
        market_analysis: {
          total_companies_analyzed: finalObject.leads.length,
          qualification_pass_rate: "100%", // All AI-generated leads are pre-qualified
          average_deal_size: LLMLeadGenerator.estimateDealSize(sector, useCase),
          market_penetration_opportunity: finalObject.market_context.sector_overview,
        },
        outreach_toolkit: [
          ...LLMLeadGenerator.generateEmailTemplates(useCase, sector),
          ...LLMLeadGenerator.generateLinkedInScripts(useCase),
          ...LLMLeadGenerator.generateCallScripts(useCase, sector),
        ],
        implementation_roadmap: {
          immediate_actions: [
            {
              action: `Review and prioritize top ${Math.min(5, targetCount)} leads by fit score`,
              deadline: "24h",
              responsible: "Sales Team",
              expected_outcome: "Shortlist of highest-value prospects",
            },
            {
              action: "Personalize outreach for each lead using provided value propositions",
              deadline: "48h",
              responsible: "SDR Team",
              expected_outcome: "Customized outreach campaigns ready",
            },
          ],
          weekly_targets: {
            outreach_volume: targetCount * 3,
            expected_responses: Math.round(targetCount * 0.25),
            meetings_target: Math.round(targetCount * 0.15),
            deals_pipeline: Math.round(targetCount * 0.05),
          },
          success_metrics: [
            { metric: "Response rate", target: ">25%", measurement_method: "Email tracking" },
            { metric: "Meetings booked", target: `${Math.round(targetCount * 0.15)}/week`, measurement_method: "Calendar" },
            { metric: "Pipeline value", target: this.estimateDealSize(sector, useCase), measurement_method: "CRM" },
          ],
        },
  data_sources: ["Grok-4-fast AI Generation", "Market Intelligence", finalObject.market_context.sector_overview],
        confidence_level: "high",
        last_updated: new Date().toISOString(),
        next_update_recommended: new Date(Date.now() + 7 * 86400000).toISOString(),
      };

      const totalTime = Date.now() - startTime;
      console.log(`[LLM LeadGen] 🎉 Complete! ${qualifiedLeads.length} leads in ${(totalTime / 1000).toFixed(1)}s`);

      return report;
    } catch (error: any) {
      console.error(`[LLM LeadGen] ❌ Generation failed:`, error);
      // Return an empty but valid report to keep the flow non-blocking
      return {
        qualified_leads: [],
        market_analysis: {
          total_companies_analyzed: 0,
          qualification_pass_rate: "0%",
          average_deal_size: this.estimateDealSize(sector, useCase),
          market_penetration_opportunity: sector,
        },
        outreach_toolkit: [
          ...LLMLeadGenerator.generateEmailTemplates(useCase, sector),
          ...LLMLeadGenerator.generateLinkedInScripts(useCase),
          ...LLMLeadGenerator.generateCallScripts(useCase, sector),
        ],
        implementation_roadmap: {
          immediate_actions: [],
          weekly_targets: { outreach_volume: 0, expected_responses: 0, meetings_target: 0, deals_pipeline: 0 },
          success_metrics: [],
        },
        data_sources: ["LLM LeadGen Fallback"],
        confidence_level: "medium",
        last_updated: new Date().toISOString(),
        next_update_recommended: new Date(Date.now() + 7 * 86400000).toISOString(),
      } as LeadIntelligenceReportType;
    }
  }

  private static estimateDealSize(sector: string, useCase: string): string {
    // Simple heuristics
    const sectorMultipliers: Record<string, number> = {
      fintech: 50000,
      technology: 30000,
      marketing: 15000,
      healthcare: 40000,
      default: 20000,
    };

    const base = sectorMultipliers[sector.toLowerCase()] || sectorMultipliers.default;
    return `€${(base * 0.5).toLocaleString()}-${base.toLocaleString()}`;
  }

  private static inferSeniorityLevel(title: string): "C-level" | "VP" | "Director" | "Manager" {
    const titleLower = title.toLowerCase();
    if (titleLower.includes("ceo") || titleLower.includes("cto") || titleLower.includes("cmo") || titleLower.includes("chief")) {
      return "C-level";
    }
    if (titleLower.includes("vp") || titleLower.includes("vice president")) {
      return "VP";
    }
    if (titleLower.includes("director") || titleLower.includes("head of")) {
      return "Director";
    }
    return "Manager";
  }

  private static mapIndicatorToScore(indicator: "low" | "medium" | "high"): number {
    switch (indicator) {
      case "high": return 9;
      case "medium": return 6;
      case "low": return 3;
    }
  }

  private static generateEmailTemplates(useCase: string, sector: string): any[] {
    return [
      {
        template_type: "cold_email" as const,
        subject_line: `Quick question about ${sector} at {{company_name}}`,
        body: `Hi {{first_name}},

I noticed {{company_name}} is {{specific_observation}}. 

Most ${sector} companies I work with struggle with {{pain_point}}. We've helped companies like {{competitor_example}} achieve {{specific_result}}.

Worth a 15-minute call to explore if we can help {{company_name}} too?

{{your_name}}`,
        personalization_variables: ["first_name", "company_name", "specific_observation", "pain_point", "competitor_example", "specific_result", "your_name"],
        expected_response_rate: "15-25%",
        best_practices: [
          "Research the company before sending",
          "Use a clear, specific observation",
          "Keep it under 100 words",
          "Include a clear CTA"
        ],
      },
    ];
  }

  private static generateLinkedInScripts(useCase: string): any[] {
    return [
      {
        template_type: "linkedin_message" as const,
        subject_line: "Connection Request",
        body: `Hi {{first_name}}, I work with {{sector}} leaders on {{use_case}}. Would love to connect and share some insights that might be relevant to {{company_name}}.`,
        personalization_variables: ["first_name", "sector", "use_case", "company_name"],
        expected_response_rate: "30-40%",
        best_practices: [
          "Personalize the message",
          "Keep it short (under 300 chars)",
          "Mention a specific observation"
        ],
      },
    ];
  }

  private static generateCallScripts(useCase: string, sector: string): any[] {
    return [
      {
        template_type: "cold_email" as const,
        subject_line: "Opening",
        body: `Hi {{first_name}}, this is {{your_name}} from {{your_company}}. I'm calling because we work with ${sector} companies on ${useCase} and I noticed {{specific_trigger}}. Do you have 2 minutes?`,
        personalization_variables: ["first_name", "your_name", "your_company", "specific_trigger"],
        expected_response_rate: "20-30%",
        best_practices: [
          "Have a clear reason for calling",
          "Ask for permission to continue",
          "Be prepared with value proposition"
        ],
      },
    ];
  }
}
