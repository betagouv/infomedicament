import { HTMLAttributes } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { SearchTypeEnum, SearchATCClass, SearchResultData } from "@/types/SearchType";
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
  type: SearchTypeEnum;
}

function GenericResultBlock({
  item,
  type,
}: GenericResultBlockProps) {

 console.log(item);

  function getFormatSpecName(){
    if(type === SearchTypeEnum.SUBSTANCE){
      return formatSpecName((item as SubstanceNom).NomLib);
    } else if(type === SearchTypeEnum.PATHOLOGY){
      return formatSpecName((item as Patho).NomPatho)
    } else if(type === SearchTypeEnum.ATCCLASS){
      return formatSpecName((item as SearchATCClass).class.label)
    }
    return "Autre";
  }

  return (
    <Container>
      <div className={fr.cx("fr-mb-1w")}>
        {type === SearchTypeEnum.SUBSTANCE 
          ? (
            <Badge className={fr.cx("fr-badge--blue-cumulus")}>{SearchTypeEnum.SUBSTANCE}</Badge>
          ) : type === SearchTypeEnum.PATHOLOGY 
              ? (
                <Badge className={fr.cx("fr-badge--yellow-tournesol")}>{SearchTypeEnum.PATHOLOGY}</Badge>
              ) : type === SearchTypeEnum.ATCCLASS 
              ? (
                <Badge className={fr.cx("fr-badge--yellow-tournesol")}>{SearchTypeEnum.ATCCLASS}</Badge>
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
