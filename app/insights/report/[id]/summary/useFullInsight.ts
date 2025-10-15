"use client";

import { useEffect, useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { BusinessInsight } from "@/lib/insights-schema";
import type { Id } from "@/convex/_generated/dataModel";

interface UseFullInsightResult {
  insight: (BusinessInsight & { status?: string; createdAt?: number }) | null;
  isLoading: boolean;
  isLargeReport: boolean;
  error: string | null;
}

/**
 * Custom hook to load full insight report
 * Handles both small reports (stored in DB) and large reports (File Storage)
 */
export function useFullInsight(reportId: Id<"insightReports">): UseFullInsightResult {
  const [fullInsight, setFullInsight] = useState<BusinessInsight | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  // Get report metadata (always includes summary for large reports)
  const report = useQuery(api.insightReports.getFullInsightReport, { id: reportId });
  const getFileContent = useAction(api.insightReports.getInsightFileContent);

  useEffect(() => {
    const loadFullReport = async () => {
      if (!report) return;

      try {
        // If it's a large report stored in file storage
        if (report.isLargeReport && report.storageId) {
          setIsLoadingFile(true);
          console.log(`[useFullInsight] Loading large report from storage: ${report.storageId}`);
          
          const fileContent = await getFileContent({ storageId: report.storageId });
          setFullInsight(fileContent);
          setIsLoadingFile(false);
        } else {
          // Small report - already in DB
          setFullInsight(report.insightReport);
        }
      } catch (err: any) {
        console.error("[useFullInsight] Error loading file content:", err);
        setError(err.message || "Failed to load full insight");
        setIsLoadingFile(false);
        
        // Fallback to summary if available
        if (report.insightReport) {
          console.warn("[useFullInsight] Using summary fallback");
          setFullInsight(report.insightReport);
        }
      }
    };

    loadFullReport();
  }, [report, getFileContent]);

  if (report === undefined || isLoadingFile) {
    return {
      insight: null,
      isLoading: true,
      isLargeReport: false,
      error: null,
    };
  }

  if (report === null) {
    return {
      insight: null,
      isLoading: false,
      isLargeReport: false,
      error: "Report not found",
    };
  }

  if (error) {
    return {
      insight: fullInsight ? {
        ...fullInsight,
        status: report.status,
        createdAt: report.createdAt,
      } : null,
      isLoading: false,
      isLargeReport: report.isLargeReport || false,
      error,
    };
  }

  if (!fullInsight) {
    return {
      insight: null,
      isLoading: true,
      isLargeReport: report.isLargeReport || false,
      error: null,
    };
  }

  // Derive display title
  const displayTitle = fullInsight.title || 
                       fullInsight.meta?.title || 
                       report.originalPrompt || 
                       "Business Insight";

  const enrichedInsight = {
    ...fullInsight,
    meta: { ...(fullInsight.meta || {}), title: displayTitle },
    status: report.status,
    createdAt: report.createdAt,
  };

  return {
    insight: enrichedInsight,
    isLoading: false,
    isLargeReport: report.isLargeReport || false,
    error: null,
  };
}
