"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { BusinessInsight } from "@/lib/insights-schema";

function buildFilename(title?: string | null, fallback?: string | null) {
  const base = title || fallback || "informe-rankora";
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .concat(".pdf");
}

export function DownloadInsightPDFButton({ insight }: { insight: BusinessInsight }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/insights/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ insight }),
      });

      const contentType = response.headers.get("content-type") ?? "";

      if (!response.ok) {
        let message = "No se pudo generar el PDF.";
        if (contentType.includes("application/json")) {
          const data = await response.json().catch(() => null);
          if (data && typeof data.message === "string") message = data.message;
        }
        throw new Error(message);
      }

      // If server fell back to HTML (no headless browser), open the HTML preview in a new tab
      if (contentType.includes("text/html")) {
        const html = await response.text();
        const blob = new Blob([html], { type: "text/html" });
        const url = window.URL.createObjectURL(blob);
        window.open(url, "_blank", "noopener,noreferrer");
        // Also surface a gentle notice to the user
        setError("No se pudo generar el PDF. Mostrando versión HTML del informe en una nueva pestaña.");
        return;
      }

      // Otherwise proceed with PDF download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = buildFilename(insight.title, insight.type);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const fallbackMessage = "No se pudo generar el PDF.";
      setError(err instanceof Error ? err.message || fallbackMessage : fallbackMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const showError = error ?? null;

  return (
    <div className="space-y-2">
      <Button onClick={handleDownload} disabled={isLoading} className="flex items-center gap-2">
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
        <span>{isLoading ? "Generando..." : "Descargar PDF"}</span>
      </Button>
      {showError ? (
        <p role="alert" className="text-sm text-destructive">
          {showError}
        </p>
      ) : null}
    </div>
  );
}
