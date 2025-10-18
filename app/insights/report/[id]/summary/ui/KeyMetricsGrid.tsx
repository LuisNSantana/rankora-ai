"use client";

import React, { useState } from "react";
import { BusinessInsight } from "@/lib/insights-schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, BarChart3, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [showAllMetrics, setShowAllMetrics] = useState(false);
  
  if (!insight.metrics || insight.metrics.length === 0) return null;

  const filtered = insight.metrics.filter(m => !isGenericName(m.name));
  const metrics = filtered.length > 0 ? filtered : insight.metrics;
  
  // Separate top metrics from secondary ones
  const topMetrics = metrics.slice(0, 4);
  const secondaryMetrics = metrics.slice(4);
  const hasSecondaryMetrics = secondaryMetrics.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/40">
          <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Métricas clave</h2>
          <p className="text-sm text-muted-foreground">Indicadores de desempeño extraídos de las fuentes</p>
        </div>
      </div>

      {/* Top 4 Metrics - Large & Prominent */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
      >
        {topMetrics.map((m, i) => {
          const trendInfo = m.trend ? trendMap[m.trend] : null;
          const valueDisplay = formatValue(m.value as any, m.unit);
          const showUnit = m.unit && !String(valueDisplay).includes("%") && !/[€$£¥]|USD|EUR|GBP/.test(String(valueDisplay));
          
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <Card className="relative overflow-hidden border-2 border-transparent bg-gradient-to-br from-white via-slate-50 to-blue-50 dark:from-slate-900 dark:via-slate-900/95 dark:to-blue-950/30 group hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-2xl transition-all duration-300">
                {/* Decorative background blob */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200 to-cyan-200 dark:from-blue-800/50 dark:to-cyan-800/50 rounded-full opacity-20 -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500" />
                
                {/* Sparkle icon for top metrics */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Sparkles className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                </div>
                
                <CardContent className="relative p-6 flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-3 min-w-0 flex-1">
                      <h3 className="font-semibold text-sm text-muted-foreground/90 tracking-wide uppercase line-clamp-2 leading-tight">
                        {m.name}
                      </h3>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-br from-slate-900 via-blue-800 to-blue-900 dark:from-slate-100 dark:via-blue-300 dark:to-blue-200 bg-clip-text text-transparent">
                          {valueDisplay}
                        </span>
                        {showUnit && (
                          <span className="text-sm font-semibold text-muted-foreground/70 uppercase">{m.unit}</span>
                        )}
                      </div>
                    </div>
                    {trendInfo && (
                      <Badge
                        variant="secondary"
                        className={`flex items-center gap-1 ${trendInfo.color} bg-white/90 dark:bg-slate-800/90 border-2 shadow-md`}
                      >
                        {trendInfo.icon}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Benchmark */}
                  {m.benchmark && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground/70">Benchmark:</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {formatValue(m.benchmark, m.unit)}
                      </span>
                    </div>
                  )}
                  
                  {/* Percentile bar */}
                  {m.percentile && (
                    <div className="mt-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground/80 mb-2">
                        <span className="font-medium">Percentil {m.percentile}</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${m.percentile}%` }}
                          transition={{ duration: 1, delay: 0.3 + i * 0.1, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500 rounded-full"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Secondary Metrics - Collapsible Section */}
      {hasSecondaryMetrics && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-muted-foreground">
              Métricas adicionales ({secondaryMetrics.length})
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllMetrics(!showAllMetrics)}
              className="gap-2"
            >
              {showAllMetrics ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Ocultar
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Ver todas
                </>
              )}
            </Button>
          </div>

          <AnimatePresence>
            {showAllMetrics && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4"
              >
                {secondaryMetrics.map((m, i) => {
                  const trendInfo = m.trend ? trendMap[m.trend] : null;
                  const valueDisplay = formatValue(m.value as any, m.unit);
                  const showUnit = m.unit && !String(valueDisplay).includes("%") && !/[€$£¥]|USD|EUR|GBP/.test(String(valueDisplay));
                  
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2, delay: i * 0.05 }}
                    >
                      <Card className="relative overflow-hidden border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/95 group hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-lg transition-all duration-200">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-full opacity-20 -translate-y-10 translate-x-10 group-hover:scale-125 transition-transform duration-300" />
                        
                        <CardContent className="relative p-4 flex flex-col gap-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1.5 min-w-0 flex-1">
                              <h3 className="font-medium text-xs text-muted-foreground/80 tracking-wide uppercase line-clamp-2 leading-tight">
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
                                className={`flex items-center gap-1 ${trendInfo.color} bg-white/80 dark:bg-slate-800/80 border shadow-sm`}
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
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${m.percentile}%` }}
                                  transition={{ duration: 0.8, delay: 0.2 + i * 0.05, ease: "easeOut" }}
                                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                                />
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
