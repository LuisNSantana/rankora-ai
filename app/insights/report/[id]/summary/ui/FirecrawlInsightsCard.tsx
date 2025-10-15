"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Database, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target, 
  Globe,
  BarChart3,
  CheckCircle,
  ExternalLink
} from "lucide-react";
import type { BusinessInsight } from "@/lib/insights-schema";

interface FirecrawlInsightsCardProps {
  insight: BusinessInsight;
}

export default function FirecrawlInsightsCard({ insight }: FirecrawlInsightsCardProps) {
  // Check if insight has Firecrawl data in various places
  const hasFirecrawlData = insight.meta?.["premium:raw"] || 
                          insight.summary?.includes('FIRECRAWL') ||
                          insight.summary?.includes('91-98%') ||
                          insight.sources?.some(source => 
                            source.includes('firecrawl') || 
                            source.includes('structured') ||
                            source.includes('verified')
                          );

  if (!hasFirecrawlData) return null;

  // Extract Firecrawl-specific content from the summary
  const firecrawlSections = extractFirecrawlSections(insight);

  return (
    <Card className="border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-cyan-950/20 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
                <Database className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                🔍 Business Intelligence
              </CardTitle>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 border-emerald-400 dark:border-emerald-700 font-semibold">
              91-98% Accuracy
            </Badge>
            <Badge className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0 shadow-md">
              <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
              Verified Data
            </Badge>
          </div>
        </div>
        <CardDescription className="text-sm sm:text-base text-emerald-800 dark:text-emerald-200 font-medium mt-2">
          Datos estructurados verificados extraídos directamente de sitios web empresariales
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Competitive Intelligence Section */}
        {firecrawlSections.competitive && (
          <div className="space-y-3 group">
            <div className="flex items-center gap-2.5 px-1">
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40">
                <Target className="h-4 w-4 text-amber-700 dark:text-amber-400" />
              </div>
              <h4 className="font-bold text-base text-amber-900 dark:text-amber-100">
                Inteligencia Competitiva
              </h4>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border-2 border-amber-200 dark:border-amber-800 shadow-sm group-hover:shadow-md transition-shadow">
              <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ 
                __html: formatMarkdownToHTML(firecrawlSections.competitive) 
              }} />
            </div>
          </div>
        )}

        {/* Pricing Intelligence Section */}
        {firecrawlSections.pricing && (
          <div className="space-y-3 group">
            <div className="flex items-center gap-2.5 px-1">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/40">
                <DollarSign className="h-4 w-4 text-blue-700 dark:text-blue-400" />
              </div>
              <h4 className="font-bold text-base text-blue-900 dark:text-blue-100">
                Análisis de Precios Verificado
              </h4>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border-2 border-blue-200 dark:border-blue-800 shadow-sm group-hover:shadow-md transition-shadow">
              <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ 
                __html: formatMarkdownToHTML(firecrawlSections.pricing) 
              }} />
            </div>
          </div>
        )}

        {/* Market Opportunities Section */}
        {firecrawlSections.opportunities && (
          <div className="space-y-3 group">
            <div className="flex items-center gap-2.5 px-1">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40">
                <TrendingUp className="h-4 w-4 text-purple-700 dark:text-purple-400" />
              </div>
              <h4 className="font-bold text-base text-purple-900 dark:text-purple-100">
                Oportunidades de Mercado
              </h4>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border-2 border-purple-200 dark:border-purple-800 shadow-sm group-hover:shadow-md transition-shadow">
              <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ 
                __html: formatMarkdownToHTML(firecrawlSections.opportunities) 
              }} />
            </div>
          </div>
        )}

        {/* Customer Intelligence Section */}
        {firecrawlSections.customers && (
          <div className="space-y-3 group">
            <div className="flex items-center gap-2.5 px-1">
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40">
                <Users className="h-4 w-4 text-green-700 dark:text-green-400" />
              </div>
              <h4 className="font-bold text-base text-green-900 dark:text-green-100">
                Insights de Clientes
              </h4>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border-2 border-green-200 dark:border-green-800 shadow-sm group-hover:shadow-md transition-shadow">
              <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ 
                __html: formatMarkdownToHTML(firecrawlSections.customers) 
              }} />
            </div>
          </div>
        )}

        {/* Data Sources */}
        <div className="border-t-2 border-emerald-200 dark:border-emerald-800 pt-5">
          <h5 className="flex items-center gap-2 text-sm font-bold text-emerald-800 dark:text-emerald-200 mb-3">
            <Globe className="h-4 w-4" />
            Fuentes de Datos Verificadas
          </h5>
          <div className="flex flex-wrap gap-2">
            {insight.sources?.filter(source => 
              source.includes('http') || source.includes('firecrawl')
            ).slice(0, 5).map((source, idx) => (
              <Badge key={idx} variant="outline" className="text-xs bg-white dark:bg-slate-800 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors">
                <ExternalLink className="h-3 w-3 mr-1" />
                {formatSourceName(source)}
              </Badge>
            ))}
            {insight.sources?.length > 5 && (
              <Badge variant="outline" className="text-xs bg-emerald-100 dark:bg-emerald-900/40 border-emerald-400 dark:border-emerald-600 text-emerald-800 dark:text-emerald-200 font-semibold">
                +{insight.sources.length - 5} más
              </Badge>
            )}
          </div>
        </div>

        {/* Quality Indicators */}
        <div className="bg-gradient-to-r from-emerald-100 via-teal-100 to-cyan-100 dark:from-emerald-950/50 dark:via-teal-950/50 dark:to-cyan-950/50 p-6 rounded-2xl border-2 border-emerald-300 dark:border-emerald-700 shadow-inner">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div className="space-y-1">
              <div className="text-3xl font-bold bg-gradient-to-br from-emerald-700 to-teal-700 dark:from-emerald-300 dark:to-teal-300 bg-clip-text text-transparent">
                91-98%
              </div>
              <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                Precisión
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold bg-gradient-to-br from-blue-700 to-cyan-700 dark:from-blue-300 dark:to-cyan-300 bg-clip-text text-transparent">
                {insight.sources?.length || 0}
              </div>
              <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                Fuentes
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold bg-gradient-to-br from-purple-700 to-pink-700 dark:from-purple-300 dark:to-pink-300 bg-clip-text text-transparent">
                Real-time
              </div>
              <div className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                Datos
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to extract Firecrawl-specific sections from summary
function extractFirecrawlSections(insight: BusinessInsight) {
  const summary = insight.summary || "";
  const sections: Record<string, string> = {};

  // Look for competitive intelligence sections
  const competitiveMatch = summary.match(/(?:🏢|##.*Competitive|Competidores?)[\s\S]*?(?=(?:🔍|##|\n\n)|$)/i);
  if (competitiveMatch) {
    sections.competitive = competitiveMatch[0];
  }

  // Look for pricing sections
  const pricingMatch = summary.match(/(?:💰|##.*Pricing|Precios?)[\s\S]*?(?=(?:🔍|##|\n\n)|$)/i);
  if (pricingMatch) {
    sections.pricing = pricingMatch[0];
  }

  // Look for opportunities sections
  const opportunitiesMatch = summary.match(/(?:🚀|##.*Oportunidad|Opportunities)[\s\S]*?(?=(?:🔍|##|\n\n)|$)/i);
  if (opportunitiesMatch) {
    sections.opportunities = opportunitiesMatch[0];
  }

  // Look for customer sections
  const customersMatch = summary.match(/(?:👥|##.*Customer|Clientes?)[\s\S]*?(?=(?:🔍|##|\n\n)|$)/i);
  if (customersMatch) {
    sections.customers = customersMatch[0];
  }

  return sections;
}

// Helper function to format markdown to HTML
function formatMarkdownToHTML(text: string): string {
  return text
    // Headers
    .replace(/### (.*$)/gm, '<h3 class="font-bold text-base text-gray-900 dark:text-gray-100 mb-2 mt-3">$1</h3>')
    .replace(/## (.*$)/gm, '<h2 class="font-bold text-lg text-gray-900 dark:text-gray-50 mb-3 mt-4">$1</h2>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-gray-100">$1</strong>')
    // Lists
    .replace(/^\- (.*$)/gm, '<li class="text-gray-700 dark:text-gray-300 mb-1.5 leading-relaxed">• $1</li>')
    // Wrap lists
    .replace(/(<li class.*<\/li>\n?)+/g, '<ul class="space-y-1 my-3">$&</ul>')
    // Line breaks
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

// Helper function to format source names
function formatSourceName(source: string): string {
  if (source.includes('http')) {
    try {
      const url = new URL(source);
      return url.hostname.replace('www.', '');
    } catch {
      return source.substring(0, 30) + '...';
    }
  }
  return source.length > 30 ? source.substring(0, 30) + '...' : source;
}