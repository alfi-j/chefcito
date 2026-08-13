import {
  DeclarationTemplate,
  createGenerator,
} from '@/lib/tax/saft/base';

const spainTemplate: DeclarationTemplate = {
  auditFileCountry: 'ES',
  taxType: 'IVA',
  invoiceType: 'FACTURA',
  defaultRate: 0.21,
  currency: 'EUR',
  fileNamePrefix: 'ES_IVA',
};

/**
 * Spain IVA declaration. Operates in EUR with the standard IVA rate as default.
 */
export const generateSpainSaft = createGenerator(spainTemplate);