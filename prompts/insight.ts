import { BusinessInsight } from "@/lib/insights-schema";

/**
 * System prompt for business insight analysis.
 */
export function systemPromptForInsights(): string {
  return `
Eres un consultor empresarial senior especializado en Business Intelligence y análisis estratégico. Tu función es generar informes técnicos profesionales con insights accionables, siguiendo las mejores prácticas de consultoras como McKinsey, BCG y Bain.

TU EXPERTISE:
 - Análisis SWOT (Fortalezas, Debilidades, Oportunidades, Amenazas)
 - Identificación de KPIs críticos y métricas de negocio
 - Generación de recomendaciones estratégicas priorizadas por impacto
 - Visualización de datos para storytelling ejecutivo
 - Síntesis de información compleja en insights accionables

ESTRUCTURA DEL INFORME (Caso Técnico Empresarial):
1. RESUMEN EJECUTIVO: 3-5 hallazgos clave con impacto directo en negocio
2. MÉTRICAS CLAVE: KPIs cuantificables con tendencias y contexto
3. ANÁLISIS ESTRATÉGICO: Fortalezas, oportunidades, desafíos identificados
4. RECOMENDACIONES: Acciones priorizadas (high/medium/low) con justificación
5. VISUALIZACIONES: Gráficas de soporte (tablas comparativas, tendencias, distribuciones)

REGLAS CRÍTICAS:
 ✓ IDIOMA: TODO en ESPAÑOL profesional (lenguaje ejecutivo, claro, preciso)
 ✓ BASADO EN EVIDENCIA: Cita documentos fuente, no inventes datos
 ✓ ACCIONABLE: Cada recomendación debe tener owner implícito y próximo paso
 ✓ CUANTIFICADO: Usa números, porcentajes, rangos cuando estén disponibles
 ✓ PRIORIZADO: Ordena por impacto-esfuerzo (quick wins primero)
 ✓ VISUAL: Mínimo 2-3 visualizaciones con datos reales extraídos

CALIDAD DE SALIDA:
 - JSON válido conforme al esquema BusinessInsight Zod
 - Lenguaje profesional nivel C-suite (CEO, CFO, CMO)
 - Insights que respondan: "¿Y ahora qué?" y "¿Por qué importa?"
 - Recomendaciones tipo SMART (Específicas, Medibles, Alcanzables, Relevantes, Temporales)
`.trim();
}

/**
 * Builds a user prompt for converting scraping results into a BusinessInsight.
 */
export function buildInsightAnalysisPrompt(scrapingData: any[]): string {
  const formatted = scrapingData.map((s, i) => ({
    id: i + 1,
    prompt: s.prompt || s.input || "",
    answer_text: s.answer_text || s.output || s.answer || "",
    sources: s.sources || s.input?.sources || [],
    url: s.url || s.input?.url || "",
    timestamp: s.timestamp || new Date().toISOString(),
  }));

  return `Analiza los siguientes datos obtenidos por scraping y genera un informe técnico profesional (Business Insight) en formato JSON conforme al esquema BusinessInsight.

DATOS DE SCRAPING:
${JSON.stringify(formatted, null, 2)}

INSTRUCCIONES:
- IDIOMA: TODO en ESPAÑOL profesional.
- RESUMEN EJECUTIVO: 3-5 puntos, priorizados por impacto en negocio.
- MÉTRICAS: Extrae KPIs y números presentes (conversiones, ingresos, CTR, crecimiento, etc.).
- RECOMENDACIONES: 4-8 acciones, cada una con título, descripción y prioridad (high/medium/low).
- VISUALIZACIONES: Incluye al menos 2-3 (table/bar/line/pie) con datos REALES del scraping.
- FUENTES: Cita URLs y referencias disponibles en el campo "sources".
- TÍTULO: Proporciona un título descriptivo en español para el informe (campo "title").

Retorna ÚNICAMENTE el objeto JSON válido (sin texto adicional, sin markdown).`.trim();
}

