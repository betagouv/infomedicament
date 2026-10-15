import { expect, test } from "@playwright/test";

test("header hydrates before DSFR decorates its elements", async ({ page }) => {
  const hydrationErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && /hydrat/i.test(message.text())) {
      hydrationErrors.push(message.text());
    }
  });

  // Reproduce a slow connection where the layout arrives after DSFR starts.
  await page.route("**/_next/static/chunks/*.js", async (route) => {
    const response = await route.fetch();
    const source = await response.text();
    if (source.includes("src/components/ClientHeader.tsx")) {
      await new Promise((resolve) => setTimeout(resolve, 2500));
    }
    await route.fulfill({ response });
  });

  await page.addInitScript(() => {
    window.localStorage.setItem("greetingModal", String(Date.now()));
  });
  await page.goto("/");
  await expect(page.locator("#fr-header")).toBeVisible();
  // Opening the menu requires React's header and DSFR's event handlers.
  const menu = page.getByRole("button", {
    name: "Classes de médicament",
    exact: true,
  });
  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  expect(hydrationErrors).toEqual([]);
});
