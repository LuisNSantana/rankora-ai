"use client";

import { BusinessInsight } from "@/lib/insights-schema";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Chart from "chart.js/auto";

export function DownloadInsightPDFButton({ insight }: { insight: BusinessInsight }) {
  const page = { width: 595.28, height: 841.89 } as const; // A4 in pt
  const margin = { top: 40, right: 40, bottom: 60, left: 40 } as const;

  const addHeader = (doc: jsPDF) => {
    // Header band
    doc.setFillColor(34, 80, 200);
    doc.rect(0, 0, page.width, 80, "F");
    // Logo (optional)
    try {
      // If logo is available in public, you can embed it by preloading as Image() and converting to DataURL
      // Skipping dynamic fetch for simplicity to avoid CORS; keep textual branding.
    } catch (_) {}
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    const title = insight.title || "RANKORA AI – INFORME DE INSIGHT";
    doc.text(title, margin.left, 50);
    doc.setFontSize(11);
    // Always display current date in Spanish locale for generation timestamp
    const fechaActual = new Date().toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    doc.text(`Generado: ${fechaActual}`, margin.left, 68);
  };

  const ensureSpace = (doc: jsPDF, y: number, needed: number) => {
    if (y + needed > page.height - margin.bottom) {
      doc.addPage();
      addHeader(doc);
      return margin.top + 60; // after header space
    }
    return y;
  };

  const addSectionTitle = (doc: jsPDF, title: string, y: number) => {
    y = ensureSpace(doc, y, 26);
    doc.setTextColor(34, 80, 200);
    doc.setFontSize(15);
    doc.text(title, margin.left, y);
    return y + 18;
  };

  const addParagraph = (doc: jsPDF, text: string, y: number) => {
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(12);
    const lines = doc.splitTextToSize(text, page.width - margin.left - margin.right);
    for (const line of lines) {
      y = ensureSpace(doc, y, 16);
      doc.text(line, margin.left, y);
      y += 14;
    }
    return y + 4;
  };

  const addKeyValueBullets = (doc: jsPDF, items: string[], y: number) => {
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(12);
    const maxWidth = page.width - margin.left - margin.right - 18; // account for bullet indent
    const indentX = 14;
    for (const item of items) {
      const lines = doc.splitTextToSize(String(item ?? ""), maxWidth);
      if (lines.length === 0) continue;
      for (let i = 0; i < lines.length; i++) {
        y = ensureSpace(doc, y, 16);
        const isFirst = i === 0;
        const x = margin.left + (isFirst ? 0 : indentX);
        const prefix = isFirst ? "• " : "";
        doc.text(`${prefix}${lines[i]}`, x, y);
        y += 14;
      }
    }
    return y + 4;
  };

  const addBulletsFromText = (doc: jsPDF, text: string, y: number) => {
    // Split summary text into bullet points by line breaks or hyphen bullets
    const rawLines = String(text || "")
      .split(/\r?\n|\u2022|\u2023|\-/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (rawLines.length === 0) return y;
    const maxWidth = page.width - margin.left - margin.right - 18;
    const indentX = 14;
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(12);
    for (const bullet of rawLines) {
      const lines = doc.splitTextToSize(bullet, maxWidth);
      for (let i = 0; i < lines.length; i++) {
        y = ensureSpace(doc, y, 16);
        const isFirst = i === 0;
        const x = margin.left + (isFirst ? 0 : indentX);
        const prefix = isFirst ? "• " : "";
        doc.text(`${prefix}${lines[i]}`, x, y);
        y += 14;
      }
    }
    return y + 4;
  };

  const addAutoTable = (doc: jsPDF, title: string, rows: any[], y: number) => {
    if (!rows || rows.length === 0) return y;
    // Title
    y = addSectionTitle(doc, title, y);
    const head = [Object.keys(rows[0])];
    const body = rows.map((r) => head[0].map((k) => (r as any)[k] ?? ""));
    autoTable(doc, {
      head,
      body,
      startY: y,
      styles: { fontSize: 10, overflow: "linebreak", cellWidth: "wrap", minCellHeight: 12 },
      headStyles: { fillColor: [34, 80, 200] },
      theme: "grid",
      columnStyles: {
        0: { cellWidth: 220 },
        1: { cellWidth: 100 },
        2: { cellWidth: 120 },
        3: { cellWidth: 80 },
      },
      margin: { left: margin.left, right: margin.right },
    });
    const finalY = (doc as any).lastAutoTable.finalY as number;
    return finalY + 10;
  };

  const renderChartToDataURL = async (
    type: "bar" | "line" | "pie",
    title: string | undefined,
    data: any,
    width = 520,
    height = 260
  ): Promise<string> => {
    // Create offscreen canvas
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    // Build datasets based on our expected schemas
  let labels: string[] = [];
  let values: number[] = [];

    const safeNum = (v: any) => {
      const n = typeof v === "string" ? Number(String(v).replace(/[^0-9.-]/g, "")) : Number(v);
      return isFinite(n) ? n : 0;
    };

    const getFirst = (obj: any, keys: string[], fallback?: any) => {
      for (const k of keys) if (obj[k] !== undefined) return obj[k];
      // Try first property value as very last resort
      const firstKey = Object.keys(obj || {})[0];
      return firstKey ? obj[firstKey] : fallback;
    };
    if (type === "bar") {
      // Accept Spanish/English keys
      labels = (data || []).map((d: any) => getFirst(d, ["categoria", "category", "name", "label", "key"], ""));
      values = (data || []).map((d: any) => safeNum(getFirst(d, ["valor", "value", "amount", "count"], 0)));
    } else if (type === "line") {
      labels = (data || []).map((d: any) => getFirst(d, ["periodo", "period", "date", "label"], ""));
      values = (data || []).map((d: any) => safeNum(getFirst(d, ["valor", "value"], 0)));
    } else if (type === "pie") {
      labels = (data || []).map((d: any) => getFirst(d, ["categoria", "category", "name", "label", "key"], ""));
      values = (data || []).map((d: any) => safeNum(getFirst(d, ["porcentaje", "percent", "value", "valor"], 0)));
    }

    const chart = new Chart(ctx, {
      type,
      data: {
        labels,
        datasets: [
          {
            label: title || "",
            data: values,
            backgroundColor: type === "pie"
              ? [
                  "#1f77b4",
                  "#ff7f0e",
                  "#2ca02c",
                  "#d62728",
                  "#9467bd",
                  "#8c564b",
                ]
              : "#2250C8",
            borderColor: "#2250C8",
            borderWidth: 1,
            fill: type === "line" ? false : undefined,
            tension: type === "line" ? 0.2 : undefined,
          },
        ],
      },
      options: {
        responsive: false,
        animation: false,
        events: [],
        plugins: {
          legend: { display: type === "pie" },
          title: { display: !!title, text: title },
        },
        scales: type === "pie" ? undefined : {
          x: { grid: { display: false } },
          y: { beginAtZero: true },
        },
      } as any,
    });

    // Force draw and capture image
    try {
      chart.update();
      const dataUrl = canvas.toDataURL("image/png", 1.0);
      chart.destroy();
      return typeof dataUrl === "string" && dataUrl.startsWith("data:image/png") ? dataUrl : "";
    } catch {
      try { chart.destroy(); } catch {}
      return "";
    }
  };

  const addChartImage = async (
    doc: jsPDF,
    type: "bar" | "line" | "pie",
    title: string | undefined,
    data: any,
    y: number
  ) => {
    const imgWidth = page.width - margin.left - margin.right;
    const imgHeight = 260;
    y = addSectionTitle(doc, title || type.toUpperCase(), y);
    y = ensureSpace(doc, y, imgHeight + 10);
    const url = await renderChartToDataURL(type, title, data, imgWidth, imgHeight);
    if (url) {
      doc.addImage(url, "PNG", margin.left, y, imgWidth, imgHeight);
      y += imgHeight + 10;
    } else {
      // Placeholder to avoid large blank areas when chart generation fails
      doc.setDrawColor(200);
      doc.setLineWidth(1);
      doc.roundedRect(margin.left, y, imgWidth, imgHeight, 8, 8);
      doc.setTextColor(120);
      doc.setFontSize(12);
      doc.text("(No se pudo renderizar la gráfica por falta de datos o formato de valores)", margin.left + 10, y + 20);
      y += imgHeight + 10;
    }
    return y;
  };

  const handleDownload = async () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    addHeader(doc);

    // Info card
    doc.setFillColor(245, 247, 255);
    doc.setDrawColor(34, 80, 200);
    doc.roundedRect(margin.left - 10, 90, page.width - margin.left - margin.right + 20, 70, 8, 8, "FD");
    doc.setTextColor(34, 80, 200);
    doc.setFontSize(12);
    doc.text(`Tipo: ${insight.type}`, margin.left, 115);
    doc.setTextColor(60, 60, 60);
    // Wrap fuentes to avoid overflow
    const fuentes = `Fuentes: ${insight.sources.join(", ")}`;
    const fuenteLines = doc.splitTextToSize(fuentes, page.width - margin.left - margin.right - 10);
    let yInfo = 135;
    for (const line of fuenteLines) {
      doc.text(line, margin.left, yInfo);
      yInfo += 14;
    }

    let y = 180;
    // Contexto y Alcance
    y = addSectionTitle(doc, "Contexto y alcance", y);
    const contexto = `Se analizaron ${insight.sources?.length ?? 0} document${(insight.sources?.length ?? 0) === 1 ? "o" : "os"} proporcionados por el usuario para generar un insight de tipo "${insight.type}". Este informe resume señales cuantitativas y recomendaciones accionables para la toma de decisiones.`;
    y = addParagraph(doc, contexto, y);

    // Resumen Ejecutivo (bullets) + Resumen ampliado
    y = addSectionTitle(doc, "Resumen ejecutivo", y);
    y = addBulletsFromText(doc, insight.summary, y);

    // Resumen ampliado: narrativa basada en las 3 métricas con valor numérico y las prioridades High
    const toNum = (v: any) => {
      const n = typeof v === "string" ? Number(String(v).replace(/[^0-9.-]/g, "")) : Number(v);
      return isFinite(n) ? n : NaN;
    };
    const numericMs = (insight.metrics || [])
      .map((m) => ({ ...m, _n: toNum(m.value) }))
      .filter((m) => !isNaN((m as any)._n))
      .sort((a: any, b: any) => Math.abs(b._n) - Math.abs(a._n))
      .slice(0, 3);
    const highRecs = (insight.recommendations || []).filter((r) => String(r.priority || "").toLowerCase() === "high");
    const resumenAmpliado = [
      numericMs.length
        ? `Las métricas más influyentes en este período son ${numericMs
            .map((m) => `${m.name}: ${m.value}${m.unit ? " " + m.unit : ""}${m.trend ? ` (${m.trend})` : ""}`)
            .join(", ")}.`
        : "Las métricas reportadas indican señales cuantitativas relevantes para el negocio.",
      highRecs.length
        ? `Para capturar valor rápidamente, se recomienda priorizar: ${highRecs
            .map((r) => r.title)
            .join(", ")}.`
        : "No se reportaron acciones de alta prioridad; revise las recomendaciones para definir quick wins.",
      "Este resumen integra la evidencia cuantitativa con acciones tácticas, facilitando la ejecución en el corto plazo.",
    ].join(" ");
    y = addParagraph(doc, resumenAmpliado, y);

    // Métricas clave
    y = addSectionTitle(doc, "Métricas clave", y);
    const metricLines = insight.metrics.map(
      (m) => `${m.name}: ${m.value}${m.unit ? " " + m.unit : ""}${m.trend ? ` (${m.trend})` : ""}`
    );
    y = addKeyValueBullets(doc, metricLines, y);

    // Métricas (tabla)
    try {
      const metricRows = insight.metrics.map((m) => ({
        nombre: m.name,
        valor: String(m.value),
        unidad: m.unit || "",
        tendencia: m.trend || "",
      }));
      if (metricRows.length > 0) {
        y = addAutoTable(doc, "Métricas (detalle)", metricRows as any[], y);
      }
    } catch {}

    // Recomendaciones
    y = addSectionTitle(doc, "Recomendaciones", y);
    const recLines = insight.recommendations.map(
      (r) => `${r.title}${r.priority ? ` [${r.priority.toUpperCase()}]` : ""}: ${r.description}`
    );
    y = addKeyValueBullets(doc, recLines, y);

    // Roadmap 90 días (derivado por prioridad)
    const recHigh = insight.recommendations.filter((r) => String(r.priority || "").toLowerCase() === "high");
    const recMedium = insight.recommendations.filter((r) => String(r.priority || "").toLowerCase() === "medium");
    const recLow = insight.recommendations.filter((r) => String(r.priority || "").toLowerCase() === "low");
    y = addSectionTitle(doc, "Hoja de ruta (90 días)", y);
    y = addParagraph(doc, "0-30 días (Impacto inmediato):", y);
    y = addKeyValueBullets(doc, recHigh.map((r) => r.title), y);
    y = addParagraph(doc, "31-60 días (Consolidación):", y);
    y = addKeyValueBullets(doc, recMedium.map((r) => r.title), y);
    y = addParagraph(doc, "61-90 días (Escalamiento):", y);
    y = addKeyValueBullets(doc, recLow.map((r) => r.title), y);

    // KPIs recomendados para seguimiento (derivados de métricas)
    const kpis = (insight.metrics || []).map((m) => `${m.name}${m.unit ? ` (${m.unit})` : ""}`);
    if (kpis.length) {
      y = addSectionTitle(doc, "KPIs a monitorear", y);
      y = addKeyValueBullets(doc, kpis, y);
    }

    // Visualizaciones
    if (insight.visualizations && insight.visualizations.length > 0) {
      y = addSectionTitle(doc, "Visualizaciones", y);

      // First render any tables using autoTable
      for (const v of insight.visualizations) {
        if (v.type === "table") {
          try {
            const rows = Array.isArray(v.data) ? (v.data as any[]) : [];
            y = addAutoTable(doc, v.title || "Tabla", rows, y);
          } catch (_) {
            // Fallback to text listing
            y = addParagraph(doc, `${v.title || "Tabla"}: Datos no tabulares`, y);
          }
        }
      }

      // Then render charts (bar/line/pie)
      let chartsRendered = 0;
      for (const v of insight.visualizations) {
        if (v.type === "bar" || v.type === "line" || v.type === "pie") {
          const before = y;
          y = await addChartImage(doc, v.type, v.title, v.data, y);
          if (y !== before) chartsRendered++;
        }
      }

      // Fallback: if no charts were renderable, derive a simple bar chart from numeric metrics
      if (chartsRendered === 0 && Array.isArray(insight.metrics) && insight.metrics.length > 0) {
        const safeNum = (v: any) => {
          const n = typeof v === "string" ? Number(String(v).replace(/[^0-9.-]/g, "")) : Number(v);
          return isFinite(n) ? n : NaN;
        };
        const candidates = insight.metrics
          .map((m) => ({ categoria: m.name, valor: safeNum(m.value) }))
          .filter((m) => !isNaN(m.valor))
          .slice(0, 8);
        if (candidates.length >= 2) {
          y = await addChartImage(doc, "bar", "Resumen de métricas (derivado)", candidates, y);
        } else {
          // At least show the table of metrics again to avoid blank section
          const metricRows = insight.metrics.map((m) => ({ nombre: m.name, valor: String(m.value) }));
          y = addAutoTable(doc, "Métricas resumidas", metricRows as any[], y);
        }
      }
    }

    // Fuentes
    if (Array.isArray(insight.sources) && insight.sources.length > 0) {
      y = addSectionTitle(doc, "Fuentes", y);
      for (const src of insight.sources) {
        y = ensureSpace(doc, y, 16);
        // Avoid overly long lines: wrap if necessary
        const line = doc.splitTextToSize(String(src), page.width - margin.left - margin.right - 10);
        for (const l of line) {
          y = ensureSpace(doc, y, 16);
          doc.text(`• ${l}`, margin.left, y);
          y += 14;
        }
      }
    }

    // Footer y numeración de páginas
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setTextColor(180, 180, 180);
      doc.setFontSize(10);
      doc.text("Generado por Rankora AI | Huminary Labs", margin.left, page.height - 20);
      doc.text(`${i} / ${pageCount}`, page.width - margin.right, page.height - 20, { align: "right" as any });
    }
    doc.save(`informe-${insight.type}.pdf`);
  };

  return (
    <button
      className="bg-blue-600 text-white px-4 py-2 rounded mt-4"
      onClick={handleDownload}
    >
      Descargar PDF
    </button>
  );
}
