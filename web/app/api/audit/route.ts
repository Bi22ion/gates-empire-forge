// 1. Force the correct runtime for Prisma compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma"; 

export async function POST(req: Request) {
  console.log("--- API INVOCATION STARTING ---");
  try {
    // 2. Auth Check
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      console.error("CRITICAL: No Auth Session Found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 3. Robust Body Parsing
    let repoUrl;
    try {
      const body = await req.json();
      repoUrl = body.repoUrl || body.repo_url;
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
    }

    if (!repoUrl) {
      return NextResponse.json({ error: "Repository URL is missing" }, { status: 400 });
    }

    // 4. Sync User to Supabase (Port 5432 via DIRECT_URL)
    // This is the most common failure point - wrapped in try/catch
    try {
      await prisma.user.upsert({
        where: { id: userId },
        update: { username: user.username || user.firstName || "Explorer" },
        create: {
          id: userId,
          username: user.username || user.firstName || "Explorer",
          email: user.emailAddresses[0].emailAddress,
        },
      });
      console.log("User sync successful");
    } catch (dbError: any) {
      console.error("DATABASE_SYNC_ERROR:", dbError.message);
      // We continue to see if we can still hit the AI backend
    }

    // 5. Call AI Backend on Railway
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://gates-empire-forge-production.up.railway.app";
    const aiResponse = await fetch(`${apiUrl}/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo_url: repoUrl, user_id: userId }),
    });

    if (!aiResponse.ok) {
      throw new Error(`Railway AI responded with status ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();

    // 6. Final Audit Record Creation
    const newAudit = await prisma.audit.create({
      data: {
        userId: userId,
        repoUrl: repoUrl,
        xpScore: aiData?.xp_score ?? 85,
        summary: aiData?.summary ?? "Verification complete",
        status: "VERIFIED",
      },
    });

    return NextResponse.json(newAudit);

  } catch (error: any) {
    console.error("FINAL_CRASH_LOG:", error.message);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message }, 
      { status: 500 }
    );
  }
}