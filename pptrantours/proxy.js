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
export function proxy(request) {
  const { pathname } = request.nextUrl;

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

/**
 * Everything that is NOT localized has to be excluded here, because the rewrite
 * above is unconditional: anything that reaches it and is not already
 * locale-prefixed gets `/en` bolted on, and `/en/<that>` is not a route.
 *
 * That is not hypothetical. `app/admin/` lives outside `app/[locale]/`, so
 * `/admin` was being rewritten to `/en/admin` and served a 404 in production —
 * the owner's bookings console was simply unreachable, and nothing failed
 * loudly. `/CREDITS.md` went the same way.
 *
 *   api, _next          route handlers and build assets
 *   admin               the bookings console, outside [locale] on purpose
 *   _not-found,
 *   _global-error       Next's own generated routes
 *   .*[.]               anything with a file extension, i.e. all of `public/`
 *
 * The trailing `.*[.]` is deliberately an extension *test* rather than a list of
 * known extensions. The previous version allowlisted eleven of them and
 * silently 404'd the twelfth.
 *
 * DEPENDENCY: any new top-level route added outside `app/[locale]/` must be
 * added here too, or it will 404 with no error anywhere.
 */
export const config = {
  matcher: ["/((?!api|_next|admin|_not-found|_global-error|.*[.]).*)"],
};
