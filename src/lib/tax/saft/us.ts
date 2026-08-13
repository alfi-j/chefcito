import {
  DeclarationTemplate,
  createGenerator,
} from '@/lib/tax/saft/base';

const unitedStatesTemplate: DeclarationTemplate = {
  auditFileCountry: 'US',
  taxType: 'SALES_TAX',
  invoiceType: 'TAX_INVOICE',
  defaultRate: 0.07,
  currency: 'USD',
  fileNamePrefix: 'US_SalesTax',
};

/**
 * United States sales tax declaration. USD is the operating currency and sales
 * tax replaces VAT-style taxation.
 */
export const generateUnitedStatesSaft = createGenerator(unitedStatesTemplate);