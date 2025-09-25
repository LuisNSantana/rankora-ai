
<div align="center">
  <img src="/public/rankora_logo.png" alt="Rankora Logo" width="180" height="180" style="border-radius:50%;margin-bottom:24px;" />
</div>

# RANKORA AI

**The AI-Powered SEO Agent for Marketers**

---

**RANKORA** is an intelligent SEO agent designed by Huminary Labs for marketing professionals, agencies, and anyone looking to boost their clients' search engine performance. Built with Next.js, Convex, Clerk, and OpenAI, Rankora delivers actionable, data-driven SEO insights and beautiful reports—instantly.

---

## What is Rankora?

Rankora is your AI-powered assistant for SEO analysis and reporting. It leverages state-of-the-art AI models to:
- Analyze websites, businesses, products, and more
- Generate comprehensive, easy-to-understand SEO reports
- Provide actionable recommendations for improving search rankings
- Enable interactive AI chat for deeper insights and strategy

**Designed by [Huminary Labs](https://huminarylabs.com)**, Rankora is built for marketers who want to:
- Save time on manual SEO audits
- Deliver professional, evidence-based reports to clients
- Stay ahead with the latest AI-driven marketing tools

---

### Key Features

• AI-powered SEO analysis and reporting
• Interactive AI chat assistant (Rankora AI Assistant)
• Evidence-based recommendations
• Beautiful, modern UI
• Built for agencies, freelancers, and in-house teams

---

### Quick Start

1. Clone this repo and install dependencies
2. Set up Clerk, Bright Data, Convex, and OpenAI accounts
3. Configure your environment variables
4. Start the app and generate your first SEO report!

---

### About Huminary Labs

Huminary Labs creates next-generation AI tools for marketing, automation, and business growth. Learn more at [huminarylabs.com](https://huminarylabs.com).

---

#
# (Original content below)
#
# RANKORA AI - AI-Powered SEO Analysis & Reports
### AI & Data Processing

- **Smart Analysis Engine** using advanced AI algorithms for comprehensive SEO insights
- **Structured AI Analysis** with Zod schema validation
- **Background Processing** with Convex schedulers for long-running tasks
- **Smart Retry Logic** for failed analyses without re-processing data
- **Evidence-Based Reports** with source attribution and quotesrehensive SEO analysis platform that generates beautiful, data-driven reports powered by advanced AI. Built with Next.js 15, Clerk authentication, Convex backend, and AI-driven analysis.



### 1) Set up Clerk

Create a Clerk account at [Clerk](https://go.clerk.com/PcP73s8)

### 2) Set up Bright Data (**$20 Free Credit**)

Create a Bright Data account at [Bright Data](https://brdta.com/papafam) for Scraping

### 3) Set up Convex

Create a Convex account at [Convex](https://convex.dev)

### 4) Set up OpenAI

Create an OpenAI account at [OpenAI](https://openai.com) for AI analysis

## Features

### For Users

- **Instant SEO Reports**: Generate comprehensive SEO analysis in seconds using advanced AI
- **Entity Analysis**: Analyze businesses, people, products, courses, or websites
- **AI Chat Integration**: Chat with your reports using AI for deeper insights (Pro plan)
- **Comprehensive Data**: Source inventory, competitor analysis, keyword research, backlink analysis
- **Real-time Progress**: Track report generation with live status updates
- **Beautiful Dashboard**: Modern, responsive UI with detailed visualizations

### Technical Features

- **Next.js 15 (App Router)** with React 19 and Turbopack
- **Clerk** for authentication and user management with **Clerk Billing** for subscription management (Stripe-powered) and feature gating between Starter/Pro plans
- **Convex** for serverless backend, real-time data, and job management
- **AI-Powered Analysis** with advanced algorithms for comprehensive SEO insights
- **OpenAI GPT-4o** for AI-powered analysis and structured report generation
- **TypeScript** end-to-end with Zod validation
- **shadcn/ui + Radix UI + Tailwind v4** for modern, accessible components

### AI & Data Processing

- **Smart Web Scraping** using Bright Data's Perplexity integration
- **Structured AI Analysis** with Zod schema validation
- **Background Processing** with Convex schedulers for long-running tasks
- **Smart Retry Logic** for failed analyses without re-scraping
- **Evidence-Based Reports** with source attribution and quotes

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm/yarn
- Accounts: Clerk, Convex, Bright Data, OpenAI

### 1) Clone & Install

```bash
pnpm install
# or
npm install
```

### 2) Environment Variables

Create a `.env.local` file in the project root with the following:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Convex Backend
NEXT_PUBLIC_CONVEX_URL=your_convex_deployment_url
NEXT_PUBLIC_CONVEX_SITE_URL=your_site_url_for_webhooks

# Bright Data SERP Scraping
BRIGHTDATA_API_KEY=your_brightdata_api_key

# OpenAI for AI Analysis
OPENAI_API_KEY=your_openai_api_key
```

Notes:

- `NEXT_PUBLIC_CONVEX_URL` is required by `ConvexHttpClient` for database operations
- `NEXT_PUBLIC_CONVEX_SITE_URL` is used for webhook endpoints from Bright Data
- `BRIGHTDATA_API_KEY` enables scraping via Bright Data's API's
- `OPENAI_API_KEY` powers the AI analysis and chat features

### 3) Configure Clerk

1. Create a new application at [Clerk](https://go.clerk.com/PcP73s8)
2. Enable Email and Google as providers (optional)
3. Copy the Publishable Key and Secret Key into `.env.local`
4. For Convex auth: set up a JWT Template named `convex` (or update `convex/auth.config.ts`)
5. Set up Clerk Billing with Stripe integration for subscription management
6. Configure Starter and Pro plan pricing with feature gating for AI chat
7. In production, configure authorized redirect/callback URLs in Clerk

### 4) Configure Bright Data

1. Create a Bright Data account at [Bright Data](https://brdta.com/papafam) (**$20 Free Credit**)
2. Access the SERP Perplexity Scraper dataset (dataset_id: `gd_m7dhdot1vw9a7gc1n`)
3. Copy your API key and add to `.env.local` as `BRIGHTDATA_API_KEY`
4. Ensure webhook endpoints are properly configured for your domain

### 5) Configure Convex

1. Create a Convex project
2. In project settings, copy the Deployment URL and set `NEXT_PUBLIC_CONVEX_URL`
3. Push the schema and functions:

```bash
npx convex dev
# this runs a local dev deployment and watches for changes
```

The app includes these Convex functions:

- **scrapingJobs.ts**: Job management, status tracking, and data storage
- **analysis.ts**: AI-powered report generation using OpenAI
- **http.ts**: Webhook endpoint for Bright Data scraping results
- **auth.config.ts**: Clerk JWT integration for user authentication

### 6) Configure OpenAI

1. Create an OpenAI account
2. Generate an API key
3. Add to `.env.local` as `OPENAI_API_KEY`
4. Ensure you have access to GPT-4o model for best results

### 7) Run the App

Development mode runs both Next.js and Convex:

```bash
pnpm dev
# or
npm run dev
```

- Next.js dev server: `http://localhost:3000`
- Convex dev server runs concurrently and watches for changes

## Project Structure

- `app/` — App Router pages and layouts
  - `page.tsx` — Marketing homepage with features and pricing
  - `dashboard/` — Protected dashboard area
    - `page.tsx` — Main dashboard with report creation and management
    - `report/[id]/` — Individual report pages
      - `page.tsx` — Report status and loading states
      - `summary/` — Detailed report analysis
        - `page.tsx` — Main summary page with all components
        - `ui/` — Report visualization components
  - `api/chat/` — AI chat API endpoint
- `components/` — UI components, chat interface, and providers
  - `ConvexProviderWithClerk.tsx` — Convex + Clerk integration
  - `AIChat.tsx` — Chat interface for Pro users
  - `ReportsTable.tsx` — Dashboard reports listing
  - `ui/` — Reusable UI components
- `convex/` — Convex backend functions and schema
  - `schema.ts` — Database schema for scraping jobs
  - `scrapingJobs.ts` — Job management functions
  - `analysis.ts` — AI analysis workflows
  - `http.ts` — Webhook handlers for Bright Data (includes /api/webhook POST endpoint)
  - `auth.config.ts` — Clerk authentication configuration
- `actions/` — Server actions for form handling
  - `startScraping.ts` — Initiate scraping jobs
  - `retryAnalysis.ts` — Smart retry logic
- `prompts/` — AI prompt engineering
  - `perplexity.ts` — Scraping prompts for Bright Data
  - `gpt.ts` — Analysis prompts for OpenAI
- `lib/` — Utilities, schemas, and helpers
  - `seo-schema.ts` — Zod validation schemas for reports
  - `seo-utils.ts` — SEO analysis utilities
- `middleware.ts` — Protects dashboard routes with Clerk

## How It Works

### Data Flow

1. **User Input**: User enters entity name and selects country on dashboard
2. **Job Creation**: `startScraping` action creates job record in Convex
3. **AI Analysis**: Advanced AI algorithms process and analyze SEO data
4. **Report Generation**: Comprehensive SEO report with insights and recommendations
5. **AI Chat**: Pro users can chat with reports using contextual AI for deeper analysis

### Authentication & Authorization

- **Auth (Clerk)**: `middleware.ts` protects `/dashboard(.*)` routes
- **Billing (Clerk + Stripe)**: Handles subscription management with Starter/Pro tiers
- **Feature Gating**: AI chat and advanced features restricted to Pro plan subscribers

### Background Processing

- **Async Jobs**: Long-running analysis tasks use Convex schedulers
- **Smart Retry**: Failed analyses can retry without re-scraping data
- **Real-time Updates**: Dashboard shows live job status updates

### AI Features

- **Structured Analysis**: Uses Zod schemas for consistent report format
- **Evidence-Based**: All insights backed by source quotes and URLs
- **Contextual Chat**: AI assistant understands full report context
- **Web Search Integration**: Chat can perform additional web searches

## Common Issues

- **Missing Environment Variables**: Check all required env vars are set in `.env.local`
- **Clerk JWT Setup**: Ensure JWT template named `convex` exists in Clerk
- **Webhooks**: Verify webhook URLs are accessible using a tool such as Postman
- **OpenAI Rate Limits**: Monitor API usage and upgrade plan if needed
- **Convex Schema**: Run `npx convex dev` to sync schema changes
- **Bright Data Credits**: Ensure sufficient Bright Data credits or test credits are available

## Tech Stack Deep Dive

### Frontend

- **Next.js 15** with App Router and React 19
- **Tailwind CSS** for styling
- **shadcn/ui** for beautiful, customizable UI components
- **Radix UI** for accessible primitives
- **Lucide React** for icons
- **React Markdown** for chat message rendering

### Backend

- **Convex** for serverless functions and real-time data
- **Clerk** for authentication and user management
- **Zod** for runtime type validation

### AI & Data

- **OpenAI GPT** for analysis and chat
- **Bright Data** for web scraping
- **Vercel AI SDK** for type-safe AI completions and real-time streaming chat responses



## 📄 License & Commercial Use

This project is a derivative work based on an open-source template originally created by Sonny Sangha (PapaReact). It has been significantly modified, rebranded, and extended by Huminary Labs for the RANKORA AI SaaS platform.

### Licensing & Attribution

- **Commercial Use**: This version is intended for commercial use as the official RANKORA AI SaaS by Huminary Labs.
- **Attribution**: Original template and tutorial by Sonny Sangha (PapaReact). This project is not affiliated with or endorsed by the original author.
- **No Resale of Template**: You may not resell or redistribute the original template as your own.
- **Derivative Work**: All new features, branding, and business logic are the property of Huminary Labs.

For questions about licensing or partnership, contact [Huminary Labs](https://huminarylabs.com).

---

## Support

For support, email information@huminarylabs.com

Built with ❤️ by Huminary Labs
