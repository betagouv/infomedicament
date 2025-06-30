"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { HTMLAttributes, CSSProperties } from "react";
import styled from 'styled-components';
import { Rcp, RcpContentBlock } from "@/types/MedicamentsTypes";
import Badge from "@codegouvfr/react-dsfr/Badge";

const RcpContainer = styled.div`
  div {
    margin: var(--text-spacing);
  }
  table {
    border: gray 1px solid;
    border-spacing: 0;
    border-collapse: collapse;
    margin-bottom: 1rem;
    tr, th {
      border: gray 1px solid;
      td {
        padding: 0.5rem;
        border: gray 1px solid;
      }
    }
  }
`;
const TitulaireNomContainer = styled.p`
  font-weight: bold;
  text-decoration: underline;
  margin-bottom: 0px;
`;
const TitulaireAddressContainer = styled.p`
  margin-bottom: 0px;
`;

interface RCPProps extends HTMLAttributes<HTMLDivElement> {
  rcp?: Rcp;
}

function RcpBlock({
  rcp,
  ...props 
}: RCPProps) {

  function getStyles(styles: string[] | undefined): CSSProperties{
    let formatedStyles:CSSProperties = {};
    if(styles){
      if(styles.includes("bold"))
        formatedStyles.fontWeight = "bold";
      if(styles.includes("underline"))
        formatedStyles.textDecoration = "underline";
      if(styles.includes("italic"))
        formatedStyles.fontStyle = "italic";
    }
    return formatedStyles;
  }

  function getTitleElement(content:RcpContentBlock): (React.JSX.Element | undefined){
    if(content.content){
      if(content.type && content.type === "AmmAnnexeTitre1"){
        return (
          <h3 className={fr.cx("fr-h5")} key={content.id} id={content.anchor}>
            {content.content}
          </h3>
        );
      }
      if(content.type && content.type === "AmmAnnexeTitre2"){
        return (
          <h4 className={fr.cx("fr-h6")} key={content.id} id={content.anchor}>
            {content.content}
          </h4>
        );
      }
      if(content.type && content.type === "AmmAnnexeTitre3") {
        return (
          <h5 className={fr.cx("fr-h6")} key={content.id} id={content.anchor}>
            {content.content}
          </h5>
        );
      }
      if(content.type && content.type === "AmmAnnexeTitre4") {
        return (
          <h6 className={fr.cx("fr-h6")} key={content.id} id={content.anchor}>
            {content.content}
          </h6>
        );
      }
    }
    return undefined;
  }

  function getTableElement(children:RcpContentBlock[]): (React.JSX.Element | undefined)[] {
    let content:(React.JSX.Element | undefined)[] = [];
    children.forEach((child, index) => {
      const styles = getStyles(child.styles);
      const isTD:boolean = (child.tag && child.children && child.children.length > 0 && child.tag === "td") ? true : false;
      const props = {
        ...(styles && {style: styles})
      };
      if(child.tag && child.children && child.children.length > 0){
        const childrenElement = getTableElement(child.children);
        if(child.tag === "tr") {
          content.push((<tr key={child.id+'-'+index} style={styles}>{...childrenElement}</tr>));
        }
        else if(child.tag === "thead") {
          content.push((<thead key={child.id+'-'+index} style={styles}>{...childrenElement}</thead>));
        }
        else if(child.tag === "td") {
          content.push((
            <td 
              key={child.id+'-'+index}
              colSpan={child.colspan ? child.colspan : 1}
              rowSpan={child.rowspan ? child.rowspan : 1}
              {...(styles && {style: styles})}
            >
              {...childrenElement}
            </td>
          ));
        }
        else if(child.tag === "th") {
          content.push((
            <th 
              key={child.id+'-'+index}
              colSpan={child.colspan ? child.colspan : 1}
              rowSpan={child.rowspan ? child.rowspan : 1}
              style={styles}
            >
              {...childrenElement}
            </th>
          ));
        }
        else if(child.tag === "tbody") {
          content.push((<tbody key={child.id+'-'+index} style={styles}>{...childrenElement}</tbody>));
        }
      } else if(child.content){
        content.push(<span className={fr.cx("fr-text--md")} key={child.id} style={styles}>{child.content}</span>);
      }
    })
    return content;
  }

  function getGenericElement(content:RcpContentBlock): (React.JSX.Element | undefined){
    if(content.content){
      const styles = getStyles(content.styles);
      if(content.type && content.type === "AmmCorpsTexte") {
        return (
          <div key={content.id} style={styles}>
            {content.content}
          </div>
        )
      }
      if(content.type && content.type === "AmmComposition") {
        return (
          (<span className={fr.cx("fr-text--md")} key={content.id} style={styles}>{content.content}<br/></span>)
        )
      }
      if(content.type && content.type === "AmmCorpsTexteGras") {
        return (
          <b key={content.id} style={styles}>
            {content.content}{" "}
          </b>
        );
      }
      if(content.type && content.type === "AmmTitulaireNom") {
        return (
          <TitulaireNomContainer key={content.id} style={styles}>
            {content.content}
          </TitulaireNomContainer>
        );
      }
      if(content.type && content.type === "AmmTitulaireAdresse") {
        return (
          <TitulaireAddressContainer key={content.id} style={styles}>
            {content.content}
          </TitulaireAddressContainer>
        );
      }
      if(content.type && content.type === "listePuce") {
        return (
          <ul key={content.id} className={fr.cx("fr-ml-2w")} style={styles}>
            {content.content.map((li, index) => {
              const text = li.charAt(0) === '·' ? li.substring(1) : li;
              return (<li className={fr.cx("fr-text--md")} key={content.id+'-'+index}>{text}</li>)
            })}
          </ul>
        );
      }
      //No style to apply
      //AmmComposition
      return (<span className={fr.cx("fr-text--md")} key={content.id} style={styles}>{content.content}{" "}</span>);
    }
    return undefined;
  }

  function getRcpContent(children:RcpContentBlock[]): (React.JSX.Element | undefined)[] {
    let content:(React.JSX.Element | undefined)[] = [];
    children.forEach((child, index) => {
      if(child.type && child.type === "AmmCorpsTexteTable"){
          if(child.children){
            const tableContent:(React.JSX.Element | undefined)[] = getTableElement(child.children);
            if(tableContent) content.push((
              <table key={child.id+'-'+index}>{...tableContent}</table>
            ));
          }
      } else {
        const titleContent:(React.JSX.Element | undefined) = getTitleElement(child);
        if(titleContent){
          content.push(titleContent);
        } else if(child.content){
          const genericContent:(React.JSX.Element | undefined) = getGenericElement(child);
          if(genericContent) content.push(genericContent);
        }

        if(child.children){
          const childContent:(React.JSX.Element | undefined)[] = getRcpContent(child.children);
          if(childContent){
            if(titleContent) content = content.concat((<div key={child.id+'-'+index}>{...childContent}</div>));
            else content = content.concat(childContent);
          }
        }
      }
    })
    return content;
  }

  return (
    <>
      <h2>Résumé des caractéristiques du produit</h2>
      {rcp ? (
        <>
          {rcp.dateNotif && (
            <Badge severity={"info"} className={fr.cx("fr-mb-4w")}>{rcp.dateNotif}</Badge>
          )}
          {rcp.children && (
            <RcpContainer>{getRcpContent(rcp.children)}</RcpContainer>
          )}
        </>
      ) : (
        <span>Le résumé des caractéristiques du produit n'est pas disponible pour ce médicament.</span>
      )}
    </>
  );
};

export default RcpBlock;
