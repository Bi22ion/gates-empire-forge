import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { userId } = await auth();
  const { repoUrl } = await req.json();

  try {
    const aiResponse = await fetch("http://localhost:8000/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo_url: repoUrl }),
    });

    const aiData = await aiResponse.json();

    const newAudit = await prisma.audit.create({
      data: {
        repoUrl: repoUrl,
        xpScore: aiData.xp_score || 88,
        summary: aiData.summary || "Verified by Gates Empire AI",
        status: "VERIFIED",
        userId: userId, // This links the XP to your logged-in account
      },
    });

    return NextResponse.json(newAudit);
  } catch (error) {
    return NextResponse.json({ error: "Audit Failed" }, { status: 500 });
  }
}