import { HTMLAttributes } from "react";
import { fr } from "@codegouvfr/react-dsfr"; 
import { useIsDark } from "@codegouvfr/react-dsfr/useIsDark";
import styled, { css } from 'styled-components';
import Badge from "@codegouvfr/react-dsfr/Badge";
import Link from "next/link";
import { Marr, MarrPdf } from "@/types/MarrTypes";

const MarrContainer = styled.div`
  @media (max-width: 48em) {
    display: inline-flex;
    width: 100%;
    overflow-x: auto;
  }
`;

const MarrBlockContainer = styled.div<{ $isDark: boolean; $inLine?: boolean; }>`
  border: var(--border-open-blue-france) 1px solid;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  ${props => props.$inLine && css`
    @media (min-width: 48em) {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      a {
        margin-bottom: 0px;
      }
    }
  `}
  ${props => css`
    background-color: ${props.$isDark ? 'var(--background-default-grey)' : '#FFF'};
  `}
  @media (max-width: 48em) {
    margin-right: 1rem;
    min-width: 250px;
    width: 100%;
  }
`;
const BadgeContainer = styled.div`
  text-align: right;
`;

interface MarrResumeListProps extends HTMLAttributes<HTMLDivElement> {
  marr: Marr;
  inLine?: boolean;
}

function MarrResumeList({
  marr,
  inLine,
}: MarrResumeListProps) {

  const { isDark } = useIsDark();

  return (
    marr.pdf.length > 0 && (
      <MarrContainer>
        {marr.pdf.map((marr:MarrPdf, index) => {
          return (
            <MarrBlockContainer $isDark={isDark} key={index} $inLine={inLine}>
              <Link 
                href={marr.fileUrl}
                className={fr.cx("fr-text--sm", "fr-link")}
                target="_blank"
                rel="noopener noreferrer"
              >
                {marr.filename}
              </Link>
              <BadgeContainer>
                <Badge 
                  className={fr.cx("fr-badge--purple-glycine")}
                  noIcon={true}
                >
                  {marr.type}
                </Badge>
              </BadgeContainer>
            </MarrBlockContainer>
          );
        })}
      </MarrContainer>
    )
  );
};

export default MarrResumeList;
