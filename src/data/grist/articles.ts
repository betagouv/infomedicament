import "server-only";
import { getGristTableData } from "@/data/grist/index";
import slugify from "slugify";

export async function getArticles() {
  const records = await getGristTableData("Articles", [
    "Titre",
    "Source",
    "Contenu",
    "Theme",
    "Lien",
    "Metadescription",
    "Homepage",
  ]);

  return records.map(({ fields }) => {
    return {
      slug: slugify(fields.Titre as string, { lower: true, strict: true }),
      title: fields.Titre as string,
      source: fields.Source as string,
      content: fields.Contenu as string,
      category: fields.Theme as string,
      homepage: fields.Homepage as boolean,
      canonicalUrl: fields.Lien as string,
      description: fields.Metadescription as string,
    };
  });
}