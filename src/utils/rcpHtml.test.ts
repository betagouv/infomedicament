import { describe, it, expect } from "vitest";
import { getRcpSectionText } from "./rcpHtml";

// ANSM RCP format (BDPM): titles are paragraphs with a class, the anchor is a <a name> inside
const ansmRcp = `
<p class="AmmAnnexeTitre1"><a name="RcpDonneesCliniques">4. DONNEES CLINIQUES</a></p>
<p class="AmmAnnexeTitre2"><a name="RcpPosoAdmin"><span>4.2. Posologie et mode d'administration</span></a></p>
<p class=AmmCorpsTexte>Un comprimé par prise.</p>
<p class="AmmAnnexeTitre2"><a name="RcpContreindications"><span id='4.3._Contre-indications'>4.3. Contre-indications</span></a></p>
<p class=AmmListePuces1><a name="_Toc142278919">Hypersensibilité au paracétamol.</a></p>
<p class=AmmListePuces1>Insuffisance hépatique sévère.</p>
<p class="AmmAnnexeTitre2"><a name="RcpMisesEnGarde"><span>4.4. Mises en garde spéciales et précautions d'emploi</span></a></p>
<p class=AmmCorpsTexte>En cas d'hépatite virale aiguë, il convient d'arrêter le traitement.</p>
<p class="AmmAnnexeTitre3">Précautions d'emploi</p>
<p class=AmmCorpsTexte>Adulte de poids inférieur à 50 kg.</p>
<p class="AmmAnnexeTitre2"><a name="RcpInteractionsMed"><span>4.5. Interactions</span></a></p>
<p class=AmmCorpsTexte>Aucune.</p>
<p class="AmmAnnexeTitre1"><a name="RcpPropPharmacologiques">5. PROPRIETES PHARMACOLOGIQUES</a></p>
<p class=AmmCorpsTexte>Analgésique.</p>
`;

describe("getRcpSectionText", () => {
  it("extracts the paragraphs of an ANSM section anchored by a name inside the title", () => {
    expect(getRcpSectionText(ansmRcp, "RcpContreindications")).toBe(
      "4.3. Contre-indications Hypersensibilité au paracétamol. Insuffisance hépatique sévère.",
    );
  });

  it("keeps the sub-titles of the section", () => {
    expect(getRcpSectionText(ansmRcp, "RcpMisesEnGarde")).toBe(
      "4.4. Mises en garde spéciales et précautions d'emploi "
      + "En cas d'hépatite virale aiguë, il convient d'arrêter le traitement. "
      + "Précautions d'emploi Adulte de poids inférieur à 50 kg.",
    );
  });

  it("stops the last sub-section at the next higher level title", () => {
    expect(getRcpSectionText(ansmRcp, "RcpInteractionsMed")).toBe("4.5. Interactions Aucune.");
  });

  it("extracts a section anchored by an id on a heading", () => {
    const html = `
      <h3 id="RcpContreindications">4.3. Contre-indications</h3>
      <p>Hypersensibilité.</p>
      <h4>Sous-titre</h4>
      <p>Détail.</p>
      <h3 id="RcpMisesEnGarde">4.4. Mises en garde</h3>
      <p>Autre rubrique.</p>
    `;

    expect(getRcpSectionText(html, "RcpContreindications")).toBe(
      "4.3. Contre-indications Hypersensibilité. Sous-titre Détail.",
    );
  });

  it("extracts a section anchored by an id inside an ANSM title", () => {
    const html = `
      <p class="AmmAnnexeTitre2"><a id="RcpContreindications">4.3. Contre-indications</a></p>
      <p class=AmmCorpsTexte>Hypersensibilité.</p>
      <p class="AmmAnnexeTitre2"><a id="RcpMisesEnGarde">4.4. Mises en garde</a></p>
    `;

    expect(getRcpSectionText(html, "RcpContreindications")).toBe("4.3. Contre-indications Hypersensibilité.");
  });

  it("finds a title without anchor by its section number", () => {
    // Doliprane 1000 mg RCP: the 4.5 title has no anchor
    const html = `
      <p class="AmmAnnexeTitre2"><a name="RcpMisesEnGarde">4.4. Mises en garde</a></p>
      <p class=AmmCorpsTexte>Mise en garde.</p>
      <p class=AmmAnnexeTitre2>4.5. Interactions avec d'autres médicaments </p>
      <p class=AmmAnnexeTitre3>Associations faisant l'objet de précautions d'emploi</p>
      <p class=AmmCorpsTexte>+ Antivitamines K</p>
      <p class=AmmAnnexeTitre2>4.6. Fertilité, grossesse et allaitement</p>
    `;

    expect(getRcpSectionText(html, "RcpInteractionsMed", "4.5")).toBe(
      "4.5. Interactions avec d'autres médicaments Associations faisant l'objet de précautions d'emploi + Antivitamines K",
    );
    expect(getRcpSectionText(html, "RcpInteractionsMed")).toBe("");
  });

  it("does not take a title with a longer section number", () => {
    const html = `
      <p class=AmmAnnexeTitre2>4.50. Autre rubrique</p>
      <p class=AmmCorpsTexte>Autre.</p>
    `;

    expect(getRcpSectionText(html, "RcpInteractionsMed", "4.5")).toBe("");
  });

  it("returns an empty text when the section is missing", () => {
    expect(getRcpSectionText(ansmRcp, "RcpSurdosage")).toBe("");
    expect(getRcpSectionText("", "RcpContreindications")).toBe("");
  });
});
