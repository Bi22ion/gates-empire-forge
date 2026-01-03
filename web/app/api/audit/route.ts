export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma"; 

export async function POST(req: Request) {
  console.log("LOG: API Route reached"); // This must show up in logs
  try {
    const { userId } = await auth();
    console.log("LOG: Auth success for", userId);

    const body = await req.json();
    console.log("LOG: Body received", body);

    const repoUrl = body.repoUrl || body.repo_url;

    // Supabase Sync
    await prisma.user.upsert({
      where: { id: userId },
      update: { username: "User" },
      create: { id: userId, username: "User", email: "temp@example.com" },
    });
    console.log("LOG: Supabase sync success");

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("LOG: CRASH ->", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}