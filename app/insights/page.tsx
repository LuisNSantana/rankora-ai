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


function HelpPanel() {
  return (
    <aside className="sticky top-6 space-y-6 text-sm">
      <div className="rounded-lg border bg-white/70 dark:bg-gray-900/60 backdrop-blur p-4">
        <h3 className="font-semibold mb-2">Cómo redactar un buen prompt</h3>
        <ol className="list-decimal pl-5 space-y-1">
          <li><span className="font-medium">Objetivo</span>: Qué quieres obtener.</li>
          <li><span className="font-medium">Contexto</span>: Sector, mercado, segmento, datos disponibles.</li>
          <li><span className="font-medium">Restricciones</span>: País, tamaño, idioma, horizonte temporal.</li>
          <li><span className="font-medium">Formato</span>: Tipo de insight (clientes, marketing, producto, ventas).</li>
        </ol>
        <p className="mt-2 text-xs text-muted-foreground">Ej: "Analiza oportunidades de expansión para SaaS de RRHH en México enfocadas en pymes (50-200 empleados) y prioriza segmentos con alta rotación de personal".</p>
      </div>
      <div className="rounded-lg border bg-white/70 dark:bg-gray-900/60 backdrop-blur p-4">
        <h3 className="font-semibold mb-2">Ejemplos útiles</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Clientes: "Identifica perfiles de early adopters para plataforma IoT agricultura en España"</li>
          <li>Ventas: "Mapea triggers de compra para software de compliance financiero en LATAM"</li>
          <li>Marketing: "Canales digitales con mejor CAC esperado para fintech B2B en Colombia"</li>
          <li>Producto: "Dolores no resueltos en gestión de inventario omnicanal retail mediano"</li>
        </ul>
      </div>
      <div className="rounded-lg border bg-white/70 dark:bg-gray-900/60 backdrop-blur p-4">
        <h3 className="font-semibold mb-2">Documentos</h3>
        <p>Sube versiones recientes y variadas (presentaciones, papers, reportes). Evita duplicados. Nombres de archivo descriptivos ayudan a extraer señales.</p>
        <p className="mt-2 text-xs text-muted-foreground">Hasta 5 archivos · 30MB c/u · PDF, DOCX, TXT, MD.</p>
      </div>
      <div className="rounded-lg border bg-white/70 dark:bg-gray-900/60 backdrop-blur p-4">
        <h3 className="font-semibold mb-2">Qué hace Rankora</h3>
        <ul className="text-xs space-y-1">
          <li>1. Limpia y tokeniza texto.</li>
          <li>2. Extrae métricas y entidades sectoriales.</li>
          <li>3. Sintetiza patrones y oportunidades.</li>
          <li>4. Prioriza recomendaciones (impacto x esfuerzo).</li>
          <li>5. Genera roadmap y matriz de riesgos.</li>
        </ul>
      </div>
      <div className="rounded-lg border bg-white/70 dark:bg-gray-900/60 backdrop-blur p-4">
        <h3 className="font-semibold mb-2">🔄 Flujo de Investigación Combinado</h3>
        <p className="text-xs text-muted-foreground mb-3">Nuevo: Usamos ambos sistemas para máxima precisión y robustez.</p>
        <div className="space-y-3 text-xs">
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">1</span>
            <div>
              <div className="font-medium text-blue-700">Perplexity Sonar</div>
              <div className="text-muted-foreground">Investigación inicial del mercado, competidores y clientes con búsqueda web en tiempo real</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">2</span>
            <div>
              <div className="font-medium text-purple-700">Grok-4-fast + Live Search</div>
              <div className="text-muted-foreground">Análisis profundo con datos de X, noticias y web para generar el reporte final</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">3</span>
            <div>
              <div className="font-medium text-green-700">Síntesis Inteligente</div>
              <div className="text-muted-foreground">Combina todas las fuentes para insights completos y accionables</div>
            </div>
          </div>
        </div>
        <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded text-xs">
          <div className="font-medium text-amber-700 dark:text-amber-300">💡 Beneficios del flujo combinado:</div>
          <div className="text-amber-600 dark:text-amber-400">• Datos más completos y actualizados • Mejor contexto del mercado • Análisis más robusto</div>
        </div>
      </div>
    </aside>
  );
}

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
  
  // NEW: Advanced Grok-4-fast features for document upload
  const [useCase, setUseCase] = useState("market-entry");
  const [researchDepth, setResearchDepth] = useState("deep");
  const [enableLiveSearch, setEnableLiveSearch] = useState(true);
  
  // Advanced Grok-4-fast features for basic form
  const [basicUseCase, setBasicUseCase] = useState("lead-gen");
  const [basicResearchDepth, setBasicResearchDepth] = useState("deep");
  const [basicEnableLiveSearch, setBasicEnableLiveSearch] = useState(true);
  
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

    try {
      // 1) Crear job primero para tener una página de estado inmediata
      const createRes = await fetch("/insights/api/create-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: prompt.trim().slice(0, 100) })
      });
      const createData = await createRes.json();
      const jobId = createData?._id;
      if (!createRes.ok || !jobId) throw new Error(createData?.error || "No se pudo crear el job");

      // 2) Redirigir de inmediato a la página de estado
      router.push(`/insights/report/${jobId}`);

      // 3) Disparar generación en background apuntando al mismo job
      const payload = {
        type,
        prompt: prompt.trim(),
        sector: sector || undefined,
        country: country || undefined,
        size: size || undefined,
        useCase: basicUseCase,
        researchDepth: basicResearchDepth,
        enableLiveSearch: basicEnableLiveSearch,
        jobId,
      } as any;

      fetch("/insights/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {});

      // Limpia input local pero deja que el usuario vea el progreso
      setPrompt("");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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
    <div className="mx-auto max-w-6xl py-10 px-2 md:px-4 lg:px-6">
      <h1 className="text-3xl font-bold mb-8">Insights de Negocio</h1>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-10">
      
      {/* Create new insight hero */}
      <form onSubmit={handleGenerate}>
        <Card className="mb-8 border-2 border-blue-200/50 dark:border-blue-800/50 bg-gradient-to-br from-blue-50/60 to-purple-50/40 dark:from-blue-900/30 dark:to-purple-900/10 shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl flex items-center gap-2">
              ✨ Crear nuevo reporte de insights
            </CardTitle>
            <CardDescription className="text-base">
              Describe tu objetivo: mercado, segmento, enfoque, restricción geográfica o de tamaño. Sé específico para más valor.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Main Input Fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <Input
                  className="text-base h-12"
                  placeholder="Ej: 'Oportunidades de clientes B2B para software logística en México'"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Select value={type} onValueChange={setType} disabled={loading}>
                  <SelectTrigger className="w-full h-11">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Productized types (A & B) */}
                    <SelectItem value="seo_content_opportunity">🧭 SEO & Content Opportunity</SelectItem>
                    <SelectItem value="competitor_pricing_intel">⚔️ Competitor & Pricing</SelectItem>
                    <div className="h-px bg-muted my-1" />
                    <SelectItem value="clients">👥 Clientes</SelectItem>
                    <SelectItem value="sales">💼 Ventas</SelectItem>
                    <SelectItem value="marketing">📢 Marketing</SelectItem>
                    <SelectItem value="product">📦 Producto</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  className="h-11"
                  placeholder="Sector (ej: salud, fintech)"
                  value={sector}
                  onChange={e => setSector(e.target.value)}
                  disabled={loading}
                />
                <Input
                  className="h-11"
                  placeholder="País (ej: España)"
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  disabled={loading}
                />
                <Select value={size} onValueChange={setSize} disabled={loading}>
                  <SelectTrigger className="w-full h-11">
                    <SelectValue placeholder="Tamaño empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">🏢 Pequeña</SelectItem>
                    <SelectItem value="mid">🏭 Mediana</SelectItem>
                    <SelectItem value="enterprise">🌆 Grande</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Advanced Grok-4-fast Configuration */}
            <div className="space-y-4 p-6 bg-gradient-to-br from-white/80 to-blue-50/50 dark:from-gray-800/50 dark:to-blue-900/20 rounded-xl border-2 border-blue-100 dark:border-blue-800/30 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">⚡ Configuración Avanzada</span>
                  <span className="text-xs px-2 py-0.5 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full font-medium">
                    Grok-4-fast
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Caso de Uso */}
                <div className="space-y-2.5">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                    🎯 Caso de Uso
                  </label>
                  <Select value={basicUseCase} onValueChange={setBasicUseCase} disabled={loading}>
                    <SelectTrigger className="w-full h-11 bg-white dark:bg-gray-800">
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="market-entry">
                        <div className="flex items-center gap-2">
                          <span>🚀</span>
                          <span>Entrada a mercado</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="lead-gen">
                        <div className="flex items-center gap-2">
                          <span>🔍</span>
                          <span>Captación de clientes</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="competitive">
                        <div className="flex items-center gap-2">
                          <span>⚔️</span>
                          <span>Análisis competitivo</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="product-market-fit">
                        <div className="flex items-center gap-2">
                          <span>📊</span>
                          <span>Product-market fit</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="expansion">
                        <div className="flex items-center gap-2">
                          <span>🌍</span>
                          <span>Estrategia de expansión</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="customer-research">
                        <div className="flex items-center gap-2">
                          <span>👥</span>
                          <span>Investigación de clientes</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Profundidad de Investigación */}
                <div className="space-y-2.5">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                    <span>🔍 Profundidad de Investigación</span>
                  </label>
                  <Select value={basicResearchDepth} onValueChange={setBasicResearchDepth} disabled={loading}>
                    <SelectTrigger className="w-full h-11 bg-white dark:bg-gray-800">
                      <SelectValue placeholder="Profundidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">
                        <div className="py-1">
                          <div className="font-medium">📝 Básica</div>
                          <div className="text-xs text-muted-foreground">Sin Live Search</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="standard">
                        <div className="py-1">
                          <div className="font-medium">🔎 Estándar</div>
                          <div className="text-xs text-muted-foreground">Live Search + análisis</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="deep">
                        <div className="py-1">
                          <div className="font-medium">🌊 Profunda</div>
                          <div className="text-xs text-muted-foreground">Live Search + Perplexity</div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Live Search Toggle */}
                <div className="space-y-2.5">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                    <span>🔴 Live Search</span>
                    <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-full font-bold shadow-sm">
                      GRATIS Beta
                    </span>
                  </label>
                  <div className="flex flex-col gap-2 pt-1">
                    <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg border">
                      <input
                        id="basic-live-search"
                        type="checkbox"
                        checked={basicEnableLiveSearch}
                        onChange={(e) => setBasicEnableLiveSearch(e.target.checked)}
                        disabled={loading || basicResearchDepth === "basic"}
                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                      />
                      <label htmlFor="basic-live-search" className="text-sm font-medium cursor-pointer select-none">
                        Datos en tiempo real
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground px-1">
                      {basicEnableLiveSearch && basicResearchDepth !== "basic" 
                        ? "✅ Web, noticias y X" 
                        : "⚠️ Desactivado"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={loading || !prompt.trim()} size="lg" className="px-10 h-12">
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
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
              Sube hasta 5 documentos (PDF, DOCX, TXT, MD) para generar insights accionables. Mayor diversidad = mejor cobertura (ej: pitch deck + reporte trimestral + caso de uso).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Title input */}
              <Input
                placeholder="Título del reporte (ej: 'Análisis Mercado LATAM Q4')"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                disabled={uploadLoading}
              />

              {/* NEW: Advanced Grok-4-fast Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border">
                <div className="space-y-2">
                  <label className="text-sm font-medium">🎯 Caso de Uso</label>
                  <Select value={useCase} onValueChange={setUseCase} disabled={uploadLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona caso de uso" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="market-entry">🚀 Entrada a mercado</SelectItem>
                      <SelectItem value="lead-gen">🔍 Captación de clientes</SelectItem>
                      <SelectItem value="competitive">⚔️ Análisis competitivo</SelectItem>
                      <SelectItem value="product-market-fit">📊 Product-market fit</SelectItem>
                      <SelectItem value="expansion">🌍 Estrategia de expansión</SelectItem>
                      <SelectItem value="customer-research">👥 Investigación de clientes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">🔍 Profundidad de Investigación</label>
                  <Select value={researchDepth} onValueChange={setResearchDepth} disabled={uploadLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Profundidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">
                        <div className="flex flex-col">
                          <span>📝 Básica</span>
                          <span className="text-xs text-muted-foreground">Solo documentos</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="standard">
                        <div className="flex flex-col">
                          <span>📊 Estándar</span>
                          <span className="text-xs text-muted-foreground">Docs + benchmarks</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="deep">
                        <div className="flex flex-col">
                          <span>🚀 Profunda (Grok-4-fast)</span>
                          <span className="text-xs text-muted-foreground">Docs + live search + competitive intel</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    🌐 Live Search
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">GRATIS Beta</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="enable-live-search"
                      checked={enableLiveSearch}
                      onChange={(e) => setEnableLiveSearch(e.target.checked)}
                      disabled={uploadLoading || researchDepth === "basic"}
                      className="rounded"
                    />
                    <label htmlFor="enable-live-search" className="text-sm">
                      {researchDepth === "basic" 
                        ? "No disponible en modo básico"
                        : "Búsqueda en tiempo real (web, noticias, X)"
                      }
                    </label>
                  </div>
                  {enableLiveSearch && researchDepth === "deep" && (
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      ✨ Grok-4-fast con 2M tokens + live search habilitado
                    </p>
                  )}
                </div>
              </div>

              {/* Use case descriptions */}
              <div className="text-xs text-muted-foreground space-y-1 p-3 bg-gray-50 dark:bg-gray-900 rounded">
                <p><strong>🎯 Casos de uso:</strong></p>
                <p>• <strong>Entrada a mercado:</strong> Análisis de oportunidades, competidores, barreras de entrada</p>
                <p>• <strong>Captación:</strong> Buyer personas, canales, mensajes, triggers de compra</p>
                <p>• <strong>Competitivo:</strong> Fortalezas, debilidades, posicionamiento, pricing</p>
                <p>• <strong>Product-market fit:</strong> Demanda, pain points, features valoradas</p>
                <p>• <strong>Expansión:</strong> Nuevos segmentos, geografías, productos</p>
              </div>

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
  <HelpPanel />
      </div>
    </div>
  );
}
// End of InsightsPage
