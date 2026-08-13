import {
  DeclarationTemplate,
  createGenerator,
} from '@/lib/tax/saft/base';

const canadaTemplate: DeclarationTemplate = {
  auditFileCountry: 'CA',
  taxType: 'GST_HST',
  invoiceType: 'TAX_INVOICE',
  defaultRate: 0.05,
  currency: 'CAD',
  fileNamePrefix: 'CA_GST_HST',
};

/**
 * Canada GST/HST declaration. Operates in CAD with GST/HST as the tax type.
 */
export const generateCanadaSaft = createGenerator(canadaTemplate);