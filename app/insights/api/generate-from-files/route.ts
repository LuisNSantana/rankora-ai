import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api, internal } from "@/convex/_generated/api";
import { extractFromMultipleDocuments } from "@/lib/doc-extract";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { xai, GROK_MODELS, calculateGrokCost, createUsageRecord } from "@/lib/xai-client";
import { BusinessInsightSchema } from "@/lib/insights-schema";
import { sanitizeKeysDeep } from "@/lib/sanitize-keys";
import { systemPromptForInsights, buildDocInsightAnalysisPrompt } from "@/prompts/insight";
import type { Id } from "@/convex/_generated/dataModel";
import {
  detectIndustry,
  getIndustryBenchmarks,
  getIndustryTrends,
  getRegulatoryContext,
  benchmarkMetrics,
} from "@/lib/industry-intelligence";
import {
  conductMarketResearch,
  analyzeCompetitors,
  researchCustomerProfiles,
  trackRegulatoryUpdates,
  synthesizeLiveResearch,
} from "@/lib/grok-live-search";

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

    // 7.0 LIVE RESEARCH PHASE (Optional - only if enabled)
    // Detect sector and conduct live market research using Grok-4-fast
    const joinedContent = successDocs.map(d => d.content).join('\n\n');
    const detectedSector = detectIndustry(joinedContent);
    
    let liveResearchData: any = null;
    let liveSearchUsed = false;
    
    // TODO: Make this conditional based on user tier/preference
    const enableLiveSearch = true; // For now, always enabled for premium insights
    
    if (enableLiveSearch && detectedSector && detectedSector !== 'Unknown') {
      try {
        console.log(`[Insight Job ${jobId}] Conducting live market research for sector: ${detectedSector}`);
        await convex.mutation(api.insightReports.appendLog, { 
          id: jobId, 
          msg: `🔍 Conducting live market research (sector: ${detectedSector})...`, 
          level: "info" 
        });
        
        // Conduct multiple live searches in parallel
        const [marketResearch, competitorAnalysis, customerProfiles] = await Promise.all([
          conductMarketResearch({ sector: detectedSector as string }),
          analyzeCompetitors({ sector: detectedSector as string }),
          researchCustomerProfiles({ sector: detectedSector as string }),
        ]);
        
        // Synthesize findings
        const synthesis = await synthesizeLiveResearch([
          marketResearch,
          competitorAnalysis,
          customerProfiles,
        ]);
        
        liveResearchData = {
          sector: detectedSector,
          marketResearch: marketResearch.synthesis,
          competitorAnalysis: competitorAnalysis.synthesis,
          customerProfiles: customerProfiles.synthesis,
          synthesis,
          totalSources: marketResearch.totalSources + competitorAnalysis.totalSources + customerProfiles.totalSources,
        };
        
        liveSearchUsed = true;
        
        console.log(`[Insight Job ${jobId}] ✓ Live research completed (${liveResearchData.totalSources} sources)`);
        await convex.mutation(api.insightReports.appendLog, { 
          id: jobId, 
          msg: `✓ Live research completed (${liveResearchData.totalSources} sources from web, news, X)`, 
          level: "info" 
        });
      } catch (liveErr: any) {
        console.warn(`[Insight Job ${jobId}] Live research failed:`, liveErr);
        await convex.mutation(api.insightReports.appendLog, { 
          id: jobId, 
          msg: `⚠️ Live research failed: ${liveErr.message}. Continuing with static analysis...`, 
          level: "warn" 
        });
      }
    }

    // Generate structured insight with Grok-4-fast as primary model
    // New strategy: Grok-4-fast (primary - 2M context + live search), fallback to GPT-4o-mini → GPT-4o → GPT-4.1
    const modelCandidates = [
      { provider: "xai", model: GROK_MODELS.PRIMARY, label: "grok-4-fast-reasoning" }, // Primary - 2M context
      { provider: "openai", model: "gpt-4o-mini", label: "gpt-4o-mini" },              // Fallback 1 - cost optimized
      { provider: "openai", model: "gpt-4o", label: "gpt-4o" },                        // Fallback 2 - higher quality
      { provider: "openai", model: "gpt-4.1", label: "gpt-4.1" },                      // Last resort - deep reasoning
    ];
    let insight: any = null;
    let lastErr: any = null;
    let usageRecord: any = null;
    
    const progressiveSchemas: Array<{ label: string; schema: any; maxTokens: number }> = [
      { label: "minimal", schema: BusinessInsightSchema.pick({ type: true, summary: true, metrics: true, recommendations: true, sources: true, generated_at: true }) as any, maxTokens: 50000 },
      { label: "full", schema: BusinessInsightSchema as any, maxTokens: 100000 }, // Increased for Grok-4-fast massive output capacity
    ];
    
    const startTime = Date.now();
    
    for (const candidate of modelCandidates) {
      console.log(`[Insight Job ${jobId}] Trying model: ${candidate.label}`);
      await convex.mutation(api.insightReports.appendLog, { id: jobId, msg: `Model ${candidate.label} start`, level: "info" });
      
      for (const phase of progressiveSchemas) {
        try {
          await convex.mutation(api.insightReports.appendLog, { id: jobId, msg: `Phase ${phase.label} with ${candidate.label}`, level: "info" });
          
          // Enhance prompt with live research if available
          let enhancedPrompt = analysisPrompt;
          if (liveResearchData) {
            enhancedPrompt = `${analysisPrompt}

---

## LIVE MARKET RESEARCH (Real-time data from web, news, and X)

**Sector Detected:** ${liveResearchData.sector}

**Market Trends:**
${liveResearchData.marketResearch}

**Competitive Landscape:**
${liveResearchData.competitorAnalysis}

**Customer Insights:**
${liveResearchData.customerProfiles}

**Key Findings:**
${liveResearchData.synthesis.keyFindings.join('\n')}

**Opportunities:**
${liveResearchData.synthesis.opportunities.join('\n')}

**Risks:**
${liveResearchData.synthesis.risks.join('\n')}

IMPORTANT: Incorporate these live insights into your analysis. Reference specific trends, competitors, and market data in your recommendations.
`;
          }
          
          const result = await generateObject({
            model: candidate.provider === "xai" ? xai(candidate.model) : openai(candidate.model),
            system: systemPromptForInsights(),
            prompt: enhancedPrompt,
            schema: phase.schema,
            maxOutputTokens: phase.maxTokens,
          });
          
          insight = result.object;
          
          // Track usage for cost analytics
          const usage = (result as any).usage || { promptTokens: 0, completionTokens: 0 };
          
          if (candidate.provider === "xai") {
            usageRecord = createUsageRecord({
              model: candidate.label,
              inputTokens: usage.promptTokens || 0,
              outputTokens: usage.completionTokens || 0,
              cachedTokens: 0, // TODO: Implement caching
              insightId: jobId,
              usedLiveSearch: liveSearchUsed,
              liveSearchSources: liveResearchData?.totalSources || 0,
            });
          }
          
          insight.meta = {
            ...(insight.meta || {}),
            generation: {
              model: candidate.label,
              provider: candidate.provider,
              phase: phase.label,
              usage: usage,
              cost: usageRecord?.cost,
              elapsedMs: Date.now() - startTime,
              generatedAt: new Date().toISOString(),
              liveSearchUsed: liveSearchUsed,
              liveSearchSources: liveResearchData?.totalSources || 0,
            },
          };
          
          await convex.mutation(api.insightReports.appendLog, { 
            id: jobId, 
            msg: `Success ${candidate.label} phase ${phase.label} (cost: $${usageRecord?.cost?.toFixed(4) || 'N/A'})`, 
            level: "info" 
          });
          break;
        } catch (phaseErr: any) {
          const rsn = phaseErr?.reason || phaseErr?.message || String(phaseErr);
          await convex.mutation(api.insightReports.appendLog, { id: jobId, msg: `Phase ${phase.label} failed on ${candidate.label}: ${rsn}`, level: "warn" });
          lastErr = phaseErr;
        }
      }
      
      if (insight) {
        console.log(`[Insight Job ${jobId}] ✓ Success with ${candidate.label}`);
        await convex.mutation(api.insightReports.appendLog, { id: jobId, msg: `✓ Generated with ${candidate.label}`, level: "info" });
        break;
      } else {
        console.warn(`[Insight Job ${jobId}] Exhausted phases for ${candidate.label}`);
        await convex.mutation(api.insightReports.appendLog, { id: jobId, msg: `Exhausted phases for ${candidate.label}`, level: "warn" });
      }
    }

    if (!insight) {
      // Last-chance fallback: raw JSON attempt + schema repair
      try {
        await convex.mutation(api.insightReports.appendLog, { id: jobId, msg: `Attempting JSON fallback coercion…`, level: "warn" });
        const { generateText } = await import("ai");
        const jsonOnlyPrompt = `${systemPromptForInsights()}\n\nDevuelve EXCLUSIVAMENTE un objeto JSON válido que siga este esquema (claves en español, sin comentarios):\n{\n  "type": "string",\n  "title": "string",\n  "summary": "string",\n  "metrics": [{"name": "string", "value": "string|number", "unit": "string?", "trend": "up|down|flat|unknown?"}],\n  "recommendations": [{"title": "string", "description": "string", "priority": "critical|high|medium|low?"}],\n  "visualizations": [{"type": "table|bar|line|pie", "title": "string?", "data": "any"}],\n  "sources": ["string"],\n  "generated_at": "ISO-8601 string"\n}\n\nMaterial analizado:\n${analysisPrompt}\n\nIMPORTANTE: Responder SOLO el JSON. Sin markdown.`;
  const textResp = await generateText({ model: openai("gpt-4o-mini"), prompt: jsonOnlyPrompt, maxOutputTokens: 8000 });
        let raw = textResp.text.trim();
        raw = raw.replace(/^```(json)?/i, "").replace(/```$/i, "").trim();
        // Basic repair heuristics
        if (!raw.endsWith("}")) {
          raw = raw.slice(0, raw.lastIndexOf("}") + 1);
        }
        try {
          insight = JSON.parse(raw);
        } catch (parseErr) {
          // Attempt minor fixes: remove trailing commas
          raw = raw.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");
          insight = JSON.parse(raw);
        }
        await convex.mutation(api.insightReports.appendLog, { id: jobId, msg: `JSON fallback parsed & repaired`, level: "info" });
        insight.meta = {
          ...(insight.meta || {}),
          generation: { model: "gpt-4o-mini-fallback", repaired: true, generatedAt: new Date().toISOString() },
        };
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
      if (!insight.summary || insight.summary.length < 60) {
        const metricNames = metrics.slice(0,5).map((m: any)=>m?.name).filter(Boolean).join(", ");
        insight.summary = `Resumen generado automáticamente sobre ${metrics.length} métricas clave: ${metricNames}`;
      }
      // Enrichment: ensure numeric normalization & add metric_count
      insight.meta = {
        ...(insight.meta || {}),
        metric_count: metrics.length,
      };
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

    // 7.2 Deterministic enrichment layer (adds regional/regulatory context & derives better metrics/recommendations)
    try {
  const sourceTexts: string[] = successDocs.map(d => d.content).filter(Boolean);
      const joined = sourceTexts.join(" \n ");
      // Region & regulation inference heuristic
      const regionHints: Record<string,string> = {
        "mexico":"LatAm / México",
        "españa":"EU / España",
        "spain":"EU / España",
        "chile":"LatAm / Chile",
        "colombia":"LatAm / Colombia",
        "peru":"LatAm / Perú",
        "argentina":"LatAm / Argentina",
        "gdpr":"GDPR (UE)",
        "hipaa":"HIPAA (US Healthcare)",
        "ccpa":"CCPA (California)",
        "iso 27001":"ISO 27001",
        "soc 2":"SOC 2",
      };
      const detected: string[] = [];
      for (const key of Object.keys(regionHints)) {
        if (new RegExp(key, "i").test(joined)) detected.push(regionHints[key]);
      }
      const uniqueDetected = Array.from(new Set(detected));
      insight.meta = {
        ...(insight.meta || {}),
        regions_regulations: uniqueDetected,
      };
      // Derive contextual numeric metrics from text if metrics < 18
      const existingMetrics: Array<{ name: string; value: unknown; unit?: string; trend?: string }> = Array.isArray(insight.metrics) ? insight.metrics : [];
      if (existingMetrics.length < 18) {
        // Split into sentences/lines to capture surrounding context
        const blocks = joined.split(/\n+|(?<=[.!?])\s+/).filter(Boolean).slice(0, 2000);
        const numberRegex = /(\$|€|USD|EUR|ARS|CLP|COP|MXN)?\s*([+-]?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?|\d+(?:\.\d+)?)(\s*%\b)?/g;
        const labelMap: Array<{ keys: RegExp; label: string; unit?: string }> = [
          { keys: /(ingresos|ventas|revenue|facturación)/i, label: "Ingresos" },
          { keys: /(coste|costo|gasto|expenses|opex|capex)/i, label: "Costes" },
          { keys: /(margen|margin|gross margin|ebitda)/i, label: "Margen" },
          { keys: /(crecimiento|growth|cagr)/i, label: "Crecimiento", unit: "%" },
          { keys: /(conversión|conversion rate|ctr|cvr)/i, label: "Tasa de conversión", unit: "%" },
          { keys: /(retención|retencion|retention|churn)/i, label: "Churn/Retención", unit: "%" },
          { keys: /(costo\s*de\s*adquisición|cac)/i, label: "CAC" },
          { keys: /(ltv|lifetime\s*value)/i, label: "LTV" },
          { keys: /(mrr|ingreso\s*mensual\s*recurrente)/i, label: "MRR" },
          { keys: /(arr|ingreso\s*anual\s*recurrente)/i, label: "ARR" },
          { keys: /(usuarios\s*activos|maus?|daus?)/i, label: "Usuarios activos" },
          { keys: /(tasa\s*de\s*apertura|open\s*rate)/i, label: "Tasa de apertura", unit: "%" },
          { keys: /(inventario|existencias)/i, label: "Inventario" },
        ];
        const currencyMap: Array<{ re: RegExp; unit: string }> = [
          { re: /\$/i, unit: "$" },
          { re: /€/i, unit: "€" },
          { re: /USD/i, unit: "USD" },
          { re: /EUR/i, unit: "EUR" },
          { re: /MXN/i, unit: "MXN" },
          { re: /COP/i, unit: "COP" },
          { re: /ARS/i, unit: "ARS" },
          { re: /CLP/i, unit: "CLP" },
        ];

        const derived: Array<{ name: string; value: string; unit?: string }> = [];
        for (const blk of blocks) {
          const local = blk.slice(0, 320); // limit window
          let match: RegExpExecArray | null;
          numberRegex.lastIndex = 0;
          while ((match = numberRegex.exec(local)) !== null) {
            const [full, curSym, numStrRaw, percent] = match;
            const numStr = String(numStrRaw);
            // Grab 8 words before the number as candidate label
            const before = local.slice(0, Math.max(0, match.index)).split(/\s+/).slice(-8).join(" ");
            const after = local.slice(match.index + full.length).split(/\s+/).slice(0, 6).join(" ");
            const context = `${before} ${after}`;
            let label: string | null = null;
            for (const m of labelMap) {
              if (m.keys.test(context)) { label = m.label; break; }
            }
            if (!label) {
              // Fallback: take 2-4 preceding words (title case)
              const words = before.replace(/[^\p{L}\p{N}\s%]/gu, "").trim().split(/\s+/);
              const pick = words.slice(-4).join(" ").trim();
              label = pick && /[\p{L}]{3,}/u.test(pick) ? pick.replace(/\s+/g, " ") : null;
            }
            if (!label) continue; // skip unlabeled numbers

            // Determine unit
            let unit: string | undefined = undefined;
            if (percent) unit = "%";
            if (!unit && curSym) unit = currencyMap.find(c => c.re.test(curSym))?.unit;
            if (!unit) {
              // Check currency in context
              const ctxCurrency = currencyMap.find(c => c.re.test(context));
              if (ctxCurrency) unit = ctxCurrency.unit;
            }

            const name = label.length > 2 ? label.replace(/\s+/g, " ").trim().replace(/^[-–:•]+\s*/, "") : null;
            if (!name) continue;
            derived.push({ name, value: percent ? `${numStr}%` : numStr, unit });
          }
          if (derived.length > 40) break; // limit
        }

        // Deduplicate by name+value and drop noisy generic names
        const dedup: Array<{ name: string; value: string; unit?: string }> = [];
        const seen = new Set<string>();
        for (const m of derived) {
          const key = `${m.name.toLowerCase()}|${m.value}`;
          if (m.name.toLowerCase().startsWith("dato ")) continue; // never add generic
          if (!seen.has(key)) { seen.add(key); dedup.push(m); }
          if (dedup.length >= 30) break;
        }
        const merged = existingMetrics.concat(
          dedup.filter(m => !existingMetrics.some(em => (em.name || "").toLowerCase() === m.name.toLowerCase()))
        ).slice(0, 50);
        insight.metrics = merged;
      }
      // Add baseline recommendations if too few, and augment with execution playbooks (el "cómo")
      if (!Array.isArray(insight.recommendations) || insight.recommendations.length < 10) {
        const baseRecs = (insight.recommendations || []);
        const autoRecs = [
          {
            title: "Auditoría regulatoria inicial",
            description: "Realizar auditoría de cumplimiento para normativas detectadas (" + uniqueDetected.join(", ") + ") en próximos 30 días.",
            priority: "high",
            estimated_impact: "medium",
            estimated_effort: "low",
            timeline: "0-30 días"
          },
          {
            title: "Mapa de KPIs ampliado",
            description: "Estandarizar extracción automática de los datos numéricos identificados y consolidarlos en dashboard interno.",
            priority: "medium",
            estimated_impact: "high",
            estimated_effort: "medium",
            timeline: "30-60 días"
          },
          {
            title: "Framework de riesgos regionales",
            description: "Crear matriz de riesgos (probabilidad/impacto) para las jurisdicciones detectadas y definir mitigaciones.",
            priority: "high",
            estimated_impact: "high",
            estimated_effort: "low",
            timeline: "0-45 días"
          }
        ];
        insight.recommendations = baseRecs.concat(autoRecs).slice(0,20);
      }

      // Enrich each recommendation with a concise execution playbook embedded in description and store in meta.playbooks
      if (Array.isArray(insight.recommendations)) {
        const playbooks: Array<{ title: string; steps: string[]; tools: string[]; kpis: string[]; owner: string; timeline?: string }> = [];
        insight.recommendations = insight.recommendations.map((rec: any) => {
          const title: string = String(rec.title || "Recomendación");
          const isCompliance = /regul|gdpr|ccpa|iso|soc|auditor/i.test(title + " " + (rec.description || ""));
          const owner = isCompliance ? "Compliance Officer" : "Growth Lead / PM";
          const tools = isCompliance ? ["Confluence", "Jira", "OneTrust"] : ["GA4/Looker Studio", "HubSpot/CRM", "Segment/Amplitude"];
          const kpis = isCompliance ? ["% Controles implementados", "# Hallazgos críticos resueltos"] : ["Impacto esperado alcanzado (%)", "Tiempo de ciclo por sprint"];
          const steps = [
            "Definir objetivo y establecer KPI base (línea de partida)",
            isCompliance ? "Mapear requisitos aplicables y brechas actuales" : "Diseñar experimento/implementación en sprints (1-2 semanas)",
            `Configurar herramientas: ${tools.join(", ")}`,
            "Ejecución y medición continua (tablero semanal)",
            "Retroalimentación y ajuste sobre resultados (iteración)"
          ];
          const timeline = rec.timeline || (isCompliance ? "0-30 días" : "30-60 días");
          const how = `\n\nCómo ejecutar:\n- Pasos: ${steps.map(s=>s).join("; ")}\n- Herramientas: ${tools.join(", ")}\n- KPIs: ${kpis.join(", ")}\n- Owner: ${owner}\n- Horizonte: ${timeline}`;
          const desc: string = String(rec.description || "");
          const already = /Cómo ejecutar:/i.test(desc);
          const newDesc = already ? desc : (desc ? `${desc}${how}` : how);
          playbooks.push({ title, steps, tools, kpis, owner, timeline });
          return { ...rec, description: newDesc };
        });
        insight.meta = { ...(insight.meta || {}), playbooks };
      }
      // Ensure sources array present
      if (!Array.isArray(insight.sources) || insight.sources.length === 0) {
        insight.sources = successDocs.map(d => d.source).slice(0,20);
      }

      // 7.3 Compute richness score for premium tier detection
      const metricCount = Array.isArray(insight.metrics) ? insight.metrics.length : 0;
      const recCount = Array.isArray(insight.recommendations) ? insight.recommendations.length : 0;
      const vizCount = Array.isArray(insight.visualizations) ? insight.visualizations.length : 0;
      const regionCount = uniqueDetected.length;
      const playbookCount = Array.isArray(insight.recommendations) ? insight.recommendations.filter((r: any) => /Cómo ejecutar:/i.test(r.description || "")).length : 0;
      
      // Weighted scoring: metrics(2), recommendations(3), visualizations(1.5), regions(2), playbooks(2.5)
      const rawScore = (metricCount * 2) + (recCount * 3) + (vizCount * 1.5) + (regionCount * 2) + (playbookCount * 2.5);
      // Normalize to 0-100 scale (max expected raw: ~250 = premium tier)
      const richness_score = Math.min(100, Math.round((rawScore / 250) * 100));
      
      // Tier classification
      let richness_tier: "basic" | "standard" | "premium" | "elite" = "basic";
      if (richness_score >= 80) richness_tier = "elite";
      else if (richness_score >= 60) richness_tier = "premium";
      else if (richness_score >= 35) richness_tier = "standard";
      
      insight.meta = {
        ...(insight.meta || {}),
        richness_score,
        richness_tier,
        richness_details: {
          metrics: metricCount,
          recommendations: recCount,
          visualizations: vizCount,
          regions: regionCount,
          playbooks: playbookCount,
        },
      };

      // 7.4 Industry Intelligence Layer - detect sector and add benchmarks/trends
      try {
        console.log(`[Insight Job ${jobId}] Running Industry Intelligence analysis...`);
        await convex.mutation(api.insightReports.appendLog, { id: jobId, msg: "Running Industry Intelligence layer...", level: "info" });
        
        // Detect industry from content
        const detectedIndustry = detectIndustry(joined);
        console.log(`[Insight Job ${jobId}] Detected industry: ${detectedIndustry || "Unknown"}`);
        
        if (detectedIndustry) {
          // Get industry benchmarks
          const benchmarks = getIndustryBenchmarks(detectedIndustry);
          
          // Compare user metrics against benchmarks
          const userMetrics = (insight.metrics || []).map((m: any) => ({
            name: String(m.name || ""),
            value: m.value,
          }));
          const benchmarkComparisons = benchmarkMetrics(userMetrics, benchmarks);
          
          // Get industry trends
          const trends = getIndustryTrends(detectedIndustry);
          
          // Get regulatory context for detected regions
          const regulatoryContext = getRegulatoryContext(uniqueDetected);
          
          // Store industry intelligence in meta
          insight.meta = {
            ...(insight.meta || {}),
            industry: {
              sector: detectedIndustry,
              detected_confidence: "auto-detected",
            },
            benchmarks: benchmarkComparisons.map(bc => ({
              metric: bc.metric,
              user_value: bc.user_value,
              industry_avg: bc.industry_avg,
              performance: bc.performance,
              gap_analysis: bc.gap,
            })),
            industry_trends: trends.map(t => ({
              name: t.trend_name,
              direction: t.direction,
              impact: t.impact_level,
              horizon: t.time_horizon,
              actions: t.recommended_actions,
            })),
            regulatory_intelligence: regulatoryContext.map(rc => ({
              region: rc.region,
              regulations: rc.regulations.map(reg => ({
                name: reg.name,
                priority: reg.compliance_priority,
                requirements: reg.key_regulations,
              })),
            })),
          };
          
          // Add industry-specific recommendations if we have trends
          if (trends.length > 0 && Array.isArray(insight.recommendations)) {
            const industryRecs = trends.slice(0, 2).map(trend => ({
              title: `[Tendencia ${detectedIndustry}] ${trend.trend_name}`,
              description: `${trend.description}\n\nImpacto esperado: ${trend.impact_level}\nHorizonte temporal: ${trend.time_horizon}\n\nCómo ejecutar:\n- Pasos: ${trend.recommended_actions.join("; ")}\n- Owner: Strategic Planning / Innovation Lead\n- Horizonte: ${trend.time_horizon === "short-term" ? "0-6 meses" : trend.time_horizon === "medium-term" ? "6-18 meses" : "18-36 meses"}`,
              priority: trend.impact_level === "critical" ? "critical" : trend.impact_level === "high" ? "high" : "medium",
              estimated_impact: trend.impact_level,
              estimated_effort: trend.time_horizon === "short-term" ? "medium" : "high",
              timeline: trend.time_horizon === "short-term" ? "0-6 meses" : trend.time_horizon === "medium-term" ? "6-18 meses" : "18-36 meses",
            }));
            insight.recommendations = [...(insight.recommendations || []), ...industryRecs].slice(0, 25);
          }
          
          // Add benchmark-based insights to visualizations
          if (benchmarkComparisons.length > 0 && Array.isArray(insight.visualizations)) {
            const benchmarkViz = {
              type: "table",
              title: `Benchmark vs Industria (${detectedIndustry})`,
              subtitle: "Comparativa de tus métricas contra estándares del sector",
              data: benchmarkComparisons.map(bc => ({
                Métrica: bc.metric,
                "Tu Valor": bc.user_value,
                "Promedio Industria": bc.industry_avg,
                Desempeño: bc.performance,
                "Análisis": bc.gap,
              })),
              insights: benchmarkComparisons
                .filter(bc => bc.performance === "excellent" || bc.performance === "below-average")
                .map(bc => `${bc.metric}: ${bc.gap}`),
            };
            insight.visualizations = [...(insight.visualizations || []), benchmarkViz];
          }
          
          console.log(`[Insight Job ${jobId}] ✓ Industry Intelligence added: ${benchmarkComparisons.length} benchmarks, ${trends.length} trends, ${regulatoryContext.length} regulatory contexts`);
          await convex.mutation(api.insightReports.appendLog, { 
            id: jobId, 
            msg: `Industry Intelligence: ${detectedIndustry} | ${benchmarkComparisons.length} benchmarks | ${trends.length} trends`, 
            level: "info" 
          });
        } else {
          console.log(`[Insight Job ${jobId}] No industry detected from content`);
        }
      } catch (industryErr) {
        console.warn(`[Insight Job ${jobId}] Industry Intelligence failed`, industryErr);
        await convex.mutation(api.insightReports.appendLog, { 
          id: jobId, 
          msg: `Industry Intelligence failed: ${(industryErr as any)?.message || String(industryErr)}`, 
          level: "warn" 
        });
      }
    } catch (enrichErr) {
      console.warn(`[Insight Job ${jobId}] Enrichment layer failed`, enrichErr);
      await convex.mutation(api.insightReports.appendLog, { id: jobId, msg: `Enrichment failed: ${ (enrichErr as any)?.message || String(enrichErr) }`, level: "warn" });
    }

    // 8. Save completed insight using scalable storage strategy
    const safeInsight = sanitizeKeysDeep(insight);
    const finalInsight = {
      ...safeInsight,
      // Add document metadata
      meta: {
        ...(safeInsight.meta || {}),
        documentCount: successDocs.length,
        failedDocuments: failedDocs.length > 0 ? failedDocs.map(d => ({ source: d.source, error: d.error })) : undefined,
        totalPages: successDocs.reduce((sum, d) => sum + (d.pageCount || 0), 0),
        source_types: successDocs.reduce((acc: Record<string, number>, d) => {
          const t = d.type || "unknown";
          acc[t] = (acc[t] || 0) + 1;
          return acc;
        }, {}),
      },
    };

    // Use scalable storage function (handles DB vs File Storage automatically)
    console.log(`[Insight Job ${jobId}] Saving insight with scalable storage...`);
    await convex.mutation(api.insightReports.appendLog, { 
      id: jobId, 
      msg: `Saving insight with intelligent storage strategy...`, 
      level: "info" 
    });

    const storageResult = await convex.action(api.insightReports.saveInsightReport, {
      id: jobId,
      insightData: finalInsight,
    });

    console.log(`[Insight Job ${jobId}] Saved using ${storageResult.storage} storage (${(storageResult.size / 1024).toFixed(2)} KB)`);
    await convex.mutation(api.insightReports.appendLog, { 
      id: jobId, 
      msg: `Insight saved: ${storageResult.storage} storage, ${(storageResult.size / 1024).toFixed(2)} KB`, 
      level: "info" 
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
