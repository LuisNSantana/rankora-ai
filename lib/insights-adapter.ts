import {
  BusinessInsight,
  BusinessInsightLegacyMetric,
  BusinessInsightRecommendation,
  BusinessInsightVisualization,
} from "./insights-schema";
import { BusinessInsightSchemaV2, BusinessInsightV2, ActionItemType } from "./insights-schema-v2";

const PRIORITY_MAP: Record<ActionItemType["priority"], BusinessInsightRecommendation["priority"]> = {
  critical: "critical",
  high: "high",
  medium: "medium",
  low: "low",
};

function formatSummary(insight: BusinessInsightV2): { summary: string; points: string[] } {
  const overview = insight.executive_summary.overview.trim();
  const bullets = insight.executive_summary.key_findings.map(point => point.trim()).filter(Boolean);
  const summary = [overview, insight.executive_summary.strategic_implications.join(" ")]
    .filter(Boolean)
    .join("\n\n");
  return {
    summary: summary || overview,
    points: bullets,
  };
}

function mapMetrics(insight: BusinessInsightV2): BusinessInsightLegacyMetric[] {
  return insight.metrics.map(metric => ({
    name: metric.name,
    value: metric.value,
    trend: metric.trend ?? undefined,
    unit: metric.unit,
    benchmark: metric.benchmark,
    percentile: metric.percentile,
  }));
}

function mapRecommendations(insight: BusinessInsightV2): BusinessInsightRecommendation[] {
  const timelineFor = (action: ActionItemType) => action.timeline || undefined;

  return insight.recommendations.map(action => ({
    title: action.title,
    description: [action.description, action.success_metrics?.length
      ? `KPIs: ${action.success_metrics.join(", ")}`
      : undefined,
    ]
      .filter(Boolean)
      .join("\n"),
    priority: PRIORITY_MAP[action.priority],
    estimated_impact: action.estimated_impact,
    estimated_effort: action.estimated_effort,
    timeline: timelineFor(action),
  }));
}

function mapVisualizations(insight: BusinessInsightV2): BusinessInsightVisualization[] {
  if (!insight.visualizations) return [];

  return insight.visualizations.map(viz => ({
    type: viz.type,
    data: viz.data,
    title: viz.title,
    subtitle: viz.subtitle,
    insights: viz.insights,
  }));
}

export function mapPremiumInsightToLegacy(raw: BusinessInsightV2): BusinessInsight {
  BusinessInsightSchemaV2.parse(raw);

  const summary = formatSummary(raw);
  const metrics = mapMetrics(raw);
  const recommendations = mapRecommendations(raw);
  const visualizations = mapVisualizations(raw);

  return {
    version: "2.0",
    type: raw.meta.analysis_type,
    title: raw.meta.title,
    summary: summary.summary,
    summary_points: summary.points,
    metrics,
    recommendations,
    visualizations: visualizations.length ? visualizations : undefined,
    sources: raw.sources,
    generated_at: raw.meta.generated_at,
    meta: {
      analysis_type: raw.meta.analysis_type,
      key_themes: raw.meta.key_themes,
      confidence_level: raw.meta.confidence_level,
      ["premium:raw"]: raw,
      ["premium:summary"]: {
        roadmap: raw.roadmap,
        financial_analysis: raw.financial_analysis,
        market_intelligence: raw.market_intelligence,
        risk_assessment: raw.risk_assessment,
      },
    },
    premium: raw,
  };
}
