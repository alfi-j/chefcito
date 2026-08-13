import {
  DeclarationTemplate,
  createGenerator,
} from '@/lib/tax/saft/base';

const ecuadorTemplate: DeclarationTemplate = {
  auditFileCountry: 'EC',
  taxType: 'IVA',
  invoiceType: 'FACTURA',
  defaultRate: 0.15,
  currency: 'USD',
  fileNamePrefix: 'SAF-T',
};

/**
 * SAF-T (Ecuador) — Anexo Transaccional Simplificado (SRI).
 * Builds a transaction-based XML declaration for the given period.
 */
export const generateEcuadorSaft = createGenerator(ecuadorTemplate);