import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NoticeChunkResultsBox from "./NoticeChunkResultsBox";

beforeEach(() => { Element.prototype.scrollIntoView = vi.fn(); });

describe("leaflet excerpt results", () => {
  it("shows short quotes and links directly to the source in the full leaflet without copying the context inline", () => {
    const { container } = render(<>
      <div id="noticeContainer"><h3 id="children">Enfants — source</h3></div>
      <NoticeChunkResultsBox loading={false} onClose={vi.fn()} result={{
        status: "supported", sourceVersion: "version", passages: [
          {
            id: "a", headingPath: ["Utilisation", "Enfants"],
            html: "<h3>Enfants</h3><p>Long contexte.</p><p>Condition complète.</p><table><tr><th>Poids</th><td>Instructions</td></tr></table>",
            target: { anchor: "children" },
            quotes: [{ id: "q1", html: "<p>Condition complète.</p>", headingPath: ["Utilisation", "Enfants"] }],
          },
          {
            id: "b", headingPath: ["Avertissements"], html: "<p>Restriction complémentaire.</p>", target: {},
            quotes: [{ id: "q2", html: "<p>Restriction complémentaire.</p>", headingPath: ["Avertissements"] }],
          },
        ],
      }} />
    </>);
    expect(screen.getByRole("region", { name: "Extraits de la notice" })).not.toBeNull();
    expect(screen.getByText("Dans la rubrique « Enfants », la notice indique :")).not.toBeNull();
    expect(Array.from(container.querySelectorAll("blockquote")).map((quote) => quote.textContent)).toEqual(["Condition complète.", "Restriction complémentaire."]);
    expect(container.querySelector("details")).toBeNull();
    expect(screen.queryByText("Long contexte.")).toBeNull();
    expect(screen.queryByRole("table")).toBeNull();
    const source = screen.getByRole("link", { name: "Source [1] — Voir dans la notice" });
    expect(source.getAttribute("href")).toBe("#children");
    expect(screen.getByRole("link", { name: "Source [2] — Voir dans la notice" }).getAttribute("href")).toBe("#noticeContainer");
    fireEvent.click(source);
    expect(container.querySelector("#children")?.classList.contains("notice-highlight")).toBe(true);
    expect(container.querySelector("article .notice-highlight")).toBeNull();
  });

  it.each([
    ["insufficient_evidence", "Nous n’avons pas identifié"],
    ["unavailable", "La notice n’est pas disponible"],
    ["error", "La recherche dans la notice n’a pas pu aboutir"],
  ] as const)("shows a distinct %s message", (status, message) => {
    render(<NoticeChunkResultsBox loading={false} result={{ status, passages: [] }} onClose={vi.fn()} />);
    expect(screen.getByRole("status").textContent).toContain(message);
    expect(screen.queryByText("Extraits de la notice")).toBeNull();
  });
});
