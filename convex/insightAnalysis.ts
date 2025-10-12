"use node";

import { internalAction, action } from "./_generated/server";
import { v } from "convex/values";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { BusinessInsightSchema } from "../lib/insights-schema";
import { internal, api } from "./_generated/api";
import { systemPromptForInsights, buildInsightAnalysisPrompt } from "../prompts/insight";

export const runInsightAnalysis = internalAction({
  args: {
    jobId: v.id("insightReports"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    console.log("Starting insight analysis for job:", args.jobId);

    try {
      const job = await ctx.runQuery(api.insightReports.getInsightById, { id: args.jobId });
      if (!job) {
        console.error(`No insight report found for ${args.jobId}`);
        return null;
      }

      if (!job.results || job.results.length === 0) {
        console.error(`No scraping results found for insight job: ${args.jobId}`);
        await ctx.runMutation(api.insightReports.patchInsightReport, { id: args.jobId, patch: { status: "failed", error: "No scraping results available for analysis" } });
        return null;
      }

      // Mark as analyzing
      await ctx.runMutation(api.insightReports.patchInsightReport, { id: args.jobId, patch: { status: "analyzing", error: undefined } });

      // Build prompt
      const analysisPrompt = buildInsightAnalysisPrompt(job.results || []);

      // Save prompt for debugging
      await ctx.runMutation(api.insightReports.patchInsightReport, { id: args.jobId, patch: { analysisPrompt } });

      // Generate structured BusinessInsight using AI
      const { object: insight } = await generateObject({
        model: openai("gpt-4o-mini"),
        system: systemPromptForInsights(),
        prompt: analysisPrompt,
        schema: BusinessInsightSchema as any,
      });

      console.log("Insight generated for job:", args.jobId, { title: insight.title });

      // Persist insight
      await ctx.runMutation(api.insightReports.patchInsightReport, {
        id: args.jobId,
        patch: {
          insightReport: insight,
          status: "completed",
          completedAt: Date.now(),
          error: undefined,
        },
      });

      console.log(`Insight job ${args.jobId} analysis completed`);
      return null;
    } catch (error) {
      console.error("Insight analysis error for job:", args.jobId, error);
      try {
        await ctx.runMutation(api.insightReports.patchInsightReport, { id: args.jobId, patch: { status: "failed", error: error instanceof Error ? error.message : String(error), completedAt: Date.now() } });
      } catch (e) {
        console.error("Failed to mark insight job as failed:", e);
      }
      return null;
    }
  },
});

// Retry analysis-only for an insight report that already has scraping data
export const retryAnalysisOnly = action({
  args: {
    jobId: v.id("insightReports"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    console.log("Retrying insight analysis-only for job:", args.jobId);

    // Reset insight report to analyzing and clear previous analysis
    await ctx.runMutation(api.insightReports.resetInsightForAnalysisRetry, { id: args.jobId });

    // Call the internal analysis action to run again
    await ctx.runAction(internal.insightAnalysis.runInsightAnalysis, { jobId: args.jobId });

    return null;
  },
});
