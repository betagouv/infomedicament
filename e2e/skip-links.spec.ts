import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("greetingModal", String(Date.now()));
  });
});

test("the first keyboard shortcut moves focus to the main content", async ({
  page,
}) => {
  await page.goto("/rechercher");
  await page.keyboard.press("Tab");
  const contentLink = page.getByRole("link", { name: "Accéder au contenu" });
  await expect(contentLink).toBeFocused();
  await expect(contentLink).toBeInViewport();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
});

for (const path of [
  "/",
  "/rechercher",
  "/rechercher?advanced=1",
  "/a-propos",
]) {
  test(`the search shortcut focuses the search field on ${path}`, async ({
    page,
  }) => {
    await page.goto(path);
    // Wait for the route-dependent header search and client form to hydrate.
    const input = path.includes("advanced=1")
      ? page.getByRole("textbox", { name: "Nom de la spécialité", exact: true })
      : page.getByRole("combobox");
    await expect(input).toBeEnabled();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("link", { name: "Accéder à la recherche" }),
    ).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(input).toBeFocused();
  });
}

test("the search shortcut opens the mobile header search and focuses its field", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/a-propos");
  await expect(page.locator("#fr-header-search-button")).toBeVisible();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("combobox")).toBeVisible();
  await expect(page.getByRole("combobox")).toBeFocused();
});
