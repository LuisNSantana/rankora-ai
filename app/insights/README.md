# Rankora AI – Business Insights Module

## Estructura

- `/app/insights/api/generate/route.ts`: API para generar insights (mock, adaptable a cualquier vertical).
- `/app/insights/page.tsx`: Página principal de insights, frontend adaptable y profesional.
- `/lib/insights-schema.ts`: Esquema de datos flexible y validado con Zod para cualquier tipo de insight.

## Pipeline

1. El usuario selecciona el tipo de insight (ventas, marketing, producto, etc.).
2. El backend ingesta datos (scraping/API/mock), normaliza y analiza con AI.
3. Se generan insights estructurados: resumen, métricas, recomendaciones, visualizaciones.
4. El frontend muestra los insights y permite exportar (próximamente PDF).

## Buenas prácticas
- Arquitectura modular y extensible.
- Validación estricta de datos.
- Código documentado y fácil de mantener.
- Listo para conectar scraping real, prompts AI y visualizaciones avanzadas.
