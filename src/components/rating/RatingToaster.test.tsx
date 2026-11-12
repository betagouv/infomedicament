import { StrictMode } from "react";
import { act, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import RatingToaster from "./RatingToaster";

const { toast, dismiss, theme } = vi.hoisted(() => ({
  toast: vi.fn(),
  dismiss: vi.fn(),
  theme: { isDark: false },
}));
vi.mock("react-toastify", () => ({
  ToastContainer: () => null,
  toast: Object.assign(toast, { dismiss }),
}));
vi.mock("./RatingPage", () => ({ default: () => null }));
vi.mock("@codegouvfr/react-dsfr/useIsDark", () => ({ useIsDark: () => theme }));

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
  theme.isDark = false;
});

it("restarts the delay on navigation, uses the latest theme, and cleans up", () => {
  vi.useFakeTimers();
  const { rerender, unmount } = render(<RatingToaster pageId="first" />);
  act(() => vi.advanceTimersByTime(9000));
  rerender(<RatingToaster pageId="second" />);
  act(() => vi.advanceTimersByTime(9000));
  expect(toast).not.toHaveBeenCalled();
  theme.isDark = true;
  rerender(<RatingToaster pageId="second" />);
  act(() => vi.advanceTimersByTime(1000));
  expect(toast).toHaveBeenCalledTimes(1);
  expect(toast.mock.calls[0][0].props.pageId).toBe("second");
  expect(toast.mock.calls[0][1]).toEqual({
    toastId: "rating:second",
    theme: "dark",
  });
  unmount();
  expect(dismiss).toHaveBeenLastCalledWith("rating:second");
});

it("does not show stale prompts after unmount or duplicate them in Strict Mode", () => {
  vi.useFakeTimers();
  const { unmount } = render(
    <StrictMode>
      <RatingToaster pageId="page" />
    </StrictMode>,
  );
  act(() => vi.advanceTimersByTime(10000));
  expect(toast).toHaveBeenCalledTimes(1);
  unmount();
  const next = render(<RatingToaster pageId="abandoned" />);
  next.unmount();
  act(() => vi.advanceTimersByTime(10000));
  expect(toast).toHaveBeenCalledTimes(1);
});
