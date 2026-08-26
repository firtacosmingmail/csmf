// Renders a <script type="application/ld+json"> tag for structured data
// (schema.org). See app/[lang]/blog/[slug]/page.tsx (BlogPosting) and
// app/[lang]/about/page.tsx (Person) for what's fed into it.
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
