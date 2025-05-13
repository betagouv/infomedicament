import { HTMLAttributes } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { MainFilterTypeEnum, SearchATCClass, SearchResultData } from "@/types/SearchType";
import { formatSpecName } from "@/displayUtils";
import styled from 'styled-components';
import { Patho, SubstanceNom } from "@/db/pdbmMySQL/types";

const Container = styled.div`
  border: var(--border-open-blue-france) 1px solid;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  padding: 1rem;
`;

interface GenericResultBlockProps extends HTMLAttributes<HTMLDivElement> {
  item: SearchResultData;
  type: MainFilterTypeEnum;
}

function GenericResultBlock({
  item,
  type,
}: GenericResultBlockProps) {

 console.log(item);

  function getFormatSpecName(){
    if(type === MainFilterTypeEnum.SUBSTANCE){
      return formatSpecName((item as SubstanceNom).NomLib);
    } else if(type === MainFilterTypeEnum.PATHOLOGY){
      return formatSpecName((item as Patho).NomPatho)
    } else if(type === MainFilterTypeEnum.ATCCLASS){
      return formatSpecName((item as SearchATCClass).class.label)
    }
    return "Autre";
  }

  return (
    <Container>
      <div className={fr.cx("fr-mb-3w")}>
        {type === MainFilterTypeEnum.SUBSTANCE 
          ? (
            <Badge className={fr.cx("fr-badge--blue-cumulus")}>{MainFilterTypeEnum.SUBSTANCE}</Badge>
          ) : type === MainFilterTypeEnum.PATHOLOGY 
              ? (
                <Badge className={fr.cx("fr-badge--yellow-tournesol")}>{MainFilterTypeEnum.PATHOLOGY}</Badge>
              ) : type === MainFilterTypeEnum.ATCCLASS 
              ? (
                <Badge className={fr.cx("fr-badge--yellow-tournesol")}>{MainFilterTypeEnum.ATCCLASS}</Badge>
              ) 
          : (<Badge>Autre</Badge>)
        }
      </div>
      <div>
        <span className={fr.cx("fr-h5")}>{getFormatSpecName()}</span>
      </div>
    </Container>
  );
};

export default GenericResultBlock;
