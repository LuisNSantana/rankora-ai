// ═══════════════════════════════════════════════════════════════
// RANKORA AI - BUSINESS INSIGHTS SCHEMA V2.0
// Professional-grade schema following McKinsey/BCG standards
// ═══════════════════════════════════════════════════════════════

import { z } from "zod";

// ─────────────────────────────────────────────────────────────
// BASE TYPES & COMMON STRUCTURES
// ─────────────────────────────────────────────────────────────

export const EvidenceSource = z.object({
  source: z.string().describe("URL or document name"),
  quote: z.string().optional().describe("Direct quote supporting the finding"),
  relevance: z.number().min(0).max(1).optional().describe("Relevance score 0-1"),
  page: z.number().optional().describe("Page number if from document"),
});

export const TimeSeriesPoint = z.object({
  period: z.string().describe("Period label (Q1 2025, Jan, etc.)"),
  value: z.number().describe("Numeric value for the period"),
  label: z.string().optional().describe("Optional display label"),
  forecast: z.boolean().optional().describe("Is this a forecasted value?"),
});

export const InsightMetric = z.object({
  name: z.string().describe("Metric name (e.g., 'Revenue Growth')"),
  value: z.union([z.number(), z.string()]).describe("Current value"),
  previous_value: z.union([z.number(), z.string()]).optional(),
  trend: z.enum(["up", "down", "flat", "unknown"]).optional(),
  unit: z.string().optional().describe("Unit (%, €, users, etc.)"),
  benchmark: z.union([z.number(), z.string()]).optional().describe("Industry benchmark"),
  percentile: z.number().min(0).max(100).optional().describe("Percentile vs peers"),
  evidence: z.array(EvidenceSource).optional(),
});

// ─────────────────────────────────────────────────────────────
// STRATEGIC FRAMEWORKS
// ─────────────────────────────────────────────────────────────

export const SWOTItem = z.object({
  title: z.string(),
  description: z.string(),
  impact: z.enum(["high", "medium", "low"]).describe("Business impact level"),
  urgency: z.enum(["high", "medium", "low"]).optional(),
  evidence: z.array(EvidenceSource).optional(),
});

export const SWOTAnalysis = z.object({
  strengths: z.array(SWOTItem).max(8).describe("Internal positive factors"),
  weaknesses: z.array(SWOTItem).max(8).describe("Internal negative factors"),
  opportunities: z.array(SWOTItem).max(8).describe("External positive factors"),
  threats: z.array(SWOTItem).max(8).describe("External negative factors"),
});

export const PorterForce = z.object({
  force_name: z.string(),
  score: z.number().min(1).max(5).describe("Intensity: 1=Low, 5=High"),
  analysis: z.string().describe("Brief explanation of the score"),
  key_factors: z.array(z.string()).max(5),
  evidence: z.array(EvidenceSource).optional(),
});

export const PorterFiveForces = z.object({
  competitive_rivalry: PorterForce,
  supplier_power: PorterForce,
  buyer_power: PorterForce,
  threat_new_entrants: PorterForce,
  threat_substitutes: PorterForce,
  overall_attractiveness: z.number().min(1).max(5).describe("Market attractiveness score"),
});

export const BCGMatrixItem = z.object({
  name: z.string().describe("Product/Business unit name"),
  market_share: z.number().describe("Relative market share"),
  market_growth: z.number().describe("Market growth rate %"),
  revenue: z.number().optional(),
  strategic_action: z.string().describe("Recommended action"),
});

export const BCGMatrix = z.object({
  stars: z.array(BCGMatrixItem).describe("High growth, high share"),
  cash_cows: z.array(BCGMatrixItem).describe("Low growth, high share"),
  question_marks: z.array(BCGMatrixItem).describe("High growth, low share"),
  dogs: z.array(BCGMatrixItem).describe("Low growth, low share"),
});

// ─────────────────────────────────────────────────────────────
// COMPETITIVE & FINANCIAL ANALYSIS
// ─────────────────────────────────────────────────────────────

export const CompetitorProfile = z.object({
  name: z.string(),
  market_position: z.enum(["leader", "challenger", "follower", "niche"]),
  market_share: z.number().optional().describe("% market share"),
  strengths: z.array(z.string()).max(5),
  weaknesses: z.array(z.string()).max(5),
  key_differentiators: z.array(z.string()).max(5),
  estimated_revenue: z.number().optional(),
  evidence: z.array(EvidenceSource).optional(),
});

export const CompetitiveAdvantage = z.object({
  advantage: z.string().describe("Core competitive advantage"),
  type: z.enum(["cost", "differentiation", "focus", "innovation"]),
  sustainability: z.enum(["high", "medium", "low"]).describe("How sustainable is this advantage"),
  evidence: z.array(EvidenceSource).optional(),
});

