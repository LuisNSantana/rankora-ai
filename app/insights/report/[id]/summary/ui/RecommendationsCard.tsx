import React from "react";
import { BusinessInsight } from "@/lib/insights-schema";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, CheckCircle, Target } from "lucide-react";

interface RecommendationsCardProps {
  insight: BusinessInsight;
}

export default function RecommendationsCard({ insight }: RecommendationsCardProps) {
  if (!insight.recommendations || insight.recommendations.length === 0) return null;

  const priorityMap: Record<string, any> = {
    high: {
      icon: AlertTriangle,
      bg: "from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30",
      border: "border-red-200 dark:border-red-800",
      badge: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
      iconColor: "text-red-600 dark:text-red-400",
    },
    medium: {
      icon: TrendingUp,
      bg: "from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30",
      border: "border-amber-200 dark:border-amber-800",
      badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
    low: {
      icon: CheckCircle,
      bg: "from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30",
      border: "border-blue-200 dark:border-blue-800",
      badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
  };

  return (
    <Card className="border bg-gradient-to-br from-card to-card/95">
      <CardHeader className="pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/50 dark:to-orange-900/50">
            <Target className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <CardTitle className="text-2xl">Recomendaciones accionables</CardTitle>
            <CardDescription className="text-base">Próximos pasos estratégicos y tácticos priorizados</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          {insight.recommendations.map((r, i) => {
            const conf = priorityMap[r.priority || 'medium'];
            const Icon = conf.icon;
            return (
              <div
                key={i}
                className={`p-6 rounded-xl border bg-gradient-to-br ${conf.bg} ${conf.border} hover:shadow-lg transition-all duration-300 group`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-full bg-white/80 dark:bg-black/20 ${conf.iconColor} flex-shrink-0`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2 gap-4">
                      <h4 className="font-bold text-lg leading-tight line-clamp-2 break-words">{r.title}</h4>
                      <Badge className={`${conf.badge} border-0 text-xs px-2.5 py-1 capitalize`}>Prioridad {r.priority || 'medium'}</Badge>
                    </div>
                    <p className="text-muted-foreground leading-relaxed mb-3 text-sm break-words whitespace-pre-line">
                      {r.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground/80">
                      <span className="inline-flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" /> Impacto potencial
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Target className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" /> Enfoque de ejecución
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
