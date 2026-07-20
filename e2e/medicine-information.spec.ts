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
  await page.goto("/medicaments/69730375");

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
  await page.goto("/medicaments/61651634");

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
  await page.goto("/medicaments/68495013");
  await openDetailedView(page);

  await expect(
    page.getByText("Date d'autorisation de mise sur le marché"),
  ).toBeVisible();
  await expect(page.getByText("Le 23/04/2024", { exact: true })).toBeVisible();
});

test("FI_020: therapeutic indications are visible on the medicine page", async ({
  page,
}) => {
  await page.goto("/medicaments/65231460");
  await openDetailedView(page);

  await expect(
    page.getByRole("heading", { name: "Indications", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      /OMEPRAZOLE TEVA CONSEIL 20 mg, gélule gastro-résistante est utilisé chez les adultes pour le traitement à court terme des symptômes de reflux/,
    ),
  ).toBeVisible();
});

test("FI_011: the generic tag explains what a generic medicine is", async ({
  page,
}) => {
  await page.goto("/medicaments/65231460");
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
  await page.goto("/medicaments/65231460");
  await openDetailedView(page);

  const alternatives = page
    .getByRole("link", { name: "Voir les alternatives" })
    .filter({ visible: true });
  await expect(alternatives).toHaveAttribute("href", "/generiques/64103828");
  await alternatives.click();

  await expect(page).toHaveURL(/\/generiques\/64103828$/);
  await expect(
    page.getByRole("heading", { name: "Omeprazole 20 mg", exact: true }),
  ).toBeVisible();
});

test("FI_028–FI_042: composition and presentation details are complete", async ({
  page,
}) => {
  await page.goto("/medicaments/65231460");
  await openDetailedView(page);

  await expect(
    page.getByRole("heading", { name: "Composition", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Pour une gélule > oméprazole 20 mg", { exact: true }),
  ).toBeVisible();

  const presentation = page.getByRole("listitem").filter({
    hasText: "Code CIP : 267 527-4 ou 34009 267 527 4 3",
  });
  await expect(presentation).toContainText(
    "1 plaquette aluminium de 7 gélules",
  );
  await expect(presentation).toContainText("Prix libre - non remboursable");
  await expect(presentation).toContainText(
    "Déclaration de commercialisation : 06/09/2013",
  );
  await expect(presentation).toContainText(
    "Cette présentation n'est pas agréée aux collectivités.",
  );
});

test("FI_044–FI_045: available good-use documents are shown as external links", async ({
  page,
}) => {
  await page.goto("/medicaments/60059081");
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

test("FI_046: a generic without an SMR links to its generic group", async ({
  page,
}) => {
  await page.goto("/medicaments/65231460");
  await openDetailedView(page);
  await page
    .getByRole("link", { name: "Documents HAS (Bon usage, SMR, ASMR)" })
    .filter({ visible: true })
    .click();

  const smrGuidance = page.getByText(
    /Ce médicament étant un générique, le SMR n'a pas été évalué/,
  );
  await expect(smrGuidance).toBeVisible();
  await expect(
    smrGuidance.getByRole("link", {
      name: "cliquez ici pour accéder au groupe générique",
    }),
  ).toHaveAttribute("href", "/generiques/64103828");
});

test("FI_047–FI_048: complete SMR and ASMR histories are displayed", async ({
  page,
}) => {
  await page.goto("/medicaments/67613291");
  await openDetailedView(page);
  await page
    .getByRole("link", { name: "Documents HAS (Bon usage, SMR, ASMR)" })
    .filter({ visible: true })
    .click();

  const smrTable = page.getByRole("table").filter({
    has: page.getByRole("columnheader", { name: "Valeur du SMR" }),
  });
  await expect(smrTable.getByRole("row")).toHaveCount(4);

  const asmrTable = page.getByRole("table").filter({
    has: page.getByRole("columnheader", { name: "Valeur de l'ASMR" }),
  });
  await expect(asmrTable.getByRole("row")).toHaveCount(4);
});
