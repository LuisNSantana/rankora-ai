"use client";

import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import { SeoReport } from "@/lib/seo-schema";

interface DownloadReportButtonProps {
  seoReport: SeoReport;
}

export default function DownloadReportButton({ seoReport }: DownloadReportButtonProps) {
  const handleDownload = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    // Header with color
    doc.setFillColor(34, 80, 200);
    doc.rect(0, 0, 595, 80, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.text("RANKORA AI - SEO REPORT", 40, 50);
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 40, 70);

    // Main info box
    doc.setFillColor(245, 247, 255);
    doc.setDrawColor(34, 80, 200);
    doc.roundedRect(30, 90, 535, 70, 8, 8, "FD");
    doc.setTextColor(34, 80, 200);
    doc.setFontSize(16);
    doc.text(`Entity: ${seoReport.meta.entity_name || "N/A"}`, 50, 120);
    doc.setFontSize(12);
    doc.text(`Type: ${seoReport.meta.entity_type || "N/A"}`, 50, 140);
    doc.text(`Score: ${seoReport.meta.confidence_score ?? "N/A"}`, 250, 140);

    // Visual score bar
    const score = Math.round((seoReport.meta.confidence_score ?? 0) * 100);
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(230, 230, 230);
    doc.roundedRect(400, 130, 140, 16, 8, 8, "FD");
    doc.setFillColor(34, 160, 80);
    doc.roundedRect(400, 130, 1.4 * score, 16, 8, 8, "F");
    doc.setTextColor(34, 80, 200);
    doc.setFontSize(10);
    doc.text(`Confidence: ${score}%`, 470, 142);

    let y = 180;
    // Helper for page break
    const pageHeight = 842; // A4 pt height
    const marginBottom = 60;
    function checkPageBreak(extra = 0) {
      if (y + extra > pageHeight - marginBottom) {
        doc.addPage();
        y = 40;
      }
    }

    // Executive Summary / Agent Explanation (Expanded, dynamic height, with page breaks)
    doc.setTextColor(34, 80, 200);
    doc.setFontSize(15);
    checkPageBreak(24);
    doc.text("Executive Summary", 40, y);
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(12);
    y += 18;
    const summaryText = [
      "Rankora AI has conducted a comprehensive analysis of your digital presence, benchmarking your performance against industry standards and top competitors. This report not only highlights your current strengths and weaknesses, but also provides strategic guidance tailored to your business context.",
      "Key findings indicate that your brand has a strong foundation in its niche, but there are critical areas that require immediate attention to unlock further growth. The digital landscape is highly dynamic; staying ahead requires both technical SEO improvements and creative marketing strategies.",
      "As your AI consultant, I recommend prioritizing actions that yield quick wins while simultaneously investing in long-term opportunities. Remember, SEO is a continuous process—consistent effort and adaptation to market trends are essential for sustained success.",
      "This report includes actionable advice, expert insights, and a roadmap for the next steps. For best results, review each section carefully and consider integrating these recommendations into your digital strategy."
    ];
    summaryText.forEach((line) => {
      const split = doc.splitTextToSize(line, 500);
      checkPageBreak(split.length * 14 + 6);
      doc.text(split, 50, y);
      y += split.length * 14 + 6;
    });
    y += 8;

    // Expert Insights (dynamic height, with page breaks)
    doc.setTextColor(34, 80, 200);
    doc.setFontSize(15);
    checkPageBreak(24);
    doc.text("Expert Insights", 40, y);
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(12);
    y += 18;
    const insights = [
      "• Diversify your backlink profile by targeting editorial and news domains—this will boost your authority and trust signals.",
      "• Leverage your unique brand identity to create content that resonates emotionally with your audience.",
      "• Monitor competitor strategies regularly; adapt quickly to shifts in keyword trends and content formats.",
      "• Invest in technical SEO: site speed, mobile optimization, and structured data are increasingly important for ranking.",
      "• Build partnerships with influencers and thought leaders to amplify your reach and credibility."
    ];
    insights.forEach((line) => {
      const split = doc.splitTextToSize(line, 500);
      checkPageBreak(split.length * 14 + 2);
      doc.text(split, 50, y);
      y += split.length * 14 + 2;
    });
    y += 8;

    // Next Steps (Strategic Roadmap, dynamic height, with page breaks)
    doc.setTextColor(34, 80, 200);
    doc.setFontSize(15);
    checkPageBreak(24);
    doc.text("Next Steps", 40, y);
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(12);
    y += 18;
    const nextSteps = [
      "1. Assign responsibility for each recommendation and set clear deadlines.",
      "2. Track progress monthly and adjust tactics based on analytics and competitor moves.",
      "3. Schedule a quarterly review of your SEO and content strategy to ensure alignment with business goals.",
      "4. Consider a follow-up consultation with Rankora AI for ongoing optimization and support."
    ];
    nextSteps.forEach((line) => {
      const split = doc.splitTextToSize(line, 500);
      checkPageBreak(split.length * 14 + 2);
      doc.text(split, 50, y);
      y += split.length * 14 + 2;
    });
    y += 8;

    // Key Strengths
    if (seoReport.summary?.key_strengths) {
      doc.setTextColor(34, 80, 200);
      doc.setFontSize(15);
      checkPageBreak(24);
      doc.text("Key Strengths", 40, y);
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(12);
      y += 18;
      seoReport.summary.key_strengths.forEach((item) => {
        checkPageBreak(16);
        doc.text(`• ${item}`, 50, y);
        y += 16;
      });
      y += 8;
    }
    // Critical Issues
    if (seoReport.summary?.critical_issues) {
      doc.setTextColor(200, 34, 34);
      doc.setFontSize(15);
      checkPageBreak(24);
      doc.text("Critical Issues", 40, y);
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(12);
      y += 18;
      seoReport.summary.critical_issues.forEach((item) => {
        checkPageBreak(16);
        doc.text(`• ${item}`, 50, y);
        y += 16;
      });
      y += 8;
    }
    // Quick Wins
    if (seoReport.summary?.quick_wins) {
      doc.setTextColor(34, 160, 80);
      doc.setFontSize(15);
      checkPageBreak(24);
      doc.text("Quick Wins", 40, y);
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(12);
      y += 18;
      seoReport.summary.quick_wins.forEach((item) => {
        checkPageBreak(16);
        doc.text(`• ${item}`, 50, y);
        y += 16;
      });
      y += 8;
    }
    // Long Term Opportunities
    if (seoReport.summary?.long_term_opportunities) {
      doc.setTextColor(34, 80, 200);
      doc.setFontSize(15);
      checkPageBreak(24);
      doc.text("Long Term Opportunities", 40, y);
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(12);
      y += 18;
      seoReport.summary.long_term_opportunities.forEach((item) => {
        checkPageBreak(16);
        doc.text(`• ${item}`, 50, y);
        y += 16;
      });
      y += 8;
    }

    // Actionable Recommendations (show up to 8)
    if (seoReport.recommendations && seoReport.recommendations.length > 0) {
      doc.setTextColor(34, 80, 200);
      doc.setFontSize(15);
      checkPageBreak(24);
      doc.text("Actionable Recommendations", 40, y);
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(12);
      y += 18;
      seoReport.recommendations.slice(0, 8).forEach((rec) => {
        const split = doc.splitTextToSize(`• [${rec.category.toUpperCase()}] ${rec.title} - ${rec.description}`, 480);
        checkPageBreak(split.length * 16);
        doc.text(split, 50, y);
        y += split.length * 16;
      });
      y += 8;
    }

    // Competitor Overview
    if (seoReport.competitors && seoReport.competitors.length > 0) {
      doc.setTextColor(34, 80, 200);
      doc.setFontSize(15);
      checkPageBreak(24);
      doc.text("Competitor Overview", 40, y);
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(12);
      y += 18;
      seoReport.competitors.slice(0, 5).forEach((comp) => {
        checkPageBreak(16);
        doc.text(`• ${comp.name || comp.domain} (Score: ${comp.strength_score})`, 50, y);
        y += 16;
      });
      y += 8;
    }

    // Top Keywords
    if (seoReport.keywords?.content_keywords && seoReport.keywords.content_keywords.length > 0) {
      doc.setTextColor(34, 80, 200);
      doc.setFontSize(15);
      checkPageBreak(24);
      doc.text("Top Keywords", 40, y);
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(12);
      y += 18;
      seoReport.keywords.content_keywords.slice(0, 8).forEach((kw) => {
        checkPageBreak(16);
        doc.text(`• ${kw.keyword}`, 50, y);
        y += 16;
      });
      y += 8;
    }

    // Data Sources summary
    if (seoReport.inventory?.total_sources) {
      doc.setTextColor(34, 80, 200);
      doc.setFontSize(15);
      checkPageBreak(24);
      doc.text("Data Sources", 40, y);
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(12);
      y += 18;
      checkPageBreak(16);
      doc.text(`Total Sources: ${seoReport.inventory.total_sources}`, 50, y);
      y += 16;
      if (seoReport.inventory.unique_domains && seoReport.inventory.unique_domains.length > 0) {
        checkPageBreak(16);
        doc.text(`Unique Domains: ${seoReport.inventory.unique_domains.slice(0, 5).join(", ")}${seoReport.inventory.unique_domains.length > 5 ? ', ...' : ''}`, 50, y);
        y += 16;
      }
      y += 8;
    }

    // Footer
    doc.setTextColor(180, 180, 180);
    doc.setFontSize(10);
    doc.text("Generated by Rankora AI (Huminary Labs) | For support: information@huminarylabs.com", 40, 810);

    doc.save(`seo-report-${seoReport.meta.entity_name || "entity"}.pdf`);
  };

  return (
    <Button onClick={handleDownload} className="mb-4" variant="outline">
      Download PDF
    </Button>
  );
}
