import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  scrapingJobs: defineTable({
    // User association
    userId: v.string(), // Clerk user ID

    // User input
    originalPrompt: v.string(),
    // Saved GPT analysis prompt for debugging
    analysisPrompt: v.optional(v.string()),

    // Job tracking
    snapshotId: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("analyzing"),
      v.literal("completed"),
      v.literal("failed")
    ),

    // Results (optional, filled when webhook receives data)
    results: v.optional(v.array(v.any())),
    seoReport: v.optional(v.any()), // Structured SEO report from AI analysis
    error: v.optional(v.string()),

    // Metadata
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
    // Soft-delete flag
    archived: v.optional(v.boolean()),
  })
    .index("by_status", ["status"])
    .index("by_created_at", ["createdAt"])
    .index("by_user", ["userId"])
    .index("by_user_and_created_at", ["userId", "createdAt"]),

  insightReports: defineTable({
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
    insightReport: v.optional(v.any()), // Structured business insight
    error: v.optional(v.string()),
    // Execution logs (optional)
    logs: v.optional(
      v.array(
        v.object({
          t: v.number(),
          msg: v.string(),
          level: v.optional(v.string()), // info | warn | error
        })
      )
    ),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
    // Soft-delete flag
    archived: v.optional(v.boolean()),
  })
    .index("by_status", ["status"])
    .index("by_created_at", ["createdAt"])
    .index("by_user", ["userId"])
    .index("by_user_and_created_at", ["userId", "createdAt"])
});
