"use client";

import React from "react";
import { Sparkles, ArrowRight, TrendingUp, Target, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { BusinessInsight } from "@/lib/insights-schema";
import { motion } from "framer-motion";

interface InsightSpotlightProps {
  insight: BusinessInsight;
}

export default function InsightSpotlight({ insight }: InsightSpotlightProps) {
  // Get top recommendation by priority
  const topRecommendation = insight.recommendations?.find(
    (r) => r.priority === "critical" || r.priority === "high"
  ) || insight.recommendations?.[0];

  if (!topRecommendation) return null;

  // Get top metric for impact visualization
  const topMetric = insight.metrics?.[0];

  // Map impact levels to visual elements
  const impactConfig = {
    very_high: { color: "from-emerald-600 to-teal-600", icon: Zap, label: "Muy Alto" },
    high: { color: "from-blue-600 to-cyan-600", icon: TrendingUp, label: "Alto" },
    medium: { color: "from-amber-600 to-orange-600", icon: Target, label: "Medio" },
    low: { color: "from-slate-600 to-zinc-600", icon: Target, label: "Bajo" },
  };

  const impact = topRecommendation.estimated_impact || "medium";
  const config = impactConfig[impact] || impactConfig.medium;
  const ImpactIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-[2px] shadow-2xl"
    >
      {/* Animated gradient border effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 opacity-75 blur-xl animate-pulse" />
      
      <div className="relative bg-white dark:bg-slate-950 rounded-[22px] p-8 sm:p-12">
        {/* Top badge */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-3 mb-6"
        >
          <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 shadow-lg">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Insight Principal
            </span>
            <Badge 
              variant="outline" 
              className={`bg-gradient-to-r ${config.color} text-white border-0`}
            >
              <ImpactIcon className="h-3 w-3 mr-1" />
              Impacto {config.label}
            </Badge>
          </div>
        </motion.div>

        {/* Main content */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 bg-clip-text text-transparent leading-tight">
            {topRecommendation.title}
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-3xl leading-relaxed">
            {topRecommendation.description}
          </p>
        </motion.div>

        {/* Action bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-6"
        >
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Ver Detalles
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          {/* Stats */}
          <div className="flex items-center gap-6">
            {topMetric && (
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Métrica Clave
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    {topMetric.value}
                  </span>
                  {topMetric.unit && (
                    <span className="text-sm font-semibold text-muted-foreground">
                      {topMetric.unit}
                    </span>
                  )}
                </div>
              </div>
            )}

            {topRecommendation.timeline && (
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Timeline
                </span>
                <span className="text-lg font-semibold text-foreground">
                  {topRecommendation.timeline}
                </span>
              </div>
            )}

            {topRecommendation.estimated_effort && (
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Esfuerzo
                </span>
                <Badge variant="secondary" className="w-fit capitalize">
                  {topRecommendation.estimated_effort}
                </Badge>
              </div>
            )}
          </div>
        </motion.div>

        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-rose-500/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2" />
      </div>
    </motion.div>
  );
}
