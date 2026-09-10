import { site } from "./data/site";

/**
 * Passthrough root.
 *
 * `<html>` and `<body>` are rendered by `app/[locale]/layout.js` instead,
 * because the `lang` attribute has to be the locale being served and this
 * layout sits above the segment that knows it.
 */
export default function RootLayout({ children }) {
  return children;
}

/**
 * Only `metadataBase`. Everything else is per-locale and set below this, but
 * relative Open Graph image paths resolve against this value, and any page
 * setting its own `openGraph` needs it already in scope or Next falls back to
 * localhost.
 */
export const metadata = {
  metadataBase: new URL(site.url),
};
