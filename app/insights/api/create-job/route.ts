import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const title: string | undefined = body?.title;

    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    const jobId = await convex.mutation(api.insightReports.createInsightReport, {
      userId,
      originalPrompt: title || "Document analysis",
      analysisPrompt: undefined,
      status: "pending",
      results: [],
      insightReport: undefined,
      error: undefined,
      createdAt: Date.now(),
      completedAt: undefined,
      archived: false,
    });

    // optional log
    try {
      await convex.mutation(api.insightReports.appendLog, { id: jobId, msg: "Job created", level: "info" });
    } catch {}

    return NextResponse.json({ _id: jobId });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}
