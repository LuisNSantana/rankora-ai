import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new insight report
export const createInsightReport = mutation({
  args: {
    userId: v.string(),
    originalPrompt: v.string(),
    analysisPrompt: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("analyzing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    results: v.optional(v.array(v.any())),
    insightReport: v.optional(v.any()),
    error: v.optional(v.string()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
    archived: v.optional(v.boolean()),
  },
  returns: v.id("insightReports"),
  handler: async (ctx, args) => {
    const toInsert = { ...args, archived: args.archived === undefined ? false : args.archived };
    const id = await ctx.db.insert("insightReports", toInsert);
    return id;
  },
});

// List recent insight reports for a user
export const listRecentInsights = query({
  args: { userId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { userId, limit = 10 }) => {
    return await ctx.db
      .query("insightReports")
      .withIndex("by_user_and_created_at", q => q.eq("userId", userId))
      .order("desc")
      .take(limit);
  },
});

// Search insight reports by keyword/type
export const searchInsights = query({
  args: { userId: v.string(), query: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { userId, query, limit = 10 }) => {
    const all = await ctx.db
      .query("insightReports")
      .withIndex("by_user", q => q.eq("userId", userId))
      .order("desc")
      .take(100);
    return all.filter(r =>
      (r.originalPrompt?.toLowerCase().includes(query.toLowerCase()) || "") ||
      (r.insightReport?.summary?.toLowerCase().includes(query.toLowerCase()) || "")
    ).slice(0, limit);
  },
});

// Get a report by ID
export const getInsightById = query({
  args: { id: v.id("insightReports") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

// Patch an insight report (update status/progress/results)
export const patchInsightReport = mutation({
  args: { id: v.id("insightReports"), patch: v.any() },
  handler: async (ctx, { id, patch }) => {
    await ctx.db.patch(id, patch);
    return true;
  },
});

// Append a single log entry to an insight report (safe append)
export const appendLog = mutation({
  args: {
    id: v.id("insightReports"),
    msg: v.string(),
    level: v.optional(v.string()),
  },
  handler: async (ctx, { id, msg, level }) => {
    const job = await ctx.db.get(id);
    const prev = (job as any)?.logs || [];
    const next = [...prev, { t: Date.now(), msg, level }];
    await ctx.db.patch(id, { logs: next });
    return true;
  },
});

// Check if an insight report can use smart retry (has scraping results and analysis prompt)
export const canUseSmartRetry = query({
  args: { id: v.id("insightReports"), userId: v.string() },
  returns: v.object({
    canRetryAnalysisOnly: v.boolean(),
    hasScrapingData: v.boolean(),
    hasAnalysisPrompt: v.boolean(),
  }),
  handler: async (ctx, { id, userId }) => {
    const job = await ctx.db.get(id);
    if (!job || job.userId !== userId) {
      return {
        canRetryAnalysisOnly: false,
        hasScrapingData: false,
        hasAnalysisPrompt: false,
      };
    }

    const hasScrapingData = !!(job.results && job.results.length > 0);
    const hasAnalysisPrompt = !!job.analysisPrompt;
    const canRetryAnalysisOnly = hasScrapingData && hasAnalysisPrompt;

    return {
      canRetryAnalysisOnly,
      hasScrapingData,
      hasAnalysisPrompt,
    };
  },
});

// Internal: reset an insight report for analysis retry (keep scraping data)
export const resetInsightForAnalysisRetry = mutation({
  args: { id: v.id("insightReports") },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, {
      status: "analyzing",
      error: undefined,
      completedAt: undefined,
      insightReport: undefined,
      // keep: results, analysisPrompt, originalPrompt
    });
    return null;
  },
});

// Soft-delete an insight report
export const deleteInsightReport = mutation({
  args: { id: v.id("insightReports") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { archived: true });
    return true;
  },
});
