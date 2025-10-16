/**
 * System prompt for premium business insight analysis.
 * LLM-First Architecture (2025): Grok as core reasoning engine, enriched by external APIs.
 * Optimized for Grok-4-fast with 2M context window - focused, concise, insight-driven.
 */
export function systemPromptForInsights(): string {
  return `
Eres un estratega senior de McKinsey/BCG. Tu misión: sintetizar datos complejos en insights accionables para C-level executives.

Marca y agente: La app se llama "CrispBaconAI" y el agente también es "CrispBaconAI". Cuando incluyas cabeceras o notas de autoría, usa la marca CrispBaconAI y, cuando aplique, referencia visual al logo (crispbacon1.png).

# CAPACIDADES CORE
- **Análisis estratégico:** SWOT, Porter's Five Forces, BCG Matrix con scoring fundamentado
- **Proyecciones financieras:** Modelos best/base/worst con assumptions explícitos
- **Priorización ROI-driven:** Impact vs. Effort scoring para todas las iniciativas  
- **Identificación de gaps:** Oportunidades competitivas no-obvias y de alto valor

# ESTILO Y CALIDAD
- **Directo y cuantificado:** Cada afirmación con números específicos (%, €, fechas)
- **Sin jerga ni fluff:** Lenguaje ejecutivo claro, evita tecnicismos innecesarios
- **Accionable:** Cada recomendación = Acción concreta + Impacto medible + Timeline + Owner
- **Rich Markdown:** Jerarquía visual clara con emojis estratégicos, bullets, tablas

# PROCESO DE RAZONAMIENTO (Chain-of-Thought)

Antes de generar el report, RAZONA paso a paso:

1. **SÍNTESIS:** ¿Qué patrones clave emergen de market context + competitive data + lead opportunities?
2. **GAPS:** ¿Qué información crítica falta? ¿Cómo inferirla con assumptions razonables?
3. **INSIGHTS NO-OBVIOS:** ¿Qué hallazgos de alto impacto NO son evidentes a simple vista?
4. **QUICK WINS:** ¿Qué acciones tienen ROI >3x y se pueden ejecutar en <3 meses?
5. **RIESGOS:** ¿Qué assumptions o factores externos podrían invalidar las recomendaciones?

# EJEMPLOS DE CALIDAD (Few-Shot Learning)

## ❌ HALLAZGO GENÉRICO (evitar):
"El mercado está creciendo y hay oportunidades de expansión."

## ✅ HALLAZGO ESPECÍFICO (objetivo):
"TAM de €2.4B creciendo 23% YoY (Perplexity). Nuestro SAM (€180M) representa oportunidad de 4x vs. penetración actual del 12%. Competidor líder (Acme Corp) tiene 28% market share con pricing 40% premium según Firecrawl, indicando disposición del mercado a pagar por features enterprise."

## ❌ RECOMENDACIÓN VAGA (evitar):
"Mejorar la estrategia de pricing para aumentar ingresos."

## ✅ RECOMENDACIÓN ACCIONABLE (objetivo):
**ACCIÓN:** Lanzar tier Enterprise a €499/mes (vs. actual €299 Pro)
**JUSTIFICACIÓN:** 34% de leads cualificados tienen budget >€500/mes (Firecrawl lead intel)
**IMPACTO:** +€2.1M ARR en 12 meses (asumiendo 15% conversion de 470 Enterprise leads)
**TIMELINE:** Q1 2026 - Product development (6 sem) + Sales enablement (2 sem)
**OWNER:** Product Manager + RevOps Director
**RIESGO:** Canibalización del 8% de clientes Pro actuales (mitigable con grandfather clause)

# SCORING FRAMEWORKS (para objetividad)

Para cada recomendación, calcula:
- **Impact Score** = (Revenue potential € × Probability %) / 10,000
- **Effort Score** = (Time weeks × Resources FTE) / 5  
- **Priority** = Impact / Effort (solo incluye si Priority > 2.0)

# OUTPUT JSON STRUCTURE

Genera JSON válido conformando BusinessInsight schema con:
- **Executive summary:** Rich Markdown, 3 hallazgos cuantificados, strategic implications
- **Metrics:** Todos los KPIs con values, units, trends, benchmarks
- **Recommendations:** Priorizadas por Impact/Effort con scoring explícito
- **Visualizations:** Mínimo 6-10 charts/tables con datos reales (NO placeholders)
- **Sources:** URLs específicas de Perplexity/Firecrawl/Lead Intel

**IDIOMA:** Español profesional | **TONO:** Consultoría estratégica | **EVIDENCIA:** Cada claim respaldada por data | **BRANDING:** Firma como "CrispBaconAI" cuando corresponda.
`.trim();
}

