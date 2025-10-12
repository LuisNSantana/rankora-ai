
import { NextRequest, NextResponse } from "next/server";
import { BusinessInsightSchema } from "@/lib/insights-schema";
import { queryPerplexity } from "@/lib/perplexity";
import { api } from "@/convex/_generated/api";
import { getAuth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";




// Real Bright Data integration (trigger with webhook, same as SEO)
async function triggerBrightDataJob({ prompt, sector, country, size, jobId }: { prompt: string, sector?: string, country?: string, size?: string, jobId: string }) {
  if (!process.env.BRIGHTDATA_API_KEY) {
    throw new Error("BRIGHTDATA_API_KEY is not set");
  }
  if (!process.env.NEXT_PUBLIC_CONVEX_SITE_URL) {
    throw new Error("NEXT_PUBLIC_CONVEX_SITE_URL is not set");
  }
  const dataset_id = "gd_m7dhdot1vw9a7gc1n"; // same as SEO
  // Compose a query for business insights
  const query = [
    prompt,
    sector ? `sector: ${sector}` : null,
    country ? `country: ${country}` : null,
    size ? `size: ${size}` : null,
  ].filter(Boolean).join(" | ");

  // Webhook endpoint for Convex to receive results
  const ENDPOINT = `${process.env.NEXT_PUBLIC_CONVEX_SITE_URL}/api/insights/webhook?jobId=${jobId}`;
  const encodedEndpoint = encodeURIComponent(ENDPOINT);
  const url = `https://api.brightdata.com/datasets/v3/trigger?dataset_id=${dataset_id}&endpoint=${encodedEndpoint}&format=json&uncompressed_webhook=true&include_errors=true`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.BRIGHTDATA_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: [
        {
          query,
        },
      ],
      custom_output_fields: [
        "name", "sector", "country", "size", "url", "other_fields"
      ],
    }),
  });
  if (!response.ok) {
    throw new Error(`Bright Data error: ${response.status} ${response.statusText}`);
  }
  // Do not wait for results; webhook will update job
  return true;
}


// Instead of fetching results directly, trigger Bright Data job and return pending status
async function fetchAndAnalyzeInsights(params: any, jobId: string) {
  const type = params.type || "clients";
  let brightDataError = "";
  try {
    await triggerBrightDataJob({
      prompt: params.prompt || type,
      sector: params.sector,
      country: params.country,
      size: params.size,
      jobId,
    });
  } catch (e: any) {
    brightDataError = e.message || String(e);
  }

  // Perplexity enrichment (optional, can be run async or after Bright Data returns)
  const composedPrompt = params.prompt && params.prompt.trim()
    ? params.prompt.trim()
    : `${type} analysis${params.sector ? ` | sector: ${params.sector}` : ""}${params.country ? ` | country: ${params.country}` : ""}${params.size ? ` | size: ${params.size}` : ""}`;

  const perplexityKey = process.env.PERPLEXITY_API_KEY;
  let marketSummary = "";
  let researchNotes = "";
  let sourcesDetailed = "";

  if (perplexityKey) {
    try {
      marketSummary = await queryPerplexity({
        query: `In 3-5 concise bullets, summarize opportunities and acquisition strategies for: ${composedPrompt}. Target: SaaS B2B sellers. Keep it actionable and prioritized.`,
        apiKey: perplexityKey,
      });
    } catch (e) {
      marketSummary = "Could not retrieve Perplexity summary.";
    }

    try {
      researchNotes = await queryPerplexity({
        query: `Provide a short research section for: ${composedPrompt}. Include: (1) market signals, (2) competitor/sector notes, (3) suggested data sources or references (give a comma-separated list at the end under 'SOURCES:'). Write in a professional, research-oriented tone.`,
        apiKey: perplexityKey,
      });
      const sourcesMatch = String(researchNotes).match(/SOURCES:\s*([\s\S]*)$/i);
      if (sourcesMatch) {
        sourcesDetailed = sourcesMatch[1].trim();
      } else {
        sourcesDetailed = "Perplexity, Bright Data";
      }
    } catch (e) {
      researchNotes = "Could not retrieve extended research from Perplexity.";
      sourcesDetailed = "Perplexity (failed)";
    }
  } else {
    marketSummary = "Perplexity API key not configured.";
    researchNotes = "Perplexity API key not configured.";
    sourcesDetailed = "Bright Data";
  }

  // Return a pending status; actual results will be updated by webhook
  return {
    type,
    summary: `Job started. Waiting for Bright Data results.\n\n${marketSummary}${brightDataError ? `\n\nBright Data error: ${brightDataError}` : ""}`,
    metrics: [
      { name: "Potential Clients", value: 0, trend: "flat" },
    ],
    recommendations: [
      { title: "Contact top clients", description: "Results will appear once scraping completes.", priority: "high" },
      { title: "Segment by industry", description: "Personalize your pitch based on the client's sector.", priority: "medium" },
    ],
    visualizations: [
      { type: "table", data: [], title: "Potential Clients List" },
    ],
    sources: ["Bright Data", "Perplexity"],
    generated_at: new Date().toISOString(),
    meta: { sector: params.sector || "general", research: researchNotes, sourcesDetailed, brightDataError },
  };
}

export async function POST(request: NextRequest) {
  const params = await request.json();
  // Get userId from Clerk session
  const { userId } = getAuth(request);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  // Compose analysisPrompt from user inputs for traceability
  const analysisPrompt = `${params.prompt || params.type || ""}${params.sector ? ` | sector: ${params.sector}` : ""}${params.country ? ` | country: ${params.country}` : ""}${params.size ? ` | size: ${params.size}` : ""}`;

  // 1) Create job in Convex with status pending
  const jobId = await convex.mutation(api.insightReports.createInsightReport, {
    userId,
    originalPrompt: params.prompt || params.type || "",
    analysisPrompt,
    status: "pending",
    results: [],
    insightReport: undefined,
    error: undefined,
    createdAt: Date.now(),
    completedAt: undefined,
    archived: false,
  });

  // 2) Optimistically set it to running before heavy work
  try {
    await convex.mutation(api.insightReports.patchInsightReport, { id: jobId, patch: { status: "running", error: undefined } });
  } catch (e) {
    // ignore patch error - we'll still proceed
    console.warn("Failed to mark insight report as running:", e);
  }

  // 3) Trigger Bright Data job and Perplexity enrichment
  let insight: any;
  try {
    insight = await fetchAndAnalyzeInsights(params, jobId);
    const parsed = BusinessInsightSchema.safeParse(insight);
    if (!parsed.success) {
      await convex.mutation(api.insightReports.patchInsightReport, { id: jobId, patch: { status: "failed", error: "Invalid insight structure", completedAt: Date.now() } });
      return NextResponse.json({ error: "Invalid insight structure", details: parsed.error }, { status: 400 });
    }
    // 4) Persist pending result (will be updated by webhook)
    await convex.mutation(api.insightReports.patchInsightReport, {
      id: jobId,
      patch: {
        status: "running",
        insightReport: parsed.data,
        results: [],
        error: undefined,
      },
    });
    const result = { ...parsed.data, _id: jobId, meta: { ...(parsed.data.meta || {}), title: parsed.data.title || params.prompt || params.type } };
    return NextResponse.json(result);
  } catch (err: any) {
    try {
      await convex.mutation(api.insightReports.patchInsightReport, { id: jobId, patch: { status: "failed", error: String(err), completedAt: Date.now() } });
    } catch (e) {
      console.warn("Failed to mark insight as failed:", e);
    }
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
