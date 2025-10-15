import FirecrawlApp from "@mendable/firecrawl-js";
import { z } from "zod";
import {
  QualifiedLead,
  LeadIntelligenceReport,
  type QualifiedLeadType,
  type LeadIntelligenceReportType,
  type OutreachTemplateType,
  calculateLeadScore,
} from "./lead-intelligence-schema";

/**
 * Lead Intelligence Service - Phase 1 (Schema-aligned)
 */
export class LeadIntelligenceService {
  private static firecrawl: FirecrawlApp | null = null;

  private static getFirecrawl(): FirecrawlApp {
    if (!this.firecrawl) {
      const apiKey = process.env.FIRECRAWL_API_KEY;
      if (!apiKey) throw new Error("FIRECRAWL_API_KEY not configured");
      this.firecrawl = new FirecrawlApp({ apiKey });
    }
    return this.firecrawl;
  }

  static async generateLeads(
    sector: string,
    useCase: string,
    country: string = "Global",
    targetCount: number = 25
  ): Promise<LeadIntelligenceReportType> {
    console.log(`[LeadService] 🚀 Starting lead generation: ${sector} | ${country} | target: ${targetCount}`);
    const startTime = Date.now();
    const app = this.getFirecrawl();

    // 1) Discover URLs (simple heuristic using Google search page + map)
    console.log(`[LeadService] 🔍 Step 1: Discovering company URLs...`);
    const urls = await this.discoverCompanyUrls(app, sector, country, targetCount);
    console.log(`[LeadService] ✅ Step 1 complete: Found ${urls.length} URLs in ${Date.now() - startTime}ms`);

    // 2) Extract data for each URL and map to QualifiedLeadType aligned with schema
    console.log(`[LeadService] 📊 Step 2: Extracting lead data from ${urls.length} URLs...`);
    const extractStart = Date.now();
    const leads: QualifiedLeadType[] = await this.extractBatch(app, urls, sector, useCase);
    console.log(`[LeadService] ✅ Step 2 complete: Extracted ${leads.length} leads in ${Date.now() - extractStart}ms`);

    // 3) Score and sort
    console.log(`[LeadService] 🎯 Step 3: Scoring and sorting leads...`);
    const scored = leads.map((l) => ({
      ...l,
      qualification: {
        ...l.qualification,
        overall_fit_score: calculateLeadScore(l.qualification),
      },
    }));

    scored.sort((a, b) => b.qualification.overall_fit_score - a.qualification.overall_fit_score);
    console.log(`[LeadService] ✅ Step 3 complete: Scored ${scored.length} leads`);

    // 4) Build report (minimal viable implementation)
    console.log(`[LeadService] 📝 Step 4: Building final report...`);
    const report: LeadIntelligenceReportType = {
      qualified_leads: scored.slice(0, targetCount),
      market_analysis: {
        total_companies_analyzed: urls.length,
        qualification_pass_rate: `${Math.round((scored.length / Math.max(urls.length, 1)) * 100)}%`,
        average_deal_size: "€10k-50k",
        market_penetration_opportunity: "High in target niche",
      },
      outreach_toolkit: this.defaultOutreachTemplates(useCase),
      implementation_roadmap: {
        immediate_actions: [
          {
            action: "Contact top 10 leads",
            deadline: "48h",
            responsible: "Sales",
            expected_outcome: "3-5 qualified meetings",
          },
        ],
        weekly_targets: {
          outreach_volume: 30,
          expected_responses: 7,
          meetings_target: 4,
          deals_pipeline: 2,
        },
        success_metrics: [
          { metric: "Response rate", target: ">20%", measurement_method: "CRM" },
          { metric: "Meetings booked", target: "4/sem", measurement_method: "Calendar" },
        ],
      },
      data_sources: ["Firecrawl Extract API", "Company websites"],
      confidence_level: scored.length > 10 ? "medium" : "low",
      last_updated: new Date().toISOString(),
      next_update_recommended: new Date(Date.now() + 7 * 86400000).toISOString(),
    };

    const totalTime = Date.now() - startTime;
    console.log(`[LeadService] 🎉 Lead generation complete! Total time: ${totalTime}ms (${(totalTime/1000).toFixed(1)}s)`);
    return report;
  }

