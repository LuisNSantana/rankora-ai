/**
 * Industry Intelligence Layer
 * Provides sector-specific benchmarks, competitive analysis, and trend predictions
 */

export interface IndustryBenchmark {
  metric_name: string;
  industry_average: number | string;
  top_quartile: number | string;
  bottom_quartile: number | string;
  unit?: string;
  source: string;
  last_updated: string;
}

export interface CompetitiveIntelligence {
  competitor_name: string;
  market_position: "leader" | "challenger" | "follower" | "niche";
  key_strengths: string[];
  key_weaknesses: string[];
  estimated_market_share?: number;
  recent_moves?: string[];
}

export interface TrendPrediction {
  trend_name: string;
  direction: "rising" | "declining" | "stable" | "volatile";
  confidence: "high" | "medium" | "low";
  time_horizon: "short-term" | "medium-term" | "long-term";
  impact_level: "critical" | "high" | "medium" | "low";
  description: string;
  recommended_actions: string[];
}

export interface IndustryContext {
  sector: string;
  sub_sector?: string;
  market_size?: string;
  growth_rate?: string;
  key_drivers: string[];
  challenges: string[];
  regulatory_environment: string[];
}

/**
 * Industry classification keywords for automatic tagging
 */
export const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  "Technology / SaaS": [
    "software", "saas", "cloud", "api", "platform", "app", "tech", "digital",
    "automation", "ai", "machine learning", "desarrollo", "tecnología"
  ],
  "E-commerce / Retail": [
    "ecommerce", "retail", "tienda", "ventas", "marketplace", "comercio",
    "productos", "inventario", "fulfillment", "dropshipping"
  ],
  "Financial Services": [
    "fintech", "banking", "insurance", "payments", "credit", "financiero",
    "préstamos", "inversión", "banca", "seguros"
  ],
  "Healthcare / Pharma": [
    "healthcare", "health", "medical", "pharma", "hospital", "clinic",
    "salud", "médico", "farmacia", "pacientes", "tratamiento"
  ],
  "Education / EdTech": [
    "education", "learning", "training", "course", "edtech", "educación",
    "formación", "estudiantes", "academia", "universidad"
  ],
  "Real Estate / PropTech": [
    "real estate", "property", "inmobiliaria", "vivienda", "construcción",
    "proptech", "edificio", "alquiler", "hipoteca"
  ],
  "Marketing / Advertising": [
    "marketing", "advertising", "publicidad", "campaña", "branding",
    "seo", "sem", "social media", "content", "agencia"
  ],
  "Manufacturing / Industrial": [
    "manufacturing", "production", "factory", "industrial", "fabricación",
    "producción", "planta", "maquinaria", "logística"
  ],
  "Food & Beverage": [
    "restaurant", "food", "beverage", "hospitality", "restaurante",
    "alimentos", "bebidas", "gastronomía", "cocina"
  ],
  "Professional Services": [
    "consulting", "legal", "accounting", "consultoria", "legal",
    "contabilidad", "auditoría", "servicios profesionales"
  ],
};

/**
 * Standard industry benchmarks (baseline data)
 * In production, these would come from APIs or databases
 */
export const INDUSTRY_BENCHMARKS: Record<string, IndustryBenchmark[]> = {
  "Technology / SaaS": [
    {
      metric_name: "CAC (Customer Acquisition Cost)",
      industry_average: "$200-500",
      top_quartile: "<$150",
      bottom_quartile: ">$700",
      unit: "USD",
      source: "SaaS Capital Index 2025",
      last_updated: "2025-Q3"
    },
    {
      metric_name: "LTV/CAC Ratio",
      industry_average: "3-4x",
      top_quartile: ">5x",
      bottom_quartile: "<2x",
      source: "SaaS Metrics Standard",
      last_updated: "2025-Q3"
    },
    {
      metric_name: "Monthly Churn Rate",
      industry_average: "5-7%",
      top_quartile: "<3%",
      bottom_quartile: ">10%",
      unit: "%",
      source: "SaaS Capital Index 2025",
      last_updated: "2025-Q3"
    },
    {
      metric_name: "Net Revenue Retention",
      industry_average: "100-110%",
      top_quartile: ">120%",
      bottom_quartile: "<90%",
      unit: "%",
      source: "SaaS Capital Index 2025",
      last_updated: "2025-Q3"
    },
    {
      metric_name: "Gross Margin",
      industry_average: "70-80%",
      top_quartile: ">85%",
      bottom_quartile: "<60%",
      unit: "%",
      source: "SaaS Benchmarks 2025",
      last_updated: "2025-Q3"
    },
  ],
  "E-commerce / Retail": [
    {
      metric_name: "Conversion Rate",
      industry_average: "2-3%",
      top_quartile: ">5%",
      bottom_quartile: "<1%",
      unit: "%",
      source: "E-commerce Benchmarks 2025",
      last_updated: "2025-Q3"
    },
    {
      metric_name: "Average Order Value (AOV)",
      industry_average: "$50-150",
      top_quartile: ">$200",
      bottom_quartile: "<$30",
      unit: "USD",
      source: "Retail Analytics 2025",
      last_updated: "2025-Q3"
    },
    {
      metric_name: "Cart Abandonment Rate",
      industry_average: "65-70%",
      top_quartile: "<55%",
      bottom_quartile: ">80%",
      unit: "%",
      source: "E-commerce Standards",
      last_updated: "2025-Q3"
    },
    {
      metric_name: "Customer Retention Rate",
      industry_average: "20-30%",
      top_quartile: ">40%",
      bottom_quartile: "<15%",
      unit: "%",
      source: "Retail Loyalty Index",
      last_updated: "2025-Q3"
    },
  ],
  "Financial Services": [
    {
      metric_name: "Cost-to-Income Ratio",
      industry_average: "50-60%",
      top_quartile: "<45%",
      bottom_quartile: ">70%",
      unit: "%",
      source: "Banking Efficiency Index",
      last_updated: "2025-Q3"
    },
    {
      metric_name: "Net Promoter Score (NPS)",
      industry_average: "30-40",
      top_quartile: ">50",
      bottom_quartile: "<20",
      source: "Financial Services NPS 2025",
      last_updated: "2025-Q3"
    },
  ],
};

