export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      services: {
        Row: {
          id: string;
          name: string;
          description: string;
          price_czk: number;
          duration_minutes: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          price_czk: number;
          duration_minutes: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["services"]["Insert"]>;
      };
      availability_slots: {
        Row: {
          id: string;
          starts_at: string;
          ends_at: string;
          barber_name: string;
          is_available: boolean;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          starts_at: string;
          ends_at: string;
          barber_name?: string;
          is_available?: boolean;
          note?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["availability_slots"]["Insert"]>;
      };
      bookings: {
        Row: {
          id: string;
          slot_id: string;
          service_id: string;
          customer_name: string;
          customer_phone: string;
          customer_email: string | null;
          note: string | null;
          status: "confirmed" | "cancelled";
          created_at: string;
        };
        Insert: {
          id?: string;
          slot_id: string;
          service_id: string;
          customer_name: string;
          customer_phone: string;
          customer_email?: string | null;
          note?: string | null;
          status?: "confirmed" | "cancelled";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["bookings"]["Insert"]>;
      };
    };
  };
};