/**
 * Builds a user prompt for converting document content into a BusinessInsight.
 */
export function buildDocInsightAnalysisPrompt(documents: Array<{
  source: string;
  content: string;
  pageCount?: number;
  type?: string;
}>): string {
  const formatted = documents.map((doc, i) => ({
    id: i + 1,
    filename: doc.source,
    type: doc.type || "unknown",
    pageCount: doc.pageCount,
    contentPreview: doc.content.substring(0, 5000), // First 5K chars preview
    fullContent: doc.content,
  }));

  return `Analiza los siguientes documentos cargados y genera un informe técnico profesional tipo caso empresarial (Business Case) siguiendo el esquema BusinessInsight.

═══════════════════════════════════════════════════════════════
📋 DOCUMENTOS PROPORCIONADOS (${formatted.length} archivo${formatted.length > 1 ? 's' : ''})
═══════════════════════════════════════════════════════════════

${formatted.map(d => `
▶ DOCUMENTO ${d.id}: ${d.filename}
  Tipo: ${d.type?.toUpperCase()} | Páginas: ${d.pageCount || 'N/A'}
  
CONTENIDO COMPLETO:
${d.fullContent}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`).join('\n')}

═══════════════════════════════════════════════════════════════
🎯 INSTRUCCIONES PARA GENERAR EL INFORME TÉCNICO
═══════════════════════════════════════════════════════════════

CONTEXTO: Estás generando un caso técnico empresarial para un proceso de selección/evaluación. El informe debe ser profesional, completo y demostrar capacidad de análisis estratégico.

📊 ESTRUCTURA REQUERIDA DEL INFORME:

1️⃣ TÍTULO Y TIPO (Campo "title" y "type"):
   - Genera un título profesional que resuma el tema central (ej: "Análisis Estratégico: Transformación Digital en el Sector Retail")
   - Tipo: identifica la categoría ("estrategia", "mercado", "producto", "operaciones", "tecnología", etc.)

2️⃣ RESUMEN EJECUTIVO (Campo "summary"):
   - 3-5 hallazgos clave de alto nivel (bullet points)
   - Responde: ¿Qué encontramos? ¿Por qué importa? ¿Cuál es el impacto?
   - Usa lenguaje ejecutivo, conciso, orientado a decisión
   - Ejemplo: "• Identificamos 3 oportunidades de crecimiento valoradas en €2.5M anuales con ROI estimado de 180%"

3️⃣ MÉTRICAS CLAVE (Campo "metrics"):
   - Extrae TODOS los números, KPIs, porcentajes, ratios mencionados en los documentos
   - Cada métrica debe tener: nombre descriptivo, valor, unidad, y trend (si es posible inferir)
   - Prioriza métricas de negocio: ingresos, costos, conversión, market share, crecimiento, eficiencia
   - Ejemplos:
     * {name: "Tasa de Conversión Actual", value: 2.3, unit: "%", trend: "down"}
     * {name: "Inversión Requerida", value: "€50,000-€75,000", unit: "EUR", trend: "flat"}
     * {name: "Market Share", value: 15.7, unit: "%", trend: "up"}

4️⃣ RECOMENDACIONES ESTRATÉGICAS (Campo "recommendations"):
   - Genera 4-8 recomendaciones accionables basadas en el análisis
   - Prioriza por impacto (high = alto impacto/urgencia, medium = importante pero no urgente, low = mejora continua)
   - Cada recomendación debe seguir formato:
     * TÍTULO: Acción concreta (verbo + objetivo) - ej: "Implementar programa de fidelización digital"
     * DESCRIPCIÓN: Justificación + pasos concretos + beneficio esperado (2-3 frases)
   - Ordena: HIGH primero, luego MEDIUM, luego LOW
   - Ejemplo:
     {
       title: "Optimizar el embudo de conversión digital",
       description: "Los datos muestran un drop-off del 67% en checkout. Implementar checkout en un solo paso y añadir trust badges podría aumentar conversión en 25-40% según benchmarks del sector. Quick win con ROI estimado en 3 meses.",
       priority: "high"
     }

5️⃣ VISUALIZACIONES (Campo "visualizations"):
   - OBLIGATORIO: Genera mínimo 3 visualizaciones con datos REALES extraídos de los documentos
   - Tipos disponibles: "table", "bar", "line", "pie"
   - Cada visualización debe contar una historia clara y apoyar un insight
   
   EJEMPLOS DE VISUALIZACIONES:
   
   📊 TABLA COMPARATIVA:
   {
     type: "table",
     title: "Comparación de Alternativas de Implementación",
     data: [
       {alternativa: "Solución A", costo: "€50K", tiempo: "3 meses", roi: "180%"},
       {alternativa: "Solución B", costo: "€120K", tiempo: "6 meses", roi: "240%"},
       {alternativa: "Solución C", costo: "€30K", tiempo: "2 meses", roi: "95%"}
     ]
   }
   
   📈 GRÁFICO DE BARRAS (Comparación de categorías):
   {
     type: "bar",
     title: "Distribución de Oportunidades por Área de Negocio",
     data: [
       {categoria: "Ventas", valor: 45},
       {categoria: "Marketing", valor: 30},
       {categoria: "Operaciones", valor: 15},
       {categoria: "Tecnología", valor: 10}
     ]
   }
   
   📉 GRÁFICO DE LÍNEA (Tendencias temporales):
   {
     type: "line",
     title: "Evolución Proyectada de Ingresos (12 meses)",
     data: [
       {periodo: "Q1", valor: 100000},
       {periodo: "Q2", valor: 125000},
       {periodo: "Q3", valor: 165000},
       {periodo: "Q4", valor: 210000}
     ]
   }
   
   🥧 GRÁFICO CIRCULAR (Distribución porcentual):
   {
     type: "pie",
     title: "Análisis SWOT - Distribución de Factores",
     data: [
       {categoria: "Fortalezas", porcentaje: 35},
       {categoria: "Oportunidades", porcentaje: 30},
       {categoria: "Debilidades", porcentaje: 20},
       {categoria: "Amenazas", porcentaje: 15}
     ]
   }

6️⃣ FUENTES (Campo "sources"):
   - Lista TODOS los nombres de archivo analizados
   - Ejemplo: ["documento1.pdf", "documento2.docx", "analisis_mercado.txt"]

7️⃣ METADATA (Campo "meta"):
   - Añade contexto adicional útil:
     * documentCount: número de documentos analizados
     * totalPages: suma de páginas
     * analysisType: tipo de análisis realizado (ej: "SWOT", "Market Analysis", "Feasibility Study")
     * keyThemes: 3-5 temas principales identificados
     * confidenceLevel: "high" si hay datos suficientes, "medium" si hay gaps

═══════════════════════════════════════════════════════════════
✅ CHECKLIST DE CALIDAD (Verifica antes de retornar)
═══════════════════════════════════════════════════════════════

□ Todo el texto está en ESPAÑOL profesional
□ El título es descriptivo y refleja el contenido
□ El resumen ejecutivo tiene 3-5 puntos concisos
□ Hay mínimo 5 métricas cuantitativas con valores reales
□ Las recomendaciones están priorizadas (high/medium/low)
□ Cada recomendación es accionable y específica
□ Hay mínimo 3 visualizaciones con datos reales
□ Las fuentes incluyen todos los archivos analizados
□ El JSON es válido y cumple el esquema BusinessInsight
□ El informe responde: ¿Qué? ¿Por qué? ¿Y ahora qué?

═══════════════════════════════════════════════════════════════

⚡ GENERA EL INFORME AHORA - Retorna ÚNICAMENTE JSON válido, sin texto adicional, sin markdown, solo el objeto JSON.`.trim();
}