  private static async discoverCompanyUrls(
    app: FirecrawlApp,
    sector: string,
    country: string,
    targetCount: number
  ): Promise<string[]> {
    // OPTIMIZACIÓN: Usar fallback directory primero si disponible para España (INSTANT)
    if (country.toLowerCase().includes('españa') || country.toLowerCase().includes('spain') || country.toLowerCase().includes('es')) {
      const fallbackUrls = await this.getFallbackUrls(sector, country, targetCount);
      if (fallbackUrls.length > 0) {
        console.log(`[LeadService] ⚡ Using curated directory for ${sector} in ${country}: ${fallbackUrls.length} companies (instant - 0ms)`);
        return fallbackUrls;
      }
    }

    // Primary: Use web search to extract official homepages for companies in the sector/country
    try {
      console.log(`[LeadService] 🔍 Attempting web search for ${targetCount} ${sector} companies in ${country}...`);
      const schema = {
        type: "object",
        properties: {
          urls: { type: "array", items: { type: "string" } },
        },
        required: ["urls"],
      } as const;

      const prompt = `List ${targetCount} official company homepages for the ${sector} sector ${
        country && country !== "Global" ? "in " + country : ""
      }. Only include real company root websites (no social profiles, no directories). Return as 'urls'.`;

      const searchStart = Date.now();
      
      // TIMEOUT REDUCIDO: 20s max para web search (fallback rápido)
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Web search timeout after 20s")), 20000)
      );
      
      const extractPromise = app.extract({
        urls: [],
        schema,
        prompt,
        enableWebSearch: true,
        timeout: 18000, // 18s interno de Firecrawl
      });
      
      const res = await Promise.race([extractPromise, timeoutPromise]);
      console.log(`[LeadService] ✅ Web search completed in ${Date.now() - searchStart}ms`);

      const urls = Array.from(
        new Set(
          ((res as any)?.data?.urls || [])
            .filter((u: string) =>
              typeof u === "string" &&
              /^https?:\/\//i.test(u) &&
              !u.includes("facebook.com") &&
              !u.includes("twitter.com") &&
              !u.includes("instagram.com") &&
              !u.includes("linkedin.com/feed")
            )
            .map((u: string) => u.replace(/\/$/, ""))
        )
      ).slice(0, targetCount);

      if (urls.length > 0) {
        console.log(`[LeadService] ✅ Found ${urls.length} valid URLs via web search`);
        return urls as string[];
      }
      console.log(`[LeadService] ⚠️ Web search returned 0 URLs, trying fallback...`);
    } catch (e: any) {
      console.warn(`[LeadService] ❌ Web search failed: ${e?.message || e}, trying fallback...`);
    }

    // Fallback: Hardcoded URLs for common sectors (faster alternative)
    console.log(`[LeadService] � Using fallback: Hardcoded directory for ${sector} in ${country}`);
    
    const fallbackUrls = await this.getFallbackUrls(sector, country, targetCount);
    if (fallbackUrls.length > 0) {
      console.log(`[LeadService] ✅ Fallback provided ${fallbackUrls.length} URLs`);
      return fallbackUrls;
    }

