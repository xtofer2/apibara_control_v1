import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  LocationCatalogInput,
  ProductCatalogInput,
} from "@/features/catalogs/schemas/catalog";
import type { Database } from "@/types/database.generated";

type CatalogClient = SupabaseClient<Database>;

export async function findLocations(supabase: CatalogClient) {
  return supabase
    .from("locations")
    .select("id, name, code, active, created_at, updated_at")
    .order("active", { ascending: false })
    .order("name");
}

export async function findProducts(supabase: CatalogClient) {
  return supabase
    .from("products")
    .select(
      "id, name, code, unit_type, active, display_order, created_at, updated_at",
    )
    .order("active", { ascending: false })
    .order("display_order")
    .order("name");
}

export async function findPaymentMethods(supabase: CatalogClient) {
  return supabase
    .from("payment_methods")
    .select("id, name, code, active, created_at")
    .order("active", { ascending: false })
    .order("name");
}

export async function insertLocation(
  supabase: CatalogClient,
  input: LocationCatalogInput,
) {
  return supabase.from("locations").insert(input).select("id").single();
}

export async function updateLocationById(
  supabase: CatalogClient,
  id: string,
  input: LocationCatalogInput,
) {
  return supabase
    .from("locations")
    .update(input)
    .eq("id", id)
    .select("id")
    .single();
}

export async function insertProduct(
  supabase: CatalogClient,
  input: ProductCatalogInput,
) {
  return supabase.from("products").insert(input).select("id").single();
}

export async function updateProductById(
  supabase: CatalogClient,
  id: string,
  input: ProductCatalogInput,
) {
  return supabase
    .from("products")
    .update(input)
    .eq("id", id)
    .select("id")
    .single();
}
