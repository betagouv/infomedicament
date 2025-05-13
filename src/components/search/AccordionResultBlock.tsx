import { HTMLAttributes, useState } from "react";
import Link from "next/link";
import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { MainFilterTypeEnum, SearchMedicamentGroup } from "@/types/SearchType";
import { displaySimpleComposants, formatSpecName } from "@/displayUtils";
import styled, {css} from 'styled-components';
import Button from "@codegouvfr/react-dsfr/Button";

const Container = styled.div<{ $isDetailsVisible?: boolean; }>`
  border: var(--border-open-blue-france) 1px solid;
  border-radius: 8px;
  padding: 1rem;
  ${props => props.$isDetailsVisible && props.$isDetailsVisible && css`
    background-color: var(--background-alt-grey);
    border-radius: 8px 8px 0 0;
  `}
`;

const WhiteContainer = styled.div`
  border: var(--border-open-blue-france) 1px solid;
  border-top: none;
  border-radius: 0 0 8px 8px;
  padding: 1rem;
`;

const DetailsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const GreyText = styled.span`
  color: var(--text-mention-grey);
`;

interface AccordionResultBlockProps extends HTMLAttributes<HTMLDivElement> {
  item: SearchMedicamentGroup;
}

//For now only for type === MainFilterTypeEnum.MEDGROUP
function AccordionResultBlock({
  item,
}: AccordionResultBlockProps) {

  const specialites = item.specialites;
  const [isDetailsVisible, setIsDetailsVisible] = useState<boolean>(false);

  return (
    <div className={fr.cx("fr-mb-3w")}>
      <Container $isDetailsVisible={isDetailsVisible}>
        <div className={fr.cx("fr-mb-3w")}>
          <Badge className={fr.cx("fr-badge--purple-glycine")}>{MainFilterTypeEnum.MEDGROUP}</Badge>
        </div>
        <div>
          <span className={fr.cx("fr-h5")}>{formatSpecName(item.groupName)}</span>
        </div>
        <DetailsContainer>
          <div>
            <span className={fr.cx("fr-text--xs", "fr-mr-2w")}>
              <GreyText>Classe</GreyText>&nbsp;
              {item.atc1.label}&nbsp;{'>'}&nbsp;{item.atc2.label}
            </span>
            <span className={fr.cx("fr-text--xs")}>
              <GreyText>Substance&nbsp;active</GreyText>&nbsp;
              {displaySimpleComposants(item.composants)
                .map((s) => s.NomLib.trim())
                .join(", ")}
            </span>
          </div>
          <Button
            iconId={isDetailsVisible ? "fr-icon-arrow-up-s-line" : "fr-icon-arrow-down-s-line"}
            onClick={() => setIsDetailsVisible(!isDetailsVisible)}
            priority="tertiary no outline"
            title="Liens vers les notices"
          />
        </DetailsContainer>
      </Container>
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
    </div>
  );
};

export default AccordionResultBlock;
