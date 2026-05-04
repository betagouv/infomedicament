import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import RatingStars from "./RatingStars";

function renderRatingStars(props: Partial<Parameters<typeof RatingStars>[0]> = {}) {
  const onSaveRating = props.onSaveRating ?? vi.fn();
  render(
    <RatingStars
      readOnly={false}
      onSaveRating={onSaveRating}
      {...props}
    />
  );
  return { onSaveRating };
}

describe("RatingStars", () => {
  it("renders 5 stars by default", () => {
    renderRatingStars();
    expect(screen.getAllByRole("radio")).toHaveLength(5);
  });

  it("renders 3 stars when starsNumber=3", () => {
    renderRatingStars({ starsNumber: 3 });
    expect(screen.getAllByRole("radio")).toHaveLength(3);
  });

  it("calls onSaveRating with the correct value when a star is clicked", () => {
    const onSaveRating = vi.fn();
    renderRatingStars({ onSaveRating });
    fireEvent.click(screen.getByRole("radio", { name: /3 Stars/i }));
    expect(onSaveRating).toHaveBeenCalledWith(3);
  });

  it("does not call onSaveRating when readOnly=true", () => {
    const onSaveRating = vi.fn();
    renderRatingStars({ readOnly: true, onSaveRating });
    fireEvent.click(screen.getByRole("radio", { name: /2 Stars/i }));
    expect(onSaveRating).not.toHaveBeenCalled();
  });

  it("disables all inputs when readOnly=true", () => {
    renderRatingStars({ readOnly: true });
    screen.getAllByRole("radio").forEach((input) => {
      expect((input as HTMLInputElement).disabled).toBe(true);
    });
  });

  it("displays the hover label when a star is hovered", () => {
    renderRatingStars();
    const labels = screen.getAllByRole("radio").map((r) => r.closest("label")!);
    fireEvent.mouseEnter(labels[2]); // hover star 3
    expect(screen.getByText("Moyen")).toBeDefined();
  });

  it("clears the hover label when mouse leaves", () => {
    renderRatingStars();
    const labels = screen.getAllByRole("radio").map((r) => r.closest("label")!);
    fireEvent.mouseEnter(labels[4]); // hover star 5
    expect(screen.getByText("Parfait")).toBeDefined();
    fireEvent.mouseLeave(labels[4]);
    expect(screen.queryByText("Parfait")).toBeNull();
  });

  it("displays the selected label after clicking a star", () => {
    renderRatingStars();
    fireEvent.click(screen.getByRole("radio", { name: /4 Stars/i }));
    expect(screen.getByText("Beaucoup")).toBeDefined();
  });

  it("uses the 3-star label set when starsNumber=3", () => {
    renderRatingStars({ starsNumber: 3 });
    fireEvent.click(screen.getByRole("radio", { name: /3 Stars/i }));
    expect(screen.getByText("Parfait")).toBeDefined();
  });
});
