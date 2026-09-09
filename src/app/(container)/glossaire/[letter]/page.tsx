import { getGlossaryLetters, getGlossaryDefinitionsByFirstLetter } from "@/db/utils/glossary";
import { fr } from "@codegouvfr/react-dsfr";
import { notFound } from "next/navigation";
import AlphabeticNav from "@/components/AlphabeticNav";
import slugify from "slugify";
import { Fragment } from "react";
import ContentContainer from "@/components/generic/ContentContainer";
import RatingToaster from "@/components/rating/RatingToaster";
import { cacheLife } from "next/cache";

export async function generateStaticParams() {
  const letters = await getGlossaryLetters();
  return letters.map((letter) => ({ letter }));
}
const PAGE_LABEL: string = "Glossaire";

export default async function Page(props: {
  params: Promise<{ letter: string }>;
}) {
  const { letter } = await props.params;
  return <CachedGlossaryPage letter={letter} />;
}

async function CachedGlossaryPage({ letter }: { letter: string }) {
  "use cache: remote";
  cacheLife("daily");

  const letters = await getGlossaryLetters();
  if (!letters.includes(letter)) return notFound();

  const definitions = await getGlossaryDefinitionsByFirstLetter(letter);

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
                  __html: definition.definition,
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
