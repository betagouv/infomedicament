import db from "@/db";
import { sql } from "kysely";
import { fr } from "@codegouvfr/react-dsfr";
import { notFound } from "next/navigation";
import AlphabeticNav from "@/components/AlphabeticNav";
import sanitizeHtml from "sanitize-html";
import slugify from "slugify";
import { Fragment } from "react";
import ContentContainer from "@/components/generic/ContentContainer";
import RatingToaster from "@/components/rating/RatingToaster";

export const dynamic = "error";
export const dynamicParams = true;
const PAGE_LABEL: string = "Glossaire";

async function getDefinitions(firstLetter: string) {
  const definitions = await db.selectFrom("ref_glossaire")
    .select(["nom", "definition", "source"])
    .where("nom", "ilike", `${firstLetter}%`)
    .execute();

  return definitions;
}

async function getLetters() {
  const letters = await db.selectFrom("ref_glossaire")
    .select(sql<string>`upper(substring(nom, 1, 1))`.as("letter"))
    .distinct()
    .orderBy("letter")
    .execute();

  return letters.map((row) => row.letter);
}

export default async function Page(props: {
  params: Promise<{ letter: string }>;
}) {
  const { letter } = await props.params;

  const letters = await getLetters();
  if (!letters.includes(letter)) return notFound();

  const definitions = await getDefinitions(letter);

  return (
    <ContentContainer frContainer>
      <div className={fr.cx("fr-grid-row", "fr-mb-3w")}>
        <div className={fr.cx("fr-col-md-8")}>
          <h1>{PAGE_LABEL}</h1>
          <AlphabeticNav
            letters={letters}
            urlPrefix={`/glossaire/`}
            currentLetter={letter}
          />
          {definitions.map((definition) => (
            <Fragment
              key={slugify(definition.nom as string, {
                lower: true,
                strict: true,
              })}
            >
              <h2
                className={fr.cx("fr-h6", "fr-mt-4w", "fr-mb-1w")}
                id={slugify(definition.nom as string, {
                  lower: true,
                  strict: true,
                })}
              >
                {definition.nom}
              </h2>
              <div
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(
                    definition.definition as string,
                    {
                      allowedTags: ["p", "br", "ul", "ol", "li"],
                    },
                  ),
                }}
              />
            </Fragment>
          ))}
        </div>
      </div>
      <RatingToaster
        pageId={`${PAGE_LABEL} ${letter}`}
      />
    </ContentContainer>
  );
}
