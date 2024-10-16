import "server-only";
import { getGristTableData } from "@/data/grist";
import slugify from "slugify";

type ArticleRecord = {
  Titre: string;
  Source: string;
  Contenu: string;
};

export async function getArticles() {
  const records = (await getGristTableData("Articles")) as {
    id: number;
    fields: ArticleRecord;
  }[];

  return records.map(({ fields }) => {
    return {
      slug: slugify(fields.Titre, { lower: true, strict: true }),
      title: fields.Titre,
      source: fields.Source,
      content: fields.Contenu,
    };
  });
}
