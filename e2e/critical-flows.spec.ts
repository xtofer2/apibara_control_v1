import { expect, test } from "@playwright/test";

import {
  e2eProducts,
  loginEmployee,
  openBothLocations,
  openShift,
} from "./support/operational-flow";
import { resetAndSeedEmployee } from "./support/local-supabase";

const email = "critical.employee@apibara.local";
const password = "CriticalE2E!2026";

test.beforeEach(async () => {
  await resetAndSeedEmployee(email, password);
});

test("employee login, attendance, opening and closing", async ({ page }) => {
  await loginEmployee(page, email, password);

  await page.goto("/dashboard/attendance");
  await page.getByRole("combobox", { name: "Sede", exact: true })
    .selectOption({ label: "Av. Jesus · JESUS" });
  await page.getByRole("button", { name: "Registrar entrada" }).click();
  await expect(page.getByText("Jornada en curso")).toBeVisible();

  await openShift(page, "Av. Jesus");

  await page.goto("/dashboard/closing");
  for (const product of e2eProducts) {
    await page.getByRole("spinbutton", { name: `Cantidad final de ${product}` })
      .fill(product.startsWith("Empanada") ? "4" : "2.25");
  }
  await page.getByRole("spinbutton", { name: "Efectivo" }).fill("200");
  await page.getByRole("spinbutton", { name: "Yape" }).fill("150");
  await page.getByRole("button", { name: "Cerrar turno definitivamente" }).click();

  await expect(page.getByText("No hay turnos abiertos para cerrar.")).toBeVisible();
  await expect(page.getByText("S/ 350.00", { exact: true })).toBeVisible();
});

test("sent transfer is received with exact quantities", async ({ page }) => {
  await loginEmployee(page, email, password);
  await openBothLocations(page);
  await page.goto("/dashboard/transfers");

  await page.getByRole("combobox", { name: "Turno de origen" })
    .selectOption({ label: "Av. Jesus" });
  await page.getByRole("combobox", { name: "Sede destino" })
    .selectOption({ label: "Miguel Grau" });
  await page.getByRole("spinbutton", { name: "Cantidad enviada de Empanada Clasica" })
    .fill("3");
  await page.getByRole("button", { name: "Confirmar envío" }).click();

  await expect(page.getByText("En tránsito", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Confirmar recepción" }).click();
  await expect(page.getByText("Recibida", { exact: true })).toBeVisible();
});

test("sent transfer is received with documented differences", async ({ page }) => {
  await loginEmployee(page, email, password);
  await openBothLocations(page);
  await page.goto("/dashboard/transfers");

  await page.getByRole("combobox", { name: "Turno de origen" })
    .selectOption({ label: "Av. Jesus" });
  await page.getByRole("combobox", { name: "Sede destino" })
    .selectOption({ label: "Miguel Grau" });
  await page.getByRole("spinbutton", { name: "Cantidad enviada de Empanada Clasica" })
    .fill("3");
  await page.getByRole("button", { name: "Confirmar envío" }).click();

  await page.getByRole("spinbutton", { name: "Cantidad recibida de Empanada Clasica" })
    .fill("2");
  await page.getByRole("textbox", { name: "Observación de recepción" })
    .fill("Faltó una unidad al recibir");
  await page.getByRole("button", { name: "Confirmar recepción" }).click();

  await expect(page.getByText("Recibida con diferencias", { exact: true })).toBeVisible();
  await expect(page.getByText("Diferencia: Faltó una unidad al recibir")).toBeVisible();
});

test("employee cannot access manager or admin routes", async ({ page }) => {
  await loginEmployee(page, email, password);

  for (const route of ["reports", "audit", "admin"]) {
    await page.goto(`/dashboard/${route}`);
    await expect(page).toHaveURL(/\/dashboard\/forbidden$/);
    await expect(page.getByRole("heading")).toContainText(/acceso|permiso/i);
  }
});
