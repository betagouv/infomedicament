import { getCleanHTML } from "./htmlParser";

export type ContentBlock = {
  type?: string;
  styles?: string[];
  anchor?: string;
  content?: string[];
  html?: string;
  children?: number[];
  tag?: string;
  rowspan?: number;
  colspan?: number;
};

type DbInsert = {
  insertInto: (table: string) => {
    values: (data: any) => {
      returning: (col: string) => {
        execute: () => Promise<{ id: string | number }[]>;
      };
    };
  };
};

export async function getContentFromData(
  data: any,
  isTable?: boolean,
  addContentFn?: (childrenData: any, isTable?: boolean) => Promise<number[]>,
): Promise<ContentBlock> {
  const contentBlock: ContentBlock = {
    type: "",
    styles: [],
    anchor: "",
    content: [],
    html: "",
    children: [],
    tag: "",
    rowspan: undefined,
    colspan: undefined,
  };

  if (data.type) contentBlock.type = data.type;
  if (data.anchor) contentBlock.anchor = data.anchor;
  if (data.styles)
    contentBlock.styles = !Array.isArray(data.styles)
      ? [data.styles]
      : data.styles;

  if ((data.type && data.type === "table") || isTable) {
    if (data.tag) contentBlock.tag = data.tag;
    if (data.attributes) {
      if (data.attributes.class && (data.type === "table" || !data.type))
        contentBlock.type = data.attributes.class;
      if (data.attributes.colspan)
        contentBlock.colspan = parseInt(data.attributes.colspan);
      if (data.attributes.rowspan)
        contentBlock.rowspan = parseInt(data.attributes.rowspan);
    }
    if (data.html) contentBlock.html = data.html;
  } else {
    if (data.content)
      contentBlock.content = !Array.isArray(data.content)
        ? [data.content]
        : data.content;
    if (data.html) {
      contentBlock.html = getCleanHTML(data.html);
    }
    if (data.children && addContentFn) {
      contentBlock.children = await addContentFn(data.children);
    }
  }
  return contentBlock;
}

// Returns an "addContent" function
export function createAddContent(db: DbInsert, contentTable: string): Function {
  const addContent = async (
    childrenData: any,
    isTable?: boolean,
  ): Promise<number[]> => {
    const childrenToInsert: (ContentBlock | boolean)[] = await Promise.all(
      childrenData.map(async (data: any) => {
        if (data.content || data.children || data.text) {
          return await getContentFromData(data, isTable, addContent);
        } else return false;
      }),
    );
    const ids: number[] = [];
    if (childrenToInsert.length > 0) {
      const filteredChildren = childrenToInsert.filter(
        (child) => child !== false,
      );
      if (filteredChildren.length > 0) {
        try {
          const rawIds = await db
            .insertInto(contentTable)
            .values(filteredChildren)
            .returning("id")
            .execute();
          rawIds.forEach(
            (id) =>
              id && id.id !== undefined && ids.push(parseInt(id.id as string)),
          );
        } catch (e) {
          console.log("childrenToInsert");
          console.log(childrenToInsert);
          console.log(e);
        }
      }
    }
    return ids;
  };

  return addContent;
}
