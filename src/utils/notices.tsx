import WithGlossary from "@/components/glossary/WithGlossary";
import { TitulaireAddressContainer, TitulaireNomContainer } from "@/components/medicaments/blocks/GenericBlocks";
import { FicheInfos } from "@/types/FicheInfoTypes";
import { Definition } from "@/types/GlossaireTypes";
import { NoticeData, NoticeRCPContentBlock } from "@/types/SpecialiteTypes";
import { fr } from "@codegouvfr/react-dsfr";
import { CSSProperties } from "react";


export function noticeToText(children: NoticeRCPContentBlock[]): string {
  return children.map(block => {
    const text = Array.isArray(block.content) ? block.content.join('') : (block.content ?? '');
    const childText = block.children?.length ? noticeToText(block.children) : '';
    if (block.type?.startsWith('AmmNoticeTitre') || block.type?.startsWith('AmmAnnexeTitre')) {
      const anchor = block.anchor ? `[${block.anchor}] ` : '';
      return `\n${anchor}${text}\n${childText}`;
    }
    if (block.type === 'AmmCorpsTexteGras') return `\n**${text}**\n${childText}`;
    if (block.type === 'AmmCorpsTexte') return `[block-${block.id}] ${text}\n${childText}`;
    if (block.type === 'listePuce' && Array.isArray(block.content)) {
      return block.content.map(item => `• ${item}`).join('\n') + '\n';
    }
    return `${text}\n${childText}`;
  }).join('');
}

export function displayInfosImportantes(ficheInfos?:FicheInfos): boolean{
  if(ficheInfos && ficheInfos.listeInformationsImportantes && ficheInfos.listeInformationsImportantes.length > 0){
    return true;
  }
  return false;
}

function cleanStringContent(content: string): string {
  const pos: number = content.indexOf('<a ');
  if(pos !== -1 && content.indexOf('target=') === -1) {
    return [content.slice(0, pos + 3), 'target="_blank" rel="noopener noreferrer" ', content.slice(pos + 3)].join("");
  }
  return content;
}

function cleanArrayContent(content: string[]): string[] {
  return content
    .map((text: string) => {
      return cleanStringContent(text);
    });
}

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
    const elementContent = <WithGlossary definitions={definitions} key={content.id} text={content.content} headerId={content.anchor}/>;
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

function getGenericElement(content:NoticeRCPContentBlock, definitions?:Definition[]): (React.JSX.Element | undefined){
  if(content.content){
    if(content.html) { 
      const cleanHtmlContent = cleanStringContent(content.html);
      if(definitions) return <WithGlossary definitions={definitions} key={content.id} text={[cleanHtmlContent]} />
      return (<div dangerouslySetInnerHTML={{__html: cleanHtmlContent}}></div>)
    };

    const styles = getStyles(content.styles);
    const cleanContent = cleanArrayContent(content.content);
    const elementContent = <WithGlossary definitions={definitions} key={content.id} text={cleanContent}/>;
    if(content.type && content.type === "AmmCorpsTexte") {
      return (
        <div key={content.id} className={fr.cx("fr-mb-2w")} style={styles} data-block-id={content.id}>
          {elementContent}
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
          {elementContent}
        </TitulaireNomContainer>
      );
    }
    if(content.type && content.type === "AmmTitulaireAdresse") {
      //Only in RCP
      return (
        <TitulaireAddressContainer key={content.id} style={styles}>
          {elementContent}
        </TitulaireAddressContainer>
      );
    }
    if(content.type && content.type === "listePuce") {
      return (
        <ul key={content.id} className={fr.cx("fr-ml-2w")} style={styles}>
          {cleanContent.map((li, index) => {
            const text = li.charAt(0) === '·' ? li.substring(1) : li;
            if(text.trim().length > 0){
              return (
                <li className={fr.cx("fr-text--md", "fr-mb-1w")} key={content.id+'-'+index}>
                  <WithGlossary definitions={definitions} key={content.id} text={[text.trim()]} />
                </li>
              )
            }
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

function getTableElement(children:NoticeRCPContentBlock[], definitions?:Definition[]): (React.JSX.Element | undefined)[] {
  const content:(React.JSX.Element | undefined)[] = [];
  children.forEach((child, index) => {
    const styles = getStyles(child.styles);
    if(child.tag && child.tag !== "td" && child.children && child.children.length > 0){
      const childrenElement = getTableElement(child.children, definitions);
      if(childrenElement && childrenElement.length > 0){
        if(child.tag === "tr") {
          content.push((<tr key={child.id+'-'+index} style={styles}>{...childrenElement}</tr>));
        }
        else if(child.tag === "thead") {
          content.push((<thead key={child.id+'-'+index} style={styles}>{...childrenElement}</thead>));
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
      }
    } else if(child.tag && child.tag === "td"){
      let elementContent:(React.JSX.Element | string[] | undefined) = undefined;
      if(child.children && child.children.length > 0){
        const childElements:(React.JSX.Element | undefined)[] = [];
        child.children.forEach((element) => {
          const childElement = getGenericElement(element, definitions);
          if(childElement)
            childElements.push(childElement);
        });
        if(childElements && childElements.length > 0)
          elementContent = (
            <>{...childElements}</>
          );
      } else if(child.content && child.content.length > 0) {
        elementContent = <WithGlossary definitions={definitions} key={child.id} text={cleanArrayContent(child.content)} />;
      }
      if(elementContent){
        content.push((
          <td 
            key={child.id+'-'+index}
            colSpan={child.colspan ? child.colspan : 1}
            rowSpan={child.rowspan ? child.rowspan : 1}
            {...(styles && {style: styles})}
          >
            <span className={fr.cx("fr-text--sm")} key={child.id} style={styles}>
              {elementContent}
            </span>
          </td>
        ));
      }
    }
  })
  return content;
}

export function getContent(children:NoticeRCPContentBlock[], definitions?:Definition[]): (React.JSX.Element | undefined)[] {
  let content:(React.JSX.Element | undefined)[] = [];
  children.forEach((child, index) => {
    if(child.type && child.type === "AmmCorpsTexteTable" && !child.html){
      if(child.children){
        const tableContent:(React.JSX.Element | undefined)[] = getTableElement(child.children, definitions);
        if(tableContent) content.push((
          <div className="rcp-notice-block">
            <table key={child.id+'-'+index}>
              {...tableContent}
            </table>
          </div>
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

export function getIndicationsBlock(notice: NoticeData): NoticeRCPContentBlock | undefined {
  if (notice.children) {
    const indicationsBlock = notice.children
      .find((child: NoticeRCPContentBlock) => child.anchor === "Ann3bQuestceque");
    return indicationsBlock;
  }
  return undefined;
}

export function formatNoticeDateNotif(dateNotif: string | undefined): string {
  if(dateNotif) 
    return dateNotif
      .replace("ANSM - Mis à jour le : ", "Notice mise à jour le ")
      .replace("Mis à jour : ", "Notice mise à jour le ");
  return "";

}