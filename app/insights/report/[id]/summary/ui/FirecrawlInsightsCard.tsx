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
    <Card className="border-emerald-500/50 bg-emerald-500/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-lg">🔍 Business Intelligence Premium</CardTitle>
            </div>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">
              91-98% Accuracy
            </Badge>
          </div>
          <Badge className="bg-emerald-600 text-white">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified Data
          </Badge>
        </div>
        <CardDescription>
          Datos estructurados verificados extraídos directamente de sitios web empresariales
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Competitive Intelligence Section */}
        {firecrawlSections.competitive && (
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 font-semibold text-amber-800">
              <Target className="h-4 w-4" />
              Inteligencia Competitiva
            </h4>
            <div className="bg-white p-4 rounded-lg border border-emerald-200">
              <div dangerouslySetInnerHTML={{ 
                __html: formatMarkdownToHTML(firecrawlSections.competitive) 
              }} />
            </div>
          </div>
        )}

        {/* Pricing Intelligence Section */}
        {firecrawlSections.pricing && (
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 font-semibold text-blue-800">
              <DollarSign className="h-4 w-4" />
              Análisis de Precios Verificado
            </h4>
            <div className="bg-white p-4 rounded-lg border border-emerald-200">
              <div dangerouslySetInnerHTML={{ 
                __html: formatMarkdownToHTML(firecrawlSections.pricing) 
              }} />
            </div>
          </div>
        )}

        {/* Market Opportunities Section */}
        {firecrawlSections.opportunities && (
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 font-semibold text-purple-800">
              <TrendingUp className="h-4 w-4" />
              Oportunidades de Mercado
            </h4>
            <div className="bg-white p-4 rounded-lg border border-emerald-200">
              <div dangerouslySetInnerHTML={{ 
                __html: formatMarkdownToHTML(firecrawlSections.opportunities) 
              }} />
            </div>
          </div>
        )}

        {/* Customer Intelligence Section */}
        {firecrawlSections.customers && (
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 font-semibold text-green-800">
              <Users className="h-4 w-4" />
              Insights de Clientes
            </h4>
            <div className="bg-white p-4 rounded-lg border border-emerald-200">
              <div dangerouslySetInnerHTML={{ 
                __html: formatMarkdownToHTML(firecrawlSections.customers) 
              }} />
            </div>
          </div>
        )}

        {/* Data Sources */}
        <div className="border-t border-emerald-200 pt-4">
          <h5 className="flex items-center gap-2 text-sm font-medium text-emerald-700 mb-2">
            <Globe className="h-3 w-3" />
            Fuentes de Datos Verificadas
          </h5>
          <div className="flex flex-wrap gap-2">
            {insight.sources?.filter(source => 
              source.includes('http') || source.includes('firecrawl')
            ).slice(0, 3).map((source, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                <ExternalLink className="h-2 w-2 mr-1" />
                {formatSourceName(source)}
              </Badge>
            ))}
            {insight.sources?.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{insight.sources.length - 3} más
              </Badge>
            )}
          </div>
        </div>

        {/* Quality Indicators */}
        <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="font-semibold text-emerald-700">91-98%</div>
              <div className="text-xs text-emerald-600">Precisión</div>
            </div>
            <div>
              <div className="font-semibold text-emerald-700">
                {insight.sources?.length || 0}
              </div>
              <div className="text-xs text-emerald-600">Fuentes</div>
            </div>
            <div>
              <div className="font-semibold text-emerald-700">Real-time</div>
              <div className="text-xs text-emerald-600">Datos</div>
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
    .replace(/### (.*$)/gm, '<h3 class="font-semibold text-gray-800 mb-2">$1</h3>')
    .replace(/## (.*$)/gm, '<h2 class="font-bold text-gray-900 mb-3">$1</h2>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    // Lists
    .replace(/^\- (.*$)/gm, '<li class="text-gray-700 mb-1">• $1</li>')
    // Line breaks
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