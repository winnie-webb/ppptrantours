import { NextResponse } from "next/server";
import { DEFAULT_LOCALE, LOCALE_CODES } from "@/app/i18n/config";

/**
 * English is served from the bare path and every other language from a prefix.
 *
 * `/tours` is rewritten to `/en/tours` internally, so the App Router still sees
 * a `[locale]` segment while the guest's address bar keeps the original URL.
 * `/es/tours` is already prefixed and passes straight through.
 *
 * First-time visitors are *not* auto-redirected by Accept-Language. Silently
 * throwing a guest onto /de because their laptop is German means they can never
 * link anyone to the page they are looking at, and it splits the English URL's
 * ranking. The header only sets a hint cookie the switcher reads.
 */
const PUBLIC_FILE = /\.(?:png|jpe?g|webp|gif|svg|ico|txt|xml|json|webmanifest)$/i;

export function proxy(request) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const first = pathname.split("/")[1];
  if (LOCALE_CODES.includes(first)) {
    // Already addressed to a locale. /en/... is the one exception: it is a
    // duplicate of the bare path, so send it home rather than serve both.
    if (first === DEFAULT_LOCALE) {
      const url = request.nextUrl.clone();
      url.pathname = pathname.slice(`/${DEFAULT_LOCALE}`.length) || "/";
      return NextResponse.redirect(url, 308);
    }
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
