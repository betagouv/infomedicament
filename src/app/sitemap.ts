import { MetadataRoute } from "next";
import { getAllSpecialites } from "@/db/utils/specialities";
import { getAllSubsWithSpecialites } from "@/db/utils/substances";
import { getAtc } from "@/db/utils/atc";
import { getLetters } from "@/db/utils/letters";
import { getArticles } from "@/db/utils/articles";
import { getGlossaryLetters } from "@/db/utils/glossary";
import { getAllIndications } from "@/db/utils/indications";
import { getAllGenericGroupCodes } from "@/db/utils/generics";
import { getSpecSlug } from "@/utils/specialites";
import { getIndicationSlug } from "@/utils/indications";
import { getAtcSlug } from "@/utils/atc";


const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

const STATIC_ROUTES = [
  "/",
  "/a-propos",
  "/donnees",
  "/articles",
  "/interactions",
  "/mentions-legales",
  "/politique-de-confidentialite",
  "/rechercher",
  "/statistiques",
  "/medicaments",
  "/indications",
  "/substances",
  "/generiques",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  "use cache: remote";
  const [
    specialites,
    substances,
    indications,
    atcData,
    articles,
    glossaryLetters,
    medLetters,
    subsLetters,
    indicationsLetters,
    genLetters,
    genericGroups,
  ] = await Promise.all([
    getAllSpecialites(),
    getAllSubsWithSpecialites(),
    getAllIndications(),
    getAtc(),
    getArticles(),
    getGlossaryLetters(),
    getLetters("medicaments"),
    getLetters("substances"),
    getLetters("indications"),
    getLetters("generiques"),
    getAllGenericGroupCodes(),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${BASE_URL}${path}`,
  }));

  const medicamentEntries: MetadataRoute.Sitemap = specialites.map((s) => ({
    url: `${BASE_URL}/medicaments/${getSpecSlug(s.SpecId, s.SpecDenom01)}`,
  }));

  const articleEntries: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${BASE_URL}/articles/${a.slug}`,
  }));

  const substanceEntries: MetadataRoute.Sitemap = substances.map((s) => ({
    url: `${BASE_URL}/substances/${s.NomId.trim()}`,
  }));

  const indicationsEntries: MetadataRoute.Sitemap = indications.map((i) => ({
    url: `${BASE_URL}/indications/${getIndicationSlug(i.id, i.nom)}`,
  }));

  const atcEntries: MetadataRoute.Sitemap = [
    ...atcData.map((a) => ({ url: `${BASE_URL}/atc/${getAtcSlug(a.code, a.label)}` })),
    ...atcData.flatMap((a) =>
      a.children.map((c) => ({ url: `${BASE_URL}/atc/${getAtcSlug(c.code, c.label)}` }))
    ),
  ];

  const genericEntries: MetadataRoute.Sitemap = genericGroups.map((groupCode) => ({
    url: `${BASE_URL}/generiques/${groupCode}`,
  }));

  const glossaireEntries: MetadataRoute.Sitemap = glossaryLetters.map((l) => ({
    url: `${BASE_URL}/glossaire/${l}`,
  }));

  const alphaListEntries: MetadataRoute.Sitemap = [
    ...medLetters.map((l) => ({ url: `${BASE_URL}/alpha_lists/medicaments/${l}` })),
    ...subsLetters.map((l) => ({ url: `${BASE_URL}/alpha_lists/substances/${l}` })),
    ...indicationsLetters.map((l) => ({ url: `${BASE_URL}/alpha_lists/indications/${l}` })),
    ...genLetters.map((l) => ({ url: `${BASE_URL}/alpha_lists/generiques/${l}` })),
  ];

  return [
    ...staticEntries,
    ...medicamentEntries,
    ...articleEntries,
    ...substanceEntries,
    ...indicationsEntries,
    ...atcEntries,
    ...genericEntries,
    ...glossaireEntries,
    ...alphaListEntries,
  ];
}
