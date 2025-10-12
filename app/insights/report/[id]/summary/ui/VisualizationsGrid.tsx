import React from "react";
import { BusinessInsight } from "@/lib/insights-schema";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Layers } from "lucide-react";

interface VisualizationsGridProps {
  insight: BusinessInsight;
}

export default function VisualizationsGrid({ insight }: VisualizationsGridProps) {
  const viz = Array.isArray(insight.visualizations) ? insight.visualizations : [];
  const chartableCount = viz.filter(v => ["bar","line","pie"].includes(v.type) && Array.isArray(v.data) && v.data.length > 0).length;
  const shouldFallback = viz.length === 0 || chartableCount === 0;

  return (
    <Card className="border bg-gradient-to-br from-card to-card/95">
      <CardHeader className="pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50">
            <Layers className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <CardTitle className="text-2xl">Visualizaciones</CardTitle>
            <CardDescription className="text-base">Representaciones de datos derivadas de las fuentes</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-10">
          {shouldFallback && Array.isArray(insight.metrics) && insight.metrics.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-lg tracking-tight flex items-center gap-2">
                  Resumen de métricas (derivado)
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/20 text-xs">
                    bar
                  </Badge>
                </h3>
              </div>
              <div className="rounded-lg border bg-gradient-to-br from-muted/40 to-muted/20 p-4">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={insight.metrics
                    .map((m) => ({ categoria: m.name, valor: Number(String(m.value).replace(/[^0-9.-]/g, "")) }))
                    .filter((d) => !isNaN(d.valor))
                    .slice(0, 8)
                  }>
                    <XAxis dataKey={"categoria"} stroke="var(--foreground)" hide={false} interval={0} angle={-20} height={60} tick={{ fontSize: 12 }} />
                    <YAxis stroke="var(--foreground)" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey={"valor"} fill="#2563eb" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          {viz.map((viz, idx) => {
            const title = viz.title || viz.type.charAt(0).toUpperCase() + viz.type.slice(1);
            const dataArray = Array.isArray(viz.data) ? viz.data : [];
            const hasData = dataArray.length > 0;
            return (
              <div key={idx} className="space-y-4">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-lg tracking-tight flex items-center gap-2">
                    {title}
                    <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/20 text-xs">
                      {viz.type}
                    </Badge>
                  </h3>
                </div>
                <div className="rounded-lg border bg-gradient-to-br from-muted/40 to-muted/20 p-4">
                  {viz.type === "table" && hasData ? (
                    <div className="overflow-x-auto">
                      <Table className="text-xs sm:text-sm">
                        <TableHeader>
                          <TableRow>
                            {Object.keys(dataArray[0] || {}).map((col) => (
                              <TableHead key={col} className="capitalize text-foreground/90">
                                {col.replace(/_/g, ' ')}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dataArray.map((row: any, r) => (
                            <TableRow key={r} className="hover:bg-muted/30">
                              {Object.values(row).map((val, c) => (
                                <TableCell key={c} className="font-mono text-xs sm:text-sm text-muted-foreground/90">
                                  {String(val)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : viz.type === "bar" && hasData ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={dataArray.map((d: any) => ({
                        ...(d || {}),
                        // normalize Spanish keys
                        categoria: d.categoria ?? d.category ?? d.label ?? d[Object.keys(d)[0]],
                        valor: d.valor ?? d.value ?? d[Object.keys(d)[1]],
                      }))}>
                        <XAxis dataKey={"categoria"} stroke="var(--foreground)" />
                        <YAxis stroke="var(--foreground)" />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey={"valor"} fill="#2563eb" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : viz.type === "line" && hasData ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={dataArray.map((d: any) => ({
                        ...(d || {}),
                        periodo: d.periodo ?? d.period ?? d.label ?? d[Object.keys(d)[0]],
                        valor: d.valor ?? d.value ?? d[Object.keys(d)[1]],
                      }))}>
                        <XAxis dataKey={"periodo"} stroke="var(--foreground)" />
                        <YAxis stroke="var(--foreground)" />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey={"valor"} stroke="#6366f1" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : viz.type === "pie" && hasData ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={dataArray.map((d: any) => ({
                            ...(d || {}),
                            categoria: d.categoria ?? d.category ?? d.label ?? d[Object.keys(d)[0]],
                            porcentaje: d.porcentaje ?? d.percent ?? d.value ?? d[Object.keys(d)[1]],
                          }))}
                          dataKey={"porcentaje"}
                          nameKey={"categoria"}
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          fill="#2563eb"
                          label
                        >
                          {dataArray.map((entry: any, i: number) => (
                            <Cell
                              key={`cell-${i}`}
                              fill={["#2563eb", "#6366f1", "#0ea5e9", "#0891b2", "#10b981", "#f59e0b"][i % 6]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : viz.type === "text" ? (
                    <div className="bg-muted/40 rounded p-3 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-mono">
                      {viz.data}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground/70 font-mono break-all">
                      {JSON.stringify(viz, null, 2)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
