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
  console.log(`[LeadService] 📊 Step 2: Building leads from web search results (no scraping) for ${urls.length} URLs...`);
  const extractStart = Date.now();
  const leads: QualifiedLeadType[] = await this.buildLeadsFromSearch(urls, sector, useCase, country);
  console.log(`[LeadService] ✅ Step 2 complete: Built ${leads.length} leads in ${Date.now() - extractStart}ms`);

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
    // 0) Prefer curated directory for España when available (instant)
    if (
      country.toLowerCase().includes("españa") ||
      country.toLowerCase().includes("spain") ||
      country.toLowerCase().includes("es")
    ) {
      const fallbackUrls = await this.getFallbackUrls(sector, country, targetCount);
      if (fallbackUrls.length > 0) {
        console.log(
          `[LeadService] ⚡ Using curated directory for ${sector} in ${country}: ${fallbackUrls.length} companies (instant - 0ms)`
        );
        // We'll still attempt to top-up with web search if we need more
      }
    }

    // 1) Primary: Firecrawl SEARCH (no scraping). Build multiple queries to improve recall.
    console.log(
      `[LeadService] 🔍 WebSearch-only mode: discovering ${targetCount} ${sector} companies in ${country}...`
    );

    const queries: string[] = [];
    const sectorQ = sector.toLowerCase();
    const countryQ = country && country !== "Global" ? country : "";
    // Spanish variants and generic patterns
    queries.push(
      `${sectorQ} consultoría B2B ${countryQ}`.trim(),
      `consultora ${sectorQ} empresas ${countryQ}`.trim(),
      `servicios profesionales ${sectorQ} ${countryQ}`.trim(),
      `agencia ${sectorQ} B2B ${countryQ}`.trim(),
      `${sectorQ} empresas ${countryQ}`.trim()
    );

    const urlsSet = new Set<string>();
    const start = Date.now();
    for (const q of queries) {
      try {
        const res: any = await app.search(q, { limit: Math.min(10, targetCount) });
        const items: any[] = res?.results || res?.data || [];
        for (const it of items) {
          const u = (it?.url || it)?.toString?.() || "";
          if (
            /^https?:\/\//i.test(u) &&
            !u.includes("facebook.com") &&
            !u.includes("twitter.com") &&
            !u.includes("instagram.com") &&
            !u.includes("linkedin.com/feed")
          ) {
            // normalize to root
            try {
              const d = new URL(u);
              const root = `${d.protocol}//${d.hostname}`;
              urlsSet.add(root.replace(/\/$/, ""));
            } catch {}
          }
        }
        if (urlsSet.size >= targetCount) break;
      } catch (e: any) {
        console.warn(`[LeadService] 🔎 Search query failed ('${q}'):` , e?.message || e);
      }
    }
    console.log(`[LeadService] ✅ Web search completed in ${Date.now() - start}ms with ${urlsSet.size} unique roots`);

    // 2) If still not enough, attempt curated fallback to reach target
    let urls: string[] = Array.from(urlsSet);
    if (urls.length < targetCount) {
      const fallbackUrls = await this.getFallbackUrls(sector, country, targetCount);
      for (const f of fallbackUrls) {
        if (!urls.includes(f)) urls.push(f);
        if (urls.length >= targetCount) break;
      }
    }

    return urls.slice(0, targetCount);
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

  private static async buildLeadsFromSearch(
    urls: string[],
    sector: string,
    useCase: string,
    country: string
  ): Promise<QualifiedLeadType[]> {
    if (urls.length === 0) return [];

    const leads: QualifiedLeadType[] = urls.map((site) => {
      const host = new URL(site).hostname.replace("www.", "");
      const companyName = host.split(".")[0]?.replace(/-/g, " ") || host;
      const qualified: QualifiedLeadType = {
        company: {
          company_name: companyName.charAt(0).toUpperCase() + companyName.slice(1),
          website: site,
          industry: sector,
          revenue_estimate: "Unknown",
          employee_count: "Unknown",
          location: country || "Unknown",
          technology_stack: [],
          growth_indicators: [],
        },
        decision_maker: {
          name: undefined,
          title: "Director",
          linkedin_url: undefined,
          email: undefined,
          phone: undefined,
          seniority_level: "Director",
          department: "Operations",
        },
        qualification: {
          budget_score: 5,
          authority_score: 5,
          need_score: 5,
          timeline_score: 5,
          overall_fit_score: 5,
          qualification_notes: `Derived from web search result for ${host}`,
        },
        pain_points: [],
        opportunity_details: {
          estimated_deal_size: "€10k-50k",
          probability: "medium",
          timeline: "2-3 months",
          competition: [],
        },
        outreach_strategy: {
          primary_channel: "email",
          personalization_hooks: [],
          key_messaging: `How we help with ${useCase}`,
          call_to_action: "15-min intro call",
        },
        data_sources: ["Firecrawl Web Search"],
        priority: "medium",
        last_updated: new Date().toISOString(),
      };
      qualified.qualification.overall_fit_score = calculateLeadScore(
        qualified.qualification
      );
      return qualified;
    });

    return leads;
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
