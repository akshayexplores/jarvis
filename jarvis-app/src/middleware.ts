import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sessionToken, SESSION_COOKIE } from "@/lib/session";

/**
 * Auth gate. Set APP_PASSWORD to require login on every route.
 * Leave unset for open local development.
 *
 * - /login and /api/login stay public (so you can sign in).
 * - /api/ingest accepts `Authorization: Bearer $CRON_SECRET` so Vercel Cron
 *   can trigger scheduled pulls without a browser session.
 */
export async function middleware(req: NextRequest) {
  if (!process.env.APP_PASSWORD) return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (pathname === "/login" || pathname === "/api/login") return NextResponse.next();

  if (pathname === "/api/ingest" && process.env.CRON_SECRET) {
    const auth = req.headers.get("authorization");
    if (auth === `Bearer ${process.env.CRON_SECRET}`) return NextResponse.next();
  }

  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (cookie && cookie === (await sessionToken())