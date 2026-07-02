import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("greetingModal", String(Date.now()));
  });
});

test("homepage renders the main search experience", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /informations claires, précises et officielles/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: /que cherchez-vous/i }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Articles" })).toBeVisible();
});

test("searching a medicament from autocomplete opens its detail page", async ({
  page,
}) => {
  await page.goto("/");

  const searchInput = page.getByRole("combobox", {
    name: /que cherchez-vous/i,
  });
  await searchInput.click();
  await searchInput.pressSequentially("Dolipran");

  await page
    .getByRole("option", { name: "Doliprane 1000 mg, comprimé", exact: true })
    .click();

  await expect(page).toHaveURL(/\/medicaments\/60234100$/);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Doliprane 1000 mg, comprimé",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText("Notice complète")).toBeVisible();
});
