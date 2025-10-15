import React from "react";
import { BusinessInsight } from "@/lib/insights-schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";

interface KeyMetricsGridProps {
  insight: BusinessInsight;
}

const trendMap: Record<string, { label: string; color: string; icon: React.ReactNode } > = {
  up: { label: "Sube", color: "text-green-600 dark:text-green-400", icon: <TrendingUp className="h-4 w-4" /> },
  down: { label: "Baja", color: "text-red-600 dark:text-red-400", icon: <TrendingDown className="h-4 w-4" /> },
  flat: { label: "Estable", color: "text-muted-foreground", icon: <Minus className="h-4 w-4" /> },
};

function isGenericName(name?: string): boolean {
  if (!name) return true;
  const n = name.trim();
  if (n.length < 3) return true;
  if (/^dato\b/i.test(n)) return true;
  if (/^\d+[.,\d]*$/.test(n)) return true;
  return false;
}

function formatValue(value: unknown, unit?: string): string {
  const str = String(value);
  // Percent cases
  if (str.includes("%") || unit === "%") {
    // keep as-is, normalize comma
    return str.replace(/\s+/g, "").replace(/,(\d{1,2})$/, ".$1");
  }
  // Currency heuristic
  const currency = unit && ["$", "€", "USD", "EUR", "MXN", "COP", "ARS", "CLP"].includes(unit) ? unit : undefined;
  const num = Number(str.replace(/[^0-9.-]/g, ""));
  if (!Number.isNaN(num) && Number.isFinite(num)) {
    try {
      if (currency === "$" || currency === "USD") return new Intl.NumberFormat("es-ES", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(num);
      if (currency === "€" || currency === "EUR") return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(num);
      return new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 }).format(num);
    } catch {
      return str;
    }
  }
  return str;
}

export default function KeyMetricsGrid({ insight }: KeyMetricsGridProps) {
  if (!insight.metrics || insight.metrics.length === 0) return null;

  const filtered = insight.metrics.filter(m => !isGenericName(m.name));
  const metrics = filtered.length > 0 ? filtered : insight.metrics;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/40">
          <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Métricas clave</h2>
          <p className="text-sm text-muted-foreground">Indicadores de desempeño extraídos de las fuentes</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {metrics.slice(0, 32).map((m, i) => {
          const trendInfo = m.trend ? trendMap[m.trend] : null;
          const valueDisplay = formatValue(m.value as any, m.unit);
          return (
            <Card
              key={i}
              className="relative overflow-hidden border bg-gradient-to-br from-card to-card/95 group hover:shadow-md transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full -translate-y-6 translate-x-6 group-hover:scale-150 transition-transform duration-500" />
              <CardContent className="p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <h3 className="font-semibold text-sm text-muted-foreground tracking-wide uppercase line-clamp-2">
                      {m.name}
                    </h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold tracking-tight text-foreground">
                        {valueDisplay}
                      </span>
                      {m.unit && !String(valueDisplay).includes("%") && !/[€$]/.test(String(valueDisplay)) && (
                        <span className="text-xs font-medium text-muted-foreground">{m.unit}</span>
                      )}
                    </div>
                  </div>
                  {trendInfo && (
                    <Badge
                      variant="secondary"
                      className={`flex items-center gap-1 ${trendInfo.color} bg-transparent border border-border/40`}
                    >
                      {trendInfo.icon}
                      <span className="text-[10px] font-medium tracking-wide">{trendInfo.label}</span>
                    </Badge>
                  )}
                </div>
                {m.trend && (
                  <div className="text-[11px] text-muted-foreground/80 font-mono">
                    Tendencia: {trendInfo?.label || m.trend}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
