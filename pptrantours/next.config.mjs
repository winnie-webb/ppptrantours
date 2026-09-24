import { LOCALE_CODES, DEFAULT_LOCALE } from "./app/i18n/config.js";

/** @type {import('next').NextConfig} */
const nextConfig = {
  /*
   * /destinations duplicated the region chips and category pages already on
   * /tours (03_INFORMATION_ARCHITECTURE.md §1, F-29) — permanent, so search
   * engines drop the old URL from the index rather than keep it alongside
   * the one it now points to. One rule per locale prefix, since English is
   * served bare and every other language is `/xx/...` (see
   * app/i18n/config.js `localePath`).
   */
  async redirects() {
    return LOCALE_CODES.filter((code) => code !== DEFAULT_LOCALE)
      .map((code) => ({
        source: `/${code}/destinations`,
        destination: `/${code}/tours`,
        permanent: true,
      }))
      .concat([{ source: "/destinations", destination: "/tours", permanent: true }]);
  },
  /*
   * Image optimization is ON.
   *
   * It used to be `unoptimized: true`, which turns every <Image> into a plain
   * <img>: no srcset, no width-based resizing, no WebP/AVIF. The `sizes` props
   * scattered through the components were inert, and a phone downloaded the
   * full-resolution desktop original of every hero — about 1.7 MB of 2000px
   * JPEG before a single card image, on a 390px screen.
   *
   * AVIF first, WebP second, original as the last resort. AVIF is roughly
   * 20-30% smaller than WebP at the same quality and is now supported
   * everywhere that matters; the browser picks via content negotiation, so
   * anything that cannot read it silently gets WebP.
   *
   * Device widths are trimmed to the ones this design actually uses. Next's
   * default list has eight entries, and every extra width is another cached
   * transformation of every image for no benefit — the layout tops out at
   * `max-w-shell` (84rem / 1344px), so 1920 covers a full-bleed hero on a
   * 2x display and 3840 covers 4k.
   */
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [390, 640, 828, 1080, 1344, 1920, 3840],
    minimumCacheTTL: 2678400, // 31 days; these are static marketing assets
  },
};

export default nextConfig;
