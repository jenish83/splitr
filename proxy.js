import { clerkMiddleware } from '@clerk/nextjs/server'
import { createRouteMatcher } from 'next/navigation';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/expenses(.*)',
  '/contacts(.*)',
  '/groups(.*)',
  '/persom(.*)',
  '/settlements(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();

  if(!userId && isProtectedRoute(request)) {
    const {redirectToSignIn} = await auth();
    return redirectToSignIn();
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
    // Always run for Clerk-specific frontend API routes
    '/__clerk/(.*)',
  ],
}