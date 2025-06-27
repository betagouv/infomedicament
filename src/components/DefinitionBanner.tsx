"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Card from "@codegouvfr/react-dsfr/Card";
import styled from 'styled-components';

const Container = styled.div`
  .fr-card__detail.fr-icon-information-line{
    font-style: italic;
  }
`;

export default function DefinitionBanner({
  type,
  title,
  definition,
  disclaimer,
}: {
  type: string;
  title: string;
  definition: string | { title: string; desc: string }[];
  disclaimer?: string;
}) {
  return (
    <Container>
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-md-8")}>
          <Badge className={fr.cx("fr-badge--purple-glycine")}>{type}</Badge>
          <h1 className={fr.cx("fr-h1", "fr-mt-1w", "fr-mb-6w")}>{title}</h1>

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
      </div>
    </Container>
  );
}
