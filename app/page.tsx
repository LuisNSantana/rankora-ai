"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SignInButton } from "@clerk/nextjs";
import { Authenticated, Unauthenticated } from "convex/react";
import {
  ArrowRight,
  BarChart3,
  CheckCircle,
  FileText,
  MessageSquare,
  Search,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import Link from "next/link";

const heroHighlights = [
  "Fresh SERP snapshots by market & device",
  "Actionable summary in under ten minutes",
  "Client-ready exports with traceable evidence",
];

const featureHighlights = [
  {
    title: "Live market capture",
    description:
      "We rely on Bright Data to collect the exact SERPs and landing pages your clients are seeing right now.",
    icon: Search,
    points: [
      "Fine-grained targeting by country, language, and device",
      "Automatic detection of the competitors that actually rank",
      "Historic runs to benchmark momentum over time",
    ],
  },
  {
    title: "AI-assisted reasoning",
    description:
      "Our models surface gaps, quantify opportunity, and attach source links so you can defend every recommendation.",
    icon: Sparkles,
    points: [
      "Audit-ready summaries with citations back to the crawl",
      "Hypotheses prioritized by estimated impact and effort",
      "Conversational follow-up directly on the collected data",
    ],
  },
  {
    title: "Delivery, done for you",
    description:
      "Export polished decks, share interactive dashboards, and loop your team into the same dataset.",
    icon: FileText,
    points: [
      "PDF exports featuring your own branding palette",
      "Live dashboard with filters and annotations",
      "Shared workspace to capture feedback and next steps",
    ],
  },
];

const workflowSteps = [
  {
    title: "Frame your objective",
    description:
      "Drop in a domain, choose the regions that matter, and flag the questions you need to answer.",
    icon: MessageSquare,
  },
  {
    title: "Collect & interpret",
    description:
      "We crawl clean SERPs, organize competitors, and translate the noise into an executive-ready storyline.",
    icon: BarChart3,
  },
  {
    title: "Deliver with confidence",
    description:
      "Share the report, invite collaborators, and iterate in a chat that knows the data better than anyone.",
    icon: CheckCircle,
  },
];

const deliverables = [
  "Keyword opportunity map segmented by intent and difficulty.",
  "Competitor teardown with concrete strengths and blind spots.",
  "Technical checklist ordered by urgency and potential uplift.",
  "Content ideas backed by real examples instead of guesses.",
  "AI copilot to query the report in natural language.",
];

const plans = [
  {
    name: "One-off exploration",
    price: "$19",
    cadence: "per audit",
    description:
      "Best for validating a pitch, sanity-checking a hypothesis, or gaining a quick read on an unfamiliar market.",
    features: [
      "1 domain • 1 market • complete data export",
      "Shareable dashboard + PDF deliverable",
      "Email support for seven days after delivery",
    ],
  },
  {
    name: "Ongoing intelligence",
    price: "$49",
    cadence: "per month",
    description:
      "Built for agencies and in-house teams that want month-over-month momentum, context, and collaboration.",
    features: [
      "Track up to 5 domains across unlimited markets",
      "Historical comparisons and automated change logs",
      "AI chat trained on every report you run",
      "Priority support with same-day responses",
    ],
  },
];

const stack = [
  "Bright Data live SERP crawling",
  "Convex as our transactional core",
  "OpenAI for reasoning & summarization",
  "Clerk to manage authentication securely",
  "Next.js 15 deployed with Vercel edge network",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F7FAFF] via-[#F1F4FB] to-[#E8EDF6] dark:from-[#050915] dark:via-[#0B1223] dark:to-[#101A30]">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(37,99,235,0.15)_0%,_transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.3)_0%,_transparent_65%)]" />
        <div className="relative mx-auto flex min-h-[80vh] max-w-6xl flex-col items-center px-4 pb-24 pt-28 text-center sm:px-6 lg:px-8">

          <Badge className="mb-6 border border-blue-200/70 bg-white/80 text-blue-700 dark:border-blue-900/50 dark:bg-white/10 dark:text-blue-200 backdrop-blur">
            <Sparkles className="mr-1 h-3 w-3 text-yellow-400" />
            Smarter SEO, made simple for everyone
          </Badge>

          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-6xl lg:text-[4.2rem] dark:text-white">
            Get clear answers, not just data
          </h1>

          <p className="mt-6 max-w-3xl text-lg text-slate-600 dark:text-slate-300 sm:text-xl">
            Rankora AI turns live search results into easy-to-understand insights and action plans. No jargon, no guesswork—just real recommendations you can trust, backed by real data.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {heroHighlights.map((label) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
              >
                <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                {label}
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Unauthenticated>
              <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                <Button
                  size="lg"
                  className="group flex items-center rounded-full bg-gradient-to-r from-blue-600 to-blue-500 px-9 py-6 text-base font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:brightness-105"
                >
                  <Search className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                  Launch my first audit
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </SignInButton>
            </Unauthenticated>

            <Authenticated>
              <Link href="/dashboard">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full border-slate-200 bg-white px-8 py-6 text-base font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-900"
                >
                  Open my dashboard
                </Button>
              </Link>
            </Authenticated>

            <Link
              href="/test-seo"
              className="text-sm font-medium text-slate-600 underline-offset-4 hover:underline dark:text-slate-300"
            >
              Peek at a sample report
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="relative py-20 sm:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/30 dark:from-blue-900/20 dark:via-transparent dark:to-purple-900/10" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <Badge className="mb-4 border border-blue-200/60 bg-white/80 text-blue-700 dark:border-blue-900/40 dark:bg-white/10 dark:text-blue-200 backdrop-blur">
              Why choose Rankora?
            </Badge>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Every insight is backed by real evidence
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
              We make it easy to show where your opportunities come from, so you can explain your next steps with confidence.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {featureHighlights.map(({ title, description, icon: Icon, points }) => (
              <Card
                key={title}
                className="relative overflow-hidden border border-slate-200/70 bg-white/90 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800/60 dark:bg-slate-900/60"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/10" />
                <CardHeader className="relative space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">{title}</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-300">
                    {description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative space-y-3">
                  {points.map((point) => (
                    <div key={point} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <CheckCircle className="mt-0.5 h-4 w-4 text-blue-500 dark:text-blue-300" />
                      <span>{point}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="relative py-20 sm:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/70 via-white to-slate-100/60 dark:from-slate-900/20 dark:via-slate-950 dark:to-slate-900/30" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <Badge className="mb-4 border border-slate-200/60 bg-white/80 text-slate-700 dark:border-slate-700 dark:bg-white/10 dark:text-slate-200 backdrop-blur">
              How it works
            </Badge>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Go from question to action in three simple steps
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {workflowSteps.map(({ title, description, icon: Icon }) => (
              <Card
                key={title}
                className="border border-slate-200/80 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/60"
              >
                <CardHeader className="space-y-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900/5 text-slate-900 dark:bg-slate-700/40 dark:text-slate-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">{title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-600 dark:text-slate-300">
                  {description}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Deliverables */}
      <section className="relative py-20 sm:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/25 via-transparent to-purple-50/25 dark:from-blue-900/10 dark:via-transparent dark:to-purple-900/15" />
        <div className="relative mx-auto flex max-w-5xl flex-col gap-12 px-4 sm:px-6 lg:px-8 lg:flex-row lg:items-center">
          <div className="flex-1 space-y-4">
            <Badge className="border border-blue-200/60 bg-white/80 text-blue-700 dark:border-blue-900/40 dark:bg-white/10 dark:text-blue-200 backdrop-blur">
              What you get
            </Badge>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Clear, shareable results every time
            </h2>
            <p className="text-slate-600 dark:text-slate-300">
              Every report includes easy-to-follow insights and a direct link to the data behind each recommendation. Show your team or clients exactly why each step matters.
            </p>
            <div className="space-y-3">
              {deliverables.map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <CheckCircle className="mt-1 h-4 w-4 text-blue-600 dark:text-blue-300" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <Card className="flex-1 border border-slate-200/70 bg-white/90 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60">
            <CardHeader>
              <CardTitle className="text-lg">Explore the sample report</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-300">
                Walk through the exact format and depth your clients will receive.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link
                href="/test-seo"
                className="flex items-center gap-2 text-sm font-medium text-blue-600 underline-offset-4 hover:underline dark:text-blue-300"
              >
                View the interactive example
                <ArrowRight className="h-4 w-4" />
              </Link>
              <div className="rounded-lg border border-dashed border-slate-200 p-4 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                <p className="font-semibold text-slate-700 dark:text-slate-200">
                  Tip
                </p>
                <p>
                  The sample includes anonymized data collected by Rankora. Feel free to
                  share it internally to speed up approvals.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing */}
      <section className="relative py-20 sm:py-24">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50/70 via-blue-50/40 to-slate-50/60 dark:from-[#0E131B] dark:via-[#141A24] dark:to-[#0E131B]" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <Badge className="mb-4 border border-blue-200/60 bg-white/80 text-blue-700 dark:border-blue-900/40 dark:bg-white/10 dark:text-blue-200 backdrop-blur">
              Pricing
            </Badge>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Simple, honest pricing
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-300">
              Try one audit or subscribe for ongoing insights—no contracts, no hidden fees. You’re always in control.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {plans.map(({ name, price, cadence, description, features }) => (
              <Card
                key={name}
                className="flex h-full flex-col border border-slate-200/70 bg-white/92 shadow-sm shadow-slate-200/40 dark:border-slate-800/60 dark:bg-slate-900/70 dark:shadow-slate-900/30"
              >
                <CardHeader>
                  <Badge className="w-fit border border-slate-200/80 bg-white/70 text-slate-700 dark:border-slate-700 dark:bg-white/10 dark:text-slate-200">
                    {name}
                  </Badge>
                  <div className="mt-6 flex items-baseline gap-2">
                    <span className="text-4xl font-semibold text-slate-900 dark:text-white">
                      {price}
                    </span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {cadence}
                    </span>
                  </div>
                  <CardDescription className="mt-4 text-slate-600 dark:text-slate-300">
                    {description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto space-y-3 text-sm text-slate-600 dark:text-slate-300">
                  {features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-4 w-4 text-blue-600 dark:text-blue-300" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600 dark:text-green-300" />
              Cancel anytime—keep every report you already generated.
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500 dark:text-yellow-300" />
              Scale plans directly from your dashboard in a few clicks.
            </div>
          </div>
        </div>
      </section>

      {/* Stack */}
      <section className="relative py-20 sm:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50/20 via-blue-50/20 to-purple-50/20 dark:from-green-900/10 dark:via-blue-900/10 dark:to-purple-900/15" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-4 border border-slate-200/60 bg-white/80 text-slate-700 dark:border-slate-700 dark:bg-white/10 dark:text-slate-200 backdrop-blur">
              Technology
            </Badge>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Powered by trusted technology
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-300">
              We use industry-leading tools to keep your data safe and your experience smooth.
            </p>
          </div>

          <div className="mt-10 grid gap-3 rounded-2xl border border-slate-200/80 bg-white/92 p-6 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/70 sm:grid-cols-2">
            {stack.map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden py-20 sm:py-24">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/85 to-indigo-500/80 blur-[1px] dark:from-blue-700/90 dark:to-indigo-600/85" />
        <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-8 px-4 text-center text-white sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Start making smarter marketing decisions today
          </h2>
          <p className="max-w-2xl text-base sm:text-lg text-blue-50/90">
            Run your first audit in minutes. Share clear, actionable results with your team or clients—no technical skills needed.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Unauthenticated>
              <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                <Button
                  size="lg"
                  className="group flex items-center rounded-full bg-white px-8 py-6 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                >
                  Start for free
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </SignInButton>
            </Unauthenticated>
            <Authenticated>
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="rounded-full border border-white/40 bg-white/10 px-8 py-6 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  Continue to dashboard
                </Button>
              </Link>
            </Authenticated>
            <Link
              href="/pricing"
              className="text-sm font-medium text-blue-100 underline-offset-4 hover:underline"
            >
              Review pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
