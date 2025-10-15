"use client";

import React from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, TrendingUp, Activity } from "lucide-react";

interface VisualizationData {
  title?: string;
  type: string;
  data: any[];
  insight?: string;
  insights?: string[];
  subtitle?: string;
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const GRADIENT_COLORS = [
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#f59e0b", // amber
  "#10b981", // green
];

interface VisualizationRendererProps {
  visualization: VisualizationData;
  index: number;
}

const getChartIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case "bar":
    case "column":
      return BarChart3;
    case "line":
    case "trend":
      return LineChartIcon;
    case "pie":
    case "donut":
      return PieChartIcon;
    case "area":
      return TrendingUp;
    default:
      return Activity;
  }
};

const getChartBadgeColor = (type: string) => {
  switch (type?.toLowerCase()) {
    case "bar":
    case "column":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-300";
    case "line":
    case "trend":
      return "bg-purple-500/10 text-purple-700 dark:text-purple-300";
    case "pie":
    case "donut":
      return "bg-pink-500/10 text-pink-700 dark:text-pink-300";
    case "area":
      return "bg-green-500/10 text-green-700 dark:text-green-300";
    default:
      return "bg-gray-500/10 text-gray-700 dark:text-gray-300";
  }
};

export default function VisualizationRenderer({ visualization, index }: VisualizationRendererProps) {
  const { data, insight, insights, subtitle } = visualization;
  const title = visualization.title || `Visualization ${index + 1}`;
  const type = visualization.type || "bar";
  const ChartIcon = getChartIcon(type);

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Card className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-300">
        <CardHeader className="bg-gradient-to-br from-muted/50 to-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-background/80">
              <ChartIcon className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">{title}</CardTitle>
              <Badge variant="outline" className={`mt-2 ${getChartBadgeColor(type)}`}>
                {type}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground italic">No data available for visualization</p>
        </CardContent>
      </Card>
    );
  }

  const renderChart = () => {
    const chartType = type?.toLowerCase();

    // Intentar detectar claves automáticamente
    const firstItem = data[0];
    const keys = Object.keys(firstItem);
    const labelKey = keys.find((k) => /name|label|category|key/i.test(k)) || keys[0];
    const valueKey = keys.find((k) => /value|amount|count|total/i.test(k)) || keys[1] || keys[0];

    switch (chartType) {
      case "bar":
      case "column":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <defs>
                <linearGradient id={`barGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={GRADIENT_COLORS[index % GRADIENT_COLORS.length]} stopOpacity={0.8} />
                  <stop offset="100%" stopColor={GRADIENT_COLORS[index % GRADIENT_COLORS.length]} stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
              <XAxis 
                dataKey={labelKey} 
                angle={-45} 
                textAnchor="end" 
                height={80}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
              />
              <Legend wrapperStyle={{ paddingTop: "20px" }} />
              <Bar dataKey={valueKey} fill={`url(#barGradient-${index})`} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case "line":
      case "trend":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
              <XAxis 
                dataKey={labelKey} 
                angle={-45} 
                textAnchor="end" 
                height={80}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
              />
              <Legend wrapperStyle={{ paddingTop: "20px" }} />
              <Line
                type="monotone"
                dataKey={valueKey}
                stroke={GRADIENT_COLORS[index % GRADIENT_COLORS.length]}
                strokeWidth={3}
                dot={{ fill: GRADIENT_COLORS[index % GRADIENT_COLORS.length], r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "pie":
      case "donut":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                dataKey={valueKey}
                nameKey={labelKey}
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={chartType === "donut" ? 60 : 0}
                label={(entry) => `${entry[labelKey]}: ${entry[valueKey]}`}
                labelLine={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1 }}
              >
                {data.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case "area":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <defs>
                <linearGradient id={`areaGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={GRADIENT_COLORS[index % GRADIENT_COLORS.length]} stopOpacity={0.8} />
                  <stop offset="100%" stopColor={GRADIENT_COLORS[index % GRADIENT_COLORS.length]} stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
              <XAxis 
                dataKey={labelKey} 
                angle={-45} 
                textAnchor="end" 
                height={80}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
              />
              <Legend wrapperStyle={{ paddingTop: "20px" }} />
              <Area
                type="monotone"
                dataKey={valueKey}
                stroke={GRADIENT_COLORS[index % GRADIENT_COLORS.length]}
                strokeWidth={2}
                fill={`url(#areaGradient-${index})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case "table":
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {keys.map((key) => (
                    <th key={key} className="px-4 py-3 text-left font-semibold bg-muted/50">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} className="border-b hover:bg-muted/20 transition-colors">
                    {keys.map((key) => (
                      <td key={key} className="px-4 py-3">
                        {row[key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      default:
        return (
          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Chart type &quot;{type}&quot; not yet supported</p>
            <pre className="text-xs overflow-auto max-h-48 bg-background/50 p-3 rounded border">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        );
    }
  };

  return (
    <Card className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl group">
      <CardHeader className="bg-gradient-to-br from-muted/50 to-muted/30 group-hover:from-muted/70 group-hover:to-muted/50 transition-all">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-background/80 group-hover:scale-110 transition-transform">
            <ChartIcon className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">{title}</CardTitle>
            <Badge variant="outline" className={`mt-2 ${getChartBadgeColor(type)}`}>
              {type}
            </Badge>
          </div>
        </div>
        {insight && (
          <CardDescription className="mt-3 text-sm leading-relaxed border-l-2 border-primary pl-3">
            {insight}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-6">
        {renderChart()}
      </CardContent>
    </Card>
  );
}
