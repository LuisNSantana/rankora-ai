# Rankora AI – Copilot Instructions

**RANKORA** is an AI-powered SEO and business intelligence analysis platform. It combines web scraping, LLM analysis, and beautiful report generation for marketers, agencies, and businesses.

## Architecture Overview

### Core Stack
- **Frontend**: Next.js 15 (App Router) + React 19 + Turbopack + Tailwind CSS
- **Backend**: Convex (real-time database, serverless functions, webhooks)
- **Auth**: Clerk (user management + Stripe-powered billing with Starter/Pro tiers)
- **AI/LLM**: Grok (xai/4-fast, 2M context), OpenAI (gpt-4o/4o-mini), Perplexity (research)
- **Data Extraction**: Firecrawl (structured web scraping with LLM extraction), Bright Data (scraping)

### Data Flow
1. **User Input** → Dashboard form (entity name, country, insight type)
2. **Job Creation** → Convex mutation creates job record (pending → running)
3. **Data Ingestion** → Firecrawl + Bright Data scrape websites into structured JSON
4. **AI Analysis** → Multi-model pipeline with progressive schema fallback (grok → gpt-4o → gpt-4o-mini)
5. **Report Generation** → Zod-validated insight with metrics, recommendations, visualizations
6. **Storage** → For reports <500KB: direct DB; >=500KB: Convex File Storage with references
7. **Webhooks** → Bright Data → `convex/http.ts` endpoints update job status

## Key Patterns & Conventions

### Schema Validation (Zod)
**All AI outputs use Zod schemas** to ensure type safety and catch incomplete LLM responses. Never skip validation:

```typescript
// Example from lib/insights-schema.ts
const BusinessInsightSchema = z.object({
  summary: z.string(),
  metrics: z.array(InsightMetric),
  recommendations: z.array(InsightRecommendation),
  visualizations: z.array(InsightVisualization).optional(),
  sources: z.array(z.string()),
  // ... more fields
});

// In API route:
const parsed = BusinessInsightSchema.safeParse(insight);
if (!parsed.success) {
  console.error("Schema validation failed:", parsed.error.issues);
  // Update Convex with error, don't return incomplete data
}
```

### Progressive Schema Fallback
When LLM generation is uncertain, use **minimal → standard → premium schema progression**:

- `minimal`: Essential fields (summary, metrics, recommendations, sources)
- `standard`: Adds summary_points, visualizations, metadata
- `premium`: Full schema with financial analysis, roadmap, advanced visualizations

See `app/insights/api/generate/route.ts` lines 446-520 for implementation.

### Server Actions vs. API Routes
- **Server Actions** (`actions/`): Form submissions, job creation, auth-dependent mutations
  - Use `"use server"` directive
  - Automatically serialize Clerk auth via `auth()` from `@clerk/nextjs/server`
  - Example: `actions/startScraping.ts` creates Convex job and calls Bright Data API
  
- **API Routes** (`app/*/api/`): Webhooks, streaming, complex logic
  - Handle webhook callbacks from Bright Data/Firecrawl
  - Example: `convex/http.ts` processes scraping results, validates schemas, updates job status

### Convex Patterns
- **New function syntax** (always use this):
  ```typescript
  export const myQuery = query({
    args: { id: v.id("jobs") },
    returns: v.null(),
    handler: async (ctx, args) => { /* ... */ }
  });
  ```
- **HTTP Endpoints** in `convex/http.ts`: Use `httpAction` decorator with `httpRouter()`
- **Validators**: Always validate args with `v.*` from `convex/values`
- **Indexes**: Define for `status`, `userId`, `createdAt` to avoid expensive scans

### Insight Report Storage
Two-tier strategy:
- Small reports (<500KB): Store directly in `insightReport` field
- Large reports (>=500KB): Store via Convex File Storage, reference with `insightFileId`
- Track `reportSize` in bytes for monitoring

See `convex/schema.ts` insightReports table for implementation.

### LLM Model Ordering
Priority: **Grok-4-fast** (primary, 2M context) → **gpt-4o** (fallback 1, highest quality) → **gpt-4o-mini** (fallback 2, cost optimized)

Example from `app/insights/api/generate/route.ts`:
```typescript
const modelCandidates = [
  { provider: "xai", model: GROK_MODELS.PRIMARY, label: "grok-4-fast-reasoning" },
  { provider: "openai", model: "gpt-4o-mini", label: "gpt-4o-mini" },
  { provider: "openai", model: "gpt-4o", label: "gpt-4o" }
];
```

### Firecrawl Schema Usage
Structured extraction schemas in `lib/firecrawl-schemas.ts` for:
- `competitorAnalysisSchema`: Pricing, features, market positioning
- `marketAnalysisSchema`: Market size, trends, regulatory context
- `industryResearchSchema`: Key players, trends, disruptions
- `pricingAnalysisSchema`: Pricing models, value props
- `websiteAuditSchema`: SEO, content, UX analysis

Always use appropriate schema for the extraction use case.

## Critical Workflows

### Adding an Insight Type
1. Create Zod schema in `lib/insights-schema-v2.ts` or extend `BusinessInsightSchema`
2. Add extraction schema in `lib/firecrawl-schemas.ts` if web scraping is needed
3. Create prompt builder in `prompts/insight.ts`
4. Add schema to progressive fallback list in `app/insights/api/generate/route.ts`
5. Test with mock data in `scripts/test-firecrawl.ts` pattern

### Debugging LLM Responses
Enable detailed logging (already in place):
```typescript
console.log(`[Insight Job ${jobId}] Phase ${phase.label} with ${candidate.label}`);
console.error(`[Insight Job ${jobId}] Schema validation failed:`, parsed.error?.issues);
```

Check Convex dashboard logs and `insightReports` table's `logs` array field for step-by-step execution.

### Handling Failed Jobs
- Use smart retry for analysis-only re-runs (preserve scraping data)
- Full retry creates new job from scratch
- See `actions/retryAnalysis.ts` for implementation

## Environment Variables Required
```
NEXT_PUBLIC_CONVEX_URL=
CONVEX_DEPLOYMENT=
CLERK_SECRET_KEY=
CLERK_PUBLISHABLE_KEY=
BRIGHT_DATA_API_KEY=
OPENAI_API_KEY=
FIRECRAWL_API_KEY=
PERPLEXITY_API_KEY=
XAI_API_KEY=
```

## Testing & Validation
- Unit schema tests: `lib/test-seo-analysis.ts` demonstrates pattern
- Integration: Use scripts in `scripts/` to test Firecrawl and Bright Data flows
- Convex mutations/queries: Test via Convex dashboard or local dev server

## File Organization
- `convex/` → Database schema, functions, webhooks
- `app/` → Next.js routes, API endpoints, pages
- `lib/` → Utilities: schemas (Zod), services (Firecrawl, LLM), business logic
- `prompts/` → LLM prompt engineering (system, analysis, insight generation)
- `actions/` → Server actions for form submissions
- `components/` → React UI components + UI primitives in `ui/`

## Common Gotchas
1. **Always parse AI output with Zod** – Never trust raw LLM JSON
2. **Progressive schema fallback is required** – Single schema often fails with large/small outputs
3. **Convex validators** – Functions without proper `v.*` validators will fail type checks
4. **Webhook URLs must include jobId** – Bright Data passes this to identify jobs for updates
5. **Firecrawl extraction needs appropriate schema** – Generic schema reduces accuracy
6. **File storage for large reports** – Storing >1MB in DB field will cause issues
