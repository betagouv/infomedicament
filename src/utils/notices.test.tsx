import { describe, expect, it } from "vitest";
import { cleanStringContent, formatNoticeDateNotif } from "./notices";

describe("utils notices", () => {
  it("replacePluralSingular", async () => {
    expect(formatNoticeDateNotif("ANSM - Mis à jour le : 19/02/2026")).toBe("Notice mise à jour le 19/02/2026");
    expect(formatNoticeDateNotif("Mis à jour : 28/10/2008")).toBe("Notice mise à jour le 28/10/2008");
  });

  it("cleanStringContent", async () => {
    const rawStr: string = `<p class="AmmCorpsTexte">Si vous ressentez un quelconque effet indésirable, parlez-en à votre médecin, votre pharmacien ou à votre infirmier/ère. 
    Ceci s’applique aussi à tout effet indésirable qui ne serait pas mentionné dans cette notice. 
    Vous pouvez également déclarer les effets indésirables directement via le système national de déclaration : 
    <a href="https://ansm.sante.fr/">Agence nationale de sécurité du médicament et des produits de santé (ANSM)</a> et réseau des Centres Régionaux de Pharmacovigilance - Site internet :
    <span style="color:red"> </span><a href="https://signalement.social-sante.gouv.fr/">https://signalement.social-sante.gouv.fr</a></p>"`;
    const finalStr: string = `<p class="AmmCorpsTexte">Si vous ressentez un quelconque effet indésirable, parlez-en à votre médecin, votre pharmacien ou à votre infirmier/ère. 
    Ceci s’applique aussi à tout effet indésirable qui ne serait pas mentionné dans cette notice. 
    Vous pouvez également déclarer les effets indésirables directement via le système national de déclaration : 
    <a target="_blank" rel="noopener noreferrer" href="https://ansm.sante.fr/">Agence nationale de sécurité du médicament et des produits de santé (ANSM)</a> et réseau des Centres Régionaux de Pharmacovigilance - Site internet :
    <span style="color:red"> </span><a target="_blank" rel="noopener noreferrer" href="https://signalement.social-sante.gouv.fr/">https://signalement.social-sante.gouv.fr</a></p>"`;

    expect(cleanStringContent(rawStr)).toBe(finalStr);
  });

});