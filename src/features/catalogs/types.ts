import type { Database } from "@/types/database.generated";

export type Location = Database["public"]["Tables"]["locations"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type PaymentMethod =
  Database["public"]["Tables"]["payment_methods"]["Row"];
export type ProductUnit = Database["public"]["Enums"]["product_unit"];

export type CatalogSnapshot = {
  locations: Location[];
  products: Product[];
  paymentMethods: PaymentMethod[];
};
