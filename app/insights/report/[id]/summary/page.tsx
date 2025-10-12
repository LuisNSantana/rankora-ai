"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AlertTriangle, Loader2 } from "lucide-react";
import { BusinessInsight } from "@/lib/insights-schema";
import { useUser } from "@clerk/nextjs";
import SummaryHeader from "./ui/SummaryHeader";
import KeyMetricsGrid from "./ui/KeyMetricsGrid";
import RecommendationsCard from "./ui/RecommendationsCard";
import VisualizationsGrid from "./ui/VisualizationsGrid";
import { DownloadInsightPDFButton } from "@/app/insights/DownloadInsightPDFButton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

import type { Id } from "@/convex/_generated/dataModel";

interface InsightSummaryProps {
  params: Promise<{ id: string }> | { id: string };
}

export default function InsightSummary({ params }: InsightSummaryProps) {
  // params comes as a Promise in Next.js 15; unwrap with React.use()
  // Cast to any to satisfy the Usable<T> typing
  const { id } = React.use(params as any) as { id: string };
  const { user } = useUser();

  // Convex expects Id<"insightReports">, so cast string to Id type
  const report = useQuery(api.insightReports.getInsightById, {
    id: id as Id<"insightReports">,
  });

  const insight = report?.insightReport as BusinessInsight | undefined;

  if (report === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading insight report...</p>
        </div>
      </div>
    );
  }

  if (report === null || !insight) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Insight Not Found</h2>
          <p className="text-muted-foreground">
            The requested business insight could not be found.
          </p>
        </div>
      </div>
    );
  }
  // Derive a display title: insight.title > insight.meta.title > report.originalPrompt
  const displayTitle = insight.title || insight.meta?.title || (report?.originalPrompt as string) || "Business Insight";

  // Create a shallow copy with ensured meta.title and status/createdAt for UI
  const insightForUI: BusinessInsight & { status?: string; createdAt?: number } = {
    ...insight,
    meta: { ...(insight.meta || {}), title: displayTitle },
    status: report.status,
    createdAt: report.createdAt,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <SummaryHeader insight={insightForUI} />
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 space-y-8 lg:space-y-12">
        <DownloadInsightPDFButton insight={insightForUI} />
        <KeyMetricsGrid insight={insightForUI} />
        <RecommendationsCard insight={insightForUI} />
        <VisualizationsGrid insight={insightForUI} />
        {/* Fuentes: lista de archivos/URLs analizados */}
        {Array.isArray(insightForUI.sources) && insightForUI.sources.length > 0 && (
          <Card className="border bg-gradient-to-br from-card to-card/95">
            <CardHeader>
              <CardTitle className="text-2xl">Fuentes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-6 space-y-2 text-sm">
                {insightForUI.sources.map((src, i) => {
                  const isUrl = /^https?:\/\//i.test(src);
                  return (
                    <li key={i} className="break-words">
                      {isUrl ? (
                        <a href={src} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {src}
                        </a>
                      ) : (
                        <span className="text-foreground/90">{src}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        )}
        {/* Research & Sources: show Perplexity research if available */}
        {insightForUI.meta?.research && (
          <div className="bg-card rounded shadow p-6 border border-border/50">
            <h3 className="text-lg font-semibold mb-2">Research & Notes</h3>
            <div className="text-sm text-muted-foreground whitespace-pre-line">{String(insightForUI.meta.research)}</div>
            {insightForUI.meta?.sourcesDetailed && (
              <div className="mt-3 text-xs text-muted-foreground">Sources: {String(insightForUI.meta.sourcesDetailed)}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