/**
 * Industry trends and predictions
 */
export const INDUSTRY_TRENDS: Record<string, TrendPrediction[]> = {
  "Technology / SaaS": [
    {
      trend_name: "AI-Powered Automation",
      direction: "rising",
      confidence: "high",
      time_horizon: "short-term",
      impact_level: "critical",
      description: "Integración de IA generativa en productos SaaS para automatización de tareas y mejora de UX.",
      recommended_actions: [
        "Evaluar capacidades de IA en roadmap de producto",
        "Capacitar equipo en prompt engineering y LLMs",
        "Implementar features de AI/ML en Q1 2026"
      ]
    },
    {
      trend_name: "Usage-Based Pricing",
      direction: "rising",
      confidence: "high",
      time_horizon: "medium-term",
      impact_level: "high",
      description: "Cambio de suscripción fija a pricing basado en consumo real.",
      recommended_actions: [
        "Analizar patrones de uso actuales",
        "Diseñar modelo de pricing híbrido",
        "A/B testing con segmento de early adopters"
      ]
    },
    {
      trend_name: "Vertical SaaS Dominance",
      direction: "rising",
      confidence: "medium",
      time_horizon: "medium-term",
      impact_level: "high",
      description: "Soluciones especializadas por industria ganan terreno sobre plataformas generalistas.",
      recommended_actions: [
        "Identificar vertical más prometedor",
        "Desarrollar features específicas del sector",
        "Partnerships estratégicos en la vertical"
      ]
    },
  ],
  "E-commerce / Retail": [
    {
      trend_name: "Social Commerce Expansion",
      direction: "rising",
      confidence: "high",
      time_horizon: "short-term",
      impact_level: "critical",
      description: "Compras directas desde redes sociales (Instagram, TikTok Shop) superarán 20% del e-commerce.",
      recommended_actions: [
        "Integrar catálogo con Instagram/TikTok Shopping",
        "Crear contenido shoppable para RRSS",
        "Implementar checkout nativo en plataformas sociales"
      ]
    },
    {
      trend_name: "Sustainability Transparency",
      direction: "rising",
      confidence: "high",
      time_horizon: "medium-term",
      impact_level: "high",
      description: "Consumidores demandan trazabilidad completa y sostenibilidad verificable.",
      recommended_actions: [
        "Certificar supply chain sostenible",
        "Mostrar carbon footprint en productos",
        "Comunicar transparentemente origen y fabricación"
      ]
    },
  ],
};

/**
 * Regulatory environments by region
 */
export const REGULATORY_CONTEXT: Record<string, { name: string; key_regulations: string[]; compliance_priority: "critical" | "high" | "medium" }[]> = {
  "EU / España": [
    {
      name: "GDPR (General Data Protection Regulation)",
      key_regulations: [
        "Consentimiento explícito para datos personales",
        "Derecho al olvido (eliminación de datos)",
        "Data breach notification <72h",
        "DPO obligatorio para procesamiento masivo"
      ],
      compliance_priority: "critical"
    },
    {
      name: "Digital Services Act (DSA)",
      key_regulations: [
        "Transparencia en algoritmos de recomendación",
        "Moderación de contenido ilegal",
        "Protección de menores online"
      ],
      compliance_priority: "high"
    },
  ],
  "LatAm / México": [
    {
      name: "LFPDPPP (Ley Federal de Protección de Datos Personales)",
      key_regulations: [
        "Aviso de privacidad obligatorio",
        "Consentimiento tácito/expreso según sensibilidad",
        "ARCO rights (acceso, rectificación, cancelación, oposición)"
      ],
      compliance_priority: "high"
    },
  ],
  "US / California": [
    {
      name: "CCPA/CPRA (California Privacy Rights Act)",
      key_regulations: [
        "Right to know qué datos se recopilan",
        "Right to delete datos personales",
        "Opt-out de venta de datos",
        "Non-discrimination por ejercer derechos"
      ],
      compliance_priority: "critical"
    },
  ],
};

