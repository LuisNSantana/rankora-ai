"use client";

import React, { useEffect, useState, use as usePromise } from "react";
import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Loader2, AlertCircle, CheckCircle, XCircle, BarChart3, Clock, HardDriveDownload, ListTree, Search, Database, Sparkles, Target, Zap, FileSearch, Users, TrendingUp, Lightbulb } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import retryInsight from "@/actions/retryInsight";
import { Id } from "@/convex/_generated/dataModel";
import { formatDateTime } from "@/lib/status-utils";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// Map similar to SEO but for insight reports
type InsightStatus = "pending" | "running" | "analyzing" | "completed" | "failed";

type Step = {
  id: string;
  title: string;
  description: string;
  icon: any;
  status: "pending" | "running" | "completed" | "failed";
  duration?: number;
  timestamp?: string;
};

function parseStepsFromLogs(logs: any[], status: InsightStatus): Step[] {
  const steps: Step[] = [
    { id: "step1", title: "Research", description: "Perplexity deep research", icon: Search, status: "pending" },
    { id: "step2", title: "Intelligence", description: "Firecrawl data extraction", icon: Database, status: "pending" },
    { id: "step2.5", title: "Lead Gen", description: "Real web scraping", icon: Users, status: "pending" },
    { id: "step3", title: "Live Search", description: "Grok real-time data", icon: Zap, status: "pending" },
    { id: "step4", title: "Analysis", description: "AI insight generation", icon: Sparkles, status: "pending" },
  ];

  if (!logs || logs.length === 0) return steps;

  logs.forEach((log) => {
    const msg = log.msg || "";
    
    // STEP 1: Research
    if (msg.includes("STEP 1")) {
      const step = steps.find(s => s.id === "step1");
      if (step) {
        if (msg.includes("✓") || msg.includes("Complete")) {
          step.status = "completed";
          step.timestamp = log.t;
        } else {
          step.status = "running";
        }
      }
    }
    
    // STEP 2: Business Intelligence
    if (msg.includes("STEP 2") && !msg.includes("2.5")) {
      const step = steps.find(s => s.id === "step2");
      if (step) {
        if (msg.includes("✓") || msg.includes("Complete")) {
          step.status = "completed";
          step.timestamp = log.t;
        } else {
          step.status = "running";
        }
      }
    }
    
    // STEP 2.5: Lead Intelligence
    if (msg.includes("2.5") || msg.includes("Lead Intelligence")) {
      const step = steps.find(s => s.id === "step2.5");
      if (step) {
        if (msg.includes("✓") || msg.includes("complete") || msg.includes("leads")) {
          step.status = "completed";
          step.timestamp = log.t;
          // Extract lead count if available
          const match = msg.match(/(\d+)\s+(real\s+)?leads/i);
          if (match) {
            step.description = `${match[1]} leads extracted`;
          }
        } else if (msg.includes("Starting") || msg.includes("🎯")) {
          step.status = "running";
        }
      }
    }
    
    // STEP 3: Live Search
    if (msg.includes("STEP 3")) {
      const step = steps.find(s => s.id === "step3");
      if (step) {
        if (msg.includes("✓") || msg.includes("Complete")) {
          step.status = "completed";
          step.timestamp = log.t;
        } else {
          step.status = "running";
        }
      }
    }
    
    // STEP 4: Generation
    if (msg.includes("STEP 4") || msg.includes("Generating")) {
      const step = steps.find(s => s.id === "step4");
      if (step) {
        if (msg.includes("SUCCESS") || msg.includes("✅")) {
          step.status = "completed";
          step.timestamp = log.t;
          // Extract model name if available
          const modelMatch = msg.match(/(grok|gpt-4o|claude)[\w-]*/i);
          if (modelMatch) {
            step.description = `Generated with ${modelMatch[0]}`;
          }
        } else {
          step.status = "running";
        }
      }
    }
  });

  // Mark all as completed if status is completed
  if (status === "completed") {
    steps.forEach(s => {
      if (s.status === "pending" || s.status === "running") {
        s.status = "completed";
      }
    });
  }

  // Mark all as failed if status is failed
  if (status === "failed") {
    const lastRunning = steps.findIndex(s => s.status === "running");
    if (lastRunning >= 0) {
      steps[lastRunning].status = "failed";
    }
  }

  return steps;
}

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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="relative w-16 h-16">
            <Image src="/crispbacon1.png" alt="CrispBacon" fill className="object-contain animate-pulse" priority />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading insight status…</span>
          </div>
        </div>
      </div>
    );
  }
  if (report === null) {
    // In some flows, the client navigates before the job document is created. Keep waiting reactively.
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="relative w-16 h-16">
            <Image src="/crispbacon1.png" alt="CrispBacon" fill className="object-contain animate-pulse" priority />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Inicializando el análisis…</span>
          </div>
        </div>
      </div>
    );
  }

  const pct = progress(report.status as InsightStatus);
  const steps = parseStepsFromLogs(report.logs || [], report.status as InsightStatus);
  const currentStepIndex = steps.findIndex(s => s.status === "running");
  const completedSteps = steps.filter(s => s.status === "completed").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 px-4 py-10">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="relative w-12 h-12">
              <Image src="/crispbacon1.png" alt="CrispBacon" fill className="object-contain" priority />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
              Insight Generation
            </h1>
          </div>
          <p className="text-muted-foreground">
            {report.status === "completed" ? "✨ Your insight is ready!" : "Creating your business insight with AI-powered analysis"}
          </p>
          <StatusBadge status={report.status} showIcon />
        </motion.div>

        {/* Progress Overview Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 bg-gradient-to-br from-card via-card to-card/80 border-2">
            <div className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span className="text-muted-foreground">Overall Progress</span>
                  <span className="text-foreground">{completedSteps}/{steps.length} Steps Complete</span>
                </div>
                <div className="relative w-full h-3 bg-muted/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(completedSteps / steps.length) * 100}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className={`h-full rounded-full ${
                      report.status === "failed" 
                        ? "bg-gradient-to-r from-red-500 to-red-600" 
                        : report.status === "completed"
                        ? "bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500"
                        : "bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500"
                    }`}
                    style={{ boxShadow: "0 0 20px rgba(99,102,241,0.4)" }}
                  />
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <div className="text-2xl font-bold text-foreground">{completedSteps}</div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <div className="text-2xl font-bold text-foreground">
                    {currentStepIndex >= 0 ? 1 : 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Running</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <div className="text-2xl font-bold text-foreground">
                    {steps.length - completedSteps - (currentStepIndex >= 0 ? 1 : 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Pending</div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Steps Timeline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <ListTree className="w-5 h-5" />
            Execution Steps
          </h2>
          <div className="space-y-3">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = step.status === "running";
              const isCompleted = step.status === "completed";
              const isFailed = step.status === "failed";
              
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Card className={`p-4 transition-all duration-300 ${
                    isActive 
                      ? "border-2 border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-lg" 
                      : isCompleted
                      ? "border-green-500/30 bg-green-50/30 dark:bg-green-950/10"
                      : isFailed
                      ? "border-red-500/50 bg-red-50/30 dark:bg-red-950/10"
                      : "border-muted bg-muted/20"
                  }`}>
                    <div className="flex items-center gap-4">
                      {/* Icon Circle */}
                      <div className={`relative flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                        isActive 
                          ? "bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg" 
                          : isCompleted
                          ? "bg-gradient-to-br from-green-500 to-emerald-600"
                          : isFailed
                          ? "bg-gradient-to-br from-red-500 to-red-600"
                          : "bg-muted"
                      }`}>
                        {isActive && (
                          <motion.div
                            className="absolute inset-0 rounded-full bg-blue-500"
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        )}
                        {isCompleted ? (
                          <CheckCircle className="w-6 h-6 text-white" />
                        ) : isFailed ? (
                          <XCircle className="w-6 h-6 text-white" />
                        ) : isActive ? (
                          <Loader2 className="w-6 h-6 text-white animate-spin" />
                        ) : (
                          <StepIcon className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-semibold ${
                            isActive ? "text-blue-700 dark:text-blue-300" : "text-foreground"
                          }`}>
                            Step {index + 1}: {step.title}
                          </h3>
                          {isActive && (
                            <Badge className="bg-blue-500 text-white">
                              In Progress
                            </Badge>
                          )}
                          {isCompleted && (
                            <Badge className="bg-green-500 text-white">
                              Completed
                            </Badge>
                          )}
                          {isFailed && (
                            <Badge className="bg-red-500 text-white">
                              Failed
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {step.description}
                        </p>
                        {step.timestamp && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDateTime(Number(step.timestamp) || Date.now())}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Detailed Logs (Collapsible) */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileSearch className="w-5 h-5" />
              Detailed Execution Log
            </h3>
            <Badge variant="outline">{(report.logs || []).length} events</Badge>
          </div>
          
          <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
            {(report.logs || []).map((l: any, idx: number) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`p-3 rounded-lg border text-sm ${
                  l.level === 'error' 
                    ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800' 
                    : l.level === 'warn'
                    ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800'
                    : 'bg-muted/30 border-muted'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                    l.level === 'error' ? 'bg-red-500' : l.level === 'warn' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground mb-1">
                      {formatDateTime(l.t)}
                    </div>
                    <div className="text-foreground break-words font-mono text-xs">
                      {l.msg}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            {(!report.logs || report.logs.length === 0) && (
              <div className="text-center text-muted-foreground py-8">
                No execution logs yet...
              </div>
            )}
          </div>
        </Card>

        {/* Metadata Card */}
        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">Request Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="text-muted-foreground">Original Prompt</div>
              <div className="font-medium p-3 bg-muted/30 rounded-lg break-words">
                {report.originalPrompt}
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Created: {formatDateTime(report.createdAt)}</span>
              </div>
              {report.completedAt && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span>Completed: {formatDateTime(report.completedAt)}</span>
                </div>
              )}
              {report.error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 flex gap-2">
                  <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="text-xs">{report.error}</span>
                </div>
              )}
            </div>
          </div>
        </Card>

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
  );
}

function FileIcon({ status }: { status: InsightStatus }) {
  if (status === "failed") return <XCircle className="w-4 h-4 text-red-500" />;
  if (status === "completed") return <CheckCircle className="w-4 h-4 text-green-500" />;
  if (status === "analyzing") return <BarChart3 className="w-4 h-4 text-purple-500" />;
  if (status === "running") return <HardDriveDownload className="w-4 h-4 text-blue-500" />;
  return <Clock className="w-4 h-4 text-yellow-500" />;
}