export const FinancialProjection = z.object({
  scenario: z.enum(["best_case", "base_case", "worst_case"]),
  revenue_forecast: z.array(TimeSeriesPoint).describe("12-24 month forecast"),
  assumptions: z.array(z.string()).describe("Key assumptions for this scenario"),
  probability: z.number().min(0).max(1).optional().describe("Likelihood of scenario"),
});

export const CostStructure = z.object({
  fixed_costs: z.number().describe("Annual fixed costs"),
  variable_costs: z.number().describe("Variable costs per unit or %"),
  break_even_point: z.number().describe("Units or revenue to break even"),
  cost_drivers: z.array(z.string()).max(5).describe("Main cost drivers"),
});

export const ROIScenario = z.object({
  scenario_name: z.string(),
  investment_required: z.number(),
  expected_return: z.number(),
  roi_percentage: z.number().describe("ROI %"),
  payback_period_months: z.number(),
  risk_level: z.enum(["low", "medium", "high"]),
});

// ─────────────────────────────────────────────────────────────
// RECOMMENDATIONS & ACTION ITEMS
// ─────────────────────────────────────────────────────────────

export const ActionItem = z.object({
  title: z.string(),
  description: z.string(),
  priority: z.enum(["critical", "high", "medium", "low"]),
  estimated_effort: z.enum(["low", "medium", "high", "very_high"]).optional(),
  estimated_impact: z.enum(["low", "medium", "high", "very_high"]).optional(),
  timeline: z.string().optional().describe("Suggested timeline (e.g., '30-60 days')"),
  owner: z.string().optional().describe("Suggested owner role"),
  dependencies: z.array(z.string()).optional(),
  success_metrics: z.array(z.string()).optional(),
  evidence: z.array(EvidenceSource).optional(),
});

export const StrategicRoadmap = z.object({
  phase_30_days: z.array(ActionItem).describe("Quick wins and immediate actions"),
  phase_60_days: z.array(ActionItem).describe("Medium-term initiatives"),
  phase_90_days: z.array(ActionItem).describe("Long-term strategic moves"),
});

// ─────────────────────────────────────────────────────────────
// VISUALIZATIONS
// ─────────────────────────────────────────────────────────────

export const VisualizationData = z.object({
  type: z.enum([
    "bar",
    "line", 
    "pie",
    "table",
    "waterfall",
    "funnel",
    "heatmap",
    "scatter",
    "radar",
    "sankey"
  ]),
  title: z.string(),
  subtitle: z.string().optional(),
  data: z.any().describe("Flexible data structure based on chart type"),
  insights: z.array(z.string()).optional().describe("Key insights from this visualization"),
  config: z.record(z.string(), z.any()).optional().describe("Chart-specific configuration"),
});

// ─────────────────────────────────────────────────────────────
// MAIN BUSINESS INSIGHT SCHEMA V2
// ─────────────────────────────────────────────────────────────

