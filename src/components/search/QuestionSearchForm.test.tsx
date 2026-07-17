import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import QuestionSearchForm from "./QuestionSearchForm";

vi.mock("@/services/tracking", () => ({
  trackSearchEvent: vi.fn(),
}));

describe("QuestionSearchForm", () => {
  it("uses a one-line textarea and an accessible search icon button", () => {
    render(<QuestionSearchForm />);

    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(textarea.rows).toBe(1);
    expect(screen.getByRole("button", { name: "Rechercher dans les notices" })).not.toBeNull();
    expect(screen.queryByText("Poser ma question")).toBeNull();
  });
});
