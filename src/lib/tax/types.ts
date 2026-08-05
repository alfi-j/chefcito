export type TaxCountry = 'ec';

export interface TaxpayerInfo {
  ruc: string;
  businessName: string;
  tradeName?: string;
  address?: string;
  email?: string;
  phone?: string;
  activity?: string;
  regime?: string;
}

export interface TaxPeriod {
  from: string; // yyyy-MM-dd
  to: string; // yyyy-MM-dd
  fiscalYear: number;
}

export interface EmissionPoint {
  establishmentCode: string; // e.g. 001
  emissionPointCode: string; // e.g. 001
  sequenceStart: number;
}

export interface TaxDeclarationConfig {
  country: TaxCountry;
  taxpayer: TaxpayerInfo;
  period: TaxPeriod;
  emission: EmissionPoint;
  vatRate: number; // e.g. 0.15
}

// Transaction input shared with the reports engine
export interface TaxTransaction {
  id: number;
  date: string;
  table: string | number;
  customerName?: string;
  seller?: string;
  itemsCount: number;
  total: number;
  paymentMethod?: string | null;
}

export interface TaxDeclarationInput {
  transactions: TaxTransaction[];
  vatRate?: number;
}

export interface TaxDeclarationOutput {
  fileName: string;
  mimeType: string;
  content: string;
}

export type SaftGenerator = (
  config: TaxDeclarationConfig,
  input: TaxDeclarationInput
) => TaxDeclarationOutput;

export interface CountrySpec {
  code: TaxCountry;
  name: string;
  format: 'xml';
  generator: SaftGenerator;
}