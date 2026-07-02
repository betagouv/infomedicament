import { test, expect } from "@playwright/test";

test("navigate from the home to Gencebok 10 mg/mL, solution", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Accepter et entrer sur le site" })
    .click();
  await page.getByRole("button", { name: "Classes de médicament" }).click();
  await page.getByRole("link", { name: "Système digestif" }).click();
  await page.getByRole("link", { name: "Nausée et vomissement33" }).click();
  await page.getByRole("link", { name: "caféine3 médicaments" }).click();
  await page.getByText("Citrate De Cafeine Cooper1").click();
  await page.getByText("Gencebok1 format de médicament").click();
  await page.getByRole("link", { name: "Gencebok 10 mg/mL, solution" }).click();
});
