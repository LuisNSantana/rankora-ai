import { mutation, query, action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

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
    const needle = query.toLowerCase();
    return all
      .filter(r => {
        const textPool: Array<string | undefined> = [
          r.originalPrompt,
          r.insightReport?.summary,
          Array.isArray(r.insightReport?.summary_points)
            ? r.insightReport?.summary_points.join(" ")
            : undefined,
          r.insightReport?.title,
          r.insightReport?.meta?.analysis_type,
          r.insightReport?.premium?.meta?.title,
          r.insightReport?.premium?.executive_summary?.overview,
        ];
        return textPool.some(text => text?.toLowerCase().includes(needle));
      })
      .slice(0, limit);
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

// Internal version for use within other mutations/actions
export const patchInsightReportInternal = internalMutation({
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

// ============================================================================
// SCALABLE STORAGE FUNCTIONS - Handle large insights using Convex File Storage
// ============================================================================

/**
 * Save insight report intelligently:
 * - Small reports (< 500 KB): Store directly in DB
 * - Large reports (>= 500 KB): Store in File Storage with lightweight summary in DB
 */
export const saveInsightReport = action({
  args: {
    id: v.id("insightReports"),
    insightData: v.any(),
  },
  handler: async (ctx, { id, insightData }) => {
    const jsonString = JSON.stringify(insightData);
    const sizeInBytes = new TextEncoder().encode(jsonString).length;
    const SIZE_THRESHOLD = 500 * 1024; // 500 KB threshold

    console.log(`[saveInsightReport] Report size: ${(sizeInBytes / 1024).toFixed(2)} KB`);

    if (sizeInBytes < SIZE_THRESHOLD) {
      // Small report: Store directly in DB
      await ctx.runMutation(internal.insightReports.patchInsightReportInternal, {
        id,
        patch: {
          insightReport: insightData,
          reportSize: sizeInBytes,
          status: "completed",
          completedAt: Date.now(),
          error: undefined,
        },
      });
      console.log(`[saveInsightReport] Stored directly in DB (${(sizeInBytes / 1024).toFixed(2)} KB)`);
      return { storage: "database", size: sizeInBytes };
    } else {
      // Large report: Store in File Storage
      const blob = new Blob([jsonString], { type: "application/json" });
      const storageId = await ctx.storage.store(blob);

      // Create lightweight summary for DB
      const summary = {
        type: insightData.type,
        title: insightData.title,
        summary: insightData.summary?.substring(0, 500) + "..." || "",
        metrics: insightData.metrics?.slice(0, 5) || [], // First 5 metrics only
        metricsCount: insightData.metrics?.length || 0,
        recommendationsCount: insightData.recommendations?.length || 0,
        visualizationsCount: insightData.visualizations?.length || 0,
        sourcesCount: insightData.sources?.length || 0,
        generated_at: insightData.generated_at,
        meta: insightData.meta,
      };

      await ctx.runMutation(internal.insightReports.patchInsightReportInternal, {
        id,
        patch: {
          insightReport: summary, // Lightweight summary
          insightFileId: storageId, // Reference to full report
          reportSize: sizeInBytes,
          status: "completed",
          completedAt: Date.now(),
          error: undefined,
        },
      });

      console.log(`[saveInsightReport] Stored in File Storage (${(sizeInBytes / 1024).toFixed(2)} KB)`);
      return { storage: "file", size: sizeInBytes, storageId };
    }
  },
});

/**
 * Get full insight report (handles both DB and File Storage)
 */
export const getFullInsightReport = query({
  args: { id: v.id("insightReports") },
  handler: async (ctx, { id }) => {
    const report = await ctx.db.get(id);
    if (!report) return null;

    // If there's a file storage ID, return metadata indicating full report needs to be fetched
    if (report.insightFileId) {
      return {
        ...report,
        isLargeReport: true as const,
        storageId: report.insightFileId,
        // insightReport contains summary only
      };
    }

    // Small report stored directly in DB
    return {
      ...report,
      isLargeReport: false as const,
      storageId: undefined as Id<"_storage"> | undefined,
    };
  },
});

/**
 * Get the full insight content from File Storage
 * This is called separately when needed (e.g., for PDF generation or detailed view)
 */
export const getInsightFileContent = action({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    const blob = await ctx.storage.get(storageId);
    if (!blob) {
      throw new Error("Insight file not found in storage");
    }
    const text = await blob.text();
    return JSON.parse(text);
  },
});

/**
 * Get insight report URL for direct download/access
 */
export const getInsightFileUrl = mutation({
  args: { id: v.id("insightReports") },
  handler: async (ctx, { id }) => {
    const report = await ctx.db.get(id);
    if (!report?.insightFileId) {
      return null;
    }
    // Return storage URL - this will be used in frontend
    return await ctx.storage.getUrl(report.insightFileId);
  },
});