export const BusinessInsightSchemaV2 = z.object({
  // ── METADATA ──
  meta: z.object({
    title: z.string().describe("Professional report title"),
    subtitle: z.string().optional(),
    analysis_type: z.enum([
      "market_analysis",
      "competitive_intelligence", 
      "feasibility_study",
      "strategic_review",
      "financial_analysis",
      "business_case",
      "due_diligence",
      "growth_strategy"
    ]),
    industry: z.string().optional(),
    geography: z.string().optional(),
    generated_at: z.string(),
    document_count: z.number().optional(),
    total_pages: z.number().optional(),
    confidence_level: z.enum(["high", "medium", "low"]),
    key_themes: z.array(z.string()).max(5).optional(),
  }),

  // ── EXECUTIVE SUMMARY ──
  executive_summary: z.object({
    overview: z.string().describe("2-3 paragraph high-level summary"),
    key_findings: z.array(z.string()).min(3).max(7).describe("Critical findings"),
    strategic_implications: z.array(z.string()).max(5),
    recommended_actions: z.array(z.string()).max(5).describe("Top-level actions"),
  }),

  // ── STRATEGIC ANALYSIS ──
  strategic_analysis: z.object({
    swot: SWOTAnalysis.optional(),
    porter_five_forces: PorterFiveForces.optional(),
    bcg_matrix: BCGMatrix.optional(),
    value_chain_analysis: z.array(z.object({
      activity: z.string(),
      value_contribution: z.enum(["high", "medium", "low"]),
      optimization_potential: z.enum(["high", "medium", "low"]),
      notes: z.string(),
    })).optional(),
  }),

  // ── MARKET & COMPETITIVE POSITIONING ──
  market_intelligence: z.object({
    market_size: z.object({
      current: z.number().optional(),
      projected: z.number().optional(),
      growth_rate: z.number().optional(),
      tam_sam_som: z.object({
        total_addressable_market: z.number().optional(),
        serviceable_available_market: z.number().optional(),
        serviceable_obtainable_market: z.number().optional(),
      }).optional(),
    }).optional(),
    competitors: z.array(CompetitorProfile).optional(),
    competitive_advantages: z.array(CompetitiveAdvantage).optional(),
    market_trends: z.array(z.object({
      trend: z.string(),
      impact: z.enum(["positive", "neutral", "negative"]),
      urgency: z.enum(["high", "medium", "low"]),
    })).optional(),
  }).optional(),

  // ── FINANCIAL ANALYSIS ──
  financial_analysis: z.object({
    projections: z.array(FinancialProjection).optional(),
    cost_structure: CostStructure.optional(),
    roi_scenarios: z.array(ROIScenario).optional(),
    unit_economics: z.object({
      customer_acquisition_cost: z.number().optional(),
      lifetime_value: z.number().optional(),
      ltv_cac_ratio: z.number().optional(),
      payback_period: z.number().optional(),
    }).optional(),
  }).optional(),

  // ── KEY METRICS & KPIs ──
  metrics: z.array(InsightMetric).describe("Quantitative metrics and KPIs"),

  // ── RECOMMENDATIONS ──
  recommendations: z.array(ActionItem).describe("Prioritized action items"),

  // ── STRATEGIC ROADMAP ──
  roadmap: StrategicRoadmap.optional(),

  // ── VISUALIZATIONS ──
  visualizations: z.array(VisualizationData).optional(),

  // ── RISK ASSESSMENT ──
  risk_assessment: z.object({
    critical_risks: z.array(z.object({
      risk: z.string(),
      probability: z.enum(["high", "medium", "low"]),
      impact: z.enum(["high", "medium", "low"]),
      mitigation: z.string(),
    })).optional(),
    risk_matrix_data: z.any().optional(),
  }).optional(),

  // ── SOURCES & EVIDENCE ──
  sources: z.array(z.string()).describe("All source documents/URLs"),
  
  // ── APPENDIX ──
  appendix: z.object({
    methodology: z.string().optional(),
    assumptions: z.array(z.string()).optional(),
    data_quality_notes: z.string().optional(),
    glossary: z.record(z.string(), z.string()).optional(),
  }).optional(),
});

// ─────────────────────────────────────────────────────────────
// TYPE EXPORTS
// ─────────────────────────────────────────────────────────────

export type BusinessInsightV2 = z.infer<typeof BusinessInsightSchemaV2>;
export type SWOTAnalysisType = z.infer<typeof SWOTAnalysis>;
export type PorterFiveForcesType = z.infer<typeof PorterFiveForces>;
export type BCGMatrixType = z.infer<typeof BCGMatrix>;
export type CompetitorProfileType = z.infer<typeof CompetitorProfile>;
export type FinancialProjectionType = z.infer<typeof FinancialProjection>;
export type ActionItemType = z.infer<typeof ActionItem>;
export type InsightMetricType = z.infer<typeof InsightMetric>;
export type VisualizationDataType = z.infer<typeof VisualizationData>;

// ─────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────

/**
 * Calculate Eisenhower Matrix priority (Urgent/Important)
 */
export function calculatePriority(
  impact: "low" | "medium" | "high" | "very_high",
  urgency: "low" | "medium" | "high"
): "critical" | "high" | "medium" | "low" {
  const impactScore = { low: 1, medium: 2, high: 3, very_high: 4 };
  const urgencyScore = { low: 1, medium: 2, high: 3 };
  
  const score = impactScore[impact] + urgencyScore[urgency];
  
  if (score >= 6) return "critical";
  if (score >= 5) return "high";
  if (score >= 3) return "medium";
  return "low";
}

/**
 * Validate metric against industry benchmark
 */
export function benchmarkMetric(
  value: number,
  benchmark: number,
  higherIsBetter: boolean = true
): { status: "above" | "at" | "below"; percentile: number } {
  const diff = ((value - benchmark) / benchmark) * 100;
  
  if (Math.abs(diff) < 5) return { status: "at", percentile: 50 };
  
  if (higherIsBetter) {
    return {
      status: diff > 0 ? "above" : "below",
      percentile: Math.min(95, Math.max(5, 50 + diff))
    };
  } else {
    return {
      status: diff < 0 ? "above" : "below",
      percentile: Math.min(95, Math.max(5, 50 - diff))
    };
  }
}
