import { StructuredData, toJsonLd } from "@/utils/structuredData";

// Structured data (JSON-LD) of the page, read by the search engines
export default function JsonLd({ data }: { data: StructuredData }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: toJsonLd(data) }}
    />
  );
}
