"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Card from "@codegouvfr/react-dsfr/Card";
import styled from 'styled-components';
import ShareButtons from "./generic/ShareButtons";

const Container = styled.div`
  .fr-card__detail.fr-icon-information-line{
    font-style: italic;
  }
  @media (max-width: 48em) {
    h1{
      margin-bottom: 1rem;
    }
  }
`;

export default function DefinitionBanner({
  type,
  title,
  subtitle,
  definition,
  disclaimer,
}: {
  type: string;
  title: string;
  subtitle?: string;
  definition: string | { title: string; desc: string }[];
  disclaimer?: string;
}) {
  return (
    <Container>
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-12")}>
          <Badge className={fr.cx("fr-badge--purple-glycine")}>{type}</Badge>
          <h1 className={fr.cx("fr-h1", "fr-mt-1w", "fr-mb-0")}>{title}</h1>
          {subtitle && (
            <span>Aussi connu sous le nom de {subtitle}.</span>
          )}
          <ShareButtons 
            pageName={title}
            className={fr.cx("fr-mb-6w", "fr-mt-2w")} 
          />
        </div>
        {definition && (
          <div className={fr.cx("fr-col-md-8")}>
            {typeof definition === "string" ? (
              <div className={fr.cx("fr-grid-row")}>
                <div className={fr.cx("fr-col")}>
                  <Card 
                    title="Définition" 
                    titleAs={"h6"} 
                    desc={definition}
                    endDetail={disclaimer && disclaimer}
                    classes={{
                      endDetail: disclaimer && fr.cx("fr-icon-information-line")
                    }}
                  />
                </div>
              </div>
            ) : (
              definition.map(({ title, desc }) => (
                <div key={title} className={fr.cx("fr-grid-row", "fr-mb-1w")}>
                  <div className={fr.cx("fr-col")}>
                    <Card 
                      title={title}
                      titleAs={"h6"}
                      desc={desc}
                      endDetail={disclaimer && disclaimer}
                      classes={{
                        endDetail: disclaimer && fr.cx("fr-icon-information-line")
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Container>
  );
}
