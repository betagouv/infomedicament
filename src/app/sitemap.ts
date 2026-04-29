import { MetadataRoute } from "next";
import { getAllSpecialites } from "@/db/utils/specialities";
import { getAllSubsWithSpecialites } from "@/db/utils/substances";
import { getAllPathos } from "@/db/utils/pathologies";
import { getAtc } from "@/db/utils/atc";
import { getLetters } from "@/db/utils/letters";
import { getArticles } from "@/db/utils/articles";
import { getGlossaryLetters } from "@/db/utils/glossary";
import { pdbmMySQL } from "@/db/pdbmMySQL";

export const revalidate = 86400;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

const STATIC_ROUTES = [
  "/",
  "/a-propos",
  "/articles",
  "/interactions",
  "/mentions-legales",
  "/politique-de-confidentialite",
  "/rechercher",
  "/statistiques",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [
    specialites,
    substances,
    pathos,
    atcData,
    articles,
    glossaryLetters,
    medLetters,
    subsLetters,
    pathoLetters,
    genLetters,
    genericGroups,
  ] = await Promise.all([
    getAllSpecialites(),
    getAllSubsWithSpecialites(),
    getAllPathos(),
    getAtc(),
    getArticles(),
    getGlossaryLetters(),
    getLetters("specialites"),
    getLetters("substances"),
    getLetters("pathos"),
    getLetters("generiques"),
    pdbmMySQL.selectFrom("GroupeGene").select("SpecId").distinct().execute(),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${BASE_URL}${path}`,
  }));

  const medicamentEntries: MetadataRoute.Sitemap = specialites.map((s) => ({
    url: `${BASE_URL}/medicaments/${s.SpecId.trim()}`,
  }));

  const articleEntries: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${BASE_URL}/articles/${a.slug}`,
  }));

  const substanceEntries: MetadataRoute.Sitemap = substances.map((s) => ({
    url: `${BASE_URL}/substances/${s.NomId.trim()}`,
  }));

  const pathoEntries: MetadataRoute.Sitemap = pathos.map((p) => ({
    url: `${BASE_URL}/pathologies/${p.codePatho.trim()}`,
  }));

  const atcEntries: MetadataRoute.Sitemap = [
    ...atcData.map((a) => ({ url: `${BASE_URL}/atc/${a.code}` })),
    ...atcData.flatMap((a) =>
      a.children.map((c) => ({ url: `${BASE_URL}/atc/${c.code}` }))
    ),
  ];

  const genericEntries: MetadataRoute.Sitemap = genericGroups.map((g) => ({
    url: `${BASE_URL}/generiques/${g.SpecId.trim()}`,
  }));

  const glossaireEntries: MetadataRoute.Sitemap = glossaryLetters.map((l) => ({
    url: `${BASE_URL}/glossaire/${l}`,
  }));

  const alphaListEntries: MetadataRoute.Sitemap = [
    ...medLetters.map((l) => ({ url: `${BASE_URL}/alpha_lists/medicaments/${l}` })),
    ...subsLetters.map((l) => ({ url: `${BASE_URL}/alpha_lists/substances/${l}` })),
    ...pathoLetters.map((l) => ({ url: `${BASE_URL}/alpha_lists/pathologies/${l}` })),
    ...genLetters.map((l) => ({ url: `${BASE_URL}/alpha_lists/generiques/${l}` })),
  ];

  return [
    ...staticEntries,
    ...medicamentEntries,
    ...articleEntries,
    ...substanceEntries,
    ...pathoEntries,
    ...atcEntries,
    ...genericEntries,
    ...glossaireEntries,
    ...alphaListEntries,
  ];
}
