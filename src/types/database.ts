/* eslint-disable @typescript-eslint/no-explicit-any */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at">;
        Update: Partial<Omit<Profile, "created_at">>;
      };
      deudores: {
        Row: Deudor;
        Insert: Omit<Deudor, "id" | "created_at">;
        Update: Partial<Omit<Deudor, "id" | "created_at">>;
      };
      facturas: {
        Row: Factura;
        Insert: Omit<Factura, "id" | "created_at">;
        Update: Partial<Omit<Factura, "id" | "created_at">>;
      };
      pagos: {
        Row: Pago;
        Insert: Omit<Pago, "id" | "created_at">;
        Update: Partial<Omit<Pago, "id" | "created_at">>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export interface Profile {
  id: string;
  rut: string;
  razon_social: string;
  email: string;
  banco: string | null;
  cuenta_corriente: string | null;
  ejecutivo_nombre: string | null;
  ejecutivo_email: string | null;
  created_at: string;
}

export interface Deudor {
  id: string;
  profile_id: string;
  rut: string;
  razon_social: string;
  sector: string | null;
  mora_dias: number;
  riesgo: "bajo" | "medio" | "alto";
  email_contacto: string | null;
  telefono_contacto: string | null;
  created_at: string;
}

export interface Factura {
  id: string;
  profile_id: string;
  deudor_id: string;
  numero: string;
  monto: number;
  fecha_vencimiento: string;
  estado: "en_gestion" | "pendiente" | "pagada";
  archivo_url: string | null;
  notas: string | null;
  repactado: boolean;
  num_cuotas: number | null;
  monto_cuota: number | null;
  created_at: string;
}

export interface Pago {
  id: string;
  factura_id: string;
  profile_id: string;
  fecha: string;
  monto_bruto: number;
  honorarios_pct: number;
  metodo: string;
  estado: "liquidado" | "en_proceso";
  created_at: string;
}

export type FacturaWithDeudor = Factura & {
  deudores: Pick<Deudor, "rut" | "razon_social"> | null;
};

export type PagoWithFactura = Pago & {
  facturas: (Pick<Factura, "numero"> & {
    deudores: Pick<Deudor, "razon_social"> | null;
  }) | null;
};
