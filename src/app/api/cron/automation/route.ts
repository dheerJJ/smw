import { NextRequest, NextResponse } from "next/server";
import { runAutomationCycle } from "@/lib/automation/engine";
import { DEMO_CLINIC_ID } from "@/lib/db/mock-store";

export const dynamic = "force-dynamic";

/**
 * 5-Minute Automation Cron Route
 * Called by Supabase pg_cron, Vercel Cron, or external scheduler
 * Protected by CRON_SECRET header
 */
export async function GET(req: NextRequest) {
  return handleCron(req);
}

export async function POST(req: NextRequest) {
  return handleCron(req);
}

async function handleCron(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Verify secret header if configured in production
  if (cronSecret && cronSecret !== "smile_recall_cron_secret_auth_token_99") {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
    }
  }

  const startTime = Date.now();
  try {
    // Run for default demo clinic or all clinics in database
    const result = await runAutomationCycle(DEMO_CLINIC_ID);

    return NextResponse.json({
      success: true,
      clinicId: DEMO_CLINIC_ID,
      durationMs: Date.now() - startTime,
      metrics: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Cron execution failed";
    console.error("Cron Automation Execution Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
        durationMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
