import { BusinessInsight, BusinessInsightRecommendation } from "@/lib/insights-schema";
import type { BusinessInsightV2, SWOTAnalysisType, PorterFiveForcesType, FinancialProjectionType, ActionItemType } from "@/lib/insights-schema-v2";
// Lazy chart rendering setup to avoid Turbopack "module as expression is too dynamic" error at import time.
// We only import chartjs-node-canvas when we actually need a chart and wrap in try/catch to fail gracefully in constrained environments.
import type { ChartConfiguration } from "chart.js";
let chartRenderer: any = null;
async function ensureChartRenderer(): Promise<typeof chartRenderer | null> {
  if (chartRenderer) return chartRenderer;
  try {
    const mod = await import("chartjs-node-canvas");
    const { ChartJSNodeCanvas } = mod as any;
    chartRenderer = new ChartJSNodeCanvas({
      width: 1200,
      height: 640,
      backgroundColour: "#ffffff",
      chartCallback: (ChartJS: any) => {
        if ("registerables" in ChartJS && Array.isArray((ChartJS as any).registerables)) {
          ChartJS.register(...((ChartJS as any).registerables as any[]));
        }
      },
    });
    return chartRenderer;
  } catch (e) {
    console.warn("Chart rendering deshabilitado (dependencia no disponible)", e);
    return null;
  }
}

type PriorityKey = "critical" | "high" | "medium" | "low";

type RecommendationBuckets = Record<PriorityKey, BusinessInsightRecommendation[]>;

type PremiumRoadmap = BusinessInsightV2["roadmap"];

type MetricEntry = {
  name: string;
  display: string;
  numericValue: number | null;
  unit?: string;
  trend?: string;
};

const priorityOrder: PriorityKey[] = ["critical", "high", "medium", "low"];

const priorityLabels: Record<PriorityKey, string> = {
  critical: "Crítico",
  high: "Alto",
  medium: "Medio",
  low: "Bajo",
};

const priorityColorTokens: Record<PriorityKey, string> = {
  critical: "#b91c1c",
  high: "#db2777",
  medium: "#ca8a04",
  low: "#0f766e",
};

const priorityDescription: Record<PriorityKey, string> = {
  critical: "Riesgo inmediato o impacto directo en ingresos. Ejecutar en 24-48h.",
  high: "Impacto elevado. Programar en el próximo sprint.",
  medium: "Impacto relevante con urgencia moderada.",
  low: "Acciones de optimización o seguimiento continuo.",
};

// Helpers para cuantificar impacto / esfuerzo (heurística si no viene explícito)
function impactToNumeric(level?: string | null): number {
  switch ((level || '').toLowerCase()) {
    case 'very_high': return 4;
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
    default: return 0;
  }
}
function effortToNumeric(level?: string | null): number {
  // Menor esfuerzo = mejor para priorizar; invertimos escala para usabilidad en matriz (pero mantenemos 1-4 base)
  switch ((level || '').toLowerCase()) {
    case 'very_high': return 4;
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
    default: return 0;
  }
}
function inferImpactFromPriority(p: PriorityKey): number {
  if (p === 'critical') return 4; if (p === 'high') return 3; if (p === 'medium') return 2; return 1;
}
function inferEffortFromPriority(p: PriorityKey): number {
  if (p === 'critical') return 2; if (p === 'high') return 2; if (p === 'medium') return 3; return 3;
}

function escapeHtml(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizePriority(priority?: string | null): PriorityKey {
  const parsed = String(priority ?? "").toLowerCase();
  if (parsed === "critical") return "critical";
  if (parsed === "high") return "high";
  if (parsed === "medium") return "medium";
  if (parsed === "low") return "low";
  return "medium";
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/\s/g, "");
    const matched = cleaned.match(/-?\d+(?:[.,]\d+)?/);
    if (matched) {
      const normalized = matched[0].replace(",", ".");
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : null;
    }
  }
  return null;
}

function collectMetricEntries(metrics: BusinessInsight["metrics"]): MetricEntry[] {
  return metrics.map((metric) => ({
    name: metric.name,
    display: `${escapeHtml(metric.name)}: ${escapeHtml(metric.value)}${metric.unit ? ` ${escapeHtml(metric.unit)}` : ""}${metric.trend ? ` (${escapeHtml(metric.trend)})` : ""}`,
    numericValue: toNumber(metric.value),
    unit: metric.unit,
    trend: metric.trend,
  }));
}

