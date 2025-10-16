# 🔧 Lead Generation Critical Fixes

## Fecha: 2025-10-16

## 🚨 Problemas Identificados

### 1. **Error JSON Parse en LLM Lead Generation**
**Error:** `SyntaxError: Expected ',' or '}' after property value in JSON at position 1053`

**Causa raíz:**
- Grok-4-fast estaba generando JSON con errores de sintaxis:
  - Comas finales antes de `}` o `]`
  - Comentarios en el JSON
  - Keys sin comillas
  - Formato inconsistente

### 2. **Error Schema Validation en Metrics**
**Error:** `Invalid input: expected number, received array` en `metrics[0].value`

**Causa raíz:**
- El LLM estaba generando valores de tipo array para `metrics[].value`
- El schema espera `z.union([z.number(), z.string()])` 
- No había normalización para arrays u objetos en el campo `value`

---

## ✅ Soluciones Implementadas

### Fix 1: Mejorar JSON Repair Function
**Archivo:** `lib/llm-lead-generation.ts`

```typescript
function repairJson(raw: string): string {
  let s = raw.trim();
  // Strip code fences and markdown
  s = s.replace(/^```(json)?/i, "").replace(/```$/i, "").trim();
  // Extract balanced JSON object
  const balanced = extractBalancedObject(s);
  if (balanced) s = balanced;
  // Remove trailing commas
  s = s.replace(/,\s*([}\]])/g, "$1");
  // Remove comments
  s = s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*/g, "");
  // Fix unquoted keys
  s = s.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":');
  return s;
}
```

**Cambios:**
- ✅ Elimina comentarios (`//` y `/* */`)
- ✅ Arregla keys sin comillas
- ✅ Mejor manejo de code fences
- ✅ Más robusta para edge cases

### Fix 2: Mejorar Logging de Errores
**Archivo:** `lib/llm-lead-generation.ts`

```typescript
// Antes
const parsed = JSON.parse(raw);

// Después
let parsed: any;
try {
  parsed = JSON.parse(raw);
} catch (parseError: any) {
  console.error(`[LLM LeadGen] JSON Parse Error:`, parseError.message);
  console.error(`[LLM LeadGen] Problematic JSON:`, raw.substring(0, 500));
  throw parseError;
}
```

**Beneficios:**
- 🔍 Mejor debugging
- 📊 Logs estructurados
- 🎯 Identifica exactamente dónde falla el JSON

### Fix 3: Mejorar Prompt para JSON Válido
**Archivo:** `lib/llm-lead-generation.ts`

Nuevo prompt con **instrucciones explícitas**:
```typescript
CRITICAL: Return ONLY a valid JSON object. Follow these rules strictly:
1. NO markdown code fences (no ```json or ```)
2. NO trailing commas before } or ]
3. NO comments (// or /* */)
4. All strings must use double quotes "like this"
5. All arrays must end with proper closing bracket ]
6. All objects must end with proper closing brace }
7. Boolean values must be lowercase: true or false
8. Numbers should not be quoted unless they are strings
```

**Resultado:**
- ✅ Instrucciones más claras para el LLM
- ✅ Ejemplos de estructura esperada
- ✅ Menos errores de formato

### Fix 4: Normalización de Metrics Values
**Archivo:** `app/insights/api/generate/route.ts`

```typescript
// Normalize value: ensure it's number or string (NOT array)
let normalizedValue = m.value ?? m.val ?? m.score ?? '';
if (Array.isArray(normalizedValue)) {
  // Convert array to string (e.g., [1, 2, 3] -> "1, 2, 3")
  normalizedValue = normalizedValue.join(', ');
} else if (typeof normalizedValue === 'object' && normalizedValue !== null) {
  // Convert object to JSON string
  normalizedValue = JSON.stringify(normalizedValue);
}

// Same for benchmark
let normalizedBenchmark = m.benchmark;
if (Array.isArray(normalizedBenchmark)) {
  normalizedBenchmark = normalizedBenchmark.join(', ');
} else if (typeof normalizedBenchmark === 'object' && normalizedBenchmark !== null) {
  normalizedBenchmark = JSON.stringify(normalizedBenchmark);
}

// Normalize percentile: must be number or undefined
let normalizedPercentile = m.percentile;
if (typeof normalizedPercentile === 'string') {
  normalizedPercentile = parseFloat(normalizedPercentile) || undefined;
} else if (typeof normalizedPercentile !== 'number') {
  normalizedPercentile = undefined;
}
```

**Cambios:**
- ✅ Convierte arrays a strings: `[1, 2, 3]` → `"1, 2, 3"`
- ✅ Convierte objetos a JSON strings
- ✅ Normaliza `benchmark` (mismo problema potencial)
- ✅ Normaliza `percentile` (debe ser number)

### Fix 5: Mejor Logging de Schema Validation
**Archivo:** `app/insights/api/generate/route.ts`

```typescript
if (!res.success) {
  console.error(`[Insight Job ${jobId}] Schema validation failed:`, 
    JSON.stringify(res.error?.errors || res.error, null, 2));
  throw new Error(`Schema validation failed: ${JSON.stringify(res.error?.errors)}`);
}
```

**Beneficios:**
- 🔍 Logs detallados de errores de validación
- 📊 JSON formateado para fácil lectura
- 🎯 Identifica exactamente qué campo falla

### Fix 6: Mejorar Fallback a OpenAI
**Archivo:** `lib/llm-lead-generation.ts`

```typescript
if (!finalObject) {
  console.log(`[LLM LeadGen] 🔄 Falling back to OpenAI GPT-4o-mini...`);
  try {
    const result = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: LeadsResponseSchema,
      prompt,
      temperature: 0.2,
    });
    finalObject = result.object as z.infer<typeof LeadsResponseSchema>;
    console.log(`[LLM LeadGen] ✅ OpenAI fallback successful`);
  } catch (e: any) {
    console.error(`[LLM LeadGen] ❌ OpenAI fallback also failed:`, e.message);
    throw new Error(`Lead generation failed: ${e.message}`);
  }
}
```

**Cambios:**
- ✅ Logs claros de fallback
- ✅ Mejor manejo de errores
- ✅ Mensajes descriptivos

---

## 🎯 Impacto de los Cambios

### Antes:
- ❌ Lead generation fallaba con JSON parse errors
- ❌ Schema validation fallaba por tipos incorrectos
- ❌ No había logs útiles para debugging
- ❌ No había fallback robusto

### Después:
- ✅ JSON repair más robusto (elimina comentarios, arregla keys)
- ✅ Normalización completa de metrics (value, benchmark, percentile)
- ✅ Logs detallados para debugging
- ✅ Fallback a OpenAI con mejor error handling
- ✅ Prompt mejorado con instrucciones explícitas

---

## 🧪 Testing Recomendado

1. **Test Lead Generation:**
   ```bash
   # Generar insights con lead-gen
   - Sector: Technology / SaaS
   - Country: España
   - Use Case: lead-gen
   - Research: deep
   ```

2. **Verificar Logs:**
   - ✅ No debe haber "JSON Parse Error"
   - ✅ No debe haber "Schema validation failed" para metrics
   - ✅ Debe mostrar "Generated X leads in Xms"

3. **Verificar Métricas:**
   - ✅ Todos los `metrics[].value` deben ser number o string
   - ✅ Arrays deben convertirse a strings
   - ✅ `percentile` debe ser number o undefined

---

## 📊 Archivos Modificados

1. ✅ `lib/llm-lead-generation.ts` - JSON repair + mejor error handling
2. ✅ `app/insights/api/generate/route.ts` - Normalización de metrics + logging

---

## 🚀 Próximos Pasos

1. ✅ **Monitorear logs** en producción para nuevos errores
2. ✅ **Agregar tests unitarios** para JSON repair function
3. ✅ **Considerar schema más flexible** si el problema persiste
4. ✅ **Rate limiting** para evitar timeouts en APIs externas

---

## 📝 Notas

- Los errores de "other side closed" y "socket timeout" en Perplexity/Grok son **no críticos** y esperados (network issues)
- El sistema tiene **fallbacks robustos** que permiten continuar sin estos servicios
- La generación de leads ahora usa **LLM-First approach** (más rápido y confiable que scraping)

---

**Estado:** ✅ LISTO PARA TESTING
**Prioridad:** 🔴 CRÍTICO
**Autor:** GitHub Copilot
**Fecha:** 2025-10-16