/**
 * Detect industry from content using keyword matching
 */
export function detectIndustry(content: string): string | null {
  const lowercased = content.toLowerCase();
  const matches: Array<{ industry: string; score: number }> = [];

  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    const score = keywords.filter(kw => lowercased.includes(kw.toLowerCase())).length;
    if (score > 0) matches.push({ industry, score });
  }

  // Return industry with highest keyword match count
  if (matches.length === 0) return null;
  matches.sort((a, b) => b.score - a.score);
  return matches[0].industry;
}

/**
 * Get benchmarks for detected industry
 */
export function getIndustryBenchmarks(industry: string | null): IndustryBenchmark[] {
  if (!industry) return [];
  return INDUSTRY_BENCHMARKS[industry] || [];
}

/**
 * Get trend predictions for industry
 */
export function getIndustryTrends(industry: string | null): TrendPrediction[] {
  if (!industry) return [];
  return INDUSTRY_TRENDS[industry] || [];
}

/**
 * Get regulatory context for detected regions
 */
export function getRegulatoryContext(regions: string[]): Array<{ region: string; regulations: typeof REGULATORY_CONTEXT[string] }> {
  const result: Array<{ region: string; regulations: typeof REGULATORY_CONTEXT[string] }> = [];
  
  for (const region of regions) {
    for (const [key, value] of Object.entries(REGULATORY_CONTEXT)) {
      if (region.toLowerCase().includes(key.toLowerCase().split(" / ")[0]) || 
          region.toLowerCase().includes(key.toLowerCase().split(" / ")[1] || "")) {
        result.push({ region: key, regulations: value });
        break;
      }
    }
  }
  
  return result;
}

/**
 * Compare user metrics against industry benchmarks
 */
export function benchmarkMetrics(
  userMetrics: Array<{ name: string; value: number | string }>,
  industryBenchmarks: IndustryBenchmark[]
): Array<{
  metric: string;
  user_value: number | string;
  industry_avg: number | string;
  performance: "excellent" | "above-average" | "average" | "below-average" | "needs-improvement";
  gap: string;
}> {
  const comparisons: Array<any> = [];

  for (const benchmark of industryBenchmarks) {
    const userMetric = userMetrics.find(m => 
      m.name.toLowerCase().includes(benchmark.metric_name.toLowerCase()) ||
      benchmark.metric_name.toLowerCase().includes(m.name.toLowerCase().split(" ").slice(0, 2).join(" "))
    );

    if (!userMetric) continue;

    // Simple heuristic comparison (in production, use more sophisticated logic)
    let performance: "excellent" | "above-average" | "average" | "below-average" | "needs-improvement" = "average";
    let gap = "En línea con industria";

    const userVal = String(userMetric.value).replace(/[^0-9.]/g, "");
    const avgVal = String(benchmark.industry_average).split("-")[0].replace(/[^0-9.]/g, "");
    const topVal = String(benchmark.top_quartile).replace(/[^0-9.<>]/g, "");

    if (userVal && avgVal) {
      const userNum = parseFloat(userVal);
      const avgNum = parseFloat(avgVal);
      const topNum = parseFloat(topVal);

      // For metrics where higher is better
      if (benchmark.metric_name.includes("Margin") || benchmark.metric_name.includes("Retention") || benchmark.metric_name.includes("LTV")) {
        if (userNum >= topNum) {
          performance = "excellent";
          gap = `${Math.round(((userNum - avgNum) / avgNum) * 100)}% por encima del promedio`;
        } else if (userNum > avgNum * 1.1) {
          performance = "above-average";
          gap = `${Math.round(((userNum - avgNum) / avgNum) * 100)}% por encima del promedio`;
        } else if (userNum < avgNum * 0.8) {
          performance = "below-average";
          gap = `${Math.abs(Math.round(((userNum - avgNum) / avgNum) * 100))}% por debajo del promedio`;
        }
      }
      // For metrics where lower is better
      else if (benchmark.metric_name.includes("Churn") || benchmark.metric_name.includes("CAC") || benchmark.metric_name.includes("Abandonment")) {
        if (userNum <= topNum) {
          performance = "excellent";
          gap = `${Math.abs(Math.round(((userNum - avgNum) / avgNum) * 100))}% mejor que el promedio`;
        } else if (userNum < avgNum * 0.9) {
          performance = "above-average";
          gap = `${Math.abs(Math.round(((userNum - avgNum) / avgNum) * 100))}% mejor que el promedio`;
        } else if (userNum > avgNum * 1.2) {
          performance = "below-average";
          gap = `${Math.round(((userNum - avgNum) / avgNum) * 100)}% peor que el promedio`;
        }
      }
    }

    comparisons.push({
      metric: benchmark.metric_name,
      user_value: userMetric.value,
      industry_avg: benchmark.industry_average,
      performance,
      gap,
    });
  }

  return comparisons;
}
