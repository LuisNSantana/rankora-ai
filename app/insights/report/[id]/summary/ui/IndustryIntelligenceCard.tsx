import React from "react";
import { BusinessInsight } from "@/lib/insights-schema";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Target, AlertCircle, ArrowRight, Building2, Award } from "lucide-react";

interface IndustryIntelligenceCardProps {
  insight: BusinessInsight;
}

export default function IndustryIntelligenceCard({ insight }: IndustryIntelligenceCardProps) {
  const industryData = insight.meta?.industry;
  const benchmarks = insight.meta?.benchmarks || [];
  const trends = insight.meta?.industry_trends || [];

  if (!industryData) return null;

  const performanceColors: Record<string, { bg: string; text: string; border: string }> = {
    excellent: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300", border: "border-green-300 dark:border-green-700" },
    "above-average": { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", border: "border-blue-300 dark:border-blue-700" },
    average: { bg: "bg-gray-100 dark:bg-gray-900/30", text: "text-gray-700 dark:text-gray-300", border: "border-gray-300 dark:border-gray-700" },
    "below-average": { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-300", border: "border-orange-300 dark:border-orange-700" },
    "needs-improvement": { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300", border: "border-red-300 dark:border-red-700" },
  };

  const trendIcons: Record<string, React.ReactNode> = {
    rising: <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />,
    declining: <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />,
    stable: <Minus className="h-4 w-4 text-gray-600 dark:text-gray-400" />,
    volatile: <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />,
  };

  const impactColors: Record<string, string> = {
    critical: "bg-red-600 text-white",
    high: "bg-orange-600 text-white",
    medium: "bg-blue-600 text-white",
    low: "bg-gray-600 text-white",
  };

  return (
    <div className="space-y-6">
      {/* Industry Header */}
      <Card className="border bg-gradient-to-br from-card to-card/95">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50">
              <Building2 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">Inteligencia de Industria</CardTitle>
              <CardDescription className="text-base flex items-center gap-2 mt-1">
                <Badge variant="outline" className="border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                  {industryData.sector}
                </Badge>
                <span className="text-xs text-muted-foreground">Benchmarks y tendencias del sector</span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Benchmarks Section */}
      {benchmarks.length > 0 && (
        <Card className="border bg-gradient-to-br from-card to-card/95">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <Award className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <CardTitle className="text-xl">Benchmarks vs Industria</CardTitle>
            </div>
            <CardDescription>
              Comparativa de tus métricas contra estándares del sector {industryData.sector}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {benchmarks.slice(0, 8).map((benchmark: any, idx: number) => {
                const colors = performanceColors[benchmark.performance] || performanceColors.average;
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border ${colors.border} ${colors.bg} hover:shadow-md transition-all duration-200`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm mb-1">{benchmark.metric}</h4>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="font-mono">
                            <span className="text-muted-foreground">Tu valor:</span>{" "}
                            <span className="font-bold">{benchmark.user_value}</span>
                          </span>
                          <span className="text-muted-foreground">vs</span>
                          <span className="font-mono">
                            <span className="text-muted-foreground">Industria:</span>{" "}
                            <span className="font-semibold">{benchmark.industry_avg}</span>
                          </span>
                        </div>
                      </div>
                      <Badge className={`${colors.bg} ${colors.text} border-0 capitalize shrink-0`}>
                        {benchmark.performance.replace("-", " ")}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {benchmark.gap_analysis}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Industry Trends */}
      {trends.length > 0 && (
        <Card className="border bg-gradient-to-br from-card to-card/95">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <CardTitle className="text-xl">Tendencias del Sector</CardTitle>
            </div>
            <CardDescription>
              Movimientos clave en {industryData.sector} y acciones recomendadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {trends.slice(0, 5).map((trend: any, idx: number) => (
                <div
                  key={idx}
                  className="p-5 rounded-xl border border-border/50 bg-gradient-to-br from-muted/30 to-muted/10 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      {trendIcons[trend.direction]}
                      <h4 className="font-bold text-base">{trend.name}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${impactColors[trend.impact]} border-0 text-xs`}>
                        {trend.impact}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        {trend.horizon.replace("-", " ")}
                      </Badge>
                    </div>
                  </div>
                  {trend.actions && trend.actions.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Acciones recomendadas:
                      </p>
                      <ul className="space-y-2">
                        {trend.actions.slice(0, 3).map((action: string, actionIdx: number) => (
                          <li key={actionIdx} className="flex items-start gap-2 text-sm">
                            <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <span className="flex-1">{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
