import React from "react";
import { BusinessInsight } from "@/lib/insights-schema";
import StatusBadge from "@/components/StatusBadge";
import { formatDateTime } from "@/lib/status-utils";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Database, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DownloadInsightPDFButton } from "@/app/insights/DownloadInsightPDFButton";

interface SummaryHeaderProps {
  insight: BusinessInsight & { status?: string; createdAt?: number };
}

export default function SummaryHeader({ insight }: SummaryHeaderProps) {
  const created = insight.createdAt
    ? formatDateTime(insight.createdAt)
    : insight.generated_at
    ? formatDateTime(new Date(insight.generated_at).getTime())
    : undefined;

  return (
    <div className="border-b bg-gradient-to-r from-card via-card/95 to-card backdrop-blur-sm">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Title & meta */}
          <div className="space-y-3 flex-1">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-400/30 to-pink-500/30 dark:from-amber-500/20 dark:to-pink-600/20 border border-amber-500/30 dark:border-amber-500/40 shadow-sm">
                <Lightbulb className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {insight.title || insight.meta?.title || "Insight de Negocio"}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {insight.type && (
                    <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300 capitalize">
                      {insight.type}
                    </Badge>
                  )}
                  {insight.sources && (
                    <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/20">
                      <Database className="h-3.5 w-3.5 mr-1" /> {insight.sources.length} fuentes
                    </Badge>
                  )}
                  {created && (
                    <Badge variant="secondary" className="bg-muted/60 text-muted-foreground border-border/40">
                      <Clock className="h-3.5 w-3.5 mr-1" /> {created}
                    </Badge>
                  )}
                  {insight.status && (
                    <div className="ml-1"><StatusBadge status={insight.status} showIcon /></div>
                  )}
                </div>
              </div>
            </div>
            {insight.summary && (
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-line">
                {insight.summary}
              </p>
            )}
            {insight.meta?.research && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
                <FileText className="h-4 w-4" /> Enriquecido con datos de investigación
              </div>
            )}
          </div>
          {/* Actions */}
          <div className="flex flex-col items-stretch gap-3 w-full max-w-xs">
            <DownloadInsightPDFButton insight={insight} />
            {insight.meta?.sourcesDetailed && (
              <div className="text-[10px] text-muted-foreground line-clamp-3 leading-snug border rounded-md p-2 bg-card/50">
                <span className="font-semibold uppercase tracking-wide text-foreground/70">Fuentes detalladas:</span> {insight.meta.sourcesDetailed}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
