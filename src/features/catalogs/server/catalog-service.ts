import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";

import type {
  LocationCatalogInput,
  ProductCatalogInput,
} from "@/features/catalogs/schemas/catalog";
import { createClient } from "@/lib/supabase/server";

import {
  findLocations,
  findPaymentMethods,
  findProducts,
  insertLocation,
  insertProduct,
  updateLocationById,
  updateProductById,
} from "./catalog-repository";

export class CatalogServiceError extends Error {
  constructor(
    public readonly code: "CONFLICT" | "FORBIDDEN" | "INVALID_CHANGE" | "UNKNOWN",
    message: string,
  ) {
    super(message);
    this.name = "CatalogServiceError";
  }
}

function toCatalogServiceError(error: PostgrestError) {
  if (error.code === "23505") {
    return new CatalogServiceError(
      "CONFLICT",
      "Ya existe un registro con ese código.",
    );
  }

  if (error.code === "42501") {
    return new CatalogServiceError(
      "FORBIDDEN",
      "Tu rol no permite modificar este catálogo.",
    );
  }

  if (error.message.includes("Cannot change unit type")) {
    return new CatalogServiceError(
      "INVALID_CHANGE",
      "La unidad no puede cambiar después de usar el producto en operaciones.",
    );
  }

  return new CatalogServiceError(
    "UNKNOWN",
    "No se pudo guardar el catálogo. Intenta nuevamente.",
  );
}

export async function getCatalogSnapshot() {
  const supabase = await createClient();
  const [locationsResult, productsResult, paymentMethodsResult] =
    await Promise.all([
      findLocations(supabase),
      findProducts(supabase),
      findPaymentMethods(supabase),
    ]);

  const error =
    locationsResult.error ?? productsResult.error ?? paymentMethodsResult.error;

  if (error) {
    throw toCatalogServiceError(error);
  }

  return {
    locations: locationsResult.data ?? [],
    products: productsResult.data ?? [],
    paymentMethods: paymentMethodsResult.data ?? [],
  };
}

export async function createLocation(input: LocationCatalogInput) {
  const supabase = await createClient();
  const { error } = await insertLocation(supabase, input);

  if (error) {
    throw toCatalogServiceError(error);
  }
}

export async function updateLocation(
  id: string,
  input: LocationCatalogInput,
) {
  const supabase = await createClient();
  const { error } = await updateLocationById(supabase, id, input);

  if (error) {
    throw toCatalogServiceError(error);
  }
}

export async function createProduct(input: ProductCatalogInput) {
  const supabase = await createClient();
  const { error } = await insertProduct(supabase, input);

  if (error) {
    throw toCatalogServiceError(error);
  }
}

export async function updateProduct(
  id: string,
  input: ProductCatalogInput,
) {
  const supabase = await createClient();
  const { error } = await updateProductById(supabase, id, input);

  if (error) {
    throw toCatalogServiceError(error);
  }
}
