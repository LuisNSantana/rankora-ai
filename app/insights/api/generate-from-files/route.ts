import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api, internal } from "@/convex/_generated/api";
import { extractFromMultipleDocuments } from "@/lib/doc-extract";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { BusinessInsightSchema } from "@/lib/insights-schema";
import { sanitizeKeysDeep } from "@/lib/sanitize-keys";
import { systemPromptForInsights, buildDocInsightAnalysisPrompt } from "@/prompts/insight";
import type { Id } from "@/convex/_generated/dataModel";

// Set max file size and runtime to Node (needed for pdf-parse)
export const runtime = "nodejs";
export const maxDuration = 60; // 60 seconds max

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // 2. Parse multipart form data
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
  const title = formData.get("title") as string | null;
  const existingJobId = formData.get("jobId") as string | null;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided. Please upload at least one document." },
        { status: 400 }
      );
    }

    // Limit to 5 files max
    if (files.length > 5) {
      return NextResponse.json(
        { error: "Too many files. Maximum 5 files allowed." },
        { status: 400 }
      );
    }

    // 3. Initialize Convex client
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    // 4. Create or attach to job
    let jobId: Id<"insightReports">;
    if (existingJobId) {
      jobId = existingJobId as unknown as Id<"insightReports">;
    } else {
      jobId = await convex.mutation(api.insightReports.createInsightReport, {
        userId,
        originalPrompt: title || `Document analysis: ${files.map(f => f.name).join(", ")}`,
        analysisPrompt: `Analyzing ${files.length} document(s)`,
        status: "pending",
        results: [],
        insightReport: undefined,
        error: undefined,
        createdAt: Date.now(),
        completedAt: undefined,
        archived: false,
      });
    }

    // 5. Extract text from all documents
    console.log(`[Insight Job ${jobId}] Extracting text from ${files.length} files...`);
    await convex.mutation(api.insightReports.appendLog, { id: jobId, msg: `Extracting text from ${files.length} file(s)...`, level: "info" });
    
    const extractedDocs = await extractFromMultipleDocuments(files);

    // Check for extraction errors
    const failedDocs = extractedDocs.filter((doc) => doc.error);
    const successDocs = extractedDocs.filter((doc) => !doc.error && doc.content);

    if (successDocs.length === 0) {
      const errorMsg = `All files failed to extract:\n${failedDocs.map(d => `- ${d.source}: ${d.error}`).join('\n')}`;
      await convex.mutation(api.insightReports.patchInsightReport, {
        id: jobId,
        patch: {
          status: "failed",
          error: errorMsg,
          completedAt: Date.now(),
        },
      });
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    // Warn if some files failed but proceed with successful ones
    if (failedDocs.length > 0) {
  console.warn(`[Insight Job ${jobId}] Some files failed extraction:`, failedDocs.map(d => d.source));
  await convex.mutation(api.insightReports.appendLog, { id: jobId, msg: `Some files failed extraction: ${failedDocs.map(d => d.source).join(", ")}`, level: "warn" });
    }

    // 6. Update job with extracted content
    await convex.mutation(api.insightReports.patchInsightReport, {
      id: jobId,
      patch: {
        status: "analyzing",
        results: successDocs.map((doc) => ({
          source: doc.source,
          content: doc.content,
          pageCount: doc.pageCount,
          type: doc.type,
          size: doc.size,
        })),
      },
    });

    // 7. Generate insight using AI
  console.log(`[Insight Job ${jobId}] Generating AI insight from ${successDocs.length} documents...`);
  await convex.mutation(api.insightReports.appendLog, { id: jobId, msg: `Generating AI insight from ${successDocs.length} document(s)...`, level: "info" });

    const analysisPrompt = buildDocInsightAnalysisPrompt(successDocs);

    // Save analysis prompt for debugging
    await convex.mutation(api.insightReports.patchInsightReport, {
      id: jobId,
      patch: { analysisPrompt },
    });

    // Generate structured insight with fallback sequence of models
    const modelCandidates = [
      "gpt-4o", // primary per request
      "gpt-4.1", // fallback
    ];
    let insight: any = null;
    let lastErr: any = null;
    for (const modelId of modelCandidates) {
      try {
  console.log(`[Insight Job ${jobId}] Trying model: ${modelId}`);
  await convex.mutation(api.insightReports.appendLog, { id: jobId, msg: `Trying model: ${modelId}`, level: "info" });
        const { object } = await generateObject({
          model: openai(modelId),
          system: systemPromptForInsights(),
          prompt: analysisPrompt,
          schema: BusinessInsightSchema as any,
          maxOutputTokens: 128000,
        });
        insight = object;
        break;
      } catch (err: any) {
  lastErr = err;
  const reason = err?.reason || err?.message || String(err);
  console.warn(`[Insight Job ${jobId}] Model failed: ${modelId}`, reason);
  await convex.mutation(api.insightReports.appendLog, { id: jobId, msg: `Model failed: ${modelId} - ${reason}`, level: "warn" });
        // Try next model
      }
    }

    if (!insight) {
      // Last-chance fallback: ask for raw JSON via text and try to parse
      try {
        await convex.mutation(api.insightReports.appendLog, { id: jobId, msg: `Attempting JSON fallback coercion…`, level: "warn" });
        const { generateText } = await import("ai");
        const jsonOnlyPrompt = `${systemPromptForInsights()}\n\nDevuelve EXCLUSIVAMENTE un objeto JSON que siga este esquema (claves en español):\n{\n  "type": "string",\n  "title": "string",\n  "summary": "string",\n  "metrics": [{"name": "string", "value": "string|number", "unit": "string?", "trend": "string?"}],\n  "recommendations": [{"title": "string", "description": "string", "priority": "high|medium|low?"}],\n  "visualizations": [{"type": "table|bar|line|pie", "title": "string?", "data": "any"}],\n  "sources": ["string"],\n  "generated_at": "ISO-8601 string",\n  "meta": {"documentCount": "number?", "totalPages": "number?"}
}\n\nAnálisis:\n${analysisPrompt}\n\nIMPORTANTE: Responder SOLO el JSON válido. Sin markdown, sin comentarios.`;
        const textResp = await generateText({ model: openai(modelCandidates.at(-1)!), prompt: jsonOnlyPrompt, maxOutputTokens: 32768 });
        const raw = textResp.text.trim().replace(/^```(json)?/i, "").replace(/```$/i, "");
        const parsed = JSON.parse(raw);
        insight = parsed;
        await convex.mutation(api.insightReports.appendLog, { id: jobId, msg: `JSON fallback parsed successfully`, level: "info" });
      } catch (fallbackErr: any) {
        const msg = `All model attempts failed: ${modelCandidates.join(", ")}`;
        await convex.mutation(api.insightReports.appendLog, { id: jobId, msg: `All models failed. Last error: ${lastErr?.message || String(lastErr)}`, level: "error" });
        await convex.mutation(api.insightReports.patchInsightReport, {
          id: jobId,
          patch: { status: "failed", error: `${msg} | Last error: ${lastErr?.message || String(lastErr)}`, completedAt: Date.now() },
        });
        return NextResponse.json({ error: msg, details: lastErr?.message || String(lastErr) }, { status: 502 });
      }
    }

  console.log(`[Insight Job ${jobId}] Insight generated successfully`);
  await convex.mutation(api.insightReports.appendLog, { id: jobId, msg: `Insight object generated successfully`, level: "info" });

    // 7.1 Ensure the report has at least basic visualizations and generated_at
    try {
      // generated_at fallback if missing/invalid
      if (!insight.generated_at || isNaN(Date.parse(insight.generated_at))) {
        insight.generated_at = new Date().toISOString();
      }
      // If there are no or too few visualizations, derive from metrics
      const metrics = Array.isArray(insight.metrics) ? insight.metrics : [];
      const visualizations = Array.isArray(insight.visualizations) ? insight.visualizations : [];
      const numericMetrics = metrics
        .map((m: any) => ({
          categoria: m.name,
          valor: typeof m.value === "string" ? Number(String(m.value).replace(/[^0-9.-]/g, "")) : Number(m.value),
        }))
        .filter((m: any) => isFinite(m.valor));

      if (visualizations.length < 2 && numericMetrics.length >= 2) {
        // Add a table of metrics if not present
        visualizations.push({
          type: "table",
          title: "Métricas derivadas",
          data: metrics.map((m: any) => ({ nombre: m.name, valor: String(m.value), unidad: m.unit || "", tendencia: m.trend || "" })),
        });
        // Add a bar chart derived from numeric metrics
        visualizations.push({
          type: "bar",
          title: "Resumen de métricas (derivado)",
          data: numericMetrics.slice(0, 10),
        });
      }
      insight.visualizations = visualizations;
    } catch (e) {
      console.warn(`[Insight Job ${jobId}] Could not augment visualizations:`, e);
    }

    // 8. Save completed insight (sanitize keys to avoid non-ASCII field names)
  const safeInsight = sanitizeKeysDeep(insight);
    await convex.mutation(api.insightReports.patchInsightReport, {
      id: jobId,
      patch: {
        insightReport: {
          ...safeInsight,
          // Add document metadata
          meta: {
            ...(safeInsight.meta || {}),
            documentCount: successDocs.length,
            failedDocuments: failedDocs.length > 0 ? failedDocs.map(d => ({ source: d.source, error: d.error })) : undefined,
            totalPages: successDocs.reduce((sum, d) => sum + (d.pageCount || 0), 0),
          },
        },
        status: "completed",
        completedAt: Date.now(),
        error: undefined,
      },
    });

    // 9. Return success with job ID
    return NextResponse.json({
      success: true,
      _id: jobId,
      documentCount: successDocs.length,
      failedCount: failedDocs.length,
      message: `Successfully analyzed ${successDocs.length} document(s)${failedDocs.length > 0 ? ` (${failedDocs.length} failed)` : ""}`,
    });

  } catch (error: any) {
    console.error("[Generate from files] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate insight from documents",
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}
