import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("greetingModal", String(Date.now()));
  });
});

async function openDetailedView(page: Page) {
  await page.getByLabel("Version détaillée").filter({ visible: true }).check();
  await expect(
    page.getByRole("heading", { name: "Résumé", exact: true }),
  ).toBeVisible();
}

test("FI_015: a medicine under reinforced monitoring explains the warning", async ({
  page,
}) => {
  await page.goto("/medicaments/60184188");

  await expect(
    page.getByRole("heading", {
      name: "Médicament sous surveillance renforcée",
    }),
  ).toBeVisible();

  const explanation = page
    .getByText(/Ce médicament fait l'objet d'une surveillance renforcée\./)
    .filter({ visible: true });
  await expect(explanation).toBeVisible();
  await expect(
    explanation.getByRole("link", { name: "cliquez ici" }),
  ).toHaveAttribute("target", "_blank");
});

test("FI_018: a withdrawn medicine displays the public-health warning", async ({
  page,
}) => {
  await page.goto("/medicaments/60046529");

  await expect(
    page.getByRole("heading", {
      name: /Attention ce médicament fait l’objet d’un retrait ou d’une suspension/,
    }),
  ).toBeVisible();
  await expect(
    page
      .getByText(
        /il vous est recommandé de prendre contact, dans les meilleurs délais/,
      )
      .filter({ visible: true }),
  ).toBeVisible();
});

test("FI_017: an unavailable medicine recommends discussing alternatives", async ({
  page,
}) => {
  await page.goto("/medicaments/60004505");

  await expect(
    page.getByRole("heading", {
      name: "Ce médicament n'est ou ne sera bientôt plus disponible sur le marché.",
    }),
  ).toBeVisible();
  await expect(
    page
      .getByText(/qui pourra vous orienter vers un autre traitement/)
      .filter({ visible: true }),
  ).toBeVisible();
});

test("FI_001–FI_008: the authorization date is exposed in detailed information", async ({
  page,
}) => {
  await page.goto("/medicaments/60002283");
  await openDetailedView(page);

  await expect(
    page.getByText("Date d'autorisation de mise sur le marché"),
  ).toBeVisible();
  await expect(page.getByText("Le 28/10/2010", { exact: true })).toBeVisible();
});

test("FI_020: therapeutic indications are visible on the medicine page", async ({
  page,
}) => {
  await page.goto("/medicaments/60002283");
  await openDetailedView(page);

  await expect(
    page.getByRole("heading", { name: "Indications", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      /ANASTROZOLE ACCORD est utilisé dans le traitement du cancer du sein de la femme ménopausée/,
    ),
  ).toBeVisible();
});

test("FI_011: the generic tag explains what a generic medicine is", async ({
  page,
}) => {
  await page.goto("/medicaments/60002283");
  await openDetailedView(page);

  await page
    .getByRole("button", { name: "Générique", exact: true })
    .filter({ visible: true })
    .click();

  const dialog = page.getByRole("dialog").filter({ visible: true });
  await expect(
    dialog.getByRole("heading", {
      name: "Princeps et générique, qu’est-ce que c’est ?",
    }),
  ).toBeVisible();
  await expect(dialog).toContainText(
    "Le médicament de référence et les médicaments qui en sont génériques constituent un groupe générique.",
  );
});

test("FI_026–FI_027: a generic medicine links to its generic group", async ({
  page,
}) => {
  await page.goto("/medicaments/60002283");
  await openDetailedView(page);

  const alternatives = page
    .getByRole("link", { name: "Voir les alternatives" })
    .filter({ visible: true });
  await expect(alternatives).toHaveAttribute("href", "/generiques/62303214");
  await alternatives.click();

  await expect(page).toHaveURL(/\/generiques\/62303214$/);
  await expect(
    page.getByRole("heading", { name: /Anastrozole 1 mg/i }),
  ).toBeVisible();
});

test("FI_028–FI_042: composition and presentation details are complete", async ({
  page,
}) => {
  await page.goto("/medicaments/60002283");
  await openDetailedView(page);

  await expect(
    page.getByRole("heading", { name: "Composition", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Pour un comprimé > anastrozole 1,00 mg", { exact: true }),
  ).toBeVisible();

  const presentation = page.getByRole("listitem").filter({
    hasText: "Code CIP : 494 972-9 ou 34009 494 972 9 4",
  });
  await expect(presentation).toContainText(
    "1 plaquette PVC PVDC aluminium de 30 comprimés",
  );
  await expect(presentation).toContainText("Prix 32,61 € - remboursé à 100%");
  await expect(presentation).toContainText(
    "Déclaration de commercialisation : 16/03/2011",
  );
  await expect(
    presentation.getByRole("button", { name: "agréée aux collectivités" }),
  ).toBeVisible();
});

test("FI_044–FI_045: available good-use documents are shown as external links", async ({
  page,
}) => {
  await page.goto("/medicaments/60756917");
  await openDetailedView(page);
  await page
    .getByRole("link", { name: "Documents HAS (Bon usage, SMR, ASMR)" })
    .filter({ visible: true })
    .click();

  await expect(
    page.getByRole("heading", { name: "Documents de bon usage" }),
  ).toBeVisible();
  const document = page.getByRole("link", {
    name: /Conduite à tenir en médecine de premier recours/,
  });
  await expect(document).toHaveAttribute(
    "href",
    "https://www.has-sante.fr/jcms/c_1362146",
  );
  await expect(document).toHaveAttribute("target", "_blank");
  await expect(page.getByText("février 2015", { exact: true })).toBeVisible();
});

test("FI_043 and FI_046: missing HAS data has useful fallback guidance", async ({
  page,
}) => {
  await page.goto("/medicaments/60002283");
  await openDetailedView(page);
  await page
    .getByRole("link", { name: "Documents HAS (Bon usage, SMR, ASMR)" })
    .filter({ visible: true })
    .click();

  await expect(
    page.getByText(/Il n.y a pas de documents de bon usage disponible/),
  ).toBeVisible();
  const smrGuidance = page.getByText(
    /Ce médicament étant un générique, le SMR n'a pas été évalué/,
  );
  await expect(smrGuidance).toBeVisible();
  await expect(
    smrGuidance.getByRole("link", {
      name: "cliquez ici pour accéder au groupe générique",
    }),
  ).toHaveAttribute("href", "/generiques/62303214");
});

test("FI_047–FI_048: complete SMR and ASMR histories are displayed", async ({
  page,
}) => {
  await page.goto("/medicaments/67255976");
  await openDetailedView(page);
  await page
    .getByRole("link", { name: "Documents HAS (Bon usage, SMR, ASMR)" })
    .filter({ visible: true })
    .click();

  const smrTable = page.getByRole("table").filter({
    has: page.getByRole("columnheader", { name: "Valeur du SMR" }),
  });
  await expect(smrTable.getByRole("row")).toHaveCount(8);

  const asmrTable = page.getByRole("table").filter({
    has: page.getByRole("columnheader", { name: "Valeur de l'ASMR" }),
  });
  await expect(asmrTable.getByRole("row")).toHaveCount(6);
});