function serializeSources(sources: Array<{ source?: string; url?: string }>): string[] {
  const unique = new Set<string>();
  sources.forEach(src => {
    if (src.source) unique.add(src.source.trim());
    if (src.url) unique.add(src.url.trim());
  });
  return Array.from(unique).filter(Boolean);
}

/**
 * Builds a user prompt for converting scraping results into a premium BusinessInsight (V2).
 * LLM-First: Data context focused, minimal structural instructions.
 */
export function buildInsightAnalysisPrompt(scrapingData: any[]): string {
  const formatted = scrapingData.map((s, index) => ({
    id: index + 1,
    prompt: s.prompt || s.input || "",
    answer_text: s.answer_text || s.output || s.answer || "",
    sources: s.sources || s.input?.sources || [],
    url: s.url || s.input?.url || "",
    timestamp: s.timestamp || new Date().toISOString(),
  }));

  const flattenedSources = formatted.flatMap(item => item.sources || []).map((src: any) => ({
    source: typeof src === "string" ? src : src?.source || src?.title,
    url: src?.url,
  }));

  return `# MISIÓN
Genera un Business Insight Report ejecutivo con análisis estratégico profundo, recomendaciones priorizadas y visualizaciones basadas en datos reales.

# DATA SOURCES (${formatted.length} entries)

## Research & Market Context
${JSON.stringify(formatted, null, 2)}

## Available Source URLs
${JSON.stringify(serializeSources(flattenedSources), null, 2)}

# OUTPUT REQUIREMENTS

Devuelve **SOLO JSON válido** conformando el schema BusinessInsight:

\`\`\`typescript
{
  // CORE FIELDS (required)
  "type": "string (clients|sales|marketing|product|general)",
  "summary": "string (Executive summary en Rich Markdown, 2-3 párrafos con hallazgos cuantificados)",
  "summary_points": ["string (3-5 key bullets con métricas específicas)"],
  "metrics": [
    {
      "name": "string",
      "value": "number|string", 
      "unit": "string?",
      "trend": "up|down|flat?",
      "benchmark": "number|string?",
      "percentile": "number?"
    }
  ],
  "recommendations": [
    {
      "title": "string (acción concreta)",
      "description": "string (DEBE incluir: acción + justificación + impacto cuantificado + timeline + owner)",
      "priority": "critical|high|medium|low",
      "estimated_impact": "low|medium|high|very_high",
      "estimated_effort": "low|medium|high|very_high",
      "timeline": "string (ej: Q1 2026, 0-3 meses, 6 semanas)"
    }
  ],
  "visualizations": [
    {
      "type": "bar|line|pie|table|text|waterfall|funnel|heatmap|scatter|radar",
      "title": "string",
      "subtitle": "string?",
      "data": "any (DATOS REALES del scraping, NO placeholders)",
      "insights": ["string (interpretación de la visualización)"]?
    }
  ],
  "sources": ["string (URLs de las fuentes)"],
  "generated_at": "ISO-8601 timestamp",
  
  // META (optional but recommended)
  "meta": {
    "analysis_type": "market_analysis|competitive_intelligence|feasibility_study|strategic_review|financial_analysis|business_case|growth_strategy",
    "industry": "string?",
    "geography": "string?",
    "key_themes": ["string (max 5)"],
    "confidence_level": "high|medium|low"
  },
  
  // PREMIUM V2 STRUCTURE (optional - incluye si hay datos suficientes)
  "premium": {
    "executive_summary": {
      "overview": "string",
      "key_findings": ["string"],
      "strategic_implications": "string",
      "recommended_actions": ["string"]
    },
    "strategic_analysis": {
      "swot": { /* Strengths, Weaknesses, Opportunities, Threats con scoring */ },
      "porter_five_forces": { /* 5 forces con score 1-5 y justificación */ },
      "bcg_matrix": { /* Stars, Cash Cows, Question Marks, Dogs */ }
    },
    "market_intelligence": {
      "market_size": { /* TAM, SAM, SOM con assumptions */ },
      "competitors": [ /* Top 5 con positioning, share, strengths */ ],
      "competitive_advantages": [ /* Ventajas sostenibles */ ],
      "market_trends": [ /* Tendencias con impact */ ]
    },
    "financial_analysis": {
      "projections": [ /* Best/Base/Worst scenarios */ ],
      "cost_structure": { /* Fixed, Variable, Drivers */ },
      "unit_economics": { /* CAC, LTV, Ratios, Payback */ }
    },
    "roadmap": {
      "phases": [ /* 30/60/90 day plans */ ]
    },
    "risk_assessment": {
      "risks": [ /* Probability, Impact, Mitigation */ ]
    }
  }
}
\`\`\`

# QUALITY CHECKLIST

✅ **Metrics:** Extrae TODOS los valores numéricos del scraping (min 5-10 metrics)
✅ **Visualizations:** Mínimo 6-8 diferentes usando datos reales (NO ejemplos genéricos)
✅ **Recommendations:** Cada una ESPECÍFICA con impacto cuantificado y timeline
✅ **Sources:** Lista TODAS las URLs scraped
✅ **Consistency:** Proyecciones coherentes con métricas actuales
✅ **Specificity:** Nombres reales (empresas, productos, personas, cifras exactas)

# VALIDATION

- Verifica que cada visualización contenga datos del scraping (no placeholders)
- Asegura que métricas sumen/promedien correctamente
- Cruza que recomendaciones se basen en insights del análisis
- Confirma que sources incluyan URLs reales

Genera el JSON ahora.`.trim();
}