async function buildMetricChart(metrics: BusinessInsight["metrics"]): Promise<string | null> {
  const entries = collectMetricEntries(metrics)
    .filter((entry) => entry.numericValue !== null)
    .slice(0, 10);

  if (entries.length < 2) return null;

  const configuration: ChartConfiguration<"bar", number[], string> = {
    type: "bar",
    data: {
      labels: entries.map((entry) => entry.name),
      datasets: [
        {
          label: "Valor",
          data: entries.map((entry) => entry.numericValue ?? 0),
          backgroundColor: "rgba(34, 80, 200, 0.65)",
          borderColor: "rgba(34, 80, 200, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      indexAxis: entries.length > 6 ? "y" : "x",
      responsive: false,
      scales: {
        x: {
          ticks: { color: "#1f2937" },
          grid: { color: "rgba(148, 163, 184, 0.25)" },
        },
        y: {
          ticks: { color: "#1f2937" },
          grid: { color: "rgba(148, 163, 184, 0.25)" },
        },
      },
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "Top métricas cuantitativas",
          color: "#1f2937",
          font: { size: 18, weight: "bold" },
        },
      },
    },
  };

  const renderer = await ensureChartRenderer();
  if (!renderer) return null;
  try {
    const rendered = await renderer.renderToBuffer(configuration);
    return rendered.toString("base64");
  } catch (e) {
    console.warn("Fallo al renderizar gráfico", e);
    return null;
  }
}

function bucketRecommendations(recommendations: BusinessInsight["recommendations"]): RecommendationBuckets {
  return recommendations.reduce<RecommendationBuckets>((acc, recommendation) => {
    const key = normalizePriority(recommendation.priority);
    acc[key].push(recommendation);
    return acc;
  },
  {
    critical: [],
    high: [],
    medium: [],
    low: [],
  });
}

function renderList(items: string[], className = "list") {
  if (!items || items.length === 0) return "";
  return `<ul class="${className}" role="list">${items
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("")}</ul>`;
}

function renderKeyValueTable(rows: Array<Record<string, string | number | null | undefined>>, caption: string) {
  if (!rows || rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const thead = `<thead><tr>${headers.map((header) => `<th scope="col">${escapeHtml(header)}</th>`).join("")}</tr></thead>`;
  const tbody = `<tbody>${rows
    .map((row) => `<tr>${headers
      .map((header) => `<td>${escapeHtml(row[header] ?? "—")}</td>`)
      .join("")}</tr>`)
    .join("")}</tbody>`;
  return `<figure class="table" role="group" aria-label="${escapeHtml(caption)}"><figcaption>${escapeHtml(caption)}</figcaption><table>${thead}${tbody}</table></figure>`;
}

function renderRecommendationSection(buckets: RecommendationBuckets) {
  const totals = priorityOrder
    .map((priority) => {
      const count = buckets[priority].length;
      return count ? `${priorityLabels[priority]}: ${count}` : null;
    })
    .filter(Boolean)
    .join(" · ");

  // Build summary table (count by priority & avg impact / effort if present)
  const summaryRows: Array<Record<string, string | number>> = [];
  priorityOrder.forEach((p) => {
    if (!buckets[p].length) return;
    const impacts = buckets[p].map(r => impactToNumeric(r.estimated_impact)).map(v => v || inferImpactFromPriority(p));
    const efforts = buckets[p].map(r => effortToNumeric(r.estimated_effort)).map(v => v || inferEffortFromPriority(p));
    const impactScore = impacts.length ? (impacts.reduce((a,c)=> a + c,0) / impacts.length).toFixed(2) : '—';
    const effortScore = efforts.length ? (efforts.reduce((a,c)=> a + c,0) / efforts.length).toFixed(2) : '—';
    summaryRows.push({ Prioridad: priorityLabels[p], Acciones: buckets[p].length, "Impacto medio": impactScore, "Esfuerzo medio": effortScore });
  });

  const cards = priorityOrder
    .map((priority) => {
      const items = buckets[priority];
      if (!items.length) return "";
      const list = items
        .map((item) => {
          const tags: string[] = [];
          if (item.estimated_impact) tags.push(`Impacto ${escapeHtml(item.estimated_impact)}`);
          if (item.estimated_effort) tags.push(`Esfuerzo ${escapeHtml(item.estimated_effort)}`);
          if (item.timeline) tags.push(`Horizonte ${escapeHtml(item.timeline)}`);
          return `<article class="card" aria-label="${escapeHtml(item.title)}">
            <header>
              <h4>${escapeHtml(item.title)}</h4>
              <span class="chip" style="--chip-color:${priorityColorTokens[priority]}">${priorityLabels[priority]}</span>
            </header>
            <p>${escapeHtml(item.description)}</p>
            ${tags.length ? `<p class="meta">${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join(" ")}</p>` : ""}
          </article>`;
        })
        .join("");

      return `<section class="priority" aria-labelledby="priority-${priority}">
        <h3 id="priority-${priority}" class="band" style="--band-color:${priorityColorTokens[priority]}">
          ${priorityLabels[priority]}
        </h3>
        <p class="band-description">${escapeHtml(priorityDescription[priority])}</p>
        <div class="grid">${list}</div>
      </section>`;
    })
    .join("");

  return `<section id="recomendaciones" class="section">
    <header>
      <h2>Recomendaciones accionables</h2>
      ${totals ? `<p class="meta">Distribución de prioridades · ${escapeHtml(totals)}</p>` : ""}
    </header>
    ${summaryRows.length ? renderKeyValueTable(summaryRows, "Resumen cuantitativo de recomendaciones") : ""}
    ${cards || `<p>No se reportaron recomendaciones.</p>`}
  </section>`;
}

function renderSwot(swot?: SWOTAnalysisType) {
  if (!swot) return "";
  const entries: Array<{ id: string; label: string; items: { title: string; description: string }[] }> = [
    { id: "strengths", label: "Fortalezas", items: swot.strengths },
    { id: "weaknesses", label: "Debilidades", items: swot.weaknesses },
    { id: "opportunities", label: "Oportunidades", items: swot.opportunities },
    { id: "threats", label: "Amenazas", items: swot.threats },
  ];
  const oppSummary = swot.opportunities.slice(0,3).map(o => `• ${escapeHtml(o.title)}`).join(" ");
  const threatSummary = swot.threats.slice(0,3).map(t => `• ${escapeHtml(t.title)}`).join(" ");
  const grid = entries
    .map((entry) => {
      if (!entry.items?.length) return "";
      return `<article class="card" aria-labelledby="swot-${entry.id}">
        <header>
          <h4 id="swot-${entry.id}">${escapeHtml(entry.label)}</h4>
        </header>
        <ul role="list">
          ${entry.items
            .map((item) => `<li><strong>${escapeHtml(item.title)}:</strong> ${escapeHtml(item.description)}</li>`)
            .join("")}
        </ul>
      </article>`;
    })
    .join("");
  return grid ? `<section id="analisis-estrategico" class="section">
    <header><h2>Marco estratégico (SWOT)</h2></header>
    <div class="grid">${grid}</div>
    ${(oppSummary || threatSummary) ? `<p class="meta">Síntesis · Oportunidades clave: ${oppSummary || "—"} / Amenazas clave: ${threatSummary || "—"}</p>` : ""}
  </section>` : "";
}

function renderPorter(porter?: PorterFiveForcesType) {
  if (!porter) return "";
  const rows = [
    { Fuerza: "Rivalidad competitiva", Intensidad: porter.competitive_rivalry.score, Claves: porter.competitive_rivalry.key_factors.join(", ") },
    { Fuerza: "Poder de proveedores", Intensidad: porter.supplier_power.score, Claves: porter.supplier_power.key_factors.join(", ") },
    { Fuerza: "Poder de clientes", Intensidad: porter.buyer_power.score, Claves: porter.buyer_power.key_factors.join(", ") },
    { Fuerza: "Amenaza nuevos entrantes", Intensidad: porter.threat_new_entrants.score, Claves: porter.threat_new_entrants.key_factors.join(", ") },
    { Fuerza: "Sustitutos", Intensidad: porter.threat_substitutes.score, Claves: porter.threat_substitutes.key_factors.join(", ") },
  ];
  return `<section class="section">
    <header><h2>Intensidad competitiva (Porter)</h2></header>
    ${renderKeyValueTable(rows, "Resumen de fuerzas competitivas")}
    <p class="meta">Atracción total del mercado: ${escapeHtml(porter.overall_attractiveness)}</p>
  </section>`;
}

function renderFinancialProjections(projections?: FinancialProjectionType[]) {
  if (!projections || projections.length === 0) return "";
  const content = projections
    .map((projection, index) => {
      const rows = projection.revenue_forecast.map((point) => ({
        Periodo: point.period,
        Valor: point.value,
        "¿Forecast?": point.forecast ? "Sí" : "No",
      }));
      return `<article class="card" aria-labelledby="escenario-${index}">
        <header><h4 id="escenario-${index}">Escenario ${escapeHtml(projection.scenario)}</h4></header>
        ${renderKeyValueTable(rows, "Proyección de ingresos")}
        ${renderList(projection.assumptions, "list inline")}
      </article>`;
    })
    .join("");
  return `<section class="section" id="finanzas">
    <header><h2>Escenarios financieros</h2></header>
    <div class="grid">${content}</div>
  </section>`;
}

function renderRoadmap(roadmap?: PremiumRoadmap, buckets?: RecommendationBuckets) {
  const phases: Array<{ id: string; label: string; description: string; actions: ActionItemType[] | BusinessInsightRecommendation[] }> = [];

  if (roadmap) {
    phases.push(
      { id: "fase-30", label: "0-30 días", description: "Quick wins y mitigación inmediata", actions: roadmap.phase_30_days },
      { id: "fase-60", label: "31-60 días", description: "Escalamiento y consolidación", actions: roadmap.phase_60_days },
      { id: "fase-90", label: "61-90 días", description: "Optimización y growth", actions: roadmap.phase_90_days },
    );
  } else if (buckets) {
    phases.push(
      { id: "fase-15", label: "0-15 días", description: "Mitigar riesgos críticos", actions: buckets.critical },
      { id: "fase-30", label: "16-30 días", description: "Impacto inmediato", actions: buckets.high },
      { id: "fase-60", label: "31-60 días", description: "Consolidación", actions: buckets.medium },
      { id: "fase-90", label: "61-90 días", description: "Escalamiento", actions: buckets.low },
    );
  }

  if (!phases.length) return "";

  const content = phases
    .map((phase) => {
      if (!phase.actions || phase.actions.length === 0) {
        return `<article class="card" aria-labelledby="${phase.id}">
          <header><h4 id="${phase.id}">${escapeHtml(phase.label)}</h4></header>
          <p>${escapeHtml(phase.description)}</p>
          <p class="meta">Sin acciones priorizadas en esta fase.</p>
        </article>`;
      }
      const list = phase.actions
        .map((action) => `<li>
          <strong>${escapeHtml(action.title)}:</strong> ${escapeHtml(action.description ?? "")}
        </li>`)
        .join("");
      return `<article class="card" aria-labelledby="${phase.id}">
        <header><h4 id="${phase.id}">${escapeHtml(phase.label)}</h4></header>
        <p>${escapeHtml(phase.description)}</p>
        <ul role="list">${list}</ul>
      </article>`;
    })
    .join("");

  return `<section class="section" id="roadmap">
    <header><h2>Hoja de ruta estratégicamente calendarizada</h2></header>
    <div class="grid">${content}</div>
  </section>`;
}

function renderRiskMatrix(premium?: BusinessInsightV2) {
  const risks = premium?.risk_assessment?.critical_risks;
  if (!risks || risks.length === 0) return "";
  const rows = risks.map((risk) => ({
    Riesgo: risk.risk,
    Probabilidad: risk.probability,
    Impacto: risk.impact,
    Mitigación: risk.mitigation,
  }));
  return `<section class="section" id="riesgos">
    <header><h2>Riesgos críticos y mitigaciones</h2></header>
    ${renderKeyValueTable(rows, "Matriz de riesgos priorizados")}
  </section>`;
}

function renderPremiumSummary(premium?: BusinessInsightV2) {
  if (!premium) return "";
  const executive = premium.executive_summary;
  const keyThemes = premium.meta.key_themes ?? [];
  const findings = executive?.key_findings ?? [];
  const implications = executive?.strategic_implications ?? [];

  return `<section class="section" id="premium">
    <header>
      <h2>Resumen premium estructurado</h2>
      <p class="meta">Análisis ${escapeHtml(premium.meta.analysis_type)}</p>
    </header>
    ${executive?.overview ? `<p>${escapeHtml(executive.overview)}</p>` : ""}
    ${renderList(findings, "list")}
    ${renderList(implications, "list inline")}
    ${keyThemes.length ? `<p class="meta">Temas clave: ${keyThemes.map((theme) => `<span>${escapeHtml(theme)}</span>`).join(" ")}</p>` : ""}
  </section>`;
}

function renderSources(sources: string[]) {
  if (!sources?.length) return "";
  return `<section class="section" id="fuentes">
    <header><h2>Fuentes consultadas</h2></header>
    <ol class="list ordered" role="list">
      ${sources.map((source) => `<li><a href="${escapeHtml(source)}">${escapeHtml(source)}</a></li>`).join("")}
    </ol>
  </section>`;
}

function buildTableOfContents(insight: BusinessInsight): string {
  const entries: Array<{ slug: string; label: string; include: boolean }> = [
    { slug: "contexto", label: "Contexto y alcance", include: true },
    { slug: "premium", label: "Resumen premium", include: Boolean(insight.premium) },
    { slug: "metricas", label: "Métricas clave", include: insight.metrics.length > 0 },
    { slug: "impacto-esfuerzo", label: "Matriz Impacto vs Esfuerzo", include: insight.recommendations.length > 0 },
    { slug: "recomendaciones", label: "Recomendaciones", include: insight.recommendations.length > 0 },
    { slug: "roadmap", label: "Hoja de ruta", include: Boolean(insight.premium?.roadmap) || insight.recommendations.length > 0 },
    { slug: "analisis-estrategico", label: "Análisis estratégico", include: Boolean(insight.premium?.strategic_analysis?.swot) },
    { slug: "finanzas", label: "Escenarios financieros", include: Boolean(insight.premium?.financial_analysis?.projections?.length) },
    { slug: "riesgos", label: "Riesgos", include: Boolean(insight.premium?.risk_assessment?.critical_risks?.length) },
    { slug: "fuentes", label: "Fuentes", include: insight.sources.length > 0 },
  ];

  const items = entries
    .filter((entry) => entry.include)
    .map((entry) => `<li><a href="#${entry.slug}">${escapeHtml(entry.label)}</a></li>`)
    .join("");

  return items
    ? `<nav aria-label="Tabla de contenido" class="toc">
        <h2>Mapa del informe</h2>
        <ul role="list">${items}</ul>
      </nav>`
    : "";
}

export async function renderInsightReportHTML(insight: BusinessInsight): Promise<string> {
  const buckets = bucketRecommendations(insight.recommendations);
  const metricsChart = await buildMetricChart(insight.metrics);
  const metricsEntries = collectMetricEntries(insight.metrics);

  const premium = insight.premium;
  const coverTitle = insight.title || (premium?.meta?.title ?? "Informe Rankora AI");
  const generatedDate = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });

  const metricRows = metricsEntries.map((entry) => ({
    Indicador: entry.name,
    Valor: entry.display.replace(`${entry.name}: `, ""),
    Tendencia: entry.trend ? entry.trend : "—",
  }));

  const premiumSWOT = premium?.strategic_analysis?.swot;
  const premiumPorter = premium?.strategic_analysis?.porter_five_forces;
  const financialProjections = premium?.financial_analysis?.projections;
  const confidence = premium?.meta?.confidence_level || insight.meta?.confidence_level || "medium";

  // Texto fallback para métricas si no hay gráfico
  let textualBars = "";
  if (!metricsChart) {
    const numeric = metricsEntries.filter(e => e.numericValue !== null);
    const max = Math.max(...numeric.map(e => e.numericValue || 0), 0);
    if (numeric.length > 0 && max > 0) {
      const rows = numeric.slice(0, 8).map(e => {
        const width = Math.round(((e.numericValue || 0) / max) * 20);
        return `<div class=\"bar-row\"><span class=\"label\">${escapeHtml(e.name)}</span><span class=\"bar\" style=\"--w:${width}\">${escapeHtml(String(e.numericValue))}</span></div>`;
      }).join("");
      textualBars = `<div class=\"bars\" aria-label=\"Distribución relativa de métricas\">${rows}</div>`;
    }
  }

  function renderImpactEffortMatrix(b: RecommendationBuckets): string {
    const cells: Record<string, string[]> = { 'Alta/Alto': [], 'Alta/Medio': [], 'Alta/Bajo': [], 'Media/Alto': [], 'Media/Medio': [], 'Media/Bajo': [], 'Baja/Alto': [], 'Baja/Medio': [], 'Baja/Bajo': [] };
    priorityOrder.forEach(p => {
      b[p].forEach(r => {
        const imp = impactToNumeric(r.estimated_impact) || inferImpactFromPriority(p); // 1..4
        const eff = effortToNumeric(r.estimated_effort) || inferEffortFromPriority(p); // 1..4
        const impBand = imp >= 3 ? 'Alta' : imp === 2 ? 'Media' : 'Baja';
        const effBand = eff >= 3 ? 'Alto' : eff === 2 ? 'Medio' : 'Bajo';
        const key = `${impBand}/${effBand}`;
        if (!cells[key]) cells[key] = [];
        cells[key].push(escapeHtml(r.title));
      });
    });
    const matrixRows = Object.entries(cells).filter(([, arr]) => arr.length).map(([k, arr]) => ({ Segmento: k, Acciones: arr.length, Ejemplos: arr.slice(0,3).join('; ') }));
    return matrixRows.length ? renderKeyValueTable(matrixRows, 'Distribución Impacto/Escenario de esfuerzo') : '<p>No hay suficientes datos para construir la matriz.</p>';
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(coverTitle)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root {
      color-scheme: light;
      font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
      --color-primary: #1d4ed8;
      --color-surface: #f8fafc;
      --color-text: #0f172a;
      --color-muted: #475569;
    }
    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: var(--color-text);
      font-size: 13px;
      line-height: 1.55;
    }
    a { color: var(--color-primary); text-decoration: none; }
    a:hover { text-decoration: underline; }
    header.cover {
      background: linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 100%);
      color: #ffffff;
      padding: 48px 56px 64px;
    }
    header.cover h1 {
      margin: 0 0 12px;
      font-size: 28px;
      font-weight: 700;
    }
    header.cover p {
      margin: 4px 0;
      font-size: 14px;
    }
    .badge {
      display: inline-flex;
      gap: 6px;
      align-items: center;
      padding: 6px 10px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.15);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    main {
      padding: 40px 56px 80px;
      background: #ffffff;
    }
    .toc {
      background: var(--color-surface);
      border: 1px solid rgba(15, 23, 42, 0.08);
      border-radius: 12px;
      padding: 20px 24px;
      margin-bottom: 36px;
    }
    .toc h2 {
      margin: 0 0 12px;
      font-size: 16px;
      font-weight: 600;
    }
    .toc ul {
      list-style: none;
      margin: 0;
      padding: 0;
      columns: 2;
      gap: 12px;
    }
    .toc li {
      margin-bottom: 8px;
    }
    .section {
      margin-bottom: 48px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .section header h2 {
      font-size: 20px;
      margin: 0 0 12px;
      color: var(--color-text);
    }
    .meta {
      color: var(--color-muted);
      font-size: 12px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .meta span {
      background: rgba(15, 23, 42, 0.08);
      border-radius: 999px;
      padding: 2px 8px;
    }
    .list {
      margin: 12px 0 0;
      padding-left: 20px;
    }
    .list.inline {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      list-style: none;
      padding: 0;
    }
    .list.inline li {
      border-radius: 999px;
      background: rgba(29, 78, 216, 0.08);
      padding: 4px 12px;
    }
    .list.ordered {
      list-style: decimal;
      padding-left: 20px;
    }
    .card {
      border: 1px solid rgba(15, 23, 42, 0.08);
      border-radius: 14px;
      padding: 18px 20px;
      background: #ffffff;
      box-shadow: 0 8px 18px -12px rgba(15, 23, 42, 0.25);
    }
    .card h4 {
      margin: 0 0 8px;
      font-size: 16px;
    }
    .card p {
      margin: 8px 0;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.05em;
      color: #ffffff;
      background: var(--chip-color, #1d4ed8);
    }
    .band {
      margin: 24px 0 8px;
      padding-bottom: 4px;
      border-bottom: 3px solid var(--band-color, #1d4ed8);
      font-size: 18px;
    }
    .band-description {
      margin: 4px 0 16px;
      color: var(--color-muted);
      font-size: 12px;
    }
    figure.table {
      margin: 16px 0;
      background: #ffffff;
    }
    figure.table figcaption {
      font-weight: 600;
      margin-bottom: 6px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    table thead th {
      text-align: left;
      padding: 8px;
      background: rgba(29, 78, 216, 0.08);
    }
    table tbody td {
      padding: 8px;
      border-top: 1px solid rgba(15, 23, 42, 0.08);
    }
    .bars { margin:16px 0; font-size:11px; }
    .bar-row { display:flex; align-items:center; gap:8px; margin:4px 0; }
    .bar-row .label { width:140px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .bar-row .bar { --w:8; position:relative; flex:1; background:rgba(29,78,216,0.12); border-radius:4px; padding:2px 6px; }
    .bar-row .bar::after { content:""; position:absolute; top:0; left:0; height:100%; width:calc(var(--w) * 5%); background:linear-gradient(90deg,#1d4ed8,#3b82f6); border-radius:4px; opacity:.55; }
    .confidence { display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:999px; background:rgba(0,0,0,0.05); font-size:11px; text-transform:uppercase; letter-spacing:.05em; }
    .confidence[data-level="high"] { background:rgba(16,185,129,0.15); }
    .confidence[data-level="medium"] { background:rgba(245,158,11,0.18); }
    .confidence[data-level="low"] { background:rgba(239,68,68,0.18); }
    figure.chart {
      margin: 24px 0;
    }
    figure.chart img {
      width: 100%;
      border-radius: 14px;
      border: 1px solid rgba(15, 23, 42, 0.08);
    }
    .footer {
      margin-top: 40px;
      padding-top: 12px;
      border-top: 1px solid rgba(15, 23, 42, 0.12);
      font-size: 11px;
      color: var(--color-muted);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  </style>
</head>
<body>
  <header class="cover" role="banner">
    <span class="badge">Rankora AI · Reporte ejecutivo</span>
    <h1>${escapeHtml(coverTitle)}</h1>
    <p>${escapeHtml(insight.summary)}</p>
    <p>Tipo de insight: ${escapeHtml(insight.type)}</p>
  <p>Generado el ${escapeHtml(generatedDate)} · Fuentes analizadas: ${escapeHtml(String(insight.sources.length))} · <span class="confidence" data-level="${escapeHtml(confidence)}">Confianza ${escapeHtml(confidence)}</span></p>
  </header>
  <main role="main">
    ${buildTableOfContents(insight)}

    <section id="contexto" class="section">
      <header>
        <h2>Contexto y alcance</h2>
        <p class="meta">Fuentes integradas: ${escapeHtml(insight.sources.length)} documentos</p>
      </header>
  <p>El informe consolida señales cuantitativas y cualitativas derivadas de las fuentes provistas, priorizando métricas accionables y recomendaciones ejecutivas. La metodología aplica extracción semántica, normalización de métricas y clasificación estratégica (impacto vs. esfuerzo). Donde los datos son incompletos se aplican heurísticas conservadoras.</p>
  <p class="meta">Metodología: parsing contextual · enriquecimiento LLM · scoring ponderado · clustering temático · priorización ICE.</p>
    </section>

    ${renderPremiumSummary(premium)}

    <section id="impacto-esfuerzo" class="section">
      <header><h2>Matriz Impacto vs Esfuerzo</h2></header>
      <p class="meta">Clasificación estimada basada en campos de recomendación; donde faltan valores se infiere desde prioridad.</p>
      ${renderImpactEffortMatrix(buckets)}
    </section>

    <section id="metricas" class="section">
      <header>
        <h2>KPIs y métricas observadas</h2>
      </header>
      ${renderKeyValueTable(metricRows, "Detalle de métricas relevantes")}
      ${metricsChart ? `<figure class="chart" role="group" aria-label="Visualización de métricas">
        <img src="data:image/png;base64,${metricsChart}" alt="Visualización de las principales métricas cuantitativas" />
        <figcaption>Métricas con mayor influencia en la decisión para el periodo analizado.</figcaption>
      </figure>` : textualBars}
    </section>

    ${renderRecommendationSection(buckets)}
    ${renderRoadmap(premium?.roadmap, buckets)}
    ${renderSwot(premiumSWOT)}
    ${renderPorter(premiumPorter)}
    ${renderFinancialProjections(financialProjections)}
    ${renderRiskMatrix(premium)}
    ${renderSources(insight.sources)}

    <footer class="footer">
      <span>Rankora AI · Huminary Labs</span>
      <span>Generado automáticamente · ${escapeHtml(generatedDate)}</span>
    </footer>
  </main>
</body>
</html>`;
}
