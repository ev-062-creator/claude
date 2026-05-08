export type VendorId = string;

export type RelationshipStatus = "ativo" | "romper" | "sem-servico" | "a-negociar";
export type PaymentType = "semanal" | "mensal" | "sem-previsao";
export type PaymentFrequency = "semanal" | "mensal" | "entrada" | "mensalidade";

export interface Vendor {
  id: VendorId;
  name: string;
  color: string;
  bg: string;
  totalOwed: number;
  paymentType: PaymentType;
  relationshipStatus: RelationshipStatus;
  totalInstallments?: number;
  entrada?: number;
  monthlyFee?: number;
  notes?: string;
}

export interface Payment {
  id: string;
  vendorId: VendorId;
  date: string; // YYYY-MM-DD
  amount: number;
  installmentNumber?: number;
  totalInstallments?: number;
  label: string;
  frequency: PaymentFrequency;
  isMonthlyFee?: boolean;
}

export interface WeekDay {
  date: string;
  dayLabel: string;
  payments: Payment[];
  total: number;
}

export interface Week {
  weekNumber: number;
  startDate: string;
  endDate: string;
  days: WeekDay[];
  total: number;
}