/**
 * Builds a user prompt for converting document content into a premium BusinessInsight (V2).
 * LLM-First: Document context focused, minimal structural instructions.
 */
export function buildDocInsightAnalysisPrompt(documents: Array<{
  source: string;
  content: string;
  pageCount?: number;
  type?: string;
}>): string {
  const formatted = documents.map((doc, index) => ({
    id: index + 1,
    filename: doc.source,
    type: doc.type || "unknown",
    pageCount: doc.pageCount,
    content: doc.content,
  }));

  return `# MISIÓN
Genera un Business Insight Report ejecutivo basado en el análisis profundo de los documentos proporcionados.

# DOCUMENTACIÓN (${formatted.length} files)
${JSON.stringify(formatted, null, 2)}

# OUTPUT REQUIREMENTS

Devuelve **SOLO JSON válido** conformando BusinessInsight schema (igual al formato de scraping analysis).

# FOCUS AREAS

**Prioridades críticas:**
1. Identifica oportunidades de crecimiento medibles con revenue potential específico
2. Evalúa viabilidad financiera y unit economics (CAC, LTV, payback period)
3. Construye roadmap 30/60/90 días con milestones cuantificados
4. Señala riesgos regulatorios/operativos con probability/impact scoring

**Visualizaciones esperadas (min 6-8):**
- Tabla comparativa de alternativas/competidores (con datos reales del doc)
- Waterfall de contribución financiera o cost structure breakdown
- Matriz riesgo vs. probabilidad (risk assessment)
- Funnel o cohortes si hay datos de conversión/pipeline
- Gráfico de proyecciones financieras (best/base/worst scenarios)
- Heatmap de priorización (Impact vs. Effort matrix)

# QUALITY REQUIREMENTS

✅ **Extrae TODOS los números:** Métricas, KPIs, financials, dates, percentages
✅ **Sé específico:** Nombres reales de empresas, productos, personas, lugares
✅ **Recommendations accionables:** Cada una con ROI estimado, timeline, owner asignado
✅ **Assumptions explícitos:** Para proyecciones y estimaciones
✅ **Cross-reference:** Liga métricas → recomendaciones → riesgos
✅ **Sources accuracy:** Lista filenames exactos

# VALIDATION

- NO inventes datos: Si falta info, usa campos opcionales vacíos
- Verifica coherencia numérica (ej: proyecciones alineadas con baseline)
- Asegura que visualizaciones deriven de datos reales del documento
- Confirma que cada recomendación tenga impacto medible

**IDIOMA:** Español profesional | **DELIVERABLE:** Business case listo para consejo directivo

Genera el JSON ahora.`.trim();
}
