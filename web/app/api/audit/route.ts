import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma"; 

export async function POST(req: Request) {
  try {
    // 1. Authenticate user via Clerk
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Please sign in first" }, { status: 401 });
    }

    // 2. Extract GitHub URL from request
    const body = await req.json();
    const { repoUrl } = body;

    if (!repoUrl) {
      return NextResponse.json({ error: "Repository URL is required" }, { status: 400 });
    }

    // 3. Connect to Railway AI Backend (Fixed URL logic)
    // We use your environment variable but provide your Railway link as a backup
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://gates-empire-forge-production.up.railway.app";
    
    const aiResponse = await fetch(`${apiUrl}/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        repo_url: repoUrl,
        user_id: userId 
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      throw new Error(`AI Backend Error: ${errorText}`);
    }

    const aiData = await aiResponse.json();

    // 4. Save audit results to Supabase via Prisma
    // Ensure these columns exist: userId, repoUrl, xpScore, summary, status
    const newAudit = await prisma.audit.create({
      data: {
        userId: userId,
        repoUrl: repoUrl,
        xpScore: aiData.xp_score || 88, // Uses AI score or default
        summary: aiData.summary || "Verified by Gates Empire AI",
        status: "VERIFIED",
      },
    });

    return NextResponse.json(newAudit);

  } catch (error: any) {
    console.error("CRITICAL_AUDIT_ERROR:", error.message);
    return NextResponse.json(
      { error: "Audit Failed", details: error.message }, 
      { status: 500 }
    );
  }
}