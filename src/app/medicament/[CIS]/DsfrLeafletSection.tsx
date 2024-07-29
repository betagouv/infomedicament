import { HTMLElement, Node, NodeType } from "node-html-parser";
import { JSX } from "react";
import Image from "next/image";
import { fr } from "@codegouvfr/react-dsfr";
import {
  isEmptyTextNode,
  isHtmlElement,
  isListItem,
} from "@/app/medicament/[CIS]/leafletUtils";

function DsfrLeafletElement({ node }: { node: HTMLElement }) {
  if (
    node.classList.contains("AmmNoticeTitre1") ||
    node.classList.contains("AmmAnnexeTitre1")
  ) {
    return (
      <h1 className={fr.cx("fr-h4")}>
        <DsfrLeafletSection data={node.childNodes} />
      </h1>
    );
  }

  if (node.classList.contains("AmmCorpsTexteGras")) {
    return (
      <p className={fr.cx("fr-text--bold")}>
        <DsfrLeafletSection data={node.childNodes} />
      </p>
    );
  }

  if (node.rawTagName === "a") {
    return <DsfrLeafletSection data={node.childNodes} />;
  }

  if (node.rawTagName === "img") {
    return (
      <Image
        src={node.getAttribute("src") as string}
        width={+(node.getAttribute("width") as string)}
        height={+(node.getAttribute("height") as string)}
        alt={node.getAttribute("alt") as string}
      />
    );
  }

  const Tag = node.rawTagName as keyof JSX.IntrinsicElements;

  if (["br", "hr"].includes(node.rawTagName)) {
    return <Tag />;
  }

  return (
    <Tag>
      <DsfrLeafletSection data={node.childNodes} />
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
    <>
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
    </>
  );
}

export default function DsfrLeafletSection({ data }: { data: Node[] }) {
  const cleanedData = data.filter((el) => !isEmptyTextNode(el));

  return (
    <>
      {cleanedData.map((node, index) => {
        if (!isHtmlElement(node)) {
          if (node.nodeType === NodeType.TEXT_NODE) {
            return node.text;
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

        return <DsfrLeafletElement key={index} node={node} />;
      })}
    </>
  );
}
