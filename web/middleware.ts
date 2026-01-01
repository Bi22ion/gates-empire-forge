import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // This runs Clerk on absolutely every single request
    '/((?!_next|.*\\..*).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
};