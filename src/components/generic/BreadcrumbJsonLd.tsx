import JsonLd from "@/components/generic/JsonLd";
import {
  BreadcrumbPage,
  getBreadcrumbStructuredData,
} from "@/utils/structuredData/breadcrumb";
import { getBaseUrl } from "@/utils/baseUrl";

// Structured data (BreadcrumbList) of the page, from its URL (not the DSFR Breadcrumb displayed):
// path (canonical path of the page) and name of the page, parents of the page in its URL if any
export default function BreadcrumbJsonLd({
  path,
  name,
  parents,
}: BreadcrumbPage & { parents?: BreadcrumbPage[] }) {
  return (
    <JsonLd
      data={getBreadcrumbStructuredData({ path, name }, getBaseUrl(), parents)}
    />
  );
}
