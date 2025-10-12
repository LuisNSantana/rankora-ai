"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Loader2, FileText, Trash2, TrendingUp } from "lucide-react";
import { RefreshCw } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { formatDate } from "@/lib/status-utils";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import DownloadInsightButton from "@/components/DownloadInsightButton";

export default function InsightsTable({ insights }: { insights: any[] }) {
  const deleteInsight = useMutation(api.insightReports.deleteInsightReport);
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleRowClick = (id: string | undefined) => {
    if (id) {
      router.push(`/insights/report/${id}/summary`);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("¿Estás seguro de que quieres eliminar este insight? Esta acción no se puede deshacer.")) return;
    setDeletingId(id);
    try {
      await deleteInsight({ id: id as Id<"insightReports"> });
    } catch (error) {
      console.error("Failed to delete insight:", error);
      alert("No se pudo eliminar el insight. Intenta de nuevo.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleRetry = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    // Confirm user intent
    if (!confirm("Retry analysis for this insight? If the analysis failed you can retry without re-scraping.")) return;
    // Call server action to retry insight analysis-only
    try {
      setDeletingId(id); // reuse state for simple loading indicator
      const retry = (await import("@/actions/retryInsight")).default;
      const result = await retry(id);
      if (!result.ok) {
        alert(result.error || "Failed to retry insight analysis");
      } else {
        // Let real-time updates refresh the list; show a small success toast
        console.log("Insight retry started:", id);
      }
    } catch (error) {
      console.error("Retry failed:", error);
      alert(error instanceof Error ? error.message : "Failed to retry insight");
    } finally {
      setDeletingId(null);
    }
  };


  if (!insights) {
    return (
      <Card className="flex flex-col items-center justify-center p-12 text-center border-0 bg-gradient-to-br from-blue-50/60 to-purple-50/40 dark:from-blue-900/20 dark:to-purple-900/10 shadow-none">
        <div className="p-3 bg-muted/50 rounded-full mb-4">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Loading Insights</h3>
        <p className="text-muted-foreground">
          Fetching your latest business insights...
        </p>
      </Card>
    );
  }

  if (insights.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-12 text-center border-0 bg-gradient-to-br from-blue-50/60 to-purple-50/40 dark:from-blue-900/20 dark:to-purple-900/10 shadow-none">
        <div className="p-4 bg-muted/50 rounded-full mb-6">
          <FileText className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No Insights Yet</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          Create your first business insight report above to see it here.
        </p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TrendingUp className="w-4 h-4" />
          <span>Start your first insight to see it here</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="w-full">
      <Card className="rounded-lg border bg-gradient-to-br from-card to-card/95 shadow-md">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/50">
              <TableHead className="font-semibold text-foreground">Insight</TableHead>
              <TableHead className="font-semibold text-foreground">Status</TableHead>
              <TableHead className="font-semibold text-foreground">Created</TableHead>
              <TableHead className="font-semibold text-foreground w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {insights.map((insight) => (
              <TableRow
                key={insight._id}
                className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-50/60 hover:to-purple-50/40 dark:hover:from-blue-900/20 dark:hover:to-purple-900/10 transition-colors border-b border-border/30 last:border-b-0 group"
                onClick={() => handleRowClick(insight._id)}
              >
                <TableCell className="font-medium py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-muted/50 rounded-md group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium text-foreground">
                          {insight.title || insight.originalPrompt || insight.insightReport?.summary || "Untitled"}
                        </span>
                        {insight.type && (
                          <Badge variant="secondary" className="ml-2 capitalize bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/20">
                            {insight.type}
                          </Badge>
                        )}
                      </div>
                      {insight._id && (
                        <p className="text-xs text-muted-foreground mt-1 font-mono">
                          ID: {insight._id.slice(0, 8)}...
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <StatusBadge status={insight.status || "completed"} showIcon={true} />
                </TableCell>
                <TableCell className="py-4 text-muted-foreground">
                  {formatDate(insight.createdAt || insight.generated_at)}
                </TableCell>
                <TableCell className="py-4 flex gap-2 items-center">
                  <DownloadInsightButton insight={insight.insightReport || insight} />
                  {insight.status === "failed" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleRetry(e, insight._id)}
                      disabled={deletingId === insight._id}
                      className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-700"
                    >
                      {deletingId === insight._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDelete(e, insight._id)}
                    disabled={deletingId === insight._id}
                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                  >
                    {deletingId === insight._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      {/* Summary Stats */}
      <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span>
              {insights.length} total insight{insights.length !== 1 ? "s" : ""}
            </span>
          </div>
          {insights.filter((i) => i.status === "completed").length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>
                {insights.filter((i) => i.status === "completed").length} completed
              </span>
            </div>
          )}
        </div>
        <div className="text-xs">Click any insight to view details</div>
      </div>
    </div>
  );
}
