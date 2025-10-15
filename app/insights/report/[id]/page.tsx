"use client";

import React, { useEffect, useState, use as usePromise } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Loader2, AlertCircle, CheckCircle, XCircle, BarChart3, Clock, HardDriveDownload, ListTree } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import retryInsight from "@/actions/retryInsight";
import { Id } from "@/convex/_generated/dataModel";
import { formatDateTime } from "@/lib/status-utils";
import { useRouter } from "next/navigation";

// Map similar to SEO but for insight reports
type InsightStatus = "pending" | "running" | "analyzing" | "completed" | "failed";

function spinnerColor(status: InsightStatus) {
  switch (status) {
    case "pending": return "text-yellow-500";
    case "running": return "text-blue-500";
    case "analyzing": return "text-purple-500";
    default: return "text-muted-foreground";
  }
}

function progress(status: InsightStatus) {
  switch (status) {
    case "pending": return 0;
    case "running": return 25;
    case "analyzing": return 75;
    case "completed": return 100;
    case "failed": return 100;
    default: return 0;
  }
}

export default function InsightStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const { user } = useUser();
  const router = useRouter();
  const report = useQuery(api.insightReports.getInsightById, { id: id as Id<"insightReports"> });
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (report && report.status === "completed") {
      // Redirect automatically to summary when ready
      router.replace(`/insights/report/${id}/summary`);
    }
  }, [report, id, router]);

  if (report === undefined) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-6 h-6 animate-spin mr-2" /> <span className="text-muted-foreground">Loading insight status...</span></div>;
  }
  if (report === null) {
    // In some flows, the client navigates before the job document is created. Keep waiting reactively.
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Inicializando el análisis…</span>
      </div>
    );
  }

  const pct = progress(report.status as InsightStatus);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Insight Generation</h1>
          <p className="text-muted-foreground text-sm">Tracking progress for your business insight request</p>
        </div>
        <div className="border rounded-xl bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 p-6 space-y-6 shadow-sm">
          <div className="flex flex-col items-center">
            {(report.status === "pending" || report.status === "running" || report.status === "analyzing") && (
              <Loader2 className={`w-6 h-6 animate-spin mb-3 ${spinnerColor(report.status as InsightStatus)}`} />
            )}
            <StatusBadge status={report.status} showIcon />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
              <span>Progress</span>
              <span>{report.status === "failed" ? "Error" : `${pct}%`}</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-2 transition-all duration-700 ease-out ${report.status === "failed" ? "bg-gradient-to-r from-red-500 to-red-600 w-full" : report.status === "completed" ? "bg-gradient-to-r from-emerald-500 to-green-500 w-full" : report.status === "analyzing" ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 w-3/4" : report.status === "running" ? "bg-gradient-to-r from-sky-500 to-blue-600 w-1/4" : "bg-gradient-to-r from-amber-400 to-yellow-500 w-0"}`}
                style={{ boxShadow: "0 0 12px rgba(99,102,241,0.35) inset" }}
              />
            </div>
          </div>

          <div className="text-sm space-y-3 pt-2 border-t">
            <div className="flex items-center gap-2"><FileIcon status={report.status as InsightStatus} /> <span className="font-medium">Original Prompt:</span> <span className="truncate" title={report.originalPrompt}>{report.originalPrompt}</span></div>
            <div className="flex items-center gap-2 text-muted-foreground"><Clock className="w-4 h-4" />Created: {formatDateTime(report.createdAt)}</div>
            {report.completedAt && <div className="flex items-center gap-2 text-muted-foreground"><CheckCircle className="w-4 h-4" />Completed: {formatDateTime(report.completedAt)}</div>}
            {report.error && <div className="p-3 text-xs rounded bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 flex gap-2"><XCircle className="w-4 h-4 mt-0.5" />{report.error}</div>}
          </div>

          {/* Execution timeline / logs */}
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
              <ListTree className="w-4 h-4" /> Flujo de ejecución
            </div>
            <ol className="relative pl-6 space-y-3 text-xs">
              {(report.logs || []).map((l: any, idx: number) => (
                <li key={idx} className="relative">
                  <span className={`absolute left-0 top-1.5 h-2 w-2 rounded-full ring-4 ring-offset-2 ring-transparent ${l.level === 'error' ? 'bg-red-500 ring-red-500/15' : l.level === 'warn' ? 'bg-yellow-500 ring-yellow-500/15' : 'bg-blue-500 ring-blue-500/15'}`} />
                  <div className="ml-2 p-3 rounded-lg border bg-card/60">
                    <div className="text-muted-foreground mb-1">{formatDateTime(l.t)}</div>
                    <div className="text-foreground">{l.msg}</div>
                  </div>
                </li>
              ))}
              {(!report.logs || report.logs.length === 0) && (
                <div className="text-muted-foreground">No hay eventos aún…</div>
              )}
            </ol>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            {report.status === "failed" && (
              <Button disabled={retrying} onClick={async () => {
                setRetrying(true); setError(null);
                try {
                  const res = await retryInsight(id);
                  if (!res.ok) setError(res.error || "Retry failed");
                } catch (e: any) { setError(e.message || String(e)); }
                finally { setRetrying(false); }
              }}>{retrying ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Retrying...</> : "Retry Analysis"}</Button>
            )}
            <Link href="/insights" className="inline-flex"><Button variant="outline">Back</Button></Link>
          </div>
          {error && <p className="text-xs text-red-600 text-center">{error}</p>}
        </div>
      </div>
    </div>
  );
}

function FileIcon({ status }: { status: InsightStatus }) {
  if (status === "failed") return <XCircle className="w-4 h-4 text-red-500" />;
  if (status === "completed") return <CheckCircle className="w-4 h-4 text-green-500" />;
  if (status === "analyzing") return <BarChart3 className="w-4 h-4 text-purple-500" />;
  if (status === "running") return <HardDriveDownload className="w-4 h-4 text-blue-500" />;
  return <Clock className="w-4 h-4 text-yellow-500" />;
}
