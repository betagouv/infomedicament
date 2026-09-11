import { render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import SwitchNoticeAdvancedBlock from "./SwitchNoticeAdvancedBlock";

vi.mock("@/services/tracking", () => ({
  trackEvent: vi.fn(),
}));

describe("SwitchNoticeAdvancedBlock", () => {
  it("is disabled in server markup until the client has hydrated", async () => {
    const props = {
      isAdvanced: false,
      onGoToAdvanced: vi.fn(),
    };

    const serverMarkup = renderToString(
      <SwitchNoticeAdvancedBlock {...props} />,
    );
    expect(serverMarkup).toMatch(/<input[^>]+disabled=""/);

    render(<SwitchNoticeAdvancedBlock {...props} />);
    await waitFor(() => {
      expect((screen.getByRole("checkbox") as HTMLInputElement).disabled).toBe(false);
    });
  });
});
