"use client";


import React, { useState } from "react";
// Charts (used in inline visualization preview when viewing a freshly created insight before status page gating)
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { BusinessInsight } from "@/lib/insights-schema";
import InsightsTable from "@/components/InsightsTable";
import { Loader2 } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DownloadInsightPDFButton } from "./DownloadInsightPDFButton";


export default function InsightsPage() {
  const [insight, setInsight] = useState<BusinessInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("clients");
  const [prompt, setPrompt] = useState("");
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("");
  const [country, setCountry] = useState("");
  const [size, setSize] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // New state for document upload
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  
  const { userId, isSignedIn } = useAuth();
  const router = useRouter();

  // Only fetch if user is signed in and userId is available
  const recentInsightsRaw = useQuery(
    api.insightReports.listRecentInsights,
    userId ? { userId } : "skip"
  );
  const searchedInsightsRaw = useQuery(
    api.insightReports.searchInsights,
    userId && search.trim() ? { userId, query: search } : "skip"
  );

  // Filter out archived entries on the client
  const recentInsights = (recentInsightsRaw || []).filter((r: any) => !r.archived);
  const searchedInsights = (searchedInsightsRaw || []).filter((r: any) => !r.archived);

  async function handleGenerate(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setInsight(null);

    const payload = {
      type,
      prompt: prompt.trim(),
      sector: sector || undefined,
      country: country || undefined,
      size: size || undefined,
    };

    const res = await fetch("/insights/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);

    // Limpia el input tras crear
    setPrompt("");

    // Si backend retorna id, navega a la vista de detalle
    const newId = data?._id || data?.id || null;
    if (newId) {
      // Navigate to status page first (gated) rather than summary directly
      router.push(`/insights/report/${newId}`);
      return;
    }
    setInsight(data);
  }

  // Handle file selection
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    
    // Validate file count
    if (files.length > 5) {
      alert("Maximum 5 files allowed");
      return;
    }

    // Validate file types
    const allowedTypes = [
      "application/pdf",
      "text/plain",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const allowedExtensions = [".pdf", ".txt", ".docx", ".md"];
    
    const invalidFiles = files.filter((file) => {
      const hasValidType = allowedTypes.includes(file.type);
      const hasValidExtension = allowedExtensions.some((ext) =>
        file.name.toLowerCase().endsWith(ext)
      );
      return !hasValidType && !hasValidExtension;
    });

    if (invalidFiles.length > 0) {
      alert(
        `Invalid file type(s): ${invalidFiles.map((f) => f.name).join(", ")}\nSupported: PDF, TXT, DOCX, MD`
      );
      return;
    }

    // Validate file sizes (max 30MB per file)
    const MAX_SIZE = 30 * 1024 * 1024; // 30MB
    const oversizedFiles = files.filter((file) => file.size > MAX_SIZE);
    
    if (oversizedFiles.length > 0) {
      alert(
        `File(s) too large (max 30MB): ${oversizedFiles.map((f) => `${f.name} (${(f.size / 1024 / 1024).toFixed(2)}MB)`).join(", ")}`
      );
      return;
    }

    setSelectedFiles(files);
  }

  // Handle document upload and insight generation
  async function handleUploadAndGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (selectedFiles.length === 0 || uploadLoading) return;

    setUploadLoading(true);

    try {
      // 1) Create job immediately to ensure a status document exists
      const createRes = await fetch("/insights/api/create-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: uploadTitle.trim() || undefined }),
      });
      const createData = await createRes.json();
      if (!createRes.ok || !createData?._id) {
        throw new Error(createData.error || "No se pudo crear el job de insight");
      }

      const jobId = createData._id as string;
      // Navega ya a la página de estado
      router.push(`/insights/report/${jobId}`);

      // 2) En paralelo, sube archivos para procesar el mismo job
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append("files", file));
      formData.append("jobId", jobId);
      if (uploadTitle.trim()) formData.append("title", uploadTitle.trim());

      // No esperamos a esta respuesta para navegar; la página de estado reaccionará a los cambios
      fetch("/insights/api/generate-from-files", { method: "POST", body: formData }).catch(() => {});

      // Clear form local
      setSelectedFiles([]);
      setUploadTitle("");
    } catch (error: any) {
      console.error("Upload error:", error);
      alert(error.message || "Failed to generate insight from documents");
    } finally {
      setUploadLoading(false);
    }
  }

  // Remove a selected file
  function removeFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  if (!isSignedIn) {
    return <div className="max-w-2xl mx-auto py-10 text-center text-gray-500">Por favor inicia sesión para ver tus insights de negocio.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Insights de Negocio</h1>
      
      {/* Create new insight hero */}
      <form onSubmit={handleGenerate}>
        <Card className="mb-8 border-0 bg-gradient-to-br from-blue-50/60 to-purple-50/40 dark:from-blue-900/30 dark:to-purple-900/10 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">Crear nuevo reporte de insights</CardTitle>
            <CardDescription>Describe tu objetivo (p. ej. "Pymes en automatización en España", "potenciales clientes para HR SaaS en LATAM").</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <Input
                className="col-span-1 sm:col-span-3"
                placeholder="p. ej. 'Pymes en automatización, España'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={loading}
                required
              />
              <Select value={type} onValueChange={setType} disabled={loading}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clients">Clientes</SelectItem>
                  <SelectItem value="sales">Ventas</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="product">Producto</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Sector (opcional)"
                value={sector}
                onChange={e => setSector(e.target.value)}
                disabled={loading}
              />
              <Input
                placeholder="País (opcional)"
                value={country}
                onChange={e => setCountry(e.target.value)}
                disabled={loading}
              />
              <Select value={size} onValueChange={setSize} disabled={loading}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tamaño de empresa (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Pequeña</SelectItem>
                  <SelectItem value="mid">Mediana</SelectItem>
                  <SelectItem value="enterprise">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="mt-6 flex justify-end">
              <Button type="submit" disabled={loading || !prompt.trim()} size="lg" className="px-8">
                {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                {loading ? "Creando..." : "Crear nuevo reporte"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* NEW: Document Upload Section */}
      <form onSubmit={handleUploadAndGenerate}>
        <Card className="mb-8 border-2 border-dashed border-blue-300 dark:border-blue-700 bg-gradient-to-br from-green-50/40 to-blue-50/40 dark:from-green-900/20 dark:to-blue-900/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl flex items-center gap-2">
              📄 Generar insight desde documentos
            </CardTitle>
            <CardDescription>
              Sube hasta 5 documentos (PDF, DOCX, TXT, MD) para generar insights accionables. Máximo 30MB por archivo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Title input */}
              <Input
                placeholder="Título del reporte (opcional, p. ej. 'Análisis de Mercado Q4')"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                disabled={uploadLoading}
              />

              {/* File input */}
              <div className="relative">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept=".pdf,.txt,.docx,.md"
                  onChange={handleFileSelect}
                  disabled={uploadLoading}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    uploadLoading
                      ? "bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                      : "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-300 dark:border-gray-700"
                  }`}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg
                      className="w-10 h-10 mb-3 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Haz clic para subir</span> o arrastra y suelta
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      PDF, DOCX, TXT, MD (máx. 30MB c/u, hasta 5 archivos)
                    </p>
                  </div>
                </label>
              </div>

              {/* Selected files list */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Archivos seleccionados ({selectedFiles.length}/5):
                  </p>
                  <div className="space-y-1">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-xl">
                            {file.name.endsWith(".pdf")
                              ? "📕"
                              : file.name.endsWith(".docx")
                              ? "📘"
                              : "📄"}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          disabled={uploadLoading}
                          className="text-red-500 hover:text-red-700 disabled:opacity-50 p-1"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit button */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={uploadLoading || selectedFiles.length === 0}
                  size="lg"
                  className="px-8"
                >
                  {uploadLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                  {uploadLoading
                    ? "Generando insight..."
                    : `Generar insight desde ${selectedFiles.length} documento${selectedFiles.length !== 1 ? "s" : ""}`}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Search bar */}
      <div className="mb-6 flex gap-2">
        <input
          className="border rounded px-2 py-1 flex-1"
          type="text"
          placeholder="Buscar insights (p. ej. cliente, tema, palabra clave)"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Recent or searched insights list */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Recent Insights</h2>
        {/* Loader si hay insights en proceso */}
        {recentInsights.some((r) => ["pending", "running", "analyzing"].includes(r.status)) && (
          <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Processing insights... You can create more while others are running.</span>
          </div>
        )}
        <InsightsTable insights={search.trim() ? searchedInsights : recentInsights} />
      </div>

      {/* Insight details */}
      {insight && (
        <div className="bg-white rounded shadow p-6 mt-6">
          <h2 className="text-xl font-semibold mb-2">Executive Summary</h2>
          <p className="mb-4 whitespace-pre-line">{insight.summary}</p>
          <h3 className="font-bold mt-4 mb-2">Key Metrics</h3>
          <ul className="mb-4">
            {insight.metrics.map((m, i) => (
              <li key={i} className={m.name.toLowerCase().includes("probability") ? "bg-blue-50 rounded px-2 py-1 my-1 font-semibold text-blue-800" : ""}>
                <span className="font-semibold">{m.name}:</span> {m.value} {m.unit || ""} {m.trend && <span className="text-xs text-gray-500">({m.trend})</span>}
                {m.name.toLowerCase().includes("probability") && typeof m.value === "number" && (
                  <span className="ml-2 inline-block px-2 py-0.5 rounded bg-blue-200 text-blue-900 text-xs font-bold">{Math.round(Number(m.value) * 100)}%</span>
                )}
              </li>
            ))}
          </ul>
          <h3 className="font-bold mt-4 mb-2">Recommendations</h3>
          <ul className="mb-4">
            {insight.recommendations.map((r, i) => (
              <li key={i}>
                <span className="font-semibold">{r.title}:</span> {r.description} {r.priority && <span className="text-xs text-gray-500">[{r.priority}]</span>}
              </li>
            ))}
          </ul>
          {insight.visualizations && insight.visualizations.length > 0 && (
            <div className="mt-4 space-y-6">
              {insight.visualizations.map((viz, idx) => (
                <div key={idx}>
                  <h3 className="font-bold mb-2">{viz.title || viz.type.charAt(0).toUpperCase() + viz.type.slice(1)}</h3>
                  {viz.type === "table" && Array.isArray(viz.data) ? (
                    <table className="w-full text-sm bg-gray-50 rounded mb-4">
                      <thead>
                        <tr>
                          {Object.keys(viz.data[0] || {}).map((col) => (
                            <th key={col} className="px-2 py-1 text-left font-semibold">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {viz.data.map((row: any, i: number) => (
                          <tr key={i} className="border-t">
                            {Object.values(row).map((val, j) => (
                              <td key={j} className="px-2 py-1">{String(val)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : viz.type === "bar" && Array.isArray(viz.data) ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={viz.data}>
                        <XAxis dataKey={Object.keys(viz.data[0])[0]} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey={Object.keys(viz.data[0])[1]} fill="#2250c8" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : viz.type === "line" && Array.isArray(viz.data) ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={viz.data}>
                        <XAxis dataKey={Object.keys(viz.data[0])[0]} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey={Object.keys(viz.data[0])[1]} stroke="#2250c8" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : viz.type === "pie" && Array.isArray(viz.data) ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={viz.data}
                          dataKey={Object.keys(viz.data[0])[1]}
                          nameKey={Object.keys(viz.data[0])[0]}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#2250c8"
                          label
                        >
                          {viz.data.map((entry: any, i: number) => (
                            <Cell key={`cell-${i}`} fill={['#2250c8', '#4f8cff', '#a3bffa', '#c3dafe', '#e2e8f0'][i % 5]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : viz.type === "text" ? (
                    <div className="bg-gray-100 rounded p-2 text-xs overflow-x-auto whitespace-pre-line">{viz.data}</div>
                  ) : (
                    <pre className="bg-gray-100 rounded p-2 text-xs overflow-x-auto">{JSON.stringify(viz, null, 2)}</pre>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 text-xs text-gray-500">
            <div>Sources: {insight.sources.join(", ")}</div>
            <div>Generated: {new Date(insight.generated_at).toLocaleString()}</div>
          </div>
          <DownloadInsightPDFButton insight={insight} />
        </div>
      )}
    </div>
  );
}
// End of InsightsPage
