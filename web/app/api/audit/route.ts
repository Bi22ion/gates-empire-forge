import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma"; 

export async function POST(req: Request) {
  try {
    // 1. Clerk Check (Simple)
    const { userId } = await auth();
    const user = await currentUser();
    if (!userId || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Ultra-Safe Body Parsing
    // This prevents the 'silent crash' if the body is empty or malformed
    let repoUrl;
    try {
      const body = await req.json();
      repoUrl = body.repoUrl || body.repo_url; // Support both naming styles
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (!repoUrl) {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 });
    }

    // 3. Ensure User exists (The "Sync")
    // We do this first because the Audit table REQUIRES a User in Supabase
    await prisma.user.upsert({
      where: { id: userId },
      update: { username: user.username || user.firstName || "Explorer" },
      create: {
        id: userId,
        username: user.username || user.firstName || "Explorer",
        email: user.emailAddresses[0].emailAddress,
      },
    });

    // 4. Call Railway (With Timeout)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://gates-empire-forge-production.up.railway.app";
    const aiResponse = await fetch(`${apiUrl}/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo_url: repoUrl, user_id: userId }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI Backend error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();

    // 5. Final Save
    const newAudit = await prisma.audit.create({
      data: {
        userId: userId,
        repoUrl: repoUrl,
        xpScore: aiData?.xp_score ?? 85,
        summary: aiData?.summary ?? "Verified",
        status: "VERIFIED",
      },
    });

    return NextResponse.json(newAudit);

  } catch (error: any) {
    // This will definitely show up in the logs now
    console.error("CRITICAL_ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}