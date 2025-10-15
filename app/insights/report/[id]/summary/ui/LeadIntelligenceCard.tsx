"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { LeadIntelligenceReportType, QualifiedLeadType } from "@/lib/lead-intelligence-schema";

interface LeadIntelligenceCardProps {
  report: LeadIntelligenceReportType;
}

function toCSV(leads: QualifiedLeadType[]): string {
  const headers = [
    "Company",
    "Website",
    "Industry",
    "Decision Maker",
    "Title",
    "Email",
    "Phone",
    "Fit Score",
    "Primary Channel",
  ];

  const rows = leads.map((l) => [
    l.company.company_name,
    l.company.website,
    l.company.industry,
    l.decision_maker.name || "",
    l.decision_maker.title,
    l.decision_maker.email || "",
    l.decision_maker.phone || "",
    String(l.qualification.overall_fit_score),
    l.outreach_strategy.primary_channel,
  ]);

  return [headers, ...rows]
    .map((cols) => cols.map((c) => `"${String(c ?? "").replaceAll('"', '""')}"`).join(","))
    .join("\n");
}

function downloadCSV(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function LeadIntelligenceCard({ report }: LeadIntelligenceCardProps) {
  const leads = Array.isArray(report?.qualified_leads) ? report.qualified_leads : [];
  if (leads.length === 0) {
    return (
      <Card className="border-emerald-500/40 bg-emerald-500/5">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-2xl font-semibold">🎯 Actionable Leads (Phase 1)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No se encontraron leads calificados con los criterios actuales. Intenta ajustar el sector/país o vuelve a generar.
          </p>
        </CardContent>
      </Card>
    );
  }

  const top = leads.slice(0, 10);

  const handleExport = () => {
    const csv = toCSV(leads);
    const date = new Date().toISOString().slice(0, 10);
    downloadCSV(`leads_${date}.csv`, csv);
  };

  return (
    <Card className="border-emerald-500/40 bg-emerald-500/5">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-2xl font-semibold">
          🎯 Actionable Leads (Phase 1)
        </CardTitle>
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">
            {leads.length} qualified
          </div>
          <Button size="sm" variant="outline" onClick={handleExport}>
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground mb-3">
          Preview of top 10 by fit score. Full list available via Export.
        </div>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Decision Maker</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Fit</TableHead>
                <TableHead>Channel</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {top.map((l, i) => (
                <TableRow key={`${l.company.company_name}-${i}`}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <a
                        href={l.company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground hover:underline"
                      >
                        {l.company.company_name}
                      </a>
                      <span className="text-xs text-muted-foreground">
                        {l.company.industry}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-foreground">
                        {l.decision_maker.name || "—"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {l.decision_maker.title}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {l.decision_maker.email || "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center justify-center w-10 h-6 rounded bg-emerald-500/10 text-emerald-600 text-xs font-medium">
                      {l.qualification.overall_fit_score}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs uppercase text-muted-foreground">
                      {l.outreach_strategy.primary_channel}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {report.market_analysis && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="p-3 rounded border bg-background">
              <div className="text-muted-foreground">Analyzed</div>
              <div className="text-lg font-semibold">
                {report.market_analysis.total_companies_analyzed}
              </div>
            </div>
            <div className="p-3 rounded border bg-background">
              <div className="text-muted-foreground">Pass Rate</div>
              <div className="text-lg font-semibold">
                {report.market_analysis.qualification_pass_rate}
              </div>
            </div>
            <div className="p-3 rounded border bg-background">
              <div className="text-muted-foreground">Avg Deal Size</div>
              <div className="text-lg font-semibold">
                {report.market_analysis.average_deal_size}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
