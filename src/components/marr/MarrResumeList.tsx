import { HTMLAttributes } from "react";
import { fr } from "@codegouvfr/react-dsfr"; 
import { useIsDark } from "@codegouvfr/react-dsfr/useIsDark";
import styled, { css } from 'styled-components';
import Badge from "@codegouvfr/react-dsfr/Badge";
import { MarrPdf } from "@/types/MarrTypes";
import { Download } from "@codegouvfr/react-dsfr/Download";

const MarrContainer = styled.div<{ $isDark: boolean; $inLine?: boolean; }>`
  border: var(--border-open-blue-france) 1px solid;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  ${props => props.$inLine && css`
    @media (min-width: 48em) {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
    }
  `}
  ${props => css`
    background-color: ${props.$isDark ? 'var(--background-default-grey)' : '#FFF'};
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

  const { isDark } = useIsDark();

  return (
    marr.length > 0 && (
      <div>
        {marr.map((marr:MarrPdf, index) => {
          return (
            <MarrContainer $isDark={isDark} key={index} $inLine={inLine}>
              <div className={fr.cx("fr-text--sm", "fr-mb-1w")}>
                <u>{marr.filename}</u>
              </div>
              <div>
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
