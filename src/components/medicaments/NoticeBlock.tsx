"use client";

import ContentContainer from "../generic/ContentContainer";
import { fr } from "@codegouvfr/react-dsfr";
import { HTMLAttributes, PropsWithChildren, CSSProperties } from "react";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { Notice, NoticeContentBlock } from "@/types/MedicamentsTypes";
import styled from 'styled-components';
import WithGlossary from "../glossary/WithGlossary";
import useSWR from "swr";
import { Definition } from "@/types/GlossaireTypes";
import { fetchJSON } from "@/utils/network";

const NoticeContainer = styled.div`
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

interface NoticeProps extends HTMLAttributes<HTMLDivElement> {
  notice?: Notice;
}

function NoticeBlock({
  notice,
  ...props
}: PropsWithChildren<NoticeProps>) {

  const { data: definitions } = useSWR<Definition[]>(
    `/glossaire/definitions`,
    fetchJSON,
    { onError: (err) => console.warn('errorDefinitions >>', err), }
  );

  //TODO same than RCP
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

  function getTitleElement(content:NoticeContentBlock): (React.JSX.Element | undefined){
    if(content.content){
      if(content.type && (content.type === "AmmNoticeTitre1" || content.type === "AmmAnnexeTitre1")){
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

  //Same than RCP
  function getTableElement(children:NoticeContentBlock[]): (React.JSX.Element | undefined)[] {
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
        content.push(
          <span className={fr.cx("fr-text--md")} key={child.id} style={styles}>
            <WithGlossary definitions={definitions} key={child.id} text={child.content} />
          </span>
        );
      }
    })
    return content;
  }

  function getGenericElement(content:NoticeContentBlock): (React.JSX.Element | undefined){
    if(content.content){
      const styles = getStyles(content.styles);
      const withGlossary = <WithGlossary definitions={definitions} key={content.id} text={content.content} />;
      if(content.type && content.type === "AmmCorpsTexte") {
        return (
          <p key={content.id} style={styles}>
            {content.content}
          </p>
        )
      }
      if(content.type && content.type === "AmmComposition") {
        return (
          (<span className={fr.cx("fr-text--md")} key={content.id} style={styles}>{withGlossary}<br/></span>)
        )
      }
      if(content.type && content.type === "AmmCorpsTexteGras") {
        return (
          <b key={content.id} style={styles}>
            {withGlossary}{" "}
          </b>
        );
      }
      if(content.type && content.type === "listePuce") {
        return (
          <ul key={content.id} className={fr.cx("fr-ml-2w")} style={styles}>
            {content.content.map((li, index) => {
              const text = li.charAt(0) === '·' ? li.substring(1) : li;
              return (<li className={fr.cx("fr-text--md")} key={content.id+'-'+index}><WithGlossary definitions={definitions} key={content.id} text={[text]} /></li>)
            })}
          </ul>
        );
      }
      //No style to apply
      //AmmComposition
      return (<span className={fr.cx("fr-text--md")} key={content.id} style={styles}>{withGlossary}{" "}</span>);
    }
    return undefined;
  }

  function getNoticeContent(children:NoticeContentBlock[]): (React.JSX.Element | undefined)[] {
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
          const childContent:(React.JSX.Element | undefined)[] = getNoticeContent(child.children);
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
    <ContentContainer className={fr.cx("fr-col-12", "fr-col-lg-9", "fr-col-md-9")}>
      <article>
        <ContentContainer whiteContainer className={fr.cx("fr-mb-4w", "fr-p-4w")}>
          <div className={fr.cx("fr-mb-4w")} style={{display: "flex", justifyContent: "space-between", alignItems: "center", }}>
            <div style={{display: "flex"}}>
              <span className={["fr-icon--custom-notice", fr.cx("fr-mr-1w", "fr-hidden", "fr-unhidden-md")].join(" ")}/>
              <h2 className={fr.cx("fr-h3", "fr-mb-1w")}>
                <span className={fr.cx("fr-hidden-md")}>Notice</span>
                <span className={fr.cx("fr-hidden", "fr-unhidden-md")}>Notice complète</span>
              </h2>
            </div>
            {(notice && notice.dateNotif) && (
              <Badge severity={"info"}>{notice.dateNotif}</Badge>
            )}
          </div>
          {(notice && notice.children) ? (
            <NoticeContainer>{getNoticeContent(notice.children)}</NoticeContainer>
          ) : (
            <span>La notice n'est pas disponible pour ce médicament.</span>
          )}
        </ContentContainer>
      </article>
    </ContentContainer>
  );
};

export default NoticeBlock;
