/**
 * Renders one or more JSON-LD graphs into the document.
 *
 * `<script type="application/ld+json">` is the documented way to ship
 * structured data in the App Router — it is inert to the browser, so it can sit
 * in the body rather than needing the head, and React will not try to execute
 * it.
 *
 * `dangerouslySetInnerHTML` is required: React escapes text children, and an
 * escaped `&quot;` in place of every quote makes the JSON unparseable. The
 * content is not user input — every builder in `app/data/schema.js` reads from
 * the repo's own data files — but `JSON.stringify` output can still contain the
 * sequence `</script>` if a string ever did, which would end the element early,
 * so `<` is escaped to its unicode form. That is the one real injection vector
 * here and it costs one replace.
 */
export default function JsonLd({ data }) {
  const graphs = (Array.isArray(data) ? data : [data]).filter(Boolean);
  if (graphs.length === 0) return null;

  return (
    <>
      {graphs.map((graph, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(graph).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}
