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
    const cleanNum = parseFloat(str.replace(/[^0-9.-]/g, ""));
    if (!isNaN(cleanNum)) {
      return `${cleanNum.toFixed(cleanNum % 1 === 0 ? 0 : 1)}%`;
    }
    return str.replace(/\s+/g, "").replace(/,(\d{1,2})$/, ".$1");
  }
  
  // Extract number and check for currency
  const num = Number(str.replace(/[^0-9.-]/g, ""));
  const hasCurrency = /[$€£¥]|USD|EUR|GBP|MXN|COP|ARS|CLP/.test(str + (unit || ""));
  const currencySymbol = unit && ["$", "€", "USD", "EUR"].includes(unit) ? unit : 
                         str.match(/[$€£¥]/)?.[0] || "";
  
  if (!Number.isNaN(num) && Number.isFinite(num)) {
    const absNum = Math.abs(num);
    
    // Format large numbers with K, M, B, T
    if (absNum >= 1_000_000_000_000) {
      const val = (num / 1_000_000_000_000).toFixed(2);
      return hasCurrency ? `${currencySymbol}${val}T` : `${val}T`;
    }
    if (absNum >= 1_000_000_000) {
      const val = (num / 1_000_000_000).toFixed(2);
      return hasCurrency ? `${currencySymbol}${val}B` : `${val}B`;
    }
    if (absNum >= 1_000_000) {
      const val = (num / 1_000_000).toFixed(2);
      return hasCurrency ? `${currencySymbol}${val}M` : `${val}M`;
    }
    if (absNum >= 1_000) {
      const val = (num / 1_000).toFixed(2);
      return hasCurrency ? `${currencySymbol}${val}K` : `${val}K`;
    }
    
    // Small numbers - format with minimal decimals
    try {
      if (hasCurrency && currencySymbol) {
        return `${currencySymbol}${num.toLocaleString('es-ES', { maximumFractionDigits: 2 })}`;
      }
      return num.toLocaleString('es-ES', { maximumFractionDigits: num % 1 === 0 ? 0 : 2 });
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
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
        {metrics.slice(0, 32).map((m, i) => {
          const trendInfo = m.trend ? trendMap[m.trend] : null;
          const valueDisplay = formatValue(m.value as any, m.unit);
          const showUnit = m.unit && !String(valueDisplay).includes("%") && !/[€$£¥]|USD|EUR|GBP/.test(String(valueDisplay));
          
          return (
            <Card
              key={i}
              className="relative overflow-hidden border-2 border-transparent bg-gradient-to-br from-white via-slate-50 to-blue-50 dark:from-slate-900 dark:via-slate-900/95 dark:to-blue-950/30 group hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-xl transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/40 rounded-full opacity-30 -translate-y-12 translate-x-12 group-hover:scale-150 transition-transform duration-500" />
              <CardContent className="relative p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2 min-w-0 flex-1">
                    <h3 className="font-medium text-xs text-muted-foreground/80 tracking-wider uppercase line-clamp-2 leading-tight">
                      {m.name}
                    </h3>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-br from-slate-900 to-blue-800 dark:from-slate-100 dark:to-blue-300 bg-clip-text text-transparent">
                        {valueDisplay}
                      </span>
                      {showUnit && (
                        <span className="text-xs font-semibold text-muted-foreground/70 uppercase">{m.unit}</span>
                      )}
                    </div>
                  </div>
                  {trendInfo && (
                    <Badge
                      variant="secondary"
                      className={`flex items-center gap-1 ${trendInfo.color} bg-white/80 dark:bg-slate-800/80 border-2 shadow-sm`}
                    >
                      {trendInfo.icon}
                    </Badge>
                  )}
                </div>
                {m.benchmark && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground/70">Benchmark:</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {formatValue(m.benchmark, m.unit)}
                    </span>
                  </div>
                )}
                {m.percentile && (
                  <div className="mt-1">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground/80 mb-1">
                      <span>Percentil {m.percentile}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-700"
                        style={{ width: `${m.percentile}%` }}
                      />
                    </div>
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
