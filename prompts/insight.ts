/**
 * CrispBaconAI – Insight Prompt Builders
 * Project: Rankora AI
 *
 * This module centralizes high-quality prompt builders used by the insight generation API.
 * It supports two initial productized report types:
 *  A) SEO & Content Opportunity
 *  B) Competitor & Pricing Intelligence
 *
 * Conventions:
 * - Professional English tone, concise and executive-friendly
 * - Always request JSON that conforms to BusinessInsight schema (legacy + v2 premium)
 * - Require evidence (sources/quotes) for sensitive claims
 * - Encourage visualizations with real data, not placeholders
 */

export const CRISPBACON_BRAND = "CrispBaconAI";
export const CRISPBACON_LOGO = "/crispbacon1.png"; // Use in UI while steps execute

// Small util: clamp large strings to reduce token bloat in prompts
function clamp(str: string, max = 3000): string {
  if (!str) return "";
  return str.length > max ? str.slice(0, max) + "\n…[truncated]" : str;
}

// Format a compact view of scraping items (url + short excerpt)
function formatScrapingItems(scrapingData: any[] = [], max = 8): string {
  const items = scrapingData.slice(0, max).map((s, i) => {
    const url = s?.url || s?.input?.url || s?.sources?.[0]?.url || "";
    const title = s?.title || s?.input?.title || s?.sources?.[0]?.title || "Untitled";
    const text = clamp(String(s?.answer_text || s?.output || s?.content || ""), 500);
    return `- [${i + 1}] ${title} (${url})\n  Excerpt: ${text}`;
  });
  return items.length ? items.join("\n") : "- (no structured scraping items provided)";
}

/**
 * Global system prompt for insight generation using Grok/OpenAI.
 * Establishes brand, quality bar, and output constraints.
 */
export function systemPromptForInsights(): string {
  return `
You are a senior strategy consultant (McKinsey/BCG level). Your mission: turn data into decisions.

Brand and agent: "${CRISPBACON_BRAND}". When appropriate, sign or reference the brand. For visuals, remember the logo (${CRISPBACON_LOGO}).

# Style
- Direct, quantified, no fluff. Executive language.
- Every recommendation: Action + Impact + Timeline + Owner + Risk.
- Always cite sources (specific URLs) for sensitive claims.

# Expected structures
- KPIs/Metrics with unit and benchmark where applicable.
- Prioritization by impact/effort. ROI if possible.
- Visualizations with real data (no placeholders).

# Required output
- Return valid JSON conforming to BusinessInsight (legacy) and enrich with premium v2 if enough data (roadmap, financials, competitive frameworks).
- Language: English.
`.trim();
}

/**
 * A) SEO & Content Opportunity – Prompt builder
 * Goal: identify content opportunities, gaps, quick wins, and a 30/60/90 roadmap, with evidence.
 */
export function buildSeoOpportunityPrompt(params: {
  entity?: string;
  country?: string;
  sector?: string;
  size?: string;
  researchDepth?: "basic" | "standard" | "deep";
  enableLiveSearch?: boolean;
  scrapingData?: any[];
}): string {
  const { entity, country, sector, size, researchDepth = "deep", enableLiveSearch = true, scrapingData = [] } = params || {};
  const scope = [
    entity ? `Entity: ${entity}` : null,
    country ? `Country: ${country}` : null,
    sector ? `Sector: ${sector}` : null,
    size ? `Size: ${size}` : null,
    `Depth: ${researchDepth}`,
    `Live Search: ${enableLiveSearch ? "yes" : "no"}`,
  ].filter(Boolean).join(" · ");

  return `
## CONTEXT
${scope}

We have structured scraping data and/or prior research:
${formatScrapingItems(scrapingData)}

## OBJECTIVE
Generate an SEO & content opportunity report that includes:
- Content gaps and clusters by intent (awareness → decision)
- 10–20 opportunities prioritized by impact/effort
- Key metrics (estimated search volume, relative difficulty, traffic/revenue potential)
- Actionable recommendations with steps and estimated impact
- 30/60/90-day roadmap (quick wins first)
- Visualizations (min. 6): bar/line/table for clusters, total impact, prioritization, timeline/calendar
- Cited sources (specific URLs) and relevant quotes

## CONDITIONS
- Quantify everything possible (%, #, $). Include benchmarks where helpful.
- Do not invent URLs. If evidence is missing, indicate uncertainty or use "confidence_level: low".
- Forbid placeholders in visualizations; if no data, omit that chart.

## JSON OUTPUT (BusinessInsight)
- type: "seo_content_opportunity"
- summary (executive)
- metrics[] (name, value, unit, benchmark)
- recommendations[] (title, description, priority, expected_impact, effort_required, implementation_steps[], evidence[])
- visualizations[] (bar/line/table, real data)
- sources[] (unique URLs)
- meta.summary_points, meta.confidence_level
- premium.roadmap (30/60/90 with ActionItem)
`.trim();
}

/**
 * B) Competitor & Pricing Intelligence – Prompt builder
 * Goal: competitive landscape, feature/pricing comparisons, Porter, BCG, and positioning playbook.
 */
