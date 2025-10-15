import React from "react";
import { BusinessInsight, type BusinessInsightVisualization } from "@/lib/insights-schema";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Layers } from "lucide-react";
import VisualizationRenderer from "./VisualizationRenderer";

interface VisualizationsGridProps {
  insight: BusinessInsight;
}

export default function VisualizationsGrid({ insight }: VisualizationsGridProps) {
  const rawVisualizations = Array.isArray(insight.visualizations) ? insight.visualizations : [];

  // Filtrar visualizaciones sin datos
  const validVisualizations: BusinessInsightVisualization[] = rawVisualizations.filter((viz: any) =>
    viz && Array.isArray(viz.data) && viz.data.length > 0
  ) as BusinessInsightVisualization[];

  // Fallback 1: Gráfico desde métricas
  const metricsFallback: BusinessInsightVisualization[] = Array.isArray(insight.metrics) && insight.metrics.length > 0
    ? [{
        title: "Resumen de Métricas Clave",
        type: "bar",
        data: insight.metrics
          .map((m) => ({
            name: m.name,
            value: Number(String(m.value).replace(/[^0-9.-]/g, "")) || 0
          }))
          .filter((d) => !isNaN(d.value))
          .slice(0, 8),
        insights: ["Visualización generada automáticamente a partir de las métricas principales"],
      } as BusinessInsightVisualization]
    : [];

  // Fallback 2: Tabla desde recomendaciones
  const recommendationsFallback: BusinessInsightVisualization[] = Array.isArray(insight.recommendations) && insight.recommendations.length > 0
    ? [{
        title: "Implementación Prioritaria",
        type: "table",
        data: insight.recommendations.slice(0, 10).map((r) => ({
          Recommendation: r.title,
          Priority: r.priority || "—",
          Timeline: r.timeline || "—",
        })),
        insights: ["Tabla generada a partir de las recomendaciones para facilitar la ejecución"],
      } as BusinessInsightVisualization]
    : [];

  // Si no hay visualizaciones válidas, usar fallbacks; si hay pocas, complementar
  let allVisualizations: BusinessInsightVisualization[] = validVisualizations;
  if (allVisualizations.length === 0) {
    allVisualizations = [...metricsFallback, ...recommendationsFallback];
  } else if (allVisualizations.length < 3) {
    allVisualizations = [...allVisualizations, ...metricsFallback, ...recommendationsFallback];
  }

  if (allVisualizations.length === 0) {
    return (
      <Card className="border bg-gradient-to-br from-card to-card/95">
        <CardHeader className="pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50">
              <Layers className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-2xl">Visualizaciones</CardTitle>
              <CardDescription className="text-base">Representaciones de datos derivadas de las fuentes</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">No hay visualizaciones disponibles para este insight.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border bg-gradient-to-br from-card to-card/95 shadow-lg">
      <CardHeader className="pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50 shadow-inner">
            <Layers className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Visualizaciones</CardTitle>
            <CardDescription className="text-base">
              {allVisualizations.length} gráfico{allVisualizations.length !== 1 ? 's' : ''} interactivo{allVisualizations.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {allVisualizations.map((viz, idx) => (
            <VisualizationRenderer key={idx} visualization={viz} index={idx} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