    console.log(`[LeadService] ❌ All discovery methods failed, returning empty array`);
    return [];
  }
  
  /**
   * Fallback URL discovery using predefined directories by sector
   */
  private static async getFallbackUrls(
    sector: string,
    country: string,
    targetCount: number
  ): Promise<string[]> {
    // Directorio curado por sector para España
    const directories: Record<string, string[]> = {
      marketing: [
        "https://www.inditex.com",
        "https://www.mango.com",
        "https://www.tendam.com",
        "https://www.desigual.com",
        "https://www.tous.com",
        "https://www.grupo-planeta.es",
        "https://www.prosegur.com",
        "https://www.ferrovial.com",
        "https://www.acciona.com",
        "https://www.iberdrola.com",
      ],
      technology: [
        "https://www.indra.es",
        "https://www.amadeus.com",
        "https://www.telefonica.com",
        "https://www.redsara.es",
        "https://www.gfi.es",
      ],
      fintech: [
        "https://www.bbva.es",
        "https://www.santander.com",
        "https://www.caixabank.com",
        "https://www.bancosabadell.com",
        "https://www.bankinter.com",
      ],
      ecommerce: [
        "https://www.elcorteingles.es",
        "https://www.pccomponentes.com",
        "https://www.mediamarkt.es",
        "https://www.carrefour.es",
        "https://www.mercadona.es",
      ],
    };
    
    const sectorKey = sector.toLowerCase();
    const urls = directories[sectorKey] || directories.marketing || [];
    
    return urls.slice(0, targetCount);
  }

  private static async extractBatch(
    app: FirecrawlApp,
    urls: string[],
    sector: string,
    useCase: string
  ): Promise<QualifiedLeadType[]> {
    if (urls.length === 0) {
      console.log(`[LeadService] ⚠️ No URLs to extract from, returning empty array`);
      return [];
    }

    console.log(`[LeadService] 📊 Starting batch extraction for ${urls.length} URLs...`);
    
    // Schema for extraction aligned to what we need to populate our schema
    const extractionSchema = z.object({
      company_name: z.string().describe("Official company name"),
      website: z.string().optional(),
      industry: z.string().optional(),
      revenue_estimate: z.string().optional(),
      employee_count: z.string().optional(),
      location: z.string().optional(),
      funding_status: z.string().optional(),
      technology_stack: z.array(z.string()).optional(),
      growth_indicators: z.array(z.string()).optional(),
      decision_maker_name: z.string().optional(),
      decision_maker_title: z.string().optional(),
      decision_maker_linkedin: z.string().optional(),
      decision_maker_email: z.string().optional(),
      decision_maker_phone: z.string().optional(),
      pain_points: z.array(z.string()).optional(),
      opportunity_estimated_deal_size: z.string().optional(),
      opportunity_probability: z.enum(["high", "medium", "low"]).optional(),
      opportunity_timeline: z.string().optional(),
      competition: z.array(z.string()).optional(),
      primary_channel: z.enum(["email", "linkedin", "phone", "referral"]).optional(),
      personalization_hooks: z.array(z.string()).optional(),
      key_messaging: z.string().optional(),
      call_to_action: z.string().optional(),
      sources: z.array(z.string()).optional(),
    });

    const out: QualifiedLeadType[] = [];

    // Process sequentially in small batches to respect rate limits
    const batchSize = 4;
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      console.log(`[LeadService] 🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(urls.length/batchSize)} (${batch.length} URLs)...`);

      const batchStart = Date.now();
      const res = await app.extract({
        urls: batch,
        prompt:
          "Extract B2B prospecting data: company details, a likely decision maker, contact info if present, and concrete pain points/opportunities relevant to sales outreach.",
        schema: extractionSchema as unknown as Record<string, unknown>,
        showSources: true,
        timeout: 30000,
      });
      console.log(`[LeadService] ✅ Batch ${Math.floor(i/batchSize) + 1} completed in ${Date.now() - batchStart}ms`);

      const data = (res as any)?.data as any[] | undefined;
      if (!data) {
        console.warn(`[LeadService] ⚠️ Batch ${Math.floor(i/batchSize) + 1} returned no data`);
        continue;
      }

      for (let j = 0; j < data.length; j++) {
        const d = data[j] || {};
        const site = batch[j];

        const qualified: QualifiedLeadType = {
          company: {
            company_name: d.company_name || new URL(site).hostname.replace("www.", ""),
            website: d.website || site,
            industry: d.industry || sector,
            revenue_estimate: d.revenue_estimate || "Unknown",
            employee_count: d.employee_count || "Unknown",
            location: d.location || "Unknown",
            funding_status: d.funding_status,
            technology_stack: d.technology_stack || [],
            growth_indicators: d.growth_indicators || [],
          },
          decision_maker: {
            name: d.decision_maker_name,
            title: d.decision_maker_title || "Director",
            linkedin_url: d.decision_maker_linkedin,
            email: d.decision_maker_email,
            phone: d.decision_maker_phone,
            seniority_level: (d.decision_maker_title || "Director").toLowerCase().includes("c")
              ? "C-level"
              : (d.decision_maker_title || "Director").toLowerCase().includes("vp")
              ? "VP"
              : (d.decision_maker_title || "Director").toLowerCase().includes("director")
              ? "Director"
              : "Manager",
            department: "Operations",
          },
          qualification: {
            budget_score: d.revenue_estimate ? 8 : 5,
            authority_score: d.decision_maker_title ? 7 : 5,
            need_score: (d.pain_points?.length || 0) > 0 ? 7 : 5,
            timeline_score: 6,
            overall_fit_score: 6,
            qualification_notes: `Auto-qualified from website ${site}`,
          },
          pain_points: d.pain_points || [],
          opportunity_details: {
            estimated_deal_size: d.opportunity_estimated_deal_size || "€10k-50k",
            probability: d.opportunity_probability || "medium",
            timeline: d.opportunity_timeline || "2-3 months",
            competition: d.competition || [],
          },
          outreach_strategy: {
            primary_channel: d.primary_channel || "email",
            personalization_hooks: d.personalization_hooks?.slice(0, 3) || [],
            key_messaging: d.key_messaging || `How we help with ${useCase}`,
            call_to_action: d.call_to_action || "15-min intro call",
          },
          data_sources: ["Company website", ...(d.sources || [])],
          priority: "high",
          last_updated: new Date().toISOString(),
        };

        // update score after mapping
        qualified.qualification.overall_fit_score = calculateLeadScore(qualified.qualification);

        out.push(qualified);
      }
      console.log(`[LeadService] ✅ Processed ${data.length} leads from batch ${Math.floor(i/batchSize) + 1}, total leads: ${out.length}`);

      if (i + batchSize < urls.length) {
        console.log(`[LeadService] ⏳ Waiting 1.5s before next batch (rate limiting)...`);
        await new Promise((r) => setTimeout(r, 1500));
      }
    }

    console.log(`[LeadService] 🎯 Extraction complete: ${out.length} total leads extracted`);
    return out;
  }

  private static defaultOutreachTemplates(useCase: string): OutreachTemplateType[] {
    return [
      {
        template_type: "cold_email",
        subject_line: `${useCase} for [COMPANY_NAME] — quick idea`,
        body:
          `Hi [NAME],\n\nWe help teams like [COMPANY_NAME] achieve [OUTCOME] using [USE_CASE].\n\nBased on what I saw, a quick win could be [HYPOTHESIS].\n\nOpen to a 15-min chat this week?`,
        personalization_variables: ["NAME", "COMPANY_NAME", "USE_CASE", "OUTCOME", "HYPOTHESIS"],
        expected_response_rate: "15-25%",
        best_practices: [
          "Keep it under 100 words",
          "Make the CTA specific",
          "Use 1 tailored insight from their site",
        ],
      },
      {
        template_type: "linkedin_message",
        subject_line: `Connection — ${useCase}`,
        body:
          `Hi [NAME], me gustó lo que están haciendo en [COMPANY_NAME].\n\nTengo una idea rápida para [USE_CASE] que podría ahorrarles tiempo. ¿Conectamos?`,
        personalization_variables: ["NAME", "COMPANY_NAME", "USE_CASE"],
        expected_response_rate: "10-15%",
        best_practices: ["Sin pitch largo", "Menciona algo concreto de su sitio"],
      },
    ];
  }
}
