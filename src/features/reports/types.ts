import type { Database } from "@/types/database.generated";

export type ReconciliationRow = {
  work_shift_id: string;
  operational_date: string;
  location_id: string;
  location_name: string;
  location_code: string;
  opened_at: string;
  closed_at: string;
  opened_by_name: string;
  closed_by_name: string;
  product_id: string;
  product_name: string;
  product_code: string;
  unit_type: "UNIT" | "LITER";
  opening_quantity: number;
  entry_quantity: number;
  received_transfer_quantity: number;
  positive_adjustment_quantity: number;
  sent_transfer_quantity: number;
  waste_quantity: number;
  negative_adjustment_quantity: number;
  closing_quantity: number;
  calculated_sales: number;
  cash_amount: number;
  yape_amount: number;
  closing_total: number;
};

export type MonthlyDailyIncomeRow =
  Database["public"]["Functions"]["management_monthly_daily_income"]["Returns"][number];

export type MonthlyLocationIncomeRow =
  Database["public"]["Functions"]["management_monthly_location_income"]["Returns"][number];

export type MonthlyProductSalesRow =
  Database["public"]["Functions"]["management_monthly_product_sales"]["Returns"][number];

export type PeriodDailyIncomeRow =
  Database["public"]["Functions"]["management_period_daily_income"]["Returns"][number];

export type PeriodLocationIncomeRow =
  Database["public"]["Functions"]["management_period_location_income"]["Returns"][number];

export type PeriodProductSalesRow =
  Database["public"]["Functions"]["management_period_product_sales"]["Returns"][number];
