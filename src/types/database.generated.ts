export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          check_in_at: string
          check_out_at: string | null
          created_at: string
          id: string
          location_id: string
          updated_at: string
          user_id: string
          work_date: string
        }
        Insert: {
          check_in_at?: string
          check_out_at?: string | null
          created_at?: string
          id?: string
          location_id: string
          updated_at?: string
          user_id: string
          work_date?: string
        }
        Update: {
          check_in_at?: string
          check_out_at?: string | null
          created_at?: string
          id?: string
          location_id?: string
          updated_at?: string
          user_id?: string
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          new_data: Json | null
          old_data: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      closing_items: {
        Row: {
          closing_id: string
          id: string
          product_id: string
          quantity: number
        }
        Insert: {
          closing_id: string
          id?: string
          product_id: string
          quantity: number
        }
        Update: {
          closing_id?: string
          id?: string
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "closing_items_closing_id_fkey"
            columns: ["closing_id"]
            isOneToOne: false
            referencedRelation: "closings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "closing_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      closing_payments: {
        Row: {
          amount: number
          closing_id: string
          id: string
          payment_method_id: string
        }
        Insert: {
          amount: number
          closing_id: string
          id?: string
          payment_method_id: string
        }
        Update: {
          amount?: number
          closing_id?: string
          id?: string
          payment_method_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "closing_payments_closing_id_fkey"
            columns: ["closing_id"]
            isOneToOne: false
            referencedRelation: "closings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "closing_payments_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      closings: {
        Row: {
          created_at: string
          created_by: string
          id: string
          work_shift_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          work_shift_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          work_shift_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "closings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "closings_work_shift_id_fkey"
            columns: ["work_shift_id"]
            isOneToOne: true
            referencedRelation: "work_shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movement_items: {
        Row: {
          id: string
          inventory_movement_id: string
          product_id: string
          quantity: number
        }
        Insert: {
          id?: string
          inventory_movement_id: string
          product_id: string
          quantity: number
        }
        Update: {
          id?: string
          inventory_movement_id?: string
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movement_items_inventory_movement_id_fkey"
            columns: ["inventory_movement_id"]
            isOneToOne: false
            referencedRelation: "inventory_movements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movement_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string
          created_by: string
          id: string
          movement_type: Database["public"]["Enums"]["inventory_movement_type"]
          notes: string | null
          reason: string | null
          work_shift_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          movement_type: Database["public"]["Enums"]["inventory_movement_type"]
          notes?: string | null
          reason?: string | null
          work_shift_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          movement_type?: Database["public"]["Enums"]["inventory_movement_type"]
          notes?: string | null
          reason?: string | null
          work_shift_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_work_shift_id_fkey"
            columns: ["work_shift_id"]
            isOneToOne: false
            referencedRelation: "work_shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      opening_items: {
        Row: {
          id: string
          opening_id: string
          product_id: string
          quantity: number
        }
        Insert: {
          id?: string
          opening_id: string
          product_id: string
          quantity: number
        }
        Update: {
          id?: string
          opening_id?: string
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "opening_items_opening_id_fkey"
            columns: ["opening_id"]
            isOneToOne: false
            referencedRelation: "openings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opening_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      openings: {
        Row: {
          cash_opening: number
          created_at: string
          created_by: string
          id: string
          work_shift_id: string
        }
        Insert: {
          cash_opening: number
          created_at?: string
          created_by: string
          id?: string
          work_shift_id: string
        }
        Update: {
          cash_opening?: number
          created_at?: string
          created_by?: string
          id?: string
          work_shift_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "openings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "openings_work_shift_id_fkey"
            columns: ["work_shift_id"]
            isOneToOne: true
            referencedRelation: "work_shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean
          code: string
          created_at: string
          display_order: number
          id: string
          name: string
          unit_type: Database["public"]["Enums"]["product_unit"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          display_order?: number
          id?: string
          name: string
          unit_type: Database["public"]["Enums"]["product_unit"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          unit_type?: Database["public"]["Enums"]["product_unit"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          full_name: string
          id: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      transfer_items: {
        Row: {
          id: string
          product_id: string
          received_quantity: number | null
          sent_quantity: number
          transfer_id: string
        }
        Insert: {
          id?: string
          product_id: string
          received_quantity?: number | null
          sent_quantity: number
          transfer_id: string
        }
        Update: {
          id?: string
          product_id?: string
          received_quantity?: number | null
          sent_quantity?: number
          transfer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfer_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfer_items_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      transfers: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          created_by: string
          destination_location_id: string
          destination_work_shift_id: string | null
          id: string
          origin_location_id: string
          origin_work_shift_id: string
          received_at: string | null
          received_by: string | null
          reception_notes: string | null
          sent_at: string | null
          sent_by: string | null
          status: Database["public"]["Enums"]["transfer_status"]
          updated_at: string
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          created_by: string
          destination_location_id: string
          destination_work_shift_id?: string | null
          id?: string
          origin_location_id: string
          origin_work_shift_id: string
          received_at?: string | null
          received_by?: string | null
          reception_notes?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: Database["public"]["Enums"]["transfer_status"]
          updated_at?: string
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          created_by?: string
          destination_location_id?: string
          destination_work_shift_id?: string | null
          id?: string
          origin_location_id?: string
          origin_work_shift_id?: string
          received_at?: string | null
          received_by?: string | null
          reception_notes?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: Database["public"]["Enums"]["transfer_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfers_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_destination_location_id_fkey"
            columns: ["destination_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_destination_shift_location_fk"
            columns: ["destination_work_shift_id", "destination_location_id"]
            isOneToOne: false
            referencedRelation: "work_shifts"
            referencedColumns: ["id", "location_id"]
          },
          {
            foreignKeyName: "transfers_origin_location_id_fkey"
            columns: ["origin_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_origin_shift_location_fk"
            columns: ["origin_work_shift_id", "origin_location_id"]
            isOneToOne: false
            referencedRelation: "work_shifts"
            referencedColumns: ["id", "location_id"]
          },
          {
            foreignKeyName: "transfers_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      work_shifts: {
        Row: {
          closed_at: string | null
          created_at: string
          id: string
          location_id: string
          opened_at: string
          operational_date: string
          status: Database["public"]["Enums"]["shift_status"]
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          id?: string
          location_id: string
          opened_at?: string
          operational_date?: string
          status?: Database["public"]["Enums"]["shift_status"]
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          id?: string
          location_id?: string
          opened_at?: string
          operational_date?: string
          status?: Database["public"]["Enums"]["shift_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_shifts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      attendance_check_in: {
        Args: { selected_location_id: string }
        Returns: {
          check_in_at: string
          check_out_at: string | null
          created_at: string
          id: string
          location_id: string
          updated_at: string
          user_id: string
          work_date: string
        }
        SetofOptions: {
          from: "*"
          to: "attendance"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      attendance_check_out: {
        Args: never
        Returns: {
          check_in_at: string
          check_out_at: string | null
          created_at: string
          id: string
          location_id: string
          updated_at: string
          user_id: string
          work_date: string
        }
        SetofOptions: {
          from: "*"
          to: "attendance"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      attendance_manager_report: {
        Args: {
          selected_date: string
          selected_location_id?: string
          selected_user_id?: string
        }
        Returns: {
          check_in_at: string
          check_out_at: string
          employee_name: string
          id: string
          location_code: string
          location_id: string
          location_name: string
          user_id: string
          work_date: string
        }[]
      }
      attendance_period_report: {
        Args: {
          selected_end_date: string
          selected_start_date: string
          selected_user_id: string
        }
        Returns: {
          attendance_id: string
          check_in_at: string
          check_out_at: string
          location_code: string
          location_id: string
          location_name: string
          work_date: string
        }[]
      }
      close_operational_shift: {
        Args: {
          selected_items: Json
          selected_payments: Json
          selected_work_shift_id: string
        }
        Returns: {
          closed_at: string | null
          created_at: string
          id: string
          location_id: string
          opened_at: string
          operational_date: string
          status: Database["public"]["Enums"]["shift_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "work_shifts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_inventory_movement: {
        Args: {
          selected_items: Json
          selected_movement_type: Database["public"]["Enums"]["inventory_movement_type"]
          selected_notes: string
          selected_reason: string
          selected_work_shift_id: string
        }
        Returns: {
          created_at: string
          created_by: string
          id: string
          movement_type: Database["public"]["Enums"]["inventory_movement_type"]
          notes: string | null
          reason: string | null
          work_shift_id: string
        }
        SetofOptions: {
          from: "*"
          to: "inventory_movements"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      management_monthly_daily_income: {
        Args: { selected_location_id?: string; selected_month: string }
        Returns: {
          cash_amount: number
          closed_shift_count: number
          open_shift_count: number
          operational_date: string
          total_income: number
          yape_amount: number
        }[]
      }
      management_monthly_location_income: {
        Args: { selected_location_id?: string; selected_month: string }
        Returns: {
          cash_amount: number
          closed_shift_count: number
          location_code: string
          location_id: string
          location_name: string
          total_income: number
          yape_amount: number
        }[]
      }
      management_monthly_product_sales: {
        Args: { selected_location_id?: string; selected_month: string }
        Returns: {
          calculated_sales: number
          product_code: string
          product_id: string
          product_name: string
          unit_type: Database["public"]["Enums"]["product_unit"]
        }[]
      }
      management_reconciliation_report: {
        Args: {
          selected_date: string
          selected_location_id?: string
          selected_user_id?: string
        }
        Returns: {
          calculated_sales: number
          cash_amount: number
          closed_at: string
          closed_by_name: string
          closing_quantity: number
          closing_total: number
          entry_quantity: number
          location_code: string
          location_id: string
          location_name: string
          negative_adjustment_quantity: number
          opened_at: string
          opened_by_name: string
          opening_quantity: number
          operational_date: string
          positive_adjustment_quantity: number
          product_code: string
          product_id: string
          product_name: string
          received_transfer_quantity: number
          sent_transfer_quantity: number
          unit_type: Database["public"]["Enums"]["product_unit"]
          waste_quantity: number
          work_shift_id: string
          yape_amount: number
        }[]
      }
      open_operational_shift: {
        Args: {
          selected_cash_opening: number
          selected_items: Json
          selected_location_id: string
        }
        Returns: {
          closed_at: string | null
          created_at: string
          id: string
          location_id: string
          opened_at: string
          operational_date: string
          status: Database["public"]["Enums"]["shift_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "work_shifts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      open_operational_shift_for_date: {
        Args: {
          selected_cash_opening: number
          selected_items: Json
          selected_location_id: string
          selected_operational_date: string
        }
        Returns: {
          closed_at: string | null
          created_at: string
          id: string
          location_id: string
          opened_at: string
          operational_date: string
          status: Database["public"]["Enums"]["shift_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "work_shifts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      receive_transfer: {
        Args: {
          selected_destination_work_shift_id: string
          selected_items: Json
          selected_reception_notes: string
          selected_transfer_id: string
        }
        Returns: {
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          created_by: string
          destination_location_id: string
          destination_work_shift_id: string | null
          id: string
          origin_location_id: string
          origin_work_shift_id: string
          received_at: string | null
          received_by: string | null
          reception_notes: string | null
          sent_at: string | null
          sent_by: string | null
          status: Database["public"]["Enums"]["transfer_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "transfers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      send_transfer: {
        Args: {
          selected_destination_location_id: string
          selected_items: Json
          selected_origin_work_shift_id: string
        }
        Returns: {
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          created_by: string
          destination_location_id: string
          destination_work_shift_id: string | null
          id: string
          origin_location_id: string
          origin_work_shift_id: string
          received_at: string | null
          received_by: string | null
          reception_notes: string | null
          sent_at: string | null
          sent_by: string | null
          status: Database["public"]["Enums"]["transfer_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "transfers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "EMPLOYEE" | "MANAGER" | "ADMIN"
      inventory_movement_type:
        | "ENTRY"
        | "WASTE"
        | "ADJUSTMENT_POSITIVE"
        | "ADJUSTMENT_NEGATIVE"
      product_unit: "UNIT" | "LITER"
      shift_status: "OPEN" | "CLOSED"
      transfer_status:
        | "PENDING"
        | "SENT"
        | "RECEIVED"
        | "RECEIVED_WITH_DIFFERENCES"
        | "CANCELLED"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["EMPLOYEE", "MANAGER", "ADMIN"],
      inventory_movement_type: [
        "ENTRY",
        "WASTE",
        "ADJUSTMENT_POSITIVE",
        "ADJUSTMENT_NEGATIVE",
      ],
      product_unit: ["UNIT", "LITER"],
      shift_status: ["OPEN", "CLOSED"],
      transfer_status: [
        "PENDING",
        "SENT",
        "RECEIVED",
        "RECEIVED_WITH_DIFFERENCES",
        "CANCELLED",
      ],
    },
  },
} as const
