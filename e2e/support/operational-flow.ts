import { expect, type Page } from "@playwright/test";

export const e2eProducts = [
  "Empanada Clasica",
  "Empanada Pizza",
  "Empanada Full Queso",
  "Api Morado",
  "Api Blanco",
  "Emoliente",
] as const;

export async function loginEmployee(
  page: Page,
  email: string,
  password: string,
) {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "Correo", exact: true }).fill(email);
  await page.getByRole("textbox", { name: "Contraseña", exact: true }).fill(password);
  await page.getByRole("button", { name: "Ingresar", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

export async function openShift(page: Page, location: string) {
  await page.goto("/dashboard/shift");
  const locationLabel = location === "Av. Jesus"
    ? "Av. Jesus · JESUS"
    : "Miguel Grau · MIGUEL_GRAU";
  await page.getByRole("combobox", { name: "Sede", exact: true })
    .selectOption({ label: locationLabel });
  await page.getByRole("spinbutton", { name: "Efectivo inicial" }).fill("100");

  for (const product of e2eProducts) {
    await page.getByRole("spinbutton", { name: `Cantidad de ${product}` })
      .fill(product.startsWith("Empanada") ? "10" : "5.5");
  }

  await page.getByRole("button", { name: "Confirmar apertura" }).click();
  await expect(page.getByRole("heading", { name: location, exact: true }))
    .toBeVisible();
}

export async function openBothLocations(page: Page) {
  await openShift(page, "Av. Jesus");
  await openShift(page, "Miguel Grau");
}
