import { openai } from "@ai-sdk/openai";
import { streamText, UIMessage, convertToModelMessages } from "ai";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { auth } from "@clerk/nextjs/server";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
}

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User ID is not set");
  }

  const {
    messages,
    id,
  }: {
    messages: UIMessage[];
    id: string;
  } = await req.json();

  // Get the SEO report OR Insight report from the database
  let seoReportData = null;
  let insightReportData = null;
  let systemPrompt = `You are an AI assistant helping users understand their reports. 
  
  Provide helpful insights and answer questions about the data and recommendations.`;

  if (id) {
    try {
      // Try to get SEO report first
      const seoJob = await convex.query(api.scrapingJobs.getJobBySnapshotId, {
        snapshotId: id,
        userId: userId,
      });

      if (seoJob?.seoReport) {
        seoReportData = seoJob.seoReport;
        systemPrompt = `You are an AI assistant helping users understand their SEO report.

CURRENT SEO REPORT DATA:
${JSON.stringify(seoReportData, null, 2)}

You have access to comprehensive SEO analysis data for "${seoReportData.meta?.entity_name || "the entity"}" (${seoReportData.meta?.entity_type || "unknown type"}).

Key areas you can help with:
- Overall SEO performance and confidence score
- Source inventory and domain analysis  
- Competitor analysis and market positioning
- Keyword analysis and search visibility
- Backlink profile and authority metrics
- Content gaps and optimization opportunities
- Actionable recommendations for improvement

Use the web_search tool to answer questions about the SEO report if it will help you answer the question.

Provide specific, data-driven insights based on the actual report data. When referencing metrics, use the exact numbers from the report. Be conversational but informative.`;
      } else {
        // Try to get Insight report
        try {
          const insightJob = await convex.query(api.insightReports.getInsightById, {
            id: id as any,
          });

          if (insightJob?.insightReport) {
            insightReportData = insightJob.insightReport;
            systemPrompt = `You are an AI assistant helping users understand their Business Insight report.

CURRENT BUSINESS INSIGHT DATA:
${JSON.stringify(insightReportData, null, 2)}

You have access to comprehensive business analysis for "${insightReportData.title || "this business analysis"}" (${insightReportData.type || "general analysis"}).

Key areas you can help with:
- Business metrics interpretation and trends
- Strategic recommendations and execution playbooks
- Regional and regulatory compliance insights
- Competitive positioning and market analysis
- Risk assessment and mitigation strategies
- Financial projections and scenario planning
- Visualization insights and data storytelling
- Actionable next steps and implementation guidance

The insight includes:
- ${insightReportData.metrics?.length || 0} key metrics
- ${insightReportData.recommendations?.length || 0} strategic recommendations
- ${insightReportData.visualizations?.length || 0} data visualizations
- Regional/regulatory context: ${insightReportData.meta?.regions_regulations?.join(", ") || "Not specified"}
- Richness score: ${insightReportData.meta?.richness_score || "Not calculated"}/100

Use the web_search tool to provide additional context about industry benchmarks, regulatory requirements, or strategic frameworks when helpful.

Provide specific, actionable insights based on the actual report data. Reference exact metrics and recommendations from the analysis. Be conversational, executive-focused, and help users understand both the "what" and the "how" of their business insights.`;
          }
        } catch (insightError) {
          console.log("No insight report found for ID:", id);
        }
      }

      if (!seoReportData && !insightReportData) {
        systemPrompt += `\n\nNote: No report found for ID "${id}". The report may not exist, may still be processing, or you may not have access to it.`;
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      systemPrompt += `\n\nNote: Unable to fetch report data for ID "${id}". The report may not exist or you may not have access to it.`;
    }
  }

  const result = streamText({
    model: openai("gpt-4o"),
    messages: convertToModelMessages(messages),
    system: systemPrompt,
    tools: {
      web_search: openai.tools.webSearch({
        searchContextSize: "high",
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
