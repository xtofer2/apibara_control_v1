"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { CatalogActionState } from "@/features/catalogs/action-state";
import {
  locationCatalogSchema,
  productCatalogSchema,
} from "@/features/catalogs/schemas/catalog";
import {
  CatalogServiceError,
  createLocation,
  createProduct,
  updateLocation,
  updateProduct,
} from "@/features/catalogs/server/catalog-service";
import { requirePermission } from "@/features/auth/server/require-permission";

function parseLocationFormData(formData: FormData) {
  return locationCatalogSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code"),
    active: formData.get("active") === "on",
  });
}

function parseProductFormData(formData: FormData) {
  return productCatalogSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code"),
    unit_type: formData.get("unit_type"),
    display_order: formData.get("display_order"),
    active: formData.get("active") === "on",
  });
}

function validationError(error: z.ZodError): CatalogActionState {
  return {
    status: "error",
    message: "Revisa los campos indicados.",
    fieldErrors: error.flatten().fieldErrors,
  };
}

function serviceError(error: unknown): CatalogActionState {
  if (error instanceof CatalogServiceError) {
    return { status: "error", message: error.message };
  }

  return {
    status: "error",
    message: "Ocurrió un error inesperado. Intenta nuevamente.",
  };
}

export async function createLocationAction(
  _previousState: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  await requirePermission("catalogs.manage");
  const parsed = parseLocationFormData(formData);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    await createLocation(parsed.data);
  } catch (error) {
    return serviceError(error);
  }

  revalidatePath("/dashboard/catalogs");
  return { status: "success", message: "Sede creada correctamente." };
}

export async function updateLocationAction(
  id: string,
  _previousState: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  await requirePermission("catalogs.manage");
  const parsed = parseLocationFormData(formData);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    await updateLocation(id, parsed.data);
  } catch (error) {
    return serviceError(error);
  }

  revalidatePath("/dashboard/catalogs");
  return { status: "success", message: "Sede actualizada correctamente." };
}

export async function createProductAction(
  _previousState: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  await requirePermission("catalogs.manage");
  const parsed = parseProductFormData(formData);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    await createProduct(parsed.data);
  } catch (error) {
    return serviceError(error);
  }

  revalidatePath("/dashboard/catalogs");
  return { status: "success", message: "Producto creado correctamente." };
}

export async function updateProductAction(
  id: string,
  _previousState: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  await requirePermission("catalogs.manage");
  const parsed = parseProductFormData(formData);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    await updateProduct(id, parsed.data);
  } catch (error) {
    return serviceError(error);
  }

  revalidatePath("/dashboard/catalogs");
  return { status: "success", message: "Producto actualizado correctamente." };
}
