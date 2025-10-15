"use client";

import React from "react";
import { AlertTriangle, Loader2, AlertCircle } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import SummaryHeader from "./ui/SummaryHeader";
import KeyMetricsGrid from "./ui/KeyMetricsGrid";
import RecommendationsCard from "./ui/RecommendationsCard";
import RecommendationMatrix from "./ui/RecommendationMatrix";
import IndustryIntelligenceCard from "./ui/IndustryIntelligenceCard";
import VisualizationsGrid from "./ui/VisualizationsGrid";
import FirecrawlInsightsCard from "./ui/FirecrawlInsightsCard";
import LeadIntelligenceCard from "./ui/LeadIntelligenceCard";
import PlaybooksCard from "./ui/PlaybooksCard";
import ExecutiveSummaryCard from "./ui/ExecutiveSummaryCard";
import { DownloadInsightPDFButton } from "@/app/insights/DownloadInsightPDFButton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import AIChat from "@/components/AIChat";
import { useFullInsight } from "./useFullInsight";
import type { Id } from "@/convex/_generated/dataModel";

interface InsightSummaryProps {
  params: Promise<{ id: string }> | { id: string };
}

export default function InsightSummary({ params }: InsightSummaryProps) {
  // params comes as a Promise in Next.js 15; unwrap with React.use()
  const { id } = React.use(params as any) as { id: string };
  const { user } = useUser();

  // Use custom hook that handles both small and large reports
  const { insight, isLoading, isLargeReport, error } = useFullInsight(id as Id<"insightReports">);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            {isLargeReport ? "Loading large insight report from storage..." : "Loading insight report..."}
          </p>
        </div>
      </div>
    );
  }

  if (error || !insight) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">
            {error ? "Error Loading Insight" : "Insight Not Found"}
          </h2>
          <p className="text-muted-foreground mb-4">
            {error || "The requested business insight could not be found."}
          </p>
          {isLargeReport && error && (
            <Card className="mt-4 border-orange-500/50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Large Report Notice
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                This is a large insight report stored in file storage. 
                If the error persists, please contact support.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <SummaryHeader insight={insight} />
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 space-y-8 lg:space-y-12">
        {isLargeReport && (
          <Card className="border-blue-500/50 bg-blue-500/5">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Large Report Loaded Successfully
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              This comprehensive insight was stored in high-capacity file storage due to its size.
              All features are available, including PDF export and AI chat.
            </CardContent>
          </Card>
        )}
        
        <DownloadInsightPDFButton insight={insight} />
        
        {/* Resumen Ejecutivo - Sección Hero */}
        <ExecutiveSummaryCard insight={insight} />
        
        {/* Business Intelligence */}
        <FirecrawlInsightsCard insight={insight} />

        {/* Lead Intelligence */}
        {insight.meta?.leadIntelligence && (
          <LeadIntelligenceCard report={insight.meta.leadIntelligence as any} />
        )}
        
        {/* Métricas Clave */}
        <KeyMetricsGrid insight={insight} />
        
        {/* Industry Intelligence */}
        <IndustryIntelligenceCard insight={insight} />
        
        {/* Recomendaciones */}
        <RecommendationsCard insight={insight} />
        
        {/* Matriz de Priorización */}
        <RecommendationMatrix insight={insight} />
        
        {/* Playbooks de Ejecución */}
        {(insight as any)?.meta?.playbooks && (
          <PlaybooksCard insight={insight as any} />
        )}
        
        {/* Visualizaciones */}
        <VisualizationsGrid insight={insight} />
        
        {/* AI Chat Assistant */}
        <AIChat seoReportId={id} reportType="insight" />
        
        {/* Fuentes: lista de archivos/URLs analizados */}
        {Array.isArray(insight.sources) && insight.sources.length > 0 && (
          <Card className="border bg-gradient-to-br from-card to-card/95">
            <CardHeader>
              <CardTitle className="text-2xl">Fuentes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-6 space-y-2 text-sm">
                {insight.sources.map((src: string, i: number) => {
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
        {insight.meta?.research && (
          <div className="bg-card rounded shadow p-6 border border-border/50">
            <h3 className="text-lg font-semibold mb-2">Research & Notes</h3>
            <div className="text-sm text-muted-foreground whitespace-pre-line">{String(insight.meta.research)}</div>
            {insight.meta?.sourcesDetailed && (
              <div className="mt-3 text-xs text-muted-foreground">Sources: {String(insight.meta.sourcesDetailed)}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
