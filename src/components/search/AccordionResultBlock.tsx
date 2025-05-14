import { HTMLAttributes, useState } from "react";
import Link from "next/link";
import { fr } from "@codegouvfr/react-dsfr";
import { SearchMedicamentGroup } from "@/types/SearchType";
import { displaySimpleComposants, formatSpecName } from "@/displayUtils";
import styled, {css} from 'styled-components';
import Button from "@codegouvfr/react-dsfr/Button";

const Container = styled.div`
  border: var(--border-open-blue-france) 1px solid;
  border-radius: 8px;
  :hover{
    background-color: var(--background-alt-grey);
    border-radius: 8px;
  }
`;
const GreyContainer = styled.div<{ $isDetailsVisible?: boolean; }>`
  padding: 1rem;
  ${props => props.$isDetailsVisible && props.$isDetailsVisible && css`
    border-bottom: var(--border-open-blue-france) 1px solid;
    background-color: var(--background-alt-grey);
    border-radius: 8px 8px 0 0;
  `}
`;
const WhiteContainer = styled.div`
  padding: 1rem;
`;
const DetailsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;
const SpecName = styled.span`
  color: var(--grey-200-850);
`;
const SpecLength = styled.span`
  color: var(--text-default-info);
`;
const GreyText = styled.span`
  color: var(--text-mention-grey);
`;
const DarkGreyText = styled.span`
  color: var(--text-title-grey);
`;

interface AccordionResultBlockProps extends HTMLAttributes<HTMLDivElement> {
  item: SearchMedicamentGroup;
}

//For now only for type === SearchTypeEnum.MEDGROUP
function AccordionResultBlock({
  item,
}: AccordionResultBlockProps) {

  const specialites = item.specialites;
  const [isDetailsVisible, setIsDetailsVisible] = useState<boolean>(false);

  return (
    <Container className={fr.cx("fr-mb-3w")}>
      <GreyContainer $isDetailsVisible={isDetailsVisible}>
        <div>
          <SpecName className={fr.cx("fr-h5", "fr-mr-2w")}>{formatSpecName(item.groupName)}</SpecName>
          <SpecLength>{specialites.length} {specialites.length > 1 ? "médicaments" : "médicament"}</SpecLength>
        </div>
        <DetailsContainer>
          <div>
            <span className={fr.cx("fr-text--xs", "fr-mr-2w")}>
              <GreyText>Classe</GreyText>&nbsp;
              <DarkGreyText>{item.atc1.label}&nbsp;{'>'}&nbsp;{item.atc2.label}</DarkGreyText>
            </span>
            <span className={fr.cx("fr-text--xs")}>
              <GreyText>Substance&nbsp;active</GreyText>&nbsp;
              <DarkGreyText>
                {displaySimpleComposants(item.composants)
                  .map((s) => s.NomLib.trim())
                  .join(", ")}
              </DarkGreyText>
            </span>
          </div>
          <Button
            iconId={isDetailsVisible ? "fr-icon-arrow-up-s-line" : "fr-icon-arrow-down-s-line"}
            onClick={() => setIsDetailsVisible(!isDetailsVisible)}
            priority="tertiary no outline"
            title="Liens vers les notices"
          />
        </DetailsContainer>
      </GreyContainer>
      {isDetailsVisible && (
        <WhiteContainer>
          <GreyText className={fr.cx("fr-text--xs")}>Consultez la notice de :</GreyText>
          <ul className={fr.cx("fr-raw-list", "fr-pl-3w")}>
            {specialites?.map((specialite, i) => (
              <li key={i} className={fr.cx("fr-mb-1v")}>
                <Link
                  href={`/medicaments/${specialite.SpecId}`}
                  className={fr.cx("fr-text--sm", "fr-link")}
                >
                  {formatSpecName(specialite.SpecDenom01)}
                </Link>
              </li>
            ))}
          </ul>
        </WhiteContainer>
      )}
    </Container>
  );
};

export default AccordionResultBlock;
