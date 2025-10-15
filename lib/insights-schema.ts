// RANKORA AI - Legacy + Premium Insights Schema
// Maintains backwards compatibility while embedding the new premium structure.

import { z } from "zod";

import {
  BusinessInsightSchemaV2,
  BusinessInsightV2,
  InsightMetric as PremiumInsightMetric,
  VisualizationDataType,
} from "./insights-schema-v2";

export const InsightMetric = z.object({
  name: z.string(),
  value: z.union([z.number(), z.string()]),
  trend: z.enum(["up", "down", "flat", "unknown"]).optional(),
  unit: z.string().optional(),
  benchmark: z.union([z.number(), z.string()]).optional(),
  percentile: z.number().min(0).max(100).optional(),
});

export const InsightVisualization = z.object({
  type: z.enum([
    "bar",
    "line",
    "pie",
    "table",
    "text",
    "waterfall",
    "funnel",
    "heatmap",
    "scatter",
    "radar",
    "sankey",
  ]),
  data: z.any(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  insights: z.array(z.string()).optional(),
});

export const InsightRecommendation = z.object({
  title: z.string(),
  description: z.string(),
  priority: z.enum(["critical", "high", "medium", "low"]).optional(),
  estimated_impact: z.enum(["low", "medium", "high", "very_high"]).optional(),
  estimated_effort: z.enum(["low", "medium", "high", "very_high"]).optional(),
  timeline: z.string().optional(),
});

export const BusinessInsightSchema = z.object({
  version: z.string().optional(),
  type: z.string(),
  title: z.string().optional(),
  summary: z.string(),
  summary_points: z.array(z.string()).optional(),
  metrics: z.array(InsightMetric),
  recommendations: z.array(InsightRecommendation),
  visualizations: z.array(InsightVisualization).optional(),
  sources: z.array(z.string()),
  generated_at: z.string(),
  meta: z
    .object({
      analysis_type: z.string().optional(),
      key_themes: z.array(z.string()).optional(),
      confidence_level: z.enum(["high", "medium", "low"]).optional(),
      premium_snapshot_id: z.string().optional(),
      ["premium:raw"]: z.any().optional(),
      ["premium:summary"]: z.record(z.string(), z.any()).optional(),
    })
    .catchall(z.any())
    .optional(),
  premium: BusinessInsightSchemaV2.optional(),
});

export type BusinessInsight = z.infer<typeof BusinessInsightSchema> & {
  premium?: BusinessInsightV2;
};

export type BusinessInsightLegacyMetric = z.infer<typeof InsightMetric>;
export type BusinessInsightVisualization = z.infer<typeof InsightVisualization>;
export type BusinessInsightRecommendation = z.infer<typeof InsightRecommendation>;

export type PremiumMetric = z.infer<typeof PremiumInsightMetric>;
export type PremiumVisualization = VisualizationDataType;

export { BusinessInsightSchemaV2 };
export type { BusinessInsightV2 };
