import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Globe, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target, 
  Shield,
  Zap,
  BarChart3
} from 'lucide-react';

interface FirecrawlDataProps {
  data: any;
  type: 'competitor' | 'market' | 'website' | 'pricing' | 'industry';
}

export function FirecrawlDataCard({ data, type }: FirecrawlDataProps) {
  if (!data) return null;

  const renderCompetitorData = (competitorData: any) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Target className="h-5 w-5 text-blue-600" />
        <h4 className="font-semibold">{competitorData.company?.name}</h4>
        <Badge variant="outline">{competitorData.company?.industry}</Badge>
      </div>
      
      <p className="text-sm text-gray-600 mb-3">
        {competitorData.company?.description}
      </p>

      {competitorData.pricing && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <h5 className="font-medium flex items-center gap-1 mb-2">
              <DollarSign className="h-4 w-4" />
              Pricing Plans
            </h5>
            <div className="space-y-2">
              {competitorData.pricing.plans?.slice(0, 3).map((plan: any, idx: number) => (
                <div key={idx} className="bg-gray-50 p-2 rounded text-sm">
                  <div className="font-medium">{plan.name} - {plan.price}</div>
                  <div className="text-xs text-gray-500">
                    {plan.features?.slice(0, 2).join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h5 className="font-medium flex items-center gap-1 mb-2">
              <Zap className="h-4 w-4" />
              Key Features
            </h5>
            <div className="flex flex-wrap gap-1">
              {competitorData.features?.core?.slice(0, 6).map((feature: string, idx: number) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {competitorData.marketing?.socialProof && (
        <div>
          <h5 className="font-medium flex items-center gap-1 mb-2">
            <Users className="h-4 w-4" />
            Social Proof
          </h5>
          {competitorData.marketing.socialProof.customerCount && (
            <Badge className="mb-2">{competitorData.marketing.socialProof.customerCount} customers</Badge>
          )}
          {competitorData.marketing.socialProof.testimonials?.slice(0, 1).map((testimonial: any, idx: number) => (
            <blockquote key={idx} className="text-sm italic border-l-2 border-blue-200 pl-3">
              "{testimonial.text.substring(0, 150)}..."
              <footer className="text-xs text-gray-500 mt-1">
                — {testimonial.author}, {testimonial.company}
              </footer>
            </blockquote>
          ))}
        </div>
      )}
    </div>
  );

  const renderMarketData = (marketData: any) => (
    <div className="space-y-4">
      {marketData.marketOverview && (
        <div>
          <h4 className="font-semibold flex items-center gap-2 mb-3">
            <BarChart3 className="h-5 w-5 text-green-600" />
            Market Overview
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-green-50 p-3 rounded">
              <div className="text-sm text-green-700 font-medium">Market Size</div>
              <div className="text-lg font-bold text-green-800">
                {marketData.marketOverview.marketSize?.current}
              </div>
            </div>
            <div className="bg-blue-50 p-3 rounded">
              <div className="text-sm text-blue-700 font-medium">Growth Rate</div>
              <div className="text-lg font-bold text-blue-800">
                {marketData.marketOverview.marketSize?.growthRate}
              </div>
            </div>
            <div className="bg-purple-50 p-3 rounded">
              <div className="text-sm text-purple-700 font-medium">Projected</div>
              <div className="text-lg font-bold text-purple-800">
                {marketData.marketOverview.marketSize?.projected}
              </div>
            </div>
          </div>
        </div>
      )}

      {marketData.trends && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="font-medium flex items-center gap-1 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Emerging Trends
            </h5>
            <div className="space-y-1">
              {marketData.trends.emerging?.slice(0, 4).map((trend: string, idx: number) => (
                <div key={idx} className="text-sm bg-green-50 p-2 rounded">
                  {trend}
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h5 className="font-medium flex items-center gap-1 mb-2">
              <Shield className="h-4 w-4 text-blue-600" />
              Key Opportunities
            </h5>
            <div className="space-y-1">
              {marketData.opportunities?.marketGaps?.slice(0, 4).map((gap: string, idx: number) => (
                <div key={idx} className="text-sm bg-blue-50 p-2 rounded">
                  {gap}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {marketData.competitiveLandscape?.marketLeaders && (
        <div>
          <h5 className="font-medium mb-2">Market Leaders</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {marketData.competitiveLandscape.marketLeaders.slice(0, 4).map((leader: any, idx: number) => (
              <div key={idx} className="bg-gray-50 p-2 rounded text-sm">
                <div className="font-medium">{leader.company}</div>
                <div className="text-xs text-gray-600">
                  Market Share: {leader.marketShare}
                </div>
                <div className="text-xs text-blue-600">
                  {leader.keyStrengths?.slice(0, 2).join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderPricingData = (pricingData: any) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <DollarSign className="h-5 w-5 text-green-600" />
        <h4 className="font-semibold">{pricingData.company?.name}</h4>
        <Badge variant="outline">{pricingData.pricingStrategy?.model}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <h5 className="font-medium mb-2">Pricing Plans</h5>
          <div className="space-y-2">
            {pricingData.plans?.map((plan: any, idx: number) => (
              <div key={idx} className="border rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium">{plan.name}</div>
                  <Badge className="bg-green-100 text-green-800">{plan.price}</Badge>
                </div>
                <div className="text-xs text-gray-600 mb-2">
                  {plan.billingCycle} • {plan.targetSegment}
                </div>
                <div className="flex flex-wrap gap-1">
                  {plan.features?.slice(0, 4).map((feature: string, featureIdx: number) => (
                    <Badge key={featureIdx} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h5 className="font-medium mb-2">Strategy Insights</h5>
          <div className="space-y-3">
            <div className="bg-blue-50 p-3 rounded">
              <div className="text-sm font-medium text-blue-800">Pricing Approach</div>
              <div className="text-sm text-blue-700">{pricingData.pricingStrategy?.approach}</div>
            </div>
            
            <div className="bg-purple-50 p-3 rounded">
              <div className="text-sm font-medium text-purple-800">Value Metric</div>
              <div className="text-sm text-purple-700">{pricingData.pricingStrategy?.valueMetric}</div>
            </div>

            {pricingData.competitivePositioning && (
              <div className="bg-orange-50 p-3 rounded">
                <div className="text-sm font-medium text-orange-800">Market Position</div>
                <div className="text-sm text-orange-700">{pricingData.competitivePositioning.pricePoint}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const getCardTitle = () => {
    switch (type) {
      case 'competitor': return 'Competitor Intelligence';
      case 'market': return 'Market Analysis';
      case 'website': return 'Website Analysis';
      case 'pricing': return 'Pricing Intelligence';
      case 'industry': return 'Industry Research';
      default: return 'Business Intelligence';
    }
  };

  const getCardIcon = () => {
    switch (type) {
      case 'competitor': return <Target className="h-5 w-5" />;
      case 'market': return <BarChart3 className="h-5 w-5" />;
      case 'website': return <Globe className="h-5 w-5" />;
      case 'pricing': return <DollarSign className="h-5 w-5" />;
      case 'industry': return <TrendingUp className="h-5 w-5" />;
      default: return <Shield className="h-5 w-5" />;
    }
  };

  const renderContent = () => {
    if (Array.isArray(data)) {
      return data.map((item, idx) => (
        <div key={idx} className={idx > 0 ? "mt-6 pt-6 border-t" : ""}>
          {type === 'competitor' && renderCompetitorData(item)}
          {type === 'market' && renderMarketData(item)}
          {type === 'pricing' && renderPricingData(item)}
        </div>
      ));
    } else {
      switch (type) {
        case 'competitor': return renderCompetitorData(data);
        case 'market': return renderMarketData(data);
        case 'pricing': return renderPricingData(data);
        default: return <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto">{JSON.stringify(data, null, 2)}</pre>;
      }
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {getCardIcon()}
          {getCardTitle()}
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Globe className="h-3 w-3 mr-1" />
            Firecrawl Enhanced
          </Badge>
          High-accuracy structured data extraction (91-98% precision)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}

export default FirecrawlDataCard;