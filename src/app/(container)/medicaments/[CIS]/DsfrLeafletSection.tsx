import { HTMLElement, Node, NodeType } from "node-html-parser";
import { Fragment, JSX } from "react";
import Image from "next/image";
import { fr } from "@codegouvfr/react-dsfr";
import { isEmptyTextNode, isHtmlElement, isListItem } from "./leafletUtils";
import { getLeafletImage } from "@/db/utils";
import { WithGlossary } from "@/components/glossary/WithGlossary";
import { headerAnchorsKeys, headerAnchorsList, questionKeys, questionsList } from "@/data/pages/notices_anchors";
import { HeaderDetails } from "@/types/NoticesAnchors";

async function DsfrLeafletElement({ node, isHeader }: { node: HTMLElement, isHeader?: boolean }) {
  if (
    node.classList.contains("AmmNoticeTitre1") ||
    node.classList.contains("AmmAnnexeTitre1")
  ) {
    return (
      <h3 className={fr.cx("fr-h4")}>
        <DsfrLeafletSection data={node.childNodes} isHeader/>
      </h3>
    );
  }

  if (node.classList.contains("AmmCorpsTexteGras")) {
    return (
      <p className={fr.cx("fr-text--bold")}>
        <DsfrLeafletSection data={node.childNodes} isHeader={isHeader}/>
      </p>
    );
  }

  if (
    node.rawTagName === "p" &&
    node.getElementsByTagName("table").length > 0
  ) {
    const tableIndex = node.childNodes.findIndex(
      (el) =>
        isHtmlElement(el) &&
        (el.rawTagName == "table" ||
          el.getElementsByTagName("table").length > 0),
    );
    return (
      <>
        <p>
          <DsfrLeafletSection data={node.childNodes.slice(0, tableIndex)}/>
        </p>
        <DsfrLeafletElement node={node.childNodes[tableIndex] as HTMLElement}/>
        <p>
          <DsfrLeafletSection data={node.childNodes.slice(tableIndex + 1)}/>
        </p>
      </>
    );
  }

  if (
    node.rawTagName === "table" &&
    !(
      isHtmlElement(node.childNodes[0]) &&
      ["tbody", "thead"].includes(node.childNodes[0].rawTagName)
    )
  ) {
    return (
      <table className={fr.cx("fr-table")}>
        <tbody>
          <DsfrLeafletSection data={node.childNodes}/>
        </tbody>
      </table>
    );
  }

  if (node.rawTagName === "span") {
    return <DsfrLeafletSection data={node.childNodes} isHeader={isHeader}/>;
  }

  if (node.rawTagName === "a") {
    return <DsfrLeafletSection data={node.childNodes} isHeader={isHeader}/>;
  }

  if (node.rawTagName === "img") {
    const dataUrl = await getLeafletImage({
      src: node.getAttribute("src") as string,
    });
    return dataUrl ? (
      <Image
        src={dataUrl}
        width={+(node.getAttribute("width") as string)}
        height={+(node.getAttribute("height") as string)}
        alt={node.getAttribute("alt") as string}
      />
    ) : (
      <span className={fr.cx("fr-error-text")}>
        Image originale manquante{node.getAttribute("alt")}
      </span>
    );
  }

  const Tag = node.rawTagName as keyof JSX.IntrinsicElements;

  if (["br", "hr"].includes(node.rawTagName)) {
    return <Tag />;
  }

  if (node.rawTagName === "u") {
    return (
      <span style={{ fontWeight: 500 }}>
        <DsfrLeafletSection data={node.childNodes}/>
      </span>
    );
  }

  return (
    <Tag>
      <DsfrLeafletSection data={node.childNodes}/>
    </Tag>
  );
}

export function DsfrListItems({
  data,
  level = 1,
}: {
  data: Node[];
  level?: number;
}) {
  if (data.find((el) => !isListItem(el) && !isEmptyTextNode(el))) {
    throw new Error("All nodes must be list items or empty text nodes");
  }

  const cleanedData = data.filter(
    (el) => !isEmptyTextNode(el) && isListItem(el),
  ) as HTMLElement[];

  return (
    <Fragment>
      {cleanedData.map((node, index) => {
        // Remove original bullet points
        node.childNodes = node.childNodes.filter(
          (childNode) => ![".", "o", "·"].includes(childNode.text.trim()),
        );

        if (
          node.classList.contains(`AmmListePuces${level}`) &&
          !cleanedData[index + 1]?.classList.contains(
            `AmmListePuces${level + 1}`,
          )
        ) {
          // Item is a leaf, display
          return (
            <li key={index}>
              <DsfrLeafletSection data={node.childNodes} />
            </li>
          );
        }

        if (node.classList.contains(`AmmListePuces${level + 1}`)) {
          // Item is inside a sublist skip
          return null;
        }

        // Last case : item is the beginning of a sublist
        const subListLength = cleanedData
          .slice(index + 1) // index + 1 to skip the current node
          .findIndex(
            (el) => !el.classList.contains(`AmmListePuces${level + 1}`),
          );

        return (
          <li key={index}>
            <DsfrLeafletSection data={node.childNodes} />
            <ul className={fr.cx("fr-list")}>
              <DsfrListItems
                data={cleanedData.slice(
                  index + 1,
                  subListLength !== -1
                    ? index + 1 + subListLength
                    : cleanedData.length,
                )}
                level={level + 1}
              />
            </ul>
          </li>
        );
      })}
    </Fragment>
  );
}
interface indexFormat {
  index: number; //position
  length: number; //length of the keyword
  id: string; //question id
  excerpt: string; //few words before and after the keyword
}
async function getTextWithAnchor(text: string, isHeader?: boolean){
  if(isHeader){
    let anchorDetails: HeaderDetails | undefined;
    let beginIndex = -1;
    let endIndex = -1;
    await headerAnchorsKeys.find((key: string) => {
      beginIndex = (text.toLowerCase()).indexOf(headerAnchorsList[key].headerTerms.begin.toLowerCase());
      if(beginIndex === -1) return false;
      endIndex = (text.toLowerCase()).indexOf(headerAnchorsList[key].headerTerms.end.toLowerCase(), beginIndex + headerAnchorsList[key].headerTerms.begin.length);
      if(endIndex === -1) return false;
      anchorDetails = headerAnchorsList[key];
      return true;
    });
    if(anchorDetails){
      return (
        <>
          {text.substring(0, beginIndex)}
          <span id={anchorDetails.id} className={`highlight-header-${anchorDetails.id}`}>{text.substring(beginIndex, endIndex + anchorDetails.headerTerms.end.length)}</span>
          {text.substring(endIndex + anchorDetails.headerTerms.end.length)}
        </>
      );
    }
  } else {
    const indexes: indexFormat[] = [];
    await questionKeys.forEach((key: string) => {
      questionsList[key].keywords && questionsList[key].keywords.forEach((keyword: string) => {
        const index = (text.toLowerCase()).indexOf(keyword.toLowerCase());
        if(index !== -1){
          indexes.push({
            index: index, 
            length: keyword.length, 
            id: questionsList[key].id,
            excerpt: "",
          });
        }
      });
    });
    if(indexes.length > 0){
      await indexes.sort((a: any, b: any) => a.index - b.index);
      return (
        <>
          {await indexes.map((data, index) => {
            const previousPos = index !==0 ? (indexes[index-1].index + indexes[index-1].length) : 0;
            const keywordSpan = (<span className={`highlight-keyword-${data.id}`}>{text.substring(data.index, data.index + data.length)}</span>);
            return (
              <span key={index}>
                {text.substring(previousPos, data.index)}
                {keywordSpan}
              </span>
            );
            
          })}
          {text.substring(indexes[indexes.length - 1].index + indexes[indexes.length - 1].length)}
        </>
      );
    }
  }
  return (<>{text}</>);
}

export default async function DsfrLeafletSection({ data, isHeader }: { data: Node[], isHeader?: boolean }) {
  const cleanedData = data.filter((el) => !isEmptyTextNode(el));

  return (
    <Fragment>
      {await Promise.all(
        cleanedData.map(async (node, index) => {
          if (!isHtmlElement(node)) {
            if (node.nodeType === NodeType.TEXT_NODE) {
              const newText = await getTextWithAnchor(node.text, isHeader);
              return (
                <WithGlossary key={index} text={newText} />
              );
            }

            return null;
          }

          // List items are not wrapped in a list element in the original HTML
          // When meeting a list we find all the following list items
          // and display them at once to wrap them in a list component
          // Then we skip the next nodes to avoid displaying the list items again
          if (isListItem(node)) {
            const previousNode = index && cleanedData[index - 1];
            if (
              previousNode &&
              isHtmlElement(previousNode) &&
              isListItem(previousNode)
            ) {
              // Item is not the first of the list, skip it
              return null;
            }

            const listLength = cleanedData
              .slice(index)
              .findIndex((el) => !isListItem(el));

            return (
              <ul className={fr.cx("fr-list")} key={index}>
                <DsfrListItems
                  data={cleanedData.slice(
                    index,
                    listLength !== -1 ? index + listLength : cleanedData.length,
                  )}
                />
              </ul>
            );
          }
          return <DsfrLeafletElement key={index} node={node} isHeader={isHeader}/>;
        }),
      )}
    </Fragment>
  );
}
