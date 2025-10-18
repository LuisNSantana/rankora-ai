"use client";

import React from "react";
import { CheckCircle2, Circle, Clock, ChevronRight, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import type { BusinessInsightV2 } from "@/lib/insights-schema-v2";

interface RoadmapTimelineProps {
  insight: any; // Will accept BusinessInsight with premium field
}

interface TimelinePhase {
  label: string;
  timeframe: string;
  items: any[];
  color: string;
}

export default function RoadmapTimeline({ insight }: RoadmapTimelineProps) {
  const roadmap = insight?.premium?.roadmap;
  
  if (!roadmap) return null;

  const phases: TimelinePhase[] = [
    {
      label: "Quick Wins",
      timeframe: "30 días",
      items: roadmap.filter((item: any) => item.timeframe?.includes("30") || item.priority === "quick-win"),
      color: "from-emerald-500 to-teal-500",
    },
    {
      label: "Consolidación",
      timeframe: "60 días",
      items: roadmap.filter((item: any) => item.timeframe?.includes("60") || item.priority === "medium-term"),
      color: "from-blue-500 to-indigo-500",
    },
    {
      label: "Transformación",
      timeframe: "90 días",
      items: roadmap.filter((item: any) => item.timeframe?.includes("90") || item.priority === "long-term"),
      color: "from-purple-500 to-pink-500",
    },
  ].filter(phase => phase.items.length > 0);

  if (phases.length === 0) return null;

  return (
    <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/20 dark:from-blue-950/20 dark:via-indigo-950/10 dark:to-purple-950/10">
      <CardContent className="p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg">
            <Clock className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Roadmap 30/60/90 Días
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Plan de acción progresivo para maximizar el impacto
            </p>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical progress line */}
          <div className="absolute left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 via-blue-500 to-purple-500 rounded-full" />

          {/* Phases */}
          <div className="space-y-8">
            {phases.map((phase, phaseIdx) => (
              <motion.div
                key={phaseIdx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: phaseIdx * 0.2 }}
                className="relative pl-16"
              >
                {/* Phase marker */}
                <div className="absolute left-3 top-2 w-7 h-7 rounded-full bg-white dark:bg-slate-950 border-4 border-current flex items-center justify-center shadow-lg z-10"
                  style={{ 
                    borderColor: phaseIdx === 0 ? '#10b981' : phaseIdx === 1 ? '#3b82f6' : '#a855f7' 
                  }}
                >
                  <span className="text-xs font-bold" style={{ 
                    color: phaseIdx === 0 ? '#10b981' : phaseIdx === 1 ? '#3b82f6' : '#a855f7' 
                  }}>
                    {phaseIdx + 1}
                  </span>
                </div>

                {/* Phase header */}
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                      {phase.label}
                    </h3>
                    <Badge 
                      className={`bg-gradient-to-r ${phase.color} text-white border-0 shadow-sm`}
                    >
                      {phase.timeframe}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {phase.items.length} acción{phase.items.length !== 1 ? 'es' : ''} planificada{phase.items.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Action items */}
                <div className="space-y-3">
                  {phase.items.map((item: any, itemIdx: number) => (
                    <motion.div
                      key={itemIdx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (phaseIdx * 0.2) + (itemIdx * 0.1) }}
                      whileHover={{ scale: 1.02, x: 4 }}
                      className="group"
                    >
                      <Card className="border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300 cursor-pointer bg-white dark:bg-slate-900/50 shadow-sm hover:shadow-lg">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            {/* Status icon */}
                            <div className="mt-0.5">
                              <Circle className="h-5 w-5 text-muted-foreground group-hover:text-blue-500 transition-colors" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-base mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {item.action || item.title}
                              </h4>
                              
                              {item.description && (
                                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                  {item.description}
                                </p>
                              )}

                              {/* Metadata */}
                              <div className="flex flex-wrap items-center gap-2">
                                {item.owner && (
                                  <Badge variant="outline" className="text-xs">
                                    👤 {item.owner}
                                  </Badge>
                                )}
                                {item.kpi && (
                                  <Badge variant="secondary" className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                    📊 {item.kpi}
                                  </Badge>
                                )}
                                {item.tools && item.tools.length > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    🔧 {item.tools[0]}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Arrow indicator */}
                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-blue-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Completion badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: phases.length * 0.2 + 0.3 }}
            className="mt-8 flex justify-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-semibold">
                Plan completo: {roadmap.length} acciones estratégicas
              </span>
            </div>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
}
