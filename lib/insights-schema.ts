// Flexible Zod schema for Business Insights
import { z } from "zod";

export const InsightMetric = z.object({
  name: z.string(),
  value: z.number().or(z.string()),
  trend: z.enum(["up", "down", "flat"]).optional(),
  unit: z.string().optional(),
});

export const InsightVisualization = z.object({
  type: z.enum(["bar", "line", "pie", "table", "text"]),
  data: z.any(), // Adaptable to charting lib
  title: z.string().optional(),
});

export const InsightRecommendation = z.object({
  title: z.string(),
  description: z.string(),
  priority: z.enum(["high", "medium", "low"]).optional(),
});

export const BusinessInsightSchema = z.object({
  type: z.string(), // e.g. "ventas", "marketing", "producto"
  summary: z.string(),
  metrics: z.array(InsightMetric),
  recommendations: z.array(InsightRecommendation),
  visualizations: z.array(InsightVisualization).optional(),
  sources: z.array(z.string()),
  generated_at: z.string(),
  meta: z.record(z.string(), z.any()).optional(),
  // Optional title for premium display (forwards compatible)
  title: z.string().optional(),
});

export type BusinessInsight = z.infer<typeof BusinessInsightSchema>;
