"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BusinessInsight } from "@/lib/insights-schema";
import { FileText, TrendingUp, Target, Lightbulb } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ExecutiveSummaryCardProps {
  insight: BusinessInsight;
}

export default function ExecutiveSummaryCard({ insight }: ExecutiveSummaryCardProps) {
  const premium = insight.premium;
  const executive = premium?.executive_summary;
  const keyThemes = premium?.meta?.key_themes ?? [];
  const findings = executive?.key_findings ?? [];
  const implications = executive?.strategic_implications ?? [];

  // Si no hay contenido premium, mostrar resumen básico
  if (!premium && !insight.summary) return null;

  return (
    <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-purple-950/20 shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            📋 Resumen Ejecutivo
          </CardTitle>
        </div>
        
        {keyThemes.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {keyThemes.map((theme, idx) => (
              <Badge 
                key={idx} 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 shadow-sm px-3 py-1"
              >
                {theme}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Contexto General */}
        {(executive?.overview || insight.summary) && (
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border-l-4 border-blue-500 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">Contexto</h3>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{executive?.overview || insight.summary}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Hallazgos Clave */}
        {findings.length > 0 && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20 rounded-xl p-5 border-2 border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">Hallazgos Clave</h3>
            </div>
            <ul className="space-y-2">
              {findings.map((finding, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{finding}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Implicaciones Estratégicas */}
        {implications.length > 0 && (
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/20 rounded-xl p-5 border-2 border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">Implicaciones Estratégicas</h3>
            </div>
            <ul className="space-y-2">
              {implications.map((implication, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="text-purple-600 dark:text-purple-400 text-lg flex-shrink-0">→</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{implication}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
