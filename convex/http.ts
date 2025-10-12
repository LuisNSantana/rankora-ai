// convex/http.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const http = httpRouter();

// make a safe datatyope enum maybe for all API paths
export enum ApiPath {
  Webhook = "/api/webhook",
  InsightsWebhook = "/api/insights/webhook",
}

http.route({
  path: ApiPath.Webhook,
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    type Job = {
      _id: Id<"scrapingJobs">;
      originalPrompt: string;
      status: string;
    };

    let job: Job | null = null;

    try {
      const data = await req.json();
      console.log("[Webhook] Received POST at /api/webhook");
      console.log("[Webhook] Raw body:", JSON.stringify(data));

      // Extract job ID from the webhook URL query parameters
      const url = new URL(req.url);
      const jobId = url.searchParams.get("jobId");
      console.log("[Webhook] jobId from query:", jobId);

      if (!jobId) {
        console.error("[Webhook] No job ID found in webhook data:", data);
        return new Response("No job ID found", { status: 400 });
      }

      // Find the job by ID
      job = await ctx.runQuery(api.scrapingJobs.getJobById, {
        jobId: jobId as Id<"scrapingJobs">,
      });
      console.log("[Webhook] Job lookup result:", job ? "FOUND" : "NOT FOUND");

      if (!job) {
        console.error(`[Webhook] No job found for job ID: ${jobId}`);
        return new Response(`No job found for job ID: ${jobId}`, {
          status: 404,
        });
      }

      // Step 1: Save raw scraping data first
      const rawResults = Array.isArray(data) ? data : [data];
      console.log("[Webhook] Saving raw scraping data for job:", job._id);
      await ctx.runMutation(internal.scrapingJobs.saveRawScrapingData, {
        jobId: job._id,
        rawData: rawResults,
      });
      console.log("[Webhook] Raw scraping data saved for job:", job._id);

      // Step 2: Schedule AI analysis as background job
      console.log("[Webhook] Scheduling analysis for job:", job._id);
      await ctx.scheduler.runAfter(0, internal.analysis.runAnalysis, {
        jobId: job._id,
      });
      console.log(
        `[Webhook] Analysis scheduled for job ${job._id}, webhook returning immediately`
      );

      return new Response("Success", { status: 200 });
    } catch (error) {
      console.error("[Webhook] Error:", error);

      // Set job status to failed when analysis fails (only if job was found)
      if (job) {
        try {
          await ctx.runMutation(api.scrapingJobs.failJob, {
            jobId: job._id,
            error:
              error instanceof Error
                ? error.message
                : "Unknown error occurred during analysis",
          });
          console.log(`[Webhook] Job ${job._id} marked as failed due to analysis error`);
        } catch (failError) {
          console.error("[Webhook] Failed to update job status to failed:", failError);
        }
      }

      // If it's a schema validation error, provide more specific feedback
      if (error instanceof Error && error.message.includes("schema")) {
        console.error("[Webhook] Schema validation failed - AI response incomplete");
        console.error("[Webhook] Error details:", error.message);
      }

      return new Response("Internal Server Error", { status: 500 });
    }
  }),
});

// Webhook for business insights (Bright Data -> InsightReports)
http.route({
  path: ApiPath.InsightsWebhook,
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    type InsightJob = {
      _id: Id<"insightReports">;
      originalPrompt: string;
      status: string;
    };

    let job: InsightJob | null = null;

    try {
      const data = await req.json();
      console.log("[Insights Webhook] Received POST at /api/insights/webhook");
      console.log("[Insights Webhook] Raw body:", JSON.stringify(data));

      // Extract job ID from the webhook URL query parameters
      const url = new URL(req.url);
      const jobId = url.searchParams.get("jobId");
      console.log("[Insights Webhook] jobId from query:", jobId);

      if (!jobId) {
        console.error("[Insights Webhook] No job ID found in webhook data:", data);
        return new Response("No job ID found", { status: 400 });
      }

      // Find the insight report by ID
      job = await ctx.runQuery(api.insightReports.getInsightById, {
        id: jobId as Id<"insightReports">,
      });
      console.log("[Insights Webhook] Job lookup result:", job ? "FOUND" : "NOT FOUND");

      if (!job) {
        console.error(`[Insights Webhook] No insight report found for job ID: ${jobId}`);
        return new Response(`No insight report found for job ID: ${jobId}`, {
          status: 404,
        });
      }

      // Save raw scraping data into the insight report and mark analyzing
      const rawResults = Array.isArray(data) ? data : [data];
      console.log("[Insights Webhook] Saving raw scraping data for insight report:", job._id);
      await ctx.runMutation(api.insightReports.patchInsightReport, {
        id: job._id,
        patch: {
          results: rawResults,
          status: "analyzing",
          error: undefined,
        },
      });
      console.log("[Insights Webhook] Raw scraping data saved for insight report:", job._id);

      // Schedule background analysis for the insight report (run immediately)
      try {
        console.log("[Insights Webhook] Scheduling insight analysis for job:", job._id);
        await ctx.scheduler.runAfter(0, internal.insightAnalysis.runInsightAnalysis, {
          jobId: job._id,
        });
        console.log("[Insights Webhook] Insight analysis scheduled for job:", job._id);
      } catch (schedErr) {
        console.error("[Insights Webhook] Failed to schedule insight analysis:", schedErr);
      }

      // Return quickly; analysis will update the record when complete
      return new Response("Success", { status: 200 });
    } catch (error) {
      console.error("[Insights Webhook] Error:", error);

      // Set insight report status to failed when processing fails (only if job was found)
      if (job) {
        try {
          await ctx.runMutation(api.insightReports.patchInsightReport, {
            id: job._id,
            patch: {
              status: "failed",
              error: error instanceof Error ? error.message : "Unknown error occurred during insights webhook processing",
              completedAt: Date.now(),
            },
          });
          console.log(`[Insights Webhook] Insight report ${job._id} marked as failed due to processing error`);
        } catch (failError) {
          console.error("[Insights Webhook] Failed to update insight report status to failed:", failError);
        }
      }

      return new Response("Internal Server Error", { status: 500 });
    }
  }),
});

export default http;
