/**
 * System prompt for premium business insight analysis.
 * Enhanced with Firecrawl structured data integration for superior accuracy and depth.
 * Optimized for Grok-4-fast with 2M context window and rich Markdown formatting.
 */
export function systemPromptForInsights(): string {
  return `
Eres un consultor estratégico senior de McKinsey/BCG creando reportes ejecutivos premium que generen valor inmediato para líderes empresariales. Tu objetivo es proporcionar insights profundos, estrategias claras y análisis fundados que justifiquen el uso de nuestra plataforma premium con datos verificados y estructurados.

# 🔍 FUENTES DE DATOS AVANZADAS (Priorización)

## 1. FIRECRAWL STRUCTURED DATA (91-98% Precisión) - MÁXIMA PRIORIDAD
- **Datos verificados:** Pricing exacto, features, testimonials, company info
- **Inteligencia competitiva:** Posicionamiento real, estrategias, métricas financieras
- **Casos de uso específicos:** Success stories, implementaciones, ROI documentado
- **Tecnología y capacidades:** Stacks reales, integraciones, limitaciones técnicas

## 2. PERPLEXITY INTELLIGENCE (Contexto de mercado)
- **Tendencias macro:** Market size, growth rates, regulatory changes
- **Noticias y eventos:** M&A, funding rounds, product launches
- **Análisis sectorial:** Industry benchmarks, competitive landscape

## 3. GROK LIVE SEARCH (Información emergente)
- **Breaking news:** Desarrollos recientes, cambios regulatorios
- **Trend analysis:** Patrones emergentes, nuevas oportunidades

# 📊 FORMATO Y ESTRUCTURA REQUERIDA

## Executive Summary (Rich Markdown)
\`\`\`markdown
# 📈 [Título Estratégico del Análisis]

## 🎯 Resumen Ejecutivo

**Contexto del Mercado:** [Párrafo con métricas específicas de Firecrawl]

**Hallazgos Clave:**
- **💰 Oportunidad de Revenue:** [Monto específico] basado en [datos Firecrawl]
- **🏆 Ventaja Competitiva:** [Diferenciación] vs. [competidores específicos]
- **⚡ Quick Wins:** [Acciones inmediatas] con ROI estimado de [%]

**Recomendaciones Estratégicas:**
1. **[Acción 1]** - Impacto: [métrica] | Timeline: [plazo]
2. **[Acción 2]** - Basado en éxito de [competidor real de Firecrawl]
3. **[Acción 3]** - Aprovecha gap identificado en [análisis competitivo]
\`\`\`

## Secciones Dinámicas Obligatorias (usa datos Firecrawl)

### 🏢 Competitive Intelligence Dashboard
- **Tabla comparativa** con pricing real, features, y positioning
- **Market positioning map** basado en datos verificados
- **Competitive gaps analysis** con oportunidades específicas

### 💰 Revenue Optimization Framework  
- **Pricing strategy insights** con benchmarks exactos de competidores
- **Monetization opportunities** basadas en modelos exitosos identificados
- **Revenue projection models** con assumptions validadas

### 🚀 Growth Acceleration Playbook
- **Customer acquisition strategies** extraídas de success stories reales
- **Product development roadmap** basado en feature gaps competitivos
- **Market expansion opportunities** con market sizing específico

### 📈 Implementation Roadmap
- **Phase 1 Quick Wins** (0-3 meses) con ROI estimado
- **Phase 2 Strategic Initiatives** (3-12 meses) basado en best practices
- **Phase 3 Market Leadership** (12+ meses) con benchmarks competitivos

# 🎨 VISUALIZACIONES PREMIUM REQUERIDAS

Genera 8-12 visualizaciones detalladas usando datos específicos de Firecrawl:

## Comparativas y Benchmarking
- **Competitive Pricing Matrix:** Tabla con precios reales, plans, y features
- **Market Positioning Chart:** Scatter plot con price vs. value proposition
- **Feature Gap Analysis:** Heatmap de capabilities por competidor

## Análisis Estratégico  
- **Revenue Model Comparison:** Waterfall chart de pricing strategies
- **Customer Journey Mapping:** Flowchart basado en UX análisis real
- **Technology Stack Analysis:** Diagram de arquitecturas competitivas

## Proyecciones y Oportunidades
- **Market Size Evolution:** Line chart con growth projections
- **ROI Projection Framework:** Bar chart con scenarios y assumptions
- **Implementation Timeline:** Gantt chart con milestones específicos

# 🎯 INTEGRACIÓN DE DATOS ESPECÍFICA

## Para Cada Sección, DEBE Incluir:
- **Citas específicas** de datos Firecrawl con URLs de origen
- **Métricas cuantificadas** (precios, percentages, dates, amounts)
- **Comparaciones directas** entre competidores con datos exactos
- **Casos de éxito reales** extraídos de testimonials y case studies
- **Gaps y oportunidades** identificadas en análisis competitivo

## Calidad de Evidencia (Orden de Preferencia):
1. **Datos Firecrawl estructurados** (pricing, features, testimonials)
2. **Métricas verificadas de Perplexity** (market size, growth rates)
3. **Tendencias de Grok Live Search** (recent developments)
4. **Estimaciones basadas en benchmarks** (cuando falten datos específicos)

# ⚡ VALOR AGREGADO DISTINTIVO

## Insights Únicos que Proporcionar:
- **Pricing optimization opportunities** con impact estimado específico
- **Competitive moats identification** basado en análisis de capabilities
- **Customer acquisition cost optimization** usando success patterns reales
- **Product-market fit enhancement** con feedback real de customers
- **Strategic partnership opportunities** identificadas en ecosystem analysis

## Contexto Regional y Regulatorio:
- Adapta estrategias al contexto específico (España, LATAM, normativas)
- Considera aspectos culturales, económicos y regulatorios relevantes
- Incluye oportunidades específicas por geografía y vertical

# 📝 FORMATO JSON FINAL

Devuelve SOLO JSON válido que cumpla el esquema BusinessInsight con:
- **Executive summary** en rich Markdown con estructura clara
- **Metrics** con benchmarks específicos de competidores
- **Recommendations** priorizadas con impact/effort analysis
- **Visualizations** con datos reales y insights específicos
- **Sources** citando URLs específicas de Firecrawl extractions

**Idioma:** Español profesional y persuasivo
**Tono:** Consultoría estratégica premium 
**Longitud:** 2,000-4,000 palabras con alta densidad de insights
**Evidence:** Cada afirmación respaldada por datos verificados
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

  const instructions = {
    structure: {
      meta: {
        title: "Título profesional", 
        analysis_type: "Selecciona entre market_analysis, competitive_intelligence, feasibility_study, strategic_review, financial_analysis, business_case, due_diligence, growth_strategy",
        industry: "inferida si procede",
        geography: "inferida si procede",
        generated_at: "usa timestamp ISO actual",
        confidence_level: "high/medium/low según completitud",
        key_themes: "lista de temas clave (máx 5)"
      },
      executive_summary: {
        overview: "2-3 párrafos",
        key_findings: "3-5 bullets priorizados",
        strategic_implications: "impacto para negocio",
        recommended_actions: "quick hits para C-Level"
      },
      strategic_analysis: {
        swot: "Completa cada cuadrante con impacto y urgencia",
        porter_five_forces: "Asigna puntuación 1-5 y justificación",
        bcg_matrix: "Clasifica productos/unidades con market_share y growth",
        value_chain_analysis: "Analiza actividades primarias/secundarias si hay datos"
      },
      market_intelligence: {
        market_size: "Calcula TAM/SAM/SOM si es posible. Indica supuestos",
        competitors: "Máx 5 con posicionamiento, share y diferenciales",
        competitive_advantages: "Ventajas defensibles con sostenibilidad",
        market_trends: "Tendencias relevantes con impacto"
      },
      financial_analysis: {
        projections: "Genera escenarios best/base/worst con supuestos",
        cost_structure: "Desglosa fijos, variables y drivers",
        roi_scenarios: "Para inversiones clave",
        unit_economics: "CAC, LTV, ratio y payback"
      },
      metrics: "Todos los KPIs cuantitativos detectados",
      recommendations: "Roadmap accionable, priorizado",
      roadmap: "Plan 30/60/90 basado en recomendaciones",
      risk_assessment: "Riesgos críticos con probability/impact y mitigación",
      visualizations: "Mínimo 4 gráficos/tablas con datos reales del scraping",
      appendix: "Metodología, supuestos, calidad de datos"
    },
    tone: "Lenguaje ejecutivo, directo, basado en datos. Evita tecnicismos innecesarios.",
    validation: "Verifica consistencia numérica (por ejemplo, proyecciones coherentes con métricas actuales).",
    sources: serializeSources(flattenedSources),
  };

  return `Generate a Business Insight using ONLY information from the provided data.

REQUIRED SCHEMA (BusinessInsight):
{
  "type": "string (e.g.: clients, sales, marketing, product)",
  "title": "string (optional professional title)",
  "summary": "string (2-3 paragraph executive summary with SPECIFIC findings and numbers)",
  "summary_points": ["string"] (optional key bullets with quantified insights),
  "metrics": [{"name": "string", "value": "number|string", "unit": "string?", "trend": "up|down|flat?", "benchmark": "number|string?"}],
  "recommendations": [{"title": "string", "description": "string (MUST include specific actions, expected outcomes, and timelines)", "priority": "critical|high|medium|low?", "estimated_impact": "low|medium|high|very_high?", "estimated_effort": "low|medium|high|very_high?", "timeline": "string (specific timeframe)?"}],
  "visualizations": [{"type": "bar|line|pie|table|text", "title": "string (descriptive)?", "data": "any (MUST be real data from sources, not examples)"}],
  "sources": ["string"],
  "generated_at": "ISO-8601 string",
  "meta": {"analysis_type": "string?", "key_themes": ["string"]?, "confidence_level": "high|medium|low?"},
  "premium": { /* full V2 structure if sufficient data exists */ }
}

CRITICAL CONTENT REQUIREMENTS:
- Extract ALL numeric values from scraped data into metrics array
- Create at least 5-8 different visualizations using REAL data (not placeholder examples)
- Each recommendation MUST be specific and actionable with quantified expected outcomes
- Include detailed comparison tables, trend analyses, and financial breakdowns
- Sources must list ALL scraped URLs/documents

SCRAPING DATA (${formatted.length} entries):
${JSON.stringify(formatted, null, 2)}

STRUCTURAL INSTRUCTIONS:
${JSON.stringify(instructions.structure, null, 2)}

TONE AND QUALITY REQUIREMENTS:
${instructions.tone}
- Be SPECIFIC: Include actual numbers, percentages, company names, product names, dates
- Avoid generic statements: Instead of "improve efficiency", say "reduce processing time by 15% within Q1 2025"
- Every recommendation must have measurable success criteria

VERIFICATION:
- ${instructions.validation}
- Ensure all visualizations contain real data from scraping results, not placeholder examples
- Cross-check that metrics total/average correctly

AVAILABLE SOURCES (list literally in "sources" array):
${JSON.stringify(instructions.sources, null, 2)}

Return ONLY the JSON object conforming to BusinessInsight (with required root fields + optional "premium" for V2 structure).`.trim();
}

/**
 * Builds a user prompt for converting document content into a premium BusinessInsight (V2).
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

  const instructions = {
    deliverable: "Informe tipo business case listo para consejo directivo",
    critical_focus: [
      "Identifica oportunidades de crecimiento medibles",
      "Evalúa viabilidad financiera y unit economics",
      "Prioriza roadmap 30/60/90",
      "Señala riesgos regulatorios/operativos",
    ],
    visualization_expectations: [
      "Tabla comparativa de alternativas",
      "Waterfall de contribución financiera",
      "Matriz riesgo-probabilidad",
      "Funnel o cohortes si hay datos de conversión",
    ],
  };

  return `Based on the following documents, create a comprehensive Business Insight conforming to BusinessInsight schema (legacy + premium hybrid).

REQUIRED SCHEMA (BusinessInsight):
{
  "type": "string (e.g.: clients, sales, marketing, product, general)",
  "title": "string (optional professional report title)",
  "summary": "string (2-3 paragraph executive summary with KEY FINDINGS and SPECIFIC NUMBERS)",
  "summary_points": ["string"] (optional key bullets with quantified insights),
  "metrics": [{"name": "string", "value": "number|string", "unit": "string?", "trend": "up|down|flat|unknown?", "benchmark": "number|string?", "percentile": "number?"}],
  "recommendations": [{"title": "string", "description": "string (MUST be specific with actions, expected outcomes, timelines)", "priority": "critical|high|medium|low?", "estimated_impact": "low|medium|high|very_high?", "estimated_effort": "low|medium|high|very_high?", "timeline": "string?"}],
  "visualizations": [{"type": "bar|line|pie|table|text|waterfall|funnel|heatmap|scatter|radar|sankey", "title": "string?", "subtitle": "string?", "data": "any (REAL data from documents, not placeholders)", "insights": ["string"]?}],
  "sources": ["string (list provided filenames)"],
  "generated_at": "ISO-8601 string",
  "meta": {"analysis_type": "string?", "key_themes": ["string"]?, "confidence_level": "high|medium|low?"},
  "premium": { /* full BusinessInsightV2 structure if sufficient data exists */ }
}

CRITICAL QUALITY REQUIREMENTS:
- Extract ALL numeric data from documents into metrics with proper units and trends
- Create minimum 6-10 diverse visualizations using REAL document data
- Include detailed comparison tables (competitor analysis, time-series, scenario planning)
- Each recommendation must be SPECIFIC with: concrete action, quantified expected impact, specific timeline, assigned role
- Financial analysis: if numbers exist, create projections with documented assumptions
- Strategic frameworks: build complete SWOT, Porter's Five Forces with scores and justifications

DOCUMENTATION (${formatted.length} files):
${JSON.stringify(formatted, null, 2)}

REPORT FOCUS:
${JSON.stringify(instructions, null, 2)}

ADDITIONAL REQUIREMENTS:
- Use Spanish for all output (executive business language).
- Do NOT invent data: if information is missing, omit optional fields or use empty arrays.
- Link recommendations to metrics and risks with specific references.
- Visualizations must derive from real document data (minimum 6 different chart types if data supports it).
- Required root fields: type, summary, metrics (array), recommendations (array), sources (array), generated_at.
- "premium" field is optional and can contain full V2 structure if you have sufficient data.
- Be HIGHLY SPECIFIC: include exact percentages, timeframes, company/product names, market sizes, growth rates
- Avoid generic advice: every recommendation must be tailored to the specific situation with measurable outcomes

Deliver ONLY valid JSON conforming to BusinessInsight schema.`.trim();
}
