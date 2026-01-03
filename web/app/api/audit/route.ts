import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma"; 

export async function POST(req: Request) {
  console.log("--- AUDIT START ---");
  try {
    // 1. Authenticate user via Clerk
    const { userId } = await auth();
    const clerkUser = await currentUser();

    if (!userId || !clerkUser) {
      console.error("AUTH ERROR: No userId found");
      return NextResponse.json({ error: "Please sign in first" }, { status: 401 });
    }

    // 2. Parse Body
    const body = await req.json();
    const { repoUrl } = body;
    console.log(`AUDIT REQUEST: User ${userId} for repo ${repoUrl}`);

    if (!repoUrl) {
      return NextResponse.json({ error: "Repository URL is required" }, { status: 400 });
    }

    // 3. Ensure User exists in Supabase (The Fix)
    // This prevents "Foreign Key Constraint" errors
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
      console.log("USER SYNCED SUCCESSFULLY");
    } catch (userError: any) {
      console.error("USER SYNC ERROR:", userError.message);
      // We continue even if sync fails, as long as the user exists
    }

    // 4. AI Backend Call (Railway)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://gates-empire-forge-production.up.railway.app";
    console.log(`CALLING AI BACKEND: ${apiUrl}/audit`);
    
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
      console.error(`AI BACKEND ERROR: Status ${aiResponse.status} - ${errorText}`);
      return NextResponse.json({ error: "AI Processing Failed" }, { status: 502 });
    }

    const aiData = await aiResponse.json();
    console.log("AI DATA RECEIVED:", JSON.stringify(aiData));

    // 5. Save Audit to Database
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
      
      console.log("DATABASE SAVE SUCCESS:", newAudit.id);
      return NextResponse.json(newAudit);
      
    } catch (dbError: any) {
      console.error("PRISMA DB ERROR:", dbError.message);
      return NextResponse.json({ error: "Database Save Failed", details: dbError.message }, { status: 500 });
    }

  } catch (error: any) {
    console.error("GLOBAL SERVER ERROR:", error.stack || error.message);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message }, 
      { status: 500 }
    );
  } finally {
    console.log("--- AUDIT END ---");
  }
}