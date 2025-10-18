import { BusinessInsight, BusinessInsightRecommendation } from "@/lib/insights-schema";
import type { BusinessInsightV2, SWOTAnalysisType, PorterFiveForcesType, FinancialProjectionType, ActionItemType } from "@/lib/insights-schema-v2";
import type { LeadIntelligenceReportType } from "@/lib/lead-intelligence-schema";
// Lazy chart rendering setup to avoid Turbopack "module as expression is too dynamic" error at import time.
// We only import chartjs-node-canvas when we actually need a chart and wrap in try/catch to fail gracefully in constrained environments.
import type { ChartConfiguration } from "chart.js";
let chartRenderer: any = null;
async function ensureChartRenderer(): Promise<typeof chartRenderer | null> {
  if (chartRenderer) return chartRenderer;
  // Allow disabling charts explicitly or on macOS by default to avoid native canvas issues in dev.
  const disableChartsEnv = (process.env.DISABLE_PDF_CHARTS || "").toLowerCase();
  const disableCharts = disableChartsEnv === "1" || disableChartsEnv === "true";
  // On macOS, default to disabled unless FORCE_PDF_CHARTS is set
  const isMac = typeof process !== "undefined" && process.platform === "darwin";
  const forceCharts = (process.env.FORCE_PDF_CHARTS || "").toLowerCase() === "1" || (process.env.FORCE_PDF_CHARTS || "").toLowerCase() === "true";
  if (disableCharts || (isMac && !forceCharts)) {
    console.warn("Chart rendering disabled (env/platform configuration)");
    return null;
  }
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
  } catch (e: any) {
    console.warn("Chart rendering disabled (dependency not available):", e?.message || e);
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

/**
 * Parse markdown to HTML for executive summary
 * Supports: headings, bold, bullets, numbered lists, links, tables
 */
function parseMarkdownToHtml(markdown: string): string {
  if (!markdown) return "";
  
  let html = markdown;
  
  // Normalize line endings
  html = html.replace(/\r\n?/g, "\n");

  // Tables (GitHub Flavored Markdown)
  // Pattern: | Header 1 | Header 2 |
  //          |----------|----------|
  //          | Cell 1   | Cell 2   |
  const tableRegex = /\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)+)/g;
  html = html.replace(tableRegex, (match, headerRow, bodyRows) => {
    const headers = headerRow.split('|').filter((h: string) => h.trim()).map((h: string) => h.trim());
    const rows = bodyRows.trim().split('\n').map((row: string) => 
      row.split('|').filter((c: string) => c.trim()).map((c: string) => c.trim())
    );
    
    return `<table class="data-table" style="width: 100%; border-collapse: collapse; margin: 16px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
      <thead>
        <tr style="background: #0f172a; color: white;">
          ${headers.map((h: string) => `<th style="padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #334155;">${h}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${rows.map((row: string[], idx: number) => `
          <tr style="background: ${idx % 2 === 0 ? '#f8fafc' : '#ffffff'};">
            ${row.map((cell: string) => `<td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${cell}</td>`).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>`;
  });
  
  // Headings (##, ###, ####)
  // Headings with optional leading spaces (GitHub style)
  html = html.replace(/^\s{0,3}######\s+(.+)$/gim, '<h6>$1<\/h6>');
  html = html.replace(/^\s{0,3}#####\s+(.+)$/gim, '<h5>$1<\/h5>');
  html = html.replace(/^\s{0,3}####\s+(.+)$/gim, '<h4>$1<\/h4>');
  html = html.replace(/^\s{0,3}###\s+(.+)$/gim, '<h3>$1<\/h3>');
  html = html.replace(/^\s{0,3}##\s+(.+)$/gim, '<h2>$1<\/h2>');
  html = html.replace(/^\s{0,3}#\s+(.+)$/gim, '<h1>$1<\/h1>');
  
  // Bold (**text** or __text__)
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  
  // Italic (*text* or _text_)
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');
  
  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  
  // Unordered lists (- or *)
  // Unordered list blocks
  html = html.replace(/(^|\n)(?:\s*[-*]\s+.+\n?)+/g, (block) => {
    const items = block
      .trim()
      .split(/\n/)
      .map((line) => line.replace(/^\s*[-*]\s+/, ''))
      .filter(Boolean)
      .map((it) => `<li>${it}<\/li>`) 
      .join('');
    return `\n<ul>${items}<\/ul>\n`;
  });

  // Ordered list blocks
  html = html.replace(/(^|\n)(?:\s*\d+\.\s+.+\n?)+/g, (block) => {
    const items = block
      .trim()
      .split(/\n/)
      .map((line) => line.replace(/^\s*\d+\.\s+/, ''))
      .filter(Boolean)
      .map((it) => `<li>${it}<\/li>`) 
      .join('');
    return `\n<ol>${items}<\/ol>\n`;
  });
  
  // Line breaks
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');
  
  // Wrap in paragraphs if not already wrapped
  if (!html.startsWith('<')) {
    html = '<p>' + html + '</p>';
  }
  
  return html;
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

function renderPremiumSummary(premium?: BusinessInsightV2) {
  if (!premium || !premium.executive_summary) return "";

  const executive = premium.executive_summary;
  const keyThemes = premium.meta?.key_themes ?? [];
  const findings = executive?.key_findings ?? [];
  const implications = executive?.strategic_implications ?? [];

  // Divide el overview en secciones lógicas para mejorar legibilidad y evitar duplicados
  const overviewSanitized = (executive?.overview || "")
    // Elimina encabezados tipo markdown para evitar títulos duplicados dentro del resumen
    .replace(/^\s{0,3}#{1,6}.*$/gmi, "")
    .trim();

  let overviewSections = "";
  if (overviewSanitized) {
    const paragraphs = overviewSanitized
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);

    // 1) Contexto de mercado
    if (paragraphs[0]) {
      overviewSections += `
        <div style="margin-bottom: 14px; page-break-inside: avoid;">
          <div class="band" style="--band-color: #667eea; margin: 8px 0 6px 0;">📊 Contexto de Mercado</div>
          <div style="background: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; border-left: 4px solid #667eea; line-height: 1.65; font-size: 14px;">
            ${parseMarkdownToHtml(paragraphs[0])}
          </div>
        </div>`;
    }

    // 2) Oportunidades claves
    if (paragraphs[1]) {
      overviewSections += `
        <div style="margin-bottom: 14px; page-break-inside: avoid;">
          <div class="band" style="--band-color: #10b981; margin: 8px 0 6px 0;">💡 Oportunidades Identificadas</div>
          <div style="background: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; border-left: 4px solid #10b981; line-height: 1.65; font-size: 14px;">
            ${parseMarkdownToHtml(paragraphs[1])}
          </div>
        </div>`;
    }

    // 3+) Análisis adicional
    if (paragraphs.length > 2) {
      overviewSections += `
        <div style="margin-bottom: 12px; page-break-inside: avoid;">
          <div class="band" style="--band-color: #f59e0b; margin: 8px 0 6px 0;">📈 Análisis Profundo</div>
          <div style="background: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; border-left: 4px solid #f59e0b; line-height: 1.65; font-size: 14px;">
            ${paragraphs
              .slice(2)
              .map((p: string) => parseMarkdownToHtml(p))
              .join('<div style="margin: 8px 0;"></div>')}
          </div>
        </div>`;
    }
  }

  // Hallazgos clave (compacto)
  const findingsHtml = findings.length > 0 
    ? `<div style="margin-bottom: 14px; page-break-inside: avoid;">
         <div class="band" style="--band-color: #0ea5e9; margin: 8px 0 6px 0;">🔍 Hallazgos Clave</div>
         ${findings.map((f: string, idx: number) => `
           <div style="background: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid #0ea5e9; padding: 10px; border-radius: 6px; display: flex; gap: 10px; margin: 6px 0;">
             <div style="width: 26px; height: 26px; background: #0ea5e9; color: white; border-radius: 50%; font-weight: 700; font-size: 13px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">${idx + 1}</div>
             <div style="flex: 1; line-height: 1.55; font-size: 14px;">${parseMarkdownToHtml(f)}</div>
           </div>
         `).join('')}
       </div>`
    : '';

  // Implicaciones estratégicas (compacto)
  const implicationsHtml = implications.length > 0
    ? `<div style="margin-bottom: 14px; page-break-inside: avoid;">
         <div class="band" style="--band-color: #8b5cf6; margin: 8px 0 6px 0;">🎯 Implicaciones Estratégicas</div>
         <div style="background: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid #8b5cf6; padding: 12px; border-radius: 8px;">
           <ul style="margin: 0; padding-left: 18px;">
             ${implications.map((i: string) => `<li style="margin: 6px 0; line-height: 1.55; font-size: 14px;">${parseMarkdownToHtml(i)}</li>`).join('')}
           </ul>
         </div>
       </div>`
    : '';

  // Temas clave (compacto)
  const themesHtml = keyThemes.length > 0
    ? `<div style="margin-top: 10px; page-break-inside: avoid;">
         <strong style="color: #64748b; font-size: 12px; display: block; margin-bottom: 6px;">Temas clave del análisis:</strong> 
         <div style="display: flex; flex-wrap: wrap; gap: 6px;">
           ${keyThemes.map((theme: string) => `<span style="background: #0ea5e9; color: white; padding: 5px 12px; border-radius: 999px; font-size: 11px; font-weight: 600;">${escapeHtml(theme)}</span>`).join('')}
         </div>
       </div>`
    : '';

  return `<section class="section" id="premium" style="page-break-inside: avoid;">
    <header><h2>Resumen ejecutivo</h2></header>
    ${overviewSections}
    ${findingsHtml}
    ${implicationsHtml}
    ${themesHtml}
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
  const leadIntelligence = (insight as any)?.meta?.leadIntelligence as LeadIntelligenceReportType | undefined;
  const playbooks = (insight as any)?.meta?.playbooks as Array<{ title: string; steps: string[]; tools: string[]; kpis: string[]; owner: string; timeline?: string }> | undefined;
  const entries: Array<{ slug: string; label: string; include: boolean }> = [
    { slug: "contexto", label: "Contexto y alcance", include: true },
    { slug: "premium", label: "Resumen premium", include: Boolean(insight.premium) },
    { slug: "leads", label: "Leads accionables", include: Boolean(leadIntelligence?.qualified_leads?.length) },
    { slug: "metricas", label: "Métricas clave", include: insight.metrics.length > 0 },
    { slug: "impacto-esfuerzo", label: "Matriz Impacto vs Esfuerzo", include: insight.recommendations.length > 0 },
    { slug: "recomendaciones", label: "Recomendaciones", include: insight.recommendations.length > 0 },
    { slug: "playbooks", label: "Playbooks de ejecución", include: Boolean(playbooks?.length) },
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
  const leadIntelligence = (insight as any)?.meta?.leadIntelligence as LeadIntelligenceReportType | undefined;
  const playbooks = (insight as any)?.meta?.playbooks as Array<{ title: string; steps: string[]; tools: string[]; kpis: string[]; owner: string; timeline?: string }> | undefined;

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

  function renderLeadsSection(li?: LeadIntelligenceReportType): string {
    if (!li || !Array.isArray(li.qualified_leads) || li.qualified_leads.length === 0) return "";
    
    const leads = [...li.qualified_leads]
      .sort((a, b) => (b.qualification?.overall_fit_score || 0) - (a.qualification?.overall_fit_score || 0))
      .slice(0, 10);
    
    const leadsTableRows = leads.map((l, idx) => `
      <tr>
        <td style="font-weight: 600;">${idx + 1}</td>
        <td><strong>${escapeHtml(l.company.company_name)}</strong><br/>
            <span style="font-size: 11px; color: #64748b;">${escapeHtml(l.company.industry)} · ${escapeHtml(l.company.employee_count)} empleados</span>
        </td>
        <td>${escapeHtml(l.decision_maker.name || '—')}<br/>
            <span style="font-size: 11px; color: #64748b;">${escapeHtml(l.decision_maker.title)}</span>
        </td>
        <td style="font-family: monospace; font-size: 11px; color: #0ea5e9;">${escapeHtml(l.decision_maker.email || '—')}</td>
        <td>
          <div style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 999px; background: ${l.qualification.overall_fit_score >= 8 ? 'linear-gradient(135deg, #10b981, #059669)' : l.qualification.overall_fit_score >= 6 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #64748b, #475569)'}; color: white; font-weight: 700; font-size: 12px;">
            ${l.qualification.overall_fit_score}/10
          </div>
        </td>
        <td style="text-align: center;">
          <span style="background: rgba(59, 130, 246, 0.1); padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; color: #1d4ed8;">
            ${escapeHtml(l.outreach_strategy.primary_channel)}
          </span>
        </td>
      </tr>
    `).join('');

    const statsHtml = li.market_analysis ? `
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 20px 0; padding: 20px; background: linear-gradient(135deg, #f0fdf4, #dcfce7); border-radius: 12px; border: 2px solid #86efac;">
        <div style="text-align: center;">
          <div style="font-size: 32px; font-weight: 800; color: #059669; margin-bottom: 4px;">${escapeHtml(String(li.market_analysis.total_companies_analyzed))}</div>
          <div style="font-size: 12px; color: #166534; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Empresas Analizadas</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 32px; font-weight: 800; color: #0891b2; margin-bottom: 4px;">${escapeHtml(li.market_analysis.qualification_pass_rate)}</div>
          <div style="font-size: 12px; color: #164e63; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Tasa Cualificación</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 32px; font-weight: 800; color: #7c3aed; margin-bottom: 4px;">${escapeHtml(li.market_analysis.average_deal_size)}</div>
          <div style="font-size: 12px; color: #5b21b6; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Ticket Medio</div>
        </div>
      </div>
    ` : "";

    return `<section class="section" id="leads" style="background: linear-gradient(135deg, #fefce8, #fef3c7); padding: 24px; border-radius: 16px; border: 3px solid #fbbf24;">
      <header>
        <h2 style="color: #92400e; display: flex; align-items: center; gap: 8px;">
          🎯 Leads Accionables - Top 10
          <span style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 700;">PREMIUM</span>
        </h2>
        <p class="meta" style="color: #78350f;">Prospectos cualificados listos para contactar · Ordenados por puntuación de encaje</p>
      </header>
      
      ${statsHtml}
      
      <figure class="table" style="background: white; border-radius: 12px; padding: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <figcaption style="font-size: 14px; font-weight: 700; color: #1f2937; margin-bottom: 12px;">📋 Contactos Principales</figcaption>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: linear-gradient(135deg, #3b82f6, #2563eb); color: white;">
              <th style="padding: 12px 8px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">#</th>
              <th style="padding: 12px 8px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">Empresa</th>
              <th style="padding: 12px 8px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">Decisor</th>
              <th style="padding: 12px 8px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">Email</th>
              <th style="padding: 12px 8px; text-align: center; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">Fit Score</th>
              <th style="padding: 12px 8px; text-align: center; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">Canal</th>
            </tr>
          </thead>
          <tbody>
            ${leadsTableRows}
          </tbody>
        </table>
      </figure>
      
      <div style="margin-top: 16px; padding: 12px; background: rgba(59, 130, 246, 0.1); border-radius: 8px; border-left: 4px solid #3b82f6;">
        <p style="margin: 0; font-size: 12px; color: #1e40af;">
          <strong>💡 Consejo:</strong> Exporta la lista completa desde el dashboard en formato CSV para importar directamente a tu CRM.
        </p>
      </div>
    </section>`;
  }

  function renderPlaybooksSection(pb?: Array<{ title: string; steps: string[]; tools: string[]; kpis: string[]; owner: string; timeline?: string }>): string {
    if (!pb || pb.length === 0) return "";
    
    const cards = pb.slice(0, 6).map((p, idx) => `
      <article style="border: 2px solid #e0e7ff; border-radius: 12px; padding: 20px; background: linear-gradient(135deg, #f5f3ff, #ede9fe); break-inside: avoid; page-break-inside: avoid;">
        <header style="margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #c4b5fd;">
          <h4 style="margin: 0 0 8px; font-size: 16px; color: #5b21b6; display: flex; align-items: center; gap: 6px;">
            <span style="display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; border-radius: 50%; font-size: 12px; font-weight: 700;">${idx + 1}</span>
            ${escapeHtml(p.title)}
          </h4>
          <div style="display: flex; gap: 12px; font-size: 11px; color: #6b21a8;">
            <span><strong>Owner:</strong> ${escapeHtml(p.owner)}</span>
            ${p.timeline ? `<span><strong>Horizonte:</strong> ${escapeHtml(p.timeline)}</span>` : ''}
          </div>
        </header>
        
        <div style="margin-bottom: 12px;">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #7c3aed; margin-bottom: 6px; letter-spacing: 0.05em;">📋 Pasos de Ejecución</div>
          <ol style="margin: 0; padding-left: 20px; font-size: 12px; line-height: 1.6; color: #1f2937;">
            ${p.steps.slice(0, 5).map(s => `<li style="margin-bottom: 4px;">${escapeHtml(s)}</li>`).join('')}
          </ol>
        </div>
        
        ${p.tools.length > 0 ? `
        <div style="margin-bottom: 8px;">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #7c3aed; margin-bottom: 4px; letter-spacing: 0.05em;">🛠️ Herramientas</div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            ${p.tools.map(t => `<span style="background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 3px 10px; border-radius: 999px; font-size: 10px; font-weight: 600;">${escapeHtml(t)}</span>`).join('')}
          </div>
        </div>
        ` : ''}
        
        ${p.kpis.length > 0 ? `
        <div>
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #7c3aed; margin-bottom: 4px; letter-spacing: 0.05em;">📊 KPIs de Seguimiento</div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            ${p.kpis.map(k => `<span style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 3px 10px; border-radius: 999px; font-size: 10px; font-weight: 600;">${escapeHtml(k)}</span>`).join('')}
          </div>
        </div>
        ` : ''}
      </article>
    `).join('');
    
    return `<section class="section" id="playbooks" style="background: linear-gradient(135deg, #faf5ff, #f3e8ff); padding: 24px; border-radius: 16px; border: 3px solid #c084fc;">
      <header style="margin-bottom: 20px;">
        <h2 style="color: #6b21a8; display: flex; align-items: center; gap: 8px;">
          📚 Playbooks de Ejecución
          <span style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 700;">GUÍAS PASO A PASO</span>
        </h2>
        <p class="meta" style="color: #7e22ce;">Cómo implementar las recomendaciones de forma efectiva · Incluye herramientas, KPIs y responsables</p>
      </header>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
        ${cards}
      </div>
      ${pb.length > 6 ? `<p style="margin-top: 16px; font-size: 12px; color: #7e22ce; text-align: center;"><em>+ ${pb.length - 6} playbooks adicionales disponibles en el dashboard</em></p>` : ''}
    </section>`;
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="generator" content="Rankora AI v2.1.0" />
  <title>${escapeHtml(coverTitle)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root {
      color-scheme: light;
      font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      
      /* Base Colors */
      --color-primary: #1d4ed8;
      --color-surface: #f8fafc;
      --color-text: #0f172a;
      --color-muted: #64748b;
      --color-border: #e2e8f0;
      
      /* Modern Gradients (2025 Design System) */
      --gradient-hero: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      --gradient-success: linear-gradient(135deg, #0ea5e9 0%, #22c55e 100%);
      --gradient-warning: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
      --gradient-info: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      --gradient-neutral: linear-gradient(135deg, #64748b 0%, #475569 100%);
      
      /* Semantic Colors */
      --color-success: #22c55e;
      --color-warning: #f59e0b;
      --color-danger: #ef4444;
      --color-info: #3b82f6;
      
      /* Shadows & Depth */
      --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
      --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
      --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
      --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
      
      /* Typography Scale (Modern 2025) */
      --text-hero: 42px;
      --text-h1: 32px;
      --text-h2: 24px;
      --text-h3: 20px;
      --text-h4: 18px;
      --text-body: 15px;
      --text-sm: 13px;
      --text-xs: 11px;
      
      /* Font Weights */
      --font-normal: 400;
      --font-medium: 500;
      --font-semibold: 600;
      --font-bold: 700;
      --font-extrabold: 800;
      
      /* Spacing Scale */
      --space-xs: 8px;
      --space-sm: 12px;
      --space-md: 16px;
      --space-lg: 24px;
      --space-xl: 32px;
      --space-2xl: 48px;
      --space-3xl: 64px;
      
      /* Border Radius */
      --radius-sm: 6px;
      --radius-md: 8px;
      --radius-lg: 12px;
      --radius-xl: 16px;
      --radius-full: 9999px;
      
      /* Line Heights */
      --leading-tight: 1.25;
      --leading-normal: 1.5;
      --leading-relaxed: 1.625;
      --leading-loose: 1.75;
    }
    
    /* === BASE STYLES === */
    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: var(--color-text);
      font-size: var(--text-body);
      line-height: var(--leading-normal);
      font-weight: var(--font-normal);
      max-width: 1400px; /* Más ancho para aprovechar espacio */
      margin: 0 auto;
    }
    
    a { 
      color: var(--color-primary); 
      text-decoration: none;
      transition: color 0.2s ease;
    }
    a:hover { 
      color: #1e40af;
      text-decoration: underline; 
    }
    
    /* === HERO COVER (clean, print-friendly) === */
    header.cover {
      background: #ffffff;
      color: var(--color-text);
      padding: var(--space-2xl) var(--space-3xl);
      border-bottom: 1px solid var(--color-border);
    }
    header.cover::before { display: none; }
    header.cover h1 {
      margin: 0 0 var(--space-md);
      font-size: var(--text-hero);
      font-weight: var(--font-extrabold);
      line-height: var(--leading-tight);
      position: relative;
      z-index: 1;
    }
    header.cover p {
      margin: var(--space-xs) 0;
      font-size: var(--text-h5);
      font-weight: var(--font-normal);
      line-height: var(--leading-relaxed);
      opacity: 0.9;
    }
    
    .badge {
      display: inline-flex;
      gap: var(--space-xs);
      align-items: center;
      padding: var(--space-xs) var(--space-sm);
      border-radius: var(--radius-full);
      background: #f1f5f9;
      color: #0f172a;
      font-size: var(--text-xs);
      font-weight: var(--font-semibold);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    /* === MAIN CONTENT === */
    main {
      padding: var(--space-2xl) var(--space-3xl) var(--space-3xl);
      background: #ffffff;
    }

    /* Readability rules */
    p, li {
      max-width: 85ch; /* ~ 50–75 CPL target */
    }
    ul, ol {
      margin: var(--space-sm) 0 var(--space-md);
      padding-left: var(--space-xl);
    }
    
    /* === TABLE OF CONTENTS === */
    .toc {
      background: #ffffff;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-lg) var(--space-xl);
      margin-bottom: var(--space-2xl);
      box-shadow: var(--shadow-sm);
    }
    .toc h2 {
      margin: 0 0 var(--space-md);
      font-size: var(--text-h3);
      font-weight: var(--font-bold);
      color: var(--color-info);
    }
    .toc ul {
      list-style: none;
      margin: 0;
      padding: 0;
      columns: 2;
      gap: var(--space-md);
    }
    .toc li {
      margin-bottom: var(--space-sm);
      font-weight: var(--font-medium);
      color: var(--color-text);
    }
    
    /* === SECTIONS === */
    .section {
      margin-bottom: var(--space-2xl);
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .section header h2 {
      font-size: var(--text-h2);
      font-weight: var(--font-bold);
      margin: 0 0 var(--space-md);
      color: var(--color-text);
      line-height: var(--leading-tight);
      border-bottom: 3px solid var(--color-primary);
      padding-bottom: var(--space-sm);
    }
    
    .meta {
      color: var(--color-muted);
      font-size: var(--text-sm);
      font-weight: var(--font-medium);
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-sm);
      margin-top: var(--space-xs);
    }
    .meta span {
      background: var(--gradient-neutral);
      color: white;
      border-radius: var(--radius-full);
      padding: 4px var(--space-sm);
      font-size: var(--text-xs);
      font-weight: var(--font-semibold);
      box-shadow: var(--shadow-xs);
    }
    
    /* === LISTS === */
    .list {
      margin: var(--space-sm) 0 0;
      padding-left: var(--space-lg);
      line-height: var(--leading-relaxed);
    }
    .list.inline {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-sm);
      list-style: none;
      padding: 0;
    }
    .list.inline li {
      border-radius: var(--radius-full);
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
      border: 1px solid rgba(59, 130, 246, 0.3);
      padding: var(--space-xs) var(--space-md);
      font-weight: var(--font-medium);
      font-size: var(--text-sm);
    }
    .list.ordered {
      list-style: decimal;
      padding-left: var(--space-lg);
    }
    
    /* === CARDS === */
    .card {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-lg) var(--space-xl);
      background: #ffffff;
      box-shadow: var(--shadow-md);
      transition: all 0.3s ease;
    }
    .card:hover {
      box-shadow: var(--shadow-lg);
      transform: translateY(-2px);
    }
    .card h4 {
      margin: 0 0 var(--space-sm);
      font-size: var(--text-h4);
      font-weight: var(--font-semibold);
      color: var(--color-text);
    }
    .card p {
      margin: var(--space-sm) 0;
      line-height: var(--leading-relaxed);
    }
    
    /* === GRID LAYOUTS === */
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--space-lg);
      margin-top: var(--space-lg);
    }
    
    /* === CHIPS & BADGES === */
    .chip {
      display: inline-flex;
      align-items: center;
      gap: var(--space-xs);
      padding: 4px var(--space-sm);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: var(--font-semibold);
      letter-spacing: 0.05em;
      color: #ffffff;
      background: var(--chip-color, var(--gradient-info));
      box-shadow: var(--shadow-xs);
    }
    
    /* === BAND HEADERS === */
    .band {
      margin: var(--space-xl) 0 var(--space-sm);
      padding-bottom: var(--space-xs);
      border-bottom: 3px solid var(--band-color, var(--color-primary));
      font-size: var(--text-h3);
      font-weight: var(--font-bold);
      color: var(--color-text);
    }
    .band-description {
      margin: var(--space-xs) 0 var(--space-lg);
      color: var(--color-muted);
      font-size: var(--text-sm);
      line-height: var(--leading-relaxed);
    }
    
    /* === TABLES (Premium Design) === */
    figure.table {
      margin: var(--space-lg) 0;
      background: #ffffff;
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-md);
    }
    figure.table figcaption {
      font-weight: var(--font-semibold);
      font-size: var(--text-h4);
      margin-bottom: var(--space-sm);
      padding: var(--space-md) var(--space-lg);
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      border-bottom: 2px solid var(--color-border);
    }
    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      font-size: var(--text-sm);
    }
    table thead th {
      text-align: left;
      padding: var(--space-md) var(--space-lg);
      background: var(--gradient-info);
      color: white;
      font-weight: var(--font-semibold);
      font-size: var(--text-sm);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    table thead th:first-child {
      border-top-left-radius: var(--radius-md);
    }
    table thead th:last-child {
      border-top-right-radius: var(--radius-md);
    }
    table tbody td {
      padding: var(--space-md) var(--space-lg);
      border-top: 1px solid var(--color-border);
      line-height: var(--leading-relaxed);
    }
    table tbody tr:nth-child(even) {
      background: #f8fafc;
    }
    table tbody tr:hover {
      background: #f1f5f9;
    }
    
    /* === BAR CHARTS === */
    .bars { 
      margin: var(--space-lg) 0; 
      font-size: var(--text-sm); 
    }
    .bar-row { 
      display: flex; 
      align-items: center; 
      gap: var(--space-sm); 
      margin: var(--space-xs) 0;
      padding: var(--space-xs) 0;
    }
    .bar-row .label { 
      width: 140px; 
      white-space: nowrap; 
      overflow: hidden; 
      text-overflow: ellipsis;
      font-weight: var(--font-medium);
      color: var(--color-text);
    }
    .bar-row .bar { 
      --w: 8; 
      position: relative; 
      flex: 1; 
      background: rgba(59, 130, 246, 0.1); 
      border-radius: var(--radius-sm); 
      padding: 4px var(--space-sm);
      min-height: 24px;
      box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
    }
    .bar-row .bar::after { 
      content: ""; 
      position: absolute; 
      top: 0; 
      left: 0; 
      height: 100%; 
      width: calc(var(--w) * 5%); 
      background: var(--gradient-info); 
      border-radius: var(--radius-sm); 
      box-shadow: var(--shadow-sm);
    }
    
    /* === CONFIDENCE BADGES === */
    .confidence { 
      display: inline-flex; 
      align-items: center; 
      gap: var(--space-xs); 
      padding: var(--space-xs) var(--space-sm); 
      border-radius: var(--radius-full); 
      background: rgba(0, 0, 0, 0.05); 
      font-size: var(--text-xs); 
      font-weight: var(--font-semibold);
      text-transform: uppercase; 
      letter-spacing: 0.05em;
      box-shadow: var(--shadow-xs);
    }
    .confidence[data-level="high"] { 
      background: var(--gradient-success);
      color: white;
    }
    .confidence[data-level="medium"] { 
      background: var(--gradient-warning);
      color: white;
    }
    .confidence[data-level="low"] { 
      background: var(--gradient-warning);
      color: white;
    }
    
    /* === CHART FIGURES === */
    figure.chart {
      margin: var(--space-lg) 0;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    figure.chart img {
      width: 100%;
      border-radius: var(--radius-lg);
      border: 2px solid var(--color-border);
      box-shadow: var(--shadow-lg);
    }
    
    /* === FOOTER === */
    .footer {
      margin-top: var(--space-2xl);
      padding-top: var(--space-md);
      border-top: 2px solid var(--color-border);
      font-size: var(--text-xs);
      color: var(--color-muted);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    /* === PRIORITY-CODED RECOMMENDATIONS === */
    .priority {
      margin-bottom: var(--space-2xl);
    }
    
    .priority .card {
      position: relative;
      border-left: 4px solid var(--chip-color, var(--color-primary));
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      page-break-inside: avoid;
    }
    
    .priority .card header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-sm);
      gap: var(--space-md);
    }
    
    .priority .card header h4 {
      flex: 1;
      margin: 0;
    }
    
    .priority .card header .chip {
      flex-shrink: 0;
    }
    
    /* Priority-specific styling */
    .priority[aria-labelledby="priority-critical"] .card {
      border-left-color: #b91c1c;
      background: linear-gradient(90deg, #fef2f2 0%, #ffffff 100%);
    }
    
    .priority[aria-labelledby="priority-high"] .card {
      border-left-color: #db2777;
      background: linear-gradient(90deg, #fdf2f8 0%, #ffffff 100%);
    }
    
    .priority[aria-labelledby="priority-medium"] .card {
      border-left-color: #ca8a04;
      background: linear-gradient(90deg, #fefce8 0%, #ffffff 100%);
    }
    
    .priority[aria-labelledby="priority-low"] .card {
      border-left-color: #0f766e;
      background: linear-gradient(90deg, #f0fdfa 0%, #ffffff 100%);
    }
    
    /* === PREMIUM EXECUTIVE SUMMARY === */
    .executive-summary-hero {
      background: var(--gradient-hero);
      color: white;
      padding: var(--space-2xl) var(--space-xl);
      border-radius: var(--radius-xl);
      margin-bottom: var(--space-xl);
      box-shadow: var(--shadow-xl);
      position: relative;
      overflow: hidden;
    }
    
    .executive-summary-hero::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -20%;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
      border-radius: 50%;
    }
    
    .executive-summary-hero h3 {
      font-size: var(--text-h1);
      font-weight: var(--font-extrabold);
      margin: 0 0 var(--space-lg);
      position: relative;
      z-index: 1;
    }
    
    .executive-summary-hero .findings {
      display: grid;
      gap: var(--space-md);
      margin: var(--space-lg) 0;
      position: relative;
      z-index: 1;
    }
    
    .executive-summary-hero .finding-item {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(8px);
      padding: var(--space-md) var(--space-lg);
      border-radius: var(--radius-md);
      border-left: 4px solid rgba(255, 255, 255, 0.5);
      display: flex;
      gap: var(--space-md);
      align-items: flex-start;
    }
    
    .executive-summary-hero .finding-number {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: rgba(255, 255, 255, 0.25);
      border-radius: 50%;
      font-weight: var(--font-bold);
      font-size: var(--text-h4);
      flex-shrink: 0;
    }
    
    .executive-summary-hero .finding-text {
      flex: 1;
      line-height: var(--leading-relaxed);
    }
    
    /* === LEADS TABLE (Premium) === */
    .leads-table-wrapper {
      margin: var(--space-md) 0;
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-lg);
      page-break-inside: avoid;
    }
    
    .leads-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
    }
    
    .leads-table thead {
      background: var(--gradient-success);
    }
    
    .leads-table thead th {
      color: white;
      padding: var(--space-md) var(--space-lg);
      font-weight: var(--font-semibold);
      text-align: left;
      text-transform: uppercase;
      font-size: var(--text-sm);
      letter-spacing: 0.05em;
    }
    
    .leads-table tbody tr {
      transition: background 0.2s ease;
      page-break-inside: avoid;
    }
    
    .leads-table tbody tr:nth-child(even) {
      background: #f8fafc;
    }
    
    .leads-table tbody tr:hover {
      background: #e0f2fe;
    }
    
    .leads-table tbody td {
      padding: var(--space-md) var(--space-lg);
      border-top: 1px solid var(--color-border);
      line-height: var(--leading-relaxed);
    }
    
    .fit-score-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 40px;
      padding: 4px var(--space-sm);
      border-radius: var(--radius-full);
      font-weight: var(--font-bold);
      font-size: var(--text-xs);
      background: var(--gradient-success);
      color: white;
      box-shadow: var(--shadow-sm);
    }
    
    /* === PLAYBOOKS CARDS === */
    .playbook-card {
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-lg);
      position: relative;
      overflow: hidden;
    }
    
    .playbook-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 4px;
      height: 100%;
      background: var(--gradient-info);
    }
    
    .playbook-number {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      background: var(--gradient-info);
      color: white;
      border-radius: 50%;
      font-weight: var(--font-bold);
      font-size: var(--text-h4);
      margin-bottom: var(--space-sm);
    }
  </style>
</head>
<body>
  <header class="cover" role="banner">
    <span class="badge">Rankora AI · Reporte ejecutivo</span>
    <h1>${escapeHtml(coverTitle)}</h1>
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
    ${renderLeadsSection(leadIntelligence)}

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
    ${renderPlaybooksSection(playbooks)}
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
