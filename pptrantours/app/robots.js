const BASE = "https://ppptrantoursjamaica.com";

export default function robots() {
  return {
    // /admin and /api are gated server-side; this only keeps them out of the
    // index, it is not what protects them.
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
