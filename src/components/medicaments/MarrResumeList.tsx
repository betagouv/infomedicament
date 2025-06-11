import { HTMLAttributes } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import styled from 'styled-components';
import Badge from "@codegouvfr/react-dsfr/Badge";
import { MarrPdf } from "@/types/MarrTypes";
import { Download } from "@codegouvfr/react-dsfr/Download";

const MarrContainer = styled.div `
  border: var(--border-open-blue-france) 1px solid;
  border-radius: 8px;
  background-color: #FFF;
  padding: 1rem;

  .fr-download{
    text-align: right;
  }
  .fr-download a {
    font-size: 0.875rem !important;
    line-height: 1.5rem !important;
  }
  .fr-download .fr-download__detail{
    display: none;
  }
`;

const BadgeContainer = styled.div`
  text-align: right;
`;

interface MarrResumeListProps extends HTMLAttributes<HTMLDivElement> {
  marr: MarrPdf[];
}

function MarrResumeList({
  marr,
}: MarrResumeListProps) {

  return (
    marr.length > 0 && (
      <>
        <div className={fr.cx("fr-h6", "fr-mb-1w")}>
          Mesure additionnelles de réduction du risque (MARR)
        </div>
        <div className={fr.cx("fr-text--md", "fr-mb-1w")}>
          Consultez les documents ci-dessous pour bien utiliser ce médicament&nbsp;:
        </div>
        <div>
          {marr.map((marr:MarrPdf, index) => {
            return (
              <MarrContainer key={index}>
                <div className={fr.cx("fr-text--sm", "fr-mb-1w")}>
                  <u>{marr.filename}</u>
                </div>
                <Download
                  details="PDF"
                  label="Télécharger"
                  linkProps={{
                    href: marr.fileUrl
                  }}
                  className={fr.cx("fr-text--xs", "fr-link")}
                />
                <BadgeContainer className={fr.cx("fr-mt-1w")}>
                  <Badge 
                    className={fr.cx("fr-badge--purple-glycine")}
                    noIcon={true}
                  >
                    {marr.type}
                  </Badge>
                </BadgeContainer>
              </MarrContainer>
            );
          })}
        </div>
      </>
    )
  );
};

export default MarrResumeList;
