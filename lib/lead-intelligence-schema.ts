import { z } from "zod";

// ═══════════════════════════════════════════════════════════════
// LEAD INTELLIGENCE SCHEMA - Actionable Lead Generation
// Transforms generic insights into concrete, qualified prospects
// ═══════════════════════════════════════════════════════════════

export const DecisionMakerProfile = z.object({
  name: z.string().optional().describe("Decision maker's full name"),
  title: z.string().describe("Job title (CMO, Marketing Director, CEO)"),
  linkedin_url: z.string().optional().describe("LinkedIn profile URL"),
  email: z.string().optional().describe("Email address if available"),
  phone: z.string().optional().describe("Phone number if available"),
  seniority_level: z.enum(["C-level", "VP", "Director", "Manager"]).describe("Decision making authority"),
  department: z.string().describe("Department (Marketing, Sales, Operations)")
});

export const CompanyProfile = z.object({
  company_name: z.string().describe("Official company name"),
  website: z.string().describe("Company website URL"),
  industry: z.string().describe("Primary industry/vertical"),
  revenue_estimate: z.string().describe("Annual revenue estimate (e.g., '€2-5M')"),
  employee_count: z.string().describe("Number of employees (e.g., '50-200')"),
  location: z.string().describe("Primary location (city, region)"),
  funding_status: z.string().optional().describe("Funding stage, recent rounds"),
  technology_stack: z.array(z.string()).optional().describe("Technologies they use"),
  growth_indicators: z.array(z.string()).optional().describe("Signs of growth/expansion")
});

export const LeadQualification = z.object({
  budget_score: z.number().min(1).max(10).describe("Budget likelihood (1-10)"),
  authority_score: z.number().min(1).max(10).describe("Authority to make decisions (1-10)"),
  need_score: z.number().min(1).max(10).describe("Urgency of need (1-10)"),
  timeline_score: z.number().min(1).max(10).describe("Timeline for purchase (1-10)"),
  overall_fit_score: z.number().min(1).max(10).describe("Overall lead quality (1-10)"),
  qualification_notes: z.string().describe("Reasoning for scores")
});

export const QualifiedLead = z.object({
  company: CompanyProfile,
  decision_maker: DecisionMakerProfile,
  qualification: LeadQualification,
  pain_points: z.array(z.string()).max(5).describe("Specific challenges identified"),
  opportunity_details: z.object({
    estimated_deal_size: z.string().describe("Potential contract value"),
    probability: z.enum(["high", "medium", "low"]).describe("Probability of closing"),
    timeline: z.string().describe("Expected sales cycle length"),
    competition: z.array(z.string()).optional().describe("Likely competitors")
  }),
  outreach_strategy: z.object({
    primary_channel: z.enum(["email", "linkedin", "phone", "referral"]),
    personalization_hooks: z.array(z.string()).max(3).describe("Personalization angles"),
    key_messaging: z.string().describe("Core value proposition for this prospect"),
    call_to_action: z.string().describe("Specific next step to propose")
  }),
  data_sources: z.array(z.string()).describe("Sources used for qualification"),
  priority: z.enum(["urgent", "high", "medium", "low"]).describe("Follow-up priority"),
  last_updated: z.string().describe("When this data was gathered")
});

export const OutreachTemplate = z.object({
  template_type: z.enum(["cold_email", "linkedin_message", "follow_up", "referral_request"]),
  subject_line: z.string().describe("Email subject or message opening"),
  body: z.string().describe("Full message template with [VARIABLES] for personalization"),
  personalization_variables: z.array(z.string()).describe("Variables to customize per prospect"),
  expected_response_rate: z.string().describe("Expected response rate for this template"),
  best_practices: z.array(z.string()).describe("Tips for using this template effectively"),
  a_b_variations: z.array(z.object({
    variation_name: z.string(),
    body: z.string(),
    expected_lift: z.string()
  })).optional().describe("A/B test variations")
});

export const CompetitorClientIntelligence = z.object({
  competitor_name: z.string(),
  client_companies: z.array(z.object({
    company_name: z.string(),
    relationship_duration: z.string().optional(),
    satisfaction_indicators: z.array(z.string()).describe("Signals about satisfaction level"),
    switching_triggers: z.array(z.string()).describe("Pain points that could cause switching"),
    migration_opportunity: z.enum(["high", "medium", "low"]),
    approach_strategy: z.string().describe("How to approach this potential switcher"),
    data_source: z.string().describe("Where this intelligence was gathered")
  })),
  market_positioning: z.string().describe("How competitor positions themselves"),
  pricing_intelligence: z.object({
    price_range: z.string(),
    pricing_model: z.string(),
    pain_points: z.array(z.string()).describe("Client complaints about pricing")
  }).optional()
});

export const LeadIntelligenceReport = z.object({
  // Core qualified leads list
  qualified_leads: z.array(QualifiedLead).max(50).describe("Prioritized list of qualified prospects"),
  
  // Total addressable market analysis
  market_analysis: z.object({
    total_companies_analyzed: z.number(),
    qualification_pass_rate: z.string().describe("% that passed qualification"),
    average_deal_size: z.string(),
    market_penetration_opportunity: z.string()
  }),
  
  // Outreach tools and templates
  outreach_toolkit: z.array(OutreachTemplate).describe("Ready-to-use outreach templates"),
  
  // Competitor client intelligence
  competitor_intelligence: z.array(CompetitorClientIntelligence).optional(),
  
  // Implementation guidance
  implementation_roadmap: z.object({
    immediate_actions: z.array(z.object({
      action: z.string(),
      deadline: z.string(),
      responsible: z.string(),
      expected_outcome: z.string()
    })),
    weekly_targets: z.object({
      outreach_volume: z.number(),
      expected_responses: z.number(),
      meetings_target: z.number(),
      deals_pipeline: z.number()
    }),
    success_metrics: z.array(z.object({
      metric: z.string(),
      target: z.string(),
      measurement_method: z.string()
    }))
  }),
  
  // Data sources and confidence
  data_sources: z.array(z.string()),
  confidence_level: z.enum(["high", "medium", "low"]),
  last_updated: z.string(),
  next_update_recommended: z.string()
});

export type QualifiedLeadType = z.infer<typeof QualifiedLead>;
export type OutreachTemplateType = z.infer<typeof OutreachTemplate>;
export type LeadIntelligenceReportType = z.infer<typeof LeadIntelligenceReport>;
export type LeadQualificationType = z.infer<typeof LeadQualification>;

// Helper function to calculate lead score
export function calculateLeadScore(qualification: LeadQualificationType): number {
  const weights = {
    budget: 0.3,
    authority: 0.25,
    need: 0.25,
    timeline: 0.2
  };
  
  return Math.round(
    qualification.budget_score * weights.budget +
    qualification.authority_score * weights.authority +
    qualification.need_score * weights.need +
    qualification.timeline_score * weights.timeline
  );
}

// Helper function to prioritize leads
export function prioritizeLeads(leads: QualifiedLeadType[]): QualifiedLeadType[] {
  return leads.sort((a, b) => {
    const scoreA = calculateLeadScore(a.qualification);
    const scoreB = calculateLeadScore(b.qualification);
    return scoreB - scoreA;
  });
}