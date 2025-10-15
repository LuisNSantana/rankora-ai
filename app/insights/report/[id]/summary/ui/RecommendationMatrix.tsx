import React from "react";
import { BusinessInsight } from "@/lib/insights-schema";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Zap, TrendingUp, Clock } from "lucide-react";

interface RecommendationMatrixProps {
  insight: BusinessInsight;
}

export default function RecommendationMatrix({ insight }: RecommendationMatrixProps) {
  if (!insight.recommendations || insight.recommendations.length === 0) return null;

  // Map impact and effort to numeric scale
  const toScore = (level?: string): number => {
    if (!level) return 2;
    const l = level.toLowerCase();
    if (l === "low") return 1;
    if (l === "medium") return 2;
    if (l === "high" || l === "very_high") return 3;
    if (l === "critical") return 4;
    return 2;
  };

  // Categorize recommendations into quadrants
  const categorized = insight.recommendations.map((r, idx) => {
    const impact = toScore(r.estimated_impact);
    const effort = toScore(r.estimated_effort);
    let quadrant: "quick-wins" | "strategic-bets" | "fill-ins" | "avoid" = "fill-ins";
    if (impact >= 3 && effort <= 2) quadrant = "quick-wins";
    else if (impact >= 3 && effort >= 3) quadrant = "strategic-bets";
    else if (impact <= 2 && effort <= 2) quadrant = "fill-ins";
    else if (impact <= 2 && effort >= 3) quadrant = "avoid";
    return { ...r, quadrant, idx, impact, effort };
  });

  const quadrants = {
    "quick-wins": { 
      label: "Quick Wins", 
      desc: "Alto impacto, bajo esfuerzo",
      icon: Zap,
      color: "from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40",
      borderColor: "border-green-300 dark:border-green-700",
      badgeColor: "bg-green-600 text-white"
    },
    "strategic-bets": { 
      label: "Apuestas Estratégicas", 
      desc: "Alto impacto, alto esfuerzo",
      icon: TrendingUp,
      color: "from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/40",
      borderColor: "border-blue-300 dark:border-blue-700",
      badgeColor: "bg-blue-600 text-white"
    },
    "fill-ins": { 
      label: "Mejoras Incrementales", 
      desc: "Bajo impacto, bajo esfuerzo",
      icon: Clock,
      color: "from-amber-100 to-yellow-100 dark:from-amber-900/40 dark:to-yellow-900/40",
      borderColor: "border-amber-300 dark:border-amber-700",
      badgeColor: "bg-amber-600 text-white"
    },
    "avoid": { 
      label: "Evitar/Reevaluar", 
      desc: "Bajo impacto, alto esfuerzo",
      icon: Target,
      color: "from-red-100 to-rose-100 dark:from-red-900/40 dark:to-rose-900/40",
      borderColor: "border-red-300 dark:border-red-700",
      badgeColor: "bg-red-600 text-white"
    },
  };

  return (
    <Card className="border bg-gradient-to-br from-card to-card/95">
      <CardHeader className="pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50">
            <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <CardTitle className="text-2xl">Matriz de Priorización</CardTitle>
            <CardDescription className="text-base">
              Impacto vs Esfuerzo – Estrategia de ejecución recomendada
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(["quick-wins", "strategic-bets", "fill-ins", "avoid"] as const).map(qKey => {
            const items = categorized.filter(r => r.quadrant === qKey);
            if (items.length === 0) return null;
            const q = quadrants[qKey];
            const Icon = q.icon;
            return (
              <div 
                key={qKey}
                className={`p-5 rounded-xl border bg-gradient-to-br ${q.color} ${q.borderColor} hover:shadow-lg transition-all duration-300`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-full bg-white/80 dark:bg-black/20">
                    <Icon className="h-5 w-5 text-inherit" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{q.label}</h3>
                    <p className="text-xs text-muted-foreground">{q.desc}</p>
                  </div>
                  <Badge className={`${q.badgeColor} border-0 text-xs`}>{items.length}</Badge>
                </div>
                <div className="space-y-3">
                  {items.map(rec => (
                    <div 
                      key={rec.idx}
                      className="p-3 rounded-lg bg-white/60 dark:bg-black/20 border border-border/40"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-sm line-clamp-2 break-words">{rec.title}</h4>
                        {rec.priority && (
                          <Badge variant="outline" className="text-[10px] capitalize shrink-0">
                            {rec.priority}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {rec.description?.split("\n\nCómo ejecutar:")[0]}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground/80">
                        {rec.timeline && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {rec.timeline}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" /> Impacto: {rec.estimated_impact || "medium"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