export function buildCompetitorPricingPrompt(params: {
  entity?: string;
  country?: string;
  sector?: string;
  size?: string;
  researchDepth?: "basic" | "standard" | "deep";
  enableLiveSearch?: boolean;
  scrapingData?: any[];
}): string {
  const { entity, country, sector, size, researchDepth = "deep", enableLiveSearch = true, scrapingData = [] } = params || {};
  const scope = [
    entity ? `Entity: ${entity}` : null,
    country ? `Country: ${country}` : null,
    sector ? `Sector: ${sector}` : null,
    size ? `Size: ${size}` : null,
    `Depth: ${researchDepth}`,
    `Live Search: ${enableLiveSearch ? "yes" : "no"}`,
  ].filter(Boolean).join(" · ");

  return `
## CONTEXT
${scope}

Relevant data (competition/pricing/features):
${formatScrapingItems(scrapingData)}

## OBJECTIVE
Deliver a competitive and pricing analysis that contains:
- Profiles of 3–6 competitors (leader/challenger/niche), estimated market share (if applicable)
- Feature comparison table (parity vs differentiators) with pros/cons
- Pricing table (plans, limits, add-ons) with positioning notes
- Porter Five Forces with overall attractiveness (1–5) and evidence
- BCG matrix (stars/cash cows/question marks/dogs) for our lines vs competitors if applicable
- Positioning and pricing recommendations (counter-moves, upsell, bundling)
- Visualizations (min. 6): comparisons, differentiator radar, impact waterfall
- Cited sources and quotes

## CONDITIONS
- Prioritize accuracy: if pricing data is missing, provide an estimated range and mark as "confidence: low".
- Do not invent share metrics without trace; be explicit with assumptions.
- Avoid placeholders in charts.

## JSON OUTPUT (BusinessInsight)
- type: "competitor_pricing_intel"
- summary (executive)
- metrics[] (include competitive KPIs)
- recommendations[] (include playbook and prioritization)
- visualizations[] (comparisons and analyses)
- sources[] (unique URLs)
- meta.summary_points, meta.confidence_level
- premium: porter_five_forces, bcg_matrix (if applicable), roadmap
`.trim();
}

/**
 * Generic: build a prompt from scraping to convert into BusinessInsight (fallback minimal/standard/premium is handled by the route).
 */
export function buildInsightAnalysisPrompt(scrapingData: any[] = []): string {
  return `
## AVAILABLE DATA (scraping)
${formatScrapingItems(scrapingData, 12)}

## TASK
Synthesize the information into a business insight with:
- summary (executive with 3 quantified findings)
- metrics[] (name, value, unit, benchmark)
- recommendations[] (actionable, prioritized by impact/effort)
- visualizations[] (6–10, no placeholders)
- sources[] (unique and relevant URLs)
- meta (summary_points, confidence_level)
- optional premium: 30/60/90 roadmap, competitive frameworks, financial analysis if data exists.

## RULES
- Professional English, concise.
- Cite exact URLs for evidence. If missing, mark uncertainty.
- Valid JSON (no comments), conforming to BusinessInsight.
`.trim();
}

// Optional helper: tiny factory by type
export type InsightTypeKey = "seo_content_opportunity" | "competitor_pricing_intel";

export function buildPromptByType(type: InsightTypeKey, args: Parameters<typeof buildSeoOpportunityPrompt>[0]): string {
  if (type === "seo_content_opportunity") return buildSeoOpportunityPrompt(args);
  if (type === "competitor_pricing_intel") return buildCompetitorPricingPrompt(args);
  return buildInsightAnalysisPrompt(args.scrapingData);
}

/**
 * Document-based: build a prompt from uploaded documents to produce a BusinessInsight JSON.
 * Accepts array of { source, content, pageCount?, type?, size? }.
 */
export function buildDocInsightAnalysisPrompt(docs: Array<{ source: string; content: string; pageCount?: number; type?: string; size?: number; }> = []): string {
  const list = (docs || []).slice(0, 12).map((d, i) => {
    const meta: string[] = [];
    if (d.pageCount) meta.push(`${d.pageCount}p`);
    if (d.type) meta.push(String(d.type));
    if (d.size) meta.push(`${Math.round(d.size / 1024)}KB`);
    const excerpt = clamp(d.content || "", 800);
    return `- [${i + 1}] ${d.source}${meta.length ? ` (${meta.join(" · ")})` : ""}\n  Excerpt: ${excerpt}`;
  }).join("\n");

  return `
## AVAILABLE DOCUMENTS
${list || "- (no documents provided)"}

## TASK
Synthesize the provided documents into a decision-ready business insight with:
- summary (executive with 3 quantified findings)
- metrics[] (name, value, unit, benchmark)
- recommendations[] (actionable, prioritized by impact/effort; include steps and risks)
- visualizations[] (6–10, real data only; omit if unavailable)
- sources[] (unique URLs or document identifiers)
- meta (summary_points, confidence_level)
- optional premium: 30/60/90 roadmap, competitive frameworks, financials if data exists.

## RULES
- Professional English, concise, evidence-based.
- Cite exact sources or document references for sensitive claims.
- Return valid JSON only (no comments) conforming to BusinessInsight.
`.trim();
}
