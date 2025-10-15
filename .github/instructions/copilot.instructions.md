# RANKORA AI Copilot Guide

## Big Picture
- SaaS combines Next.js 15 App Router (React 19, Tailwind v4, shadcn/ui) with Convex for realtime/storage and Clerk for auth + billing gates.
- SEO workflow: user triggers `actions/startScraping.ts` → Bright Data Perplexity dataset calls webhook (`convex/http.ts`) → Convex stores raw results and schedules `internal.analysis.runAnalysis` to synthesize reports via OpenAI → dashboard pages read via `convex/react` hooks.
- Business insights module (`app/insights/**`) runs a longer pipeline mixing Firecrawl, Perplexity, xAI Grok, and optional lead generation; results persist in `insightReports` Convex table with file-storage fallbacks for large payloads.
- Realtime chat (`app/api/chat/route.ts`) streams GPT-4o responses seeded with Convex lookup by BrightData snapshot ID or insight report ID, so keep schemas consistent to avoid runtime prompt errors.

## Dev Workflow
- Install deps with `pnpm install`; run web app using `pnpm dev` (Turbopack) and Convex locally via `npx convex dev` so background schedulers, storage, and `ctx.scheduler` jobs are available.
- Env keys live in `.env.local`; minimum set: Clerk (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`), Convex (`NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_CONVEX_SITE_URL`), Bright Data (`BRIGHTDATA_API_KEY`), OpenAI (`OPENAI_API_KEY`). Insights flows optionally need X.ai, Perplexity, Firecrawl, and Bright Data tokens referenced in `lib/*` services.
- Use Convex CLI (`npx convex deploy`, `npx convex dev`) instead of manual HTTP when altering functions; schema changes belong in `convex/schema.ts` with matching indexes.
- Lint with `pnpm lint`. No automated tests; rely on manual flows (create report, verify webhook, chat).

## Data Pipelines
- Bright Data webhook expects `jobId` query param; any change in webhook path must update `ApiPath` enum and `actions/startScraping.ts` URL builder.
- `seoReportSchema` in `lib/seo-schema.ts` validates both writes (`internal.scrapingJobs.saveSeoReport`) and reads (`getJobById`); schema changes must propagate to prompts (`prompts/gpt.ts`) and UI components under `app/dashboard/report/[id]/summary/ui`.
- Insight reports rely on `BusinessInsightSchemaV2` and adapters (`lib/insights-adapter.ts`) to map premium AI output to legacy UI shape before storing; the pipeline patches Convex records multiple times, so prefer `api.insightReports.patchInsightReport` helpers over manual storage edits.
- Large insight payloads (>500 KB) auto-move to Convex file storage via `insightReports.saveInsightReport`; fetch full content with `api.insightReports.getInsightFileContent` instead of assuming `insightReport` contains everything.

## Patterns & Conventions
- Server actions instantiate `ConvexHttpClient` using `NEXT_PUBLIC_CONVEX_URL`; reuse that pattern when adding actions to avoid duplicated auth plumbing.
- When adding Convex functions, always provide argument/return validators (`v.*`) and leverage `internal` vs public APIs consistently; internal mutations live beside public ones (`convex/scrapingJobs.ts`).
- UI components expect graceful fallback states (`job === undefined/null`) and rely on helper utilities (`lib/status-utils.ts`), so keep loading/error branches intact when extending views.
- Prompts live in `prompts/*.ts`; update both system and user prompt builders when adjusting schemas to maintain AI compliance and avoid validation failures.

## Integration Notes
- Bright Data dataset id `gd_m7dhdot1vw9a7gc1n` is hardcoded; change centrally in `actions/startScraping.ts` if dataset swaps.
- Insight API hits external services with long-running Node actions (`runtime = "nodejs"`, `maxDuration = 300`); keep heavy logic in Node edge (`app/insights/api/**`) rather than edge runtime routes.
- PDF generation and downloads use `lib/pdf/renderInsightReport.ts` and buttons like `components/DownloadInsightButton.tsx`; ensure new report fields are rendered there for parity with UI.
- Chat tool uses OpenAI web search tool binding; if adding new report types, extend the ID resolution logic before streaming so system prompts stay accurate.

## Key References
- Convex tables & indexes: `convex/schema.ts`.
- SEO flow entry points: `actions/startScraping.ts`, `convex/http.ts`, `convex/analysis.ts`.
- Insight flow: `app/insights/api/generate/route.ts`, `convex/insightAnalysis.ts`, `convex/insightReports.ts`.
- Report presentation: `app/dashboard/report/[id]/page.tsx` and `app/dashboard/report/[id]/summary/ui/*`.
- Shared schemas/utilities: `lib/seo-schema.ts`, `lib/insights-schema-v2.ts`, `lib/status-utils.ts`.
