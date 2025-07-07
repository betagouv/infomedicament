import WithGlossary from "@/components/glossary/WithGlossary";
import { TitulaireAddressContainer, TitulaireNomContainer } from "@/components/medicaments/Blocks/GenericBlocks";
import { Definition } from "@/types/GlossaireTypes";
import { NoticeRCPContentBlock } from "@/types/MedicamentTypes";
import { fr } from "@codegouvfr/react-dsfr";
import { CSSProperties } from "react";

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

function getTitleElement(content:NoticeRCPContentBlock, definitions?:Definition[]): (React.JSX.Element | undefined){
  if(content.content){
    const elementContent = definitions 
      ? <WithGlossary definitions={definitions} text={content.content} isHeader={true}/>
      : content.content;
    if(content.type && (content.type === "AmmNoticeTitre1" || content.type === "AmmAnnexeTitre1")){
      return (
        <h3 className={fr.cx("fr-h5")} key={content.id} id={content.anchor}>
          {elementContent}
        </h3>
      );
    }
    if(content.type && content.type === "AmmAnnexeTitre2"){
      return (
        <h4 className={fr.cx("fr-h6")} key={content.id} id={content.anchor}>
          {elementContent}
        </h4>
      );
    }
    if(content.type && content.type === "AmmAnnexeTitre3") {
      return (
        <h5 className={fr.cx("fr-h6")} key={content.id} id={content.anchor}>
          {elementContent}
        </h5>
      );
    }
    if(content.type && content.type === "AmmAnnexeTitre4") {
      return (
        <h6 className={fr.cx("fr-h6")} key={content.id} id={content.anchor}>
          {elementContent}
        </h6>
      );
    }
  }
  return undefined;
}

//Same than RCP
function getTableElement(children:NoticeRCPContentBlock[], definitions?:Definition[]): (React.JSX.Element | undefined)[] {
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
      const elementContent = definitions 
        ? <WithGlossary definitions={definitions} key={child.id} text={child.content} />
        : child.content;
      content.push(
        <span className={fr.cx("fr-text--md")} key={child.id} style={styles}>
          {elementContent}
        </span>
      );
    }
  })
  return content;
}

function getGenericElement(content:NoticeRCPContentBlock, definitions?:Definition[]): (React.JSX.Element | undefined){
  if(content.content){
    const styles = getStyles(content.styles);
    const elementContent = definitions 
      ? <WithGlossary definitions={definitions} key={content.id} text={content.content} />
      : content.content;
    if(content.type && content.type === "AmmCorpsTexte") {
      return (
        <div key={content.id} style={styles}>
          {content.content}
        </div>
      )
    }
    if(content.type && content.type === "AmmComposition") {
      return (
        (<span className={fr.cx("fr-text--md")} key={content.id} style={styles}>{elementContent}<br/></span>)
      )
    }
    if(content.type && content.type === "AmmCorpsTexteGras") {
      return (
        <b key={content.id} style={styles}>
          {elementContent}{" "}
        </b>
      );
    }
    if(content.type && content.type === "AmmTitulaireNom") {
      return (
        //Only in RCP
        <TitulaireNomContainer key={content.id} style={styles}>
          {content.content}
        </TitulaireNomContainer>
      );
    }
    if(content.type && content.type === "AmmTitulaireAdresse") {
      //Only in RCP
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
            const liContent = definitions 
              ? <WithGlossary definitions={definitions} key={content.id} text={[text]} />
              : text;
            return (
              <li className={fr.cx("fr-text--md")} key={content.id+'-'+index}>
                {liContent}
              </li>
            )
          })}
        </ul>
      );
    }
    //No style to apply
    //AmmComposition
    return (<span className={fr.cx("fr-text--md")} key={content.id} style={styles}>{elementContent}{" "}</span>);
  }
  return undefined;
}

export function getContent(children:NoticeRCPContentBlock[], definitions?:Definition[]): (React.JSX.Element | undefined)[] {
  let content:(React.JSX.Element | undefined)[] = [];
  children.forEach((child, index) => {
    if(child.type && child.type === "AmmCorpsTexteTable"){
        if(child.children){
          const tableContent:(React.JSX.Element | undefined)[] = getTableElement(child.children, definitions);
          if(tableContent) content.push((
            <table key={child.id+'-'+index}>{...tableContent}</table>
          ));
        }
    } else {
      const titleContent:(React.JSX.Element | undefined) = getTitleElement(child, definitions);
      if(titleContent){
        content.push(titleContent);
      } else if(child.content){
        const genericContent:(React.JSX.Element | undefined) = getGenericElement(child, definitions);
        if(genericContent) content.push(genericContent);
      }

      if(child.children){
        const childContent:(React.JSX.Element | undefined)[] = getContent(child.children, definitions);
        if(childContent){
          if(titleContent) content = content.concat((<div key={child.id+'-'+index}>{...childContent}</div>));
          else content = content.concat(childContent);
        }
      }
    }
  })
  return content;
}