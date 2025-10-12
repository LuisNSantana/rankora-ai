"use server";

import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { auth } from "@clerk/nextjs/server";

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
}

/**
 * Retry insight analysis only for a job that already has scraping data.
 * This mirrors the SEO retry flow but targets insightReports.
 */
const retryInsightAnalysisOnly = async (jobId: string) => {
  const { userId } = await auth();
  if (!userId) {
    return { ok: false, error: "Not authenticated" };
  }

  // Initialize Convex client
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

  try {
    console.log("Starting insight analysis-only retry for job:", jobId);

    // Trigger the insight retry action
    await convex.action(api.insightAnalysis.retryAnalysisOnly, {
      jobId: jobId as Id<"insightReports">,
    });

    return {
      ok: true,
      message: "Insight analysis retry started successfully",
    };
  } catch (error) {
    console.error("Failed to retry insight analysis:", error);

    // Mark insight as failed
    await convex.mutation(api.insightReports.patchInsightReport, {
      id: jobId as Id<"insightReports">,
      patch: { status: "failed", error: error instanceof Error ? error.message : "Failed to retry insight analysis", completedAt: Date.now() },
    });

    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to retry insight analysis",
    };
  }
};

export default retryInsightAnalysisOnly;
