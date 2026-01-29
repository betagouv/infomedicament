import { describe, it, expect, vi } from "vitest";
import { Kysely } from "kysely";
import { Database } from "@/db/types";
import { getContentFromData, createAddContent } from "./contentParser";


describe("getContentFromData", () => {
  it("should return empty ContentBlock for empty data", async () => {
    const result = await getContentFromData({});

    expect(result).toEqual({
      type: "",
      styles: [],
      anchor: "",
      content: [],
      html: "",
      children: [],
      tag: "",
      rowspan: undefined,
      colspan: undefined,
    });
  });

  it("should extract type, anchor and styles from data", async () => {
    const data = {
      type: "AmmCorpsTexte",
      anchor: "_Toc123",
      styles: ["bold", "italic"],
    };

    const result = await getContentFromData(data);

    expect(result.type).toBe("AmmCorpsTexte");
    expect(result.anchor).toBe("_Toc123");
    expect(result.styles).toEqual(["bold", "italic"]);
  });

  it("should wrap single style in array", async () => {
    const data = {
      styles: "bold",
    };

    const result = await getContentFromData(data);

    expect(result.styles).toEqual(["bold"]);
  });

  it("should extract content as array", async () => {
    const data = {
      content: "Simple text",
    };

    const result = await getContentFromData(data);

    expect(result.content).toEqual(["Simple text"]);
  });

  it("should keep content array as-is", async () => {
    const data = {
      content: ["Item 1", "Item 2"],
    };

    const result = await getContentFromData(data);

    expect(result.content).toEqual(["Item 1", "Item 2"]);
  });

  it("should clean HTML with getCleanHTML", async () => {
    const data = {
      html: '<p><a name="test">Content</a></p>',
    };

    const result = await getContentFromData(data);

    expect(result.html).toBe("<p>Content</p>");
  });

  it("should NOT clean HTML when isTable is true", async () => {
    const data = {
      type: "table",
      html: '<p><a name="test">Content</a></p>',
    };

    const result = await getContentFromData(data, true);

    expect(result.html).toBe('<p><a name="test">Content</a></p>');
  });

  it("should extract table attributes (colspan, rowspan)", async () => {
    const data = {
      type: "table",
      tag: "td",
      attributes: {
        colspan: "2",
        rowspan: "3",
        class: "tableClass",
      },
    };

    const result = await getContentFromData(data, true);

    expect(result.tag).toBe("td");
    expect(result.colspan).toBe(2);
    expect(result.rowspan).toBe(3);
    expect(result.type).toBe("tableClass");
  });

  it("should call addContentFn for children when provided", async () => {
    // Mocking add content for this test
    const mockAddContent = vi.fn().mockResolvedValue([1, 2, 3]);
    const data = {
      content: "Parent",
      children: [{ content: "Child 1" }, { content: "Child 2" }],
    };

    const result = await getContentFromData(data, false, mockAddContent);

    expect(mockAddContent).toHaveBeenCalledWith(data.children);
    expect(result.children).toEqual([1, 2, 3]);
  });

  it("should NOT process children when addContentFn is not provided", async () => {
    const data = {
      content: "Parent",
      children: [{ content: "Child 1" }],
    };

    const result = await getContentFromData(data);

    expect(result.children).toEqual([]);
  });
});

describe("createAddContent", () => {
  it("should insert content blocks and return their IDs", async () => {
    // Mock what the database is supposed to return (IDs)
    const mockExecute = vi.fn().mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);
    const mockDb = {
      insertInto: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockReturnValue({
            execute: mockExecute,
          }),
        }),
      }),
    };

    const addContent = createAddContent(mockDb as unknown as Kysely<Database>, "notices_content");
    const result = await addContent([
      { content: "Bloc 1" },
      { content: "Bloc 2" },
      { content: "Bloc ABCD" },
    ]);

    expect(mockDb.insertInto).toHaveBeenCalledWith("notices_content");
    expect(result).toEqual([1, 2, 3]);
  });

  it("should filter out items without content, children or text", async () => {
    const mockExecute = vi.fn().mockResolvedValue([{ id: 1 }]);
    const mockValues = vi.fn().mockReturnValue({
      returning: vi.fn().mockReturnValue({
        execute: mockExecute,
      }),
    });
    const mockDb = {
      insertInto: vi.fn().mockReturnValue({
        values: mockValues,
      }),
    };

    const addContent = createAddContent(mockDb as unknown as Kysely<Database>, "notices_content");
    const result = await addContent([
      { content: "Valid item" },
      { type: "TypeOnly" }, // No content, children or text - should be filtered
      { html: "<p>Test</p>" }, // No content, children or text - should be filtered
    ]);

    // Only 1 item should be inserted, check the mock call stack
    expect(mockValues).toHaveBeenCalledTimes(1);
    expect(mockValues).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ content: ["Valid item"] })]),
    );
    expect(mockValues.mock.calls[0][0]).toHaveLength(1);
    expect(result).toEqual([1]);
  });

  it("should return empty array when all items are filtered out", async () => {
    const mockDb = {
      insertInto: vi.fn(),
    };

    const addContent = createAddContent(mockDb as unknown as Kysely<Database>, "notices_content");
    const result = await addContent([{ type: "empty" }, { html: "only html" }]);

    // The mock should not have been called
    expect(mockDb.insertInto).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it("should handle nested children recursively", async () => {
    let callCount = 0;
    const mockExecute = vi.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve([{ id: callCount }]);
    });
    const mockDb = {
      insertInto: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockReturnValue({
            execute: mockExecute,
          }),
        }),
      }),
    };

    const addContent = createAddContent(mockDb as unknown as Kysely<Database>, "notices_content");
    const result = await addContent([
      {
        content: "Parent",
        children: [{ content: "Child" }],
      },
    ]);

    // Should have called insertInto twice (once for child, once for parent)
    expect(mockDb.insertInto).toHaveBeenCalledTimes(2);
    expect(result).toEqual([2]);
  });
});
