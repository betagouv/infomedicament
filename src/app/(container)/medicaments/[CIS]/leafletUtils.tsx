import { HTMLElement, Node, NodeType, TextNode } from "node-html-parser";

export const isHtmlElement = (node: Node): node is HTMLElement =>
  node.nodeType === NodeType.ELEMENT_NODE;

export const isListItem = (node: Node): node is HTMLElement =>
  isHtmlElement(node) &&
  !!Array.from(node.classList.values()).find((cl) =>
    cl.startsWith("AmmListePuces"),
  );

export const isEmptyTextNode = (node: Node): node is TextNode =>
  node.nodeType === NodeType.TEXT_NODE && !node.text.trim();
