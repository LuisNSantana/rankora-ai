import { NextRequest, NextResponse } from "next/server";
import { Buffer } from "node:buffer";
import os from "node:os";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer"; // Changed from puppeteer-core to full puppeteer

import { BusinessInsightSchema } from "@/lib/insights-schema";
import { renderInsightReportHTML } from "@/lib/pdf/renderInsightReport";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Launch browser with environment-aware strategy:
 * - Development/macOS: Use puppeteer's bundled Chromium (cross-platform compatible)
 * - Production/AWS Lambda: Use @sparticuz/chromium (optimized for serverless)
 */
async function launchBrowser() {
  const platform = os.platform();
  const isDevelopment = process.env.NODE_ENV === "development" || platform === "darwin";
  
  try {
    if (isDevelopment) {
      // Development mode: Use puppeteer's bundled Chromium
      // This works on macOS, Windows, and Linux without any binary issues
      console.log(`[PDF] 🚀 Launching puppeteer bundled Chromium (${platform})`);
      
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ],
        defaultViewport: { width: 1920, height: 1080 },
      });
      
      console.log("[PDF] ✅ Puppeteer bundled Chromium launched successfully");
      return browser;
    }
    
    // Production mode: Use @sparticuz/chromium for AWS Lambda
    console.log("[PDF] 🚀 Launching @sparticuz/chromium (production/serverless)");
    const executablePath = await chromium.executablePath();
    console.log("[PDF] Chromium executable path:", executablePath);
    
    const browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
      defaultViewport: { width: 1920, height: 1080 },
      executablePath,
      headless: true,
    });
    
    console.log("[PDF] ✅ @sparticuz/chromium launched successfully");
    return browser;
  } catch (e: any) {
    console.error("[PDF] ❌ Failed to launch browser:", e?.message || e);
    console.error("[PDF] Error details:", {
      code: e?.code,
      errno: e?.errno,
      platform,
      nodeEnv: process.env.NODE_ENV,
    });
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => ({}));
    const candidate = payload?.insight ?? payload;

    // Enhanced validation for new Grok-generated insights
    const parsed = BusinessInsightSchema.safeParse(candidate);
    if (!parsed.success) {
      console.error("PDF validation error:", {
        issues: parsed.error.issues,
        receivedKeys: Object.keys(candidate || {}),
        sampleData: JSON.stringify(candidate, null, 2).substring(0, 500)
      });
      
      // Try to extract minimal required fields for PDF generation
      const minimalInsight = {
        type: candidate?.type || "general",
        title: candidate?.title || "Business Insight Report",
        summary: candidate?.summary || "Summary not available",
        metrics: Array.isArray(candidate?.metrics) ? candidate.metrics : [],
        recommendations: Array.isArray(candidate?.recommendations) ? candidate.recommendations : [],
        sources: Array.isArray(candidate?.sources) ? candidate.sources : ["Generated Report"],
        generated_at: candidate?.generated_at || new Date().toISOString(),
        visualizations: Array.isArray(candidate?.visualizations) ? candidate.visualizations : [],
        meta: candidate?.meta || {},
      };
      
      console.log("Using fallback minimal insight for PDF generation");
      const html = await renderInsightReportHTML(minimalInsight as any);
      
      const browser = await launchBrowser();
      if (browser) {
        try {
          const page = await browser.newPage();
          await page.setContent(html, { waitUntil: "networkidle0" });

          const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: { top: "18mm", right: "16mm", bottom: "20mm", left: "16mm" },
            displayHeaderFooter: false,
          });
          const pdf = Buffer.from(pdfBuffer);
          const filename = `${(minimalInsight.title).replace(/[^a-z0-9-_]/gi, "-")}_rankora.pdf`;
          return new NextResponse(pdf, {
            status: 200,
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": `attachment; filename="${filename}"`,
              "Cache-Control": "no-store",
            },
          });
        } finally {
          await browser.close();
        }
      }
      // If browser launch failed, return HTML as a graceful fallback
      return new NextResponse(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": "inline; filename=fallback_rankora_insight.html",
          "Cache-Control": "no-store",
        },
      });
    }

    const insight = parsed.data;
    const html = await renderInsightReportHTML(insight);

    const browser = await launchBrowser();
    if (browser) {
      try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "networkidle0" });

        const pdfBuffer = await page.pdf({
          format: "A4",
          printBackground: true,
          margin: { top: "18mm", right: "16mm", bottom: "20mm", left: "16mm" },
          displayHeaderFooter: false,
        });
        const pdf = Buffer.from(pdfBuffer);
        const filename = `${(insight.title ?? insight.type ?? "insight").replace(/[^a-z0-9-_]/gi, "-")}_rankora.pdf`;
        return new NextResponse(pdf, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Cache-Control": "no-store",
          },
        });
      } finally {
        await browser.close();
      }
    }
    // Fallback: return HTML if headless browser unavailable (client will open in new tab)
    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": "inline; filename=fallback_rankora_insight.html",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("PDF generation error", error);
    return NextResponse.json(
      { message: "No se pudo generar el PDF.", error: error instanceof Error ? error.message : "unknown" },
      { status: 500 }
    );
  }
}
