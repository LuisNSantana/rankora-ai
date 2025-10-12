# Insights desde Documentos - Caso 2

## Implementación Completa ✅

### Funcionalidad

- ✅ Subida de múltiples documentos (PDF, DOCX, TXT, MD)
- ✅ Extracción automática de texto
- ✅ Análisis con IA (GPT-4o-mini)
- ✅ Generación de insights estructurados
- ✅ Visualización y descarga de reportes

### Archivos Nuevos Creados

1. **`lib/doc-extract.ts`**
   - Extracción de texto de PDF (pdf-parse)
   - Extracción de texto de DOCX (mammoth)
   - Extracción de texto de TXT/MD
   - Validaciones de tamaño y tipo
   - Manejo de errores

2. **`app/insights/api/generate-from-files/route.ts`**
   - Endpoint POST para procesar archivos
   - Autenticación con Clerk
   - Creación de job en Convex
   - Generación de insight con IA
   - Runtime Node.js

3. **Actualizaciones en `prompts/insight.ts`**
   - Nueva función: `buildDocInsightAnalysisPrompt()`
   - Prompt optimizado para análisis de documentos
   - Incluye contenido completo de documentos

4. **Actualizaciones en `app/insights/page.tsx`**
   - Sección de subida de archivos con drag & drop visual
   - Validación de tipos y tamaños
   - Preview de archivos seleccionados
   - UI/UX profesional con feedback visual

### Cómo Usar

1. Navega a <http://localhost:3000/insights>

2. Encuentra la nueva sección verde: "📄 Generate Insight from Documents"

3. Sube tus 3 documentos:
   - Click en el área de subida o arrastra archivos
   - Tipos soportados: PDF, DOCX, TXT, MD
   - Máximo: 5 archivos, 30MB cada uno

4. Opcional: Añade un título descriptivo para el reporte

5. Click en "Generate Insight from X Documents"

6. Espera ~30-60 segundos mientras:
   - Se extrae el texto de cada documento
   - IA analiza el contenido completo
   - Se genera el insight estructurado

7. Revisa el insight que incluye:
   - Resumen ejecutivo (3-5 puntos clave)
   - Métricas extraídas
   - Recomendaciones priorizadas
   - Visualizaciones (si aplica)
   - Referencias a documentos fuente

8. Descarga PDF del reporte si necesitas

### Validaciones Implementadas

- ✅ Máximo 5 archivos
- ✅ Máximo 30MB por archivo
- ✅ Solo PDF, DOCX, TXT, MD
- ✅ Archivos vacíos rechazados
- ✅ PDFs escaneados (sin texto) detectados
- ✅ Errores de extracción manejados gracefully
- ✅ Mensajes de error claros

### Diferencia vs Insights Normal

Insights Normal (sección azul/morada):

- Input: texto descriptivo + parámetros
- Fuente: Scraping web (Bright Data + Perplexity)
- Uso: Investigación de mercado, clientes potenciales

Insights desde Documentos (sección verde):

- Input: archivos locales (PDFs, DOCX, etc.)
- Fuente: Contenido de documentos subidos
- Uso: Análisis de documentos técnicos, reportes, casos de uso

### Próximos Pasos (Post-MVP)

- [ ] Almacenamiento persistente en Convex Storage
- [ ] Citas con número de página
- [ ] Soporte para archivos escaneados (OCR)
- [ ] Chunking para documentos muy largos
- [ ] Búsqueda semántica dentro de documentos
- [ ] Comparación entre múltiples reports

### Troubleshooting

#### Error: "No text could be extracted"

El PDF probablemente es escaneado. Necesita OCR (fuera de MVP).

#### Error: "File too large"

Reduce el tamaño o divide el documento.

#### Error: "Unsupported file type"

Convierte a PDF, DOCX, o TXT.

#### Insight tarda mucho

Normal con documentos grandes (varios MB). Espera hasta 90 seg.

### Dependencias Agregadas

```json
{
  "pdf-parse": "^2.2.2",
  "mammoth": "^1.11.0"
}
```

### Estado del Proyecto

- ✅ MVP Completo: Subida + extracción + análisis + UI
- ✅ Listo para Demo: Caso 2 funcional
- ✅ Probado: Validaciones y manejo de errores
- ⏳ En espera: Test con tus 3 documentos reales

---

Tiempo de implementación: ~45 minutos

Tiempo restante para pruebas: ~15 minutos

Status: ✅ READY FOR TESTING
