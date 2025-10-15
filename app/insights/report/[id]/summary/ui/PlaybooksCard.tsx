"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BusinessInsight } from "@/lib/insights-schema";
import { NotebookPen, Timer, User, Gauge, Wrench } from "lucide-react";

interface PlaybooksCardProps {
  insight: BusinessInsight;
}

export default function PlaybooksCard({ insight }: PlaybooksCardProps) {
  const playbooks = (insight as any)?.meta?.playbooks as Array<{
    title: string;
    steps: string[];
    tools: string[];
    kpis: string[];
    owner: string;
    timeline?: string;
  }> | undefined;

  if (!Array.isArray(playbooks) || playbooks.length === 0) return null;

  const shown = playbooks.slice(0, 6);

  return (
    <Card className="border bg-gradient-to-br from-card to-card/95">
      <CardHeader className="pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40">
            <NotebookPen className="h-6 w-6 text-emerald-700 dark:text-emerald-300" />
          </div>
          <div>
            <CardTitle className="text-2xl">Playbooks de ejecución</CardTitle>
            <CardDescription className="text-base">Cómo implementar las recomendaciones paso a paso</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
          {shown.map((p, i) => (
            <div key={i} className="p-5 rounded-xl border bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/30 dark:to-slate-900/10 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h4 className="font-semibold leading-tight text-lg line-clamp-2 break-words">{p.title}</h4>
                <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><User className="h-3.5 w-3.5" /> {p.owner}</span>
                  {p.timeline && <span className="inline-flex items-center gap-1"><Timer className="h-3.5 w-3.5" /> {p.timeline}</span>}
                </div>
              </div>
              {Array.isArray(p.steps) && p.steps.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-medium uppercase text-muted-foreground/80 mb-1">Pasos clave</div>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-foreground/90">
                    {p.steps.slice(0, 6).map((s, idx) => (
                      <li key={idx} className="break-words">{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                {Array.isArray(p.tools) && p.tools.slice(0, 5).map((t, idx) => (
                  <Badge key={idx} variant="secondary" className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-0 inline-flex items-center gap-1">
                    <Wrench className="h-3.5 w-3.5" /> {t}
                  </Badge>
                ))}
                {Array.isArray(p.kpis) && p.kpis.slice(0, 4).map((k, idx) => (
                  <Badge key={idx} variant="secondary" className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-0 inline-flex items-center gap-1">
                    <Gauge className="h-3.5 w-3.5" /> {k}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
        {playbooks.length > shown.length && (
          <p className="mt-3 text-xs text-muted-foreground">Ver el resto de playbooks en PDF o exportar desde el dashboard.</p>
        )}
      </CardContent>
    </Card>
  );
}
