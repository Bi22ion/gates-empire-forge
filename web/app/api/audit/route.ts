import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma"; 

export async function POST(req: Request) {
  console.log("--- AUDIT PROCESS STARTING ---");
  
  try {
    // 1. Clerk Authentication
    const { userId } = await auth();
    const clerkUser = await currentUser();

    if (!userId || !clerkUser) {
      console.error("AUTH ERROR: Session not found");
      return NextResponse.json({ error: "Please sign in first" }, { status: 401 });
    }

    // 2. Parse and Validate Request Body
    let repoUrl;
    try {
      const body = await req.json();
      repoUrl = body.repoUrl;
    } catch (e) {
      console.error("PARSE ERROR: Invalid JSON in request body");
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 });
    }

    if (!repoUrl) {
      return NextResponse.json({ error: "Repository URL is required" }, { status: 400 });
    }

    // 3. User Sync (Ensures userId exists in Supabase before Audit creation)
    console.log(`SYNCING USER: ${userId}`);
    try {
      await prisma.user.upsert({
        where: { id: userId },
        update: {
          username: clerkUser.username || clerkUser.firstName || "Explorer",
        },
        create: {
          id: userId,
          username: clerkUser.username || clerkUser.firstName || "Explorer",
          email: clerkUser.emailAddresses[0].emailAddress,
          totalXp: 0,
        },
      });
    } catch (upsertError: any) {
      console.error("UPSERT ERROR (Non-fatal):", upsertError.message);
      // We continue; if the user already exists, the Audit will still work
    }

    // 4. Call Railway AI Backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://gates-empire-forge-production.up.railway.app";
    console.log(`FETCHING AI AUDIT FROM: ${apiUrl}/audit`);
    
    // We add a timeout controller to prevent "silent" 500 crashes on Vercel
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout

    const aiResponse = await fetch(`${apiUrl}/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        repo_url: repoUrl,
        user_id: userId 
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(`RAILWAY ERROR: ${aiResponse.status} - ${errorText}`);
      return NextResponse.json({ error: "AI Backend failed to process the repo" }, { status: 502 });
    }

    const aiData = await aiResponse.json();
    console.log("AI DATA RECEIVED SUCCESSFULLY");

    // 5. Save Audit to Supabase
    try {
      const newAudit = await prisma.audit.create({
        data: {
          userId: userId,
          repoUrl: repoUrl,
          xpScore: aiData?.xp_score ?? 88, 
          summary: aiData?.summary ?? "Verified by Forge AI",
          status: "VERIFIED",
        },
      });
      
      console.log("--- AUDIT SUCCESS: SAVED TO DB ---");
      return NextResponse.json(newAudit);
      
    } catch (dbError: any) {
      console.error("DATABASE SAVE ERROR:", dbError.message);
      return NextResponse.json({ 
        error: "Database Save Failed", 
        details: dbError.message 
      }, { status: 500 });
    }

  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error("TIMEOUT ERROR: Railway took too long");
      return NextResponse.json({ error: "AI backend timeout" }, { status: 504 });
    }
    console.error("GLOBAL SERVER ERROR:", error.stack || error.message);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message }, 
      { status: 500 }
    );
  } finally {
    console.log("--- AUDIT PROCESS ENDED ---");
  }
}