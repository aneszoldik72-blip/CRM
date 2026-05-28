// Hand-written Database type — matches supabase/migrations/0001_initial_schema.sql.
// After applying the migration to a linked Supabase project, replace this file with:
//   supabase gen types typescript --linked > types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          locale: string;
          country: string | null;
          onboarding_complete: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          locale?: string;
          country?: string | null;
          onboarding_complete?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          locale?: string;
          country?: string | null;
          onboarding_complete?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          country: string | null;
          currency: string;
          image_url: string | null;
          archived: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          country?: string | null;
          currency?: string;
          image_url?: string | null;
          archived?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          country?: string | null;
          currency?: string;
          image_url?: string | null;
          archived?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      months: {
        Row: {
          id: string;
          product_id: string;
          label: string;
          start_date: string;
          end_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          label: string;
          start_date: string;
          end_date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          label?: string;
          start_date?: string;
          end_date?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "months_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      entries: {
        Row: {
          id: string;
          month_id: string;
          leads: number;
          orders: number;
          delivered: number;
          revenue_cents: number;
          ads_spend_cents: number;
          test_spend_cents: number;
          ad_account_cents: number;
          product_cost_cents: number;
          service_cost_cents: number;
          bonus_cents: number;
          initial_stock: number | null;
          current_stock: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          month_id: string;
          leads?: number;
          orders?: number;
          delivered?: number;
          revenue_cents?: number;
          ads_spend_cents?: number;
          test_spend_cents?: number;
          ad_account_cents?: number;
          product_cost_cents?: number;
          service_cost_cents?: number;
          bonus_cents?: number;
          initial_stock?: number | null;
          current_stock?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          month_id?: string;
          leads?: number;
          orders?: number;
          delivered?: number;
          revenue_cents?: number;
          ads_spend_cents?: number;
          test_spend_cents?: number;
          ad_account_cents?: number;
          product_cost_cents?: number;
          service_cost_cents?: number;
          bonus_cents?: number;
          initial_stock?: number | null;
          current_stock?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "entries_month_id_fkey";
            columns: ["month_id"];
            isOneToOne: true;
            referencedRelation: "months";
            referencedColumns: ["id"];
          },
        ];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          status: string | null;
          plan: string | null;
          current_period_end: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          status?: string | null;
          plan?: string | null;
          current_period_end?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          status?: string | null;
          plan?: string | null;
          current_period_end?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
