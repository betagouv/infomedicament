import { HTMLAttributes } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import styled, { css } from 'styled-components';
import Badge from "@codegouvfr/react-dsfr/Badge";
import { MarrPdf } from "@/types/MarrTypes";
import { Download } from "@codegouvfr/react-dsfr/Download";

const MarrContainer = styled.div<{ $inLine?: boolean; }>`
  border: var(--border-open-blue-france) 1px solid;
  border-radius: 8px;
  background-color: #FFF;
  padding: 1rem;
  margin-bottom: 1rem;
  ${props => props.$inLine && css`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  `}

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
  inLine?: boolean;
}

function MarrResumeList({
  marr,
  inLine,
}: MarrResumeListProps) {

  return (
    marr.length > 0 && (
      <div>
        {marr.map((marr:MarrPdf, index) => {
          return (
            <MarrContainer key={index} $inLine={inLine}>
              <div className={fr.cx("fr-text--sm", "fr-mb-1w")}>
                <u>{marr.filename}</u>
              </div>
              <div>
                <a
                  className={fr.cx("fr-link", "fr-link--download")}
                  download
                  href={marr.fileUrl}>
                    Télécharger le document
                    <span className={fr.cx("fr-link__detail")}>JPG – 61,88 ko</span>
                </a>
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
              </div>
            </MarrContainer>
          );
        })}
      </div>
    )
  );
};

export default MarrResumeList;
