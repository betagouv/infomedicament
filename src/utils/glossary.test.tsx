import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { withDefinition, withDefinitions } from "./glossary";
import { Definition } from "@/types/GlossaireTypes";

const posologie: Definition = {
  nom: "Posologie",
  definition: "<p>Dose et rythme de prise d'un médicament.</p>",
  source: "",
  a_souligner: true,
};

describe("utils/glossary - withDefinitions", () => {
  it("links the word to its definition, whatever the case", () => {
    render(<p>{withDefinitions("Respecter la Posologie.", [posologie])}</p>);
    const link = screen.getByRole("button");

    expect(link.textContent).toBe("Posologie");
    expect(link.getAttribute("href")).toBe("#Definition-Posologie");
    expect(link.closest("p")?.textContent).toBe("Respecter la Posologie.");
  });

  it("links each occurrence of the word in a text", () => {
    render(<p>{withDefinitions("Posologie : respecter la posologie et les posologies.", [posologie])}</p>);
    const links = screen.getAllByRole("button");

    expect(links.map((link) => link.textContent)).toEqual(["Posologie", "posologie", "posologies"]);
    expect(links[0].closest("p")?.textContent).toBe("Posologie : respecter la posologie et les posologies.");
  });

  it("links the plural of the word", () => {
    render(<p>{withDefinitions("Les posologies sont différentes.", [posologie])}</p>);

    expect(screen.getByRole("button").textContent).toBe("posologies");
  });

  it("does not link a word containing the definition word", () => {
    render(<p>{withDefinitions("Une posologique erreur.", [posologie])}</p>);

    expect(screen.queryByRole("button")).toBeNull();
  });

  it("keeps the nested elements unchanged", () => {
    render(<p>{withDefinitions(["Vérifier la posologie ", <strong key="strong">posologie</strong>], [posologie])}</p>);

    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.getByText("posologie", { selector: "strong" })).toBeTruthy();
  });

  it("keeps the text without definition", () => {
    render(<p>{withDefinitions("Respecter la dose.", [])}</p>);

    expect(screen.getByText("Respecter la dose.")).toBeTruthy();
  });
});

describe("utils/glossary - withDefinition", () => {
  it("links each occurrence of the word", () => {
    render(<p>{withDefinition("Posologie : respecter la posologie.", posologie)}</p>);
    const links = screen.getAllByRole("button");

    expect(links.map((link) => link.textContent)).toEqual(["Posologie", "posologie"]);
    expect(links[0].closest("p")?.textContent).toBe("Posologie : respecter la posologie.");
  });
});
