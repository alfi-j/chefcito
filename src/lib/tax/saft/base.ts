import {
  openTag,
  closeTag,
  element,
  elementIf,
} from '@/lib/tax/xml';
import type {
  SaftGenerator,
  TaxDeclarationConfig,
  TaxDeclarationInput,
  TaxDeclarationOutput,
} from '@/lib/tax/types';

const round2 = (value: number): number => parseFloat(value.toFixed(2));

export interface DeclarationTemplate {
  /** XML audit file country code, e.g. 'US' */
  auditFileCountry: string;
  /** Tax type label used inside <TaxType>, e.g. 'SALES_TAX' */
  taxType: string;
  /** Invoice type label, e.g. 'FACTURA' or 'TAX_INVOICE' */
  invoiceType: string;
  /** Default percentage rate (as a decimal), e.g. 0.07 */
  defaultRate: number;
  /** ISO 4217 currency code, e.g. 'USD' */
  currency: string;
  /** File name prefix, e.g. 'SAF-T' */
  fileNamePrefix: string;
}

/**
 * Shared SAF-T-style declaration builder. Handles both percentage taxation and
 * the "special contributor" fixed-amount mode (config.taxMode === 'fixed'),
 * where the fixed tax replaces the percentage rate for the whole period and is
 * distributed across the included invoices proportionally to their gross total.
 */
export function buildDeclaration(
  template: DeclarationTemplate,
  config: TaxDeclarationConfig,
  input: TaxDeclarationInput
): TaxDeclarationOutput {
  const { taxpayer, period, emission } = config;
  const transactions = input.transactions ?? [];
  const isFixed = config.taxMode === 'fixed' && config.fixedTaxAmount != null;
  const vatRate = isFixed ? 0 : input.vatRate ?? config.vatRate ?? template.defaultRate;
  const fixedTotal = isFixed ? config.fixedTaxAmount as number : 0;

  const numberEntries = transactions.length;
  const totalGross = round2(transactions.reduce((sum, t) => sum + t.total, 0));
  const totalTax = isFixed ? fixedTotal : round2(totalGross * vatRate);
  const totalNet = round2(totalGross - totalTax);

  const invoiceNodes = transactions
    .map((transaction, index) => {
      const seqNo = emission.sequenceStart + index;
      const invoiceDate = transaction.date.slice(0, 10);
      const lineQuantity = transaction.itemsCount || 1;
      const unitPrice = lineQuantity > 0 ? transaction.total / lineQuantity : 0;
      const lineAmount = transaction.total;
      // In fixed mode, distribute the flat tax proportionally to gross so the
      // invoices reconcile with the period totals.
      const taxAmount = isFixed
        ? round2(totalGross > 0 ? (fixedTotal * lineAmount) / totalGross : 0)
        : round2(lineAmount * vatRate);

      const lines =
        element('InvoiceNo', seqNo) +
        element('InvoiceDate', invoiceDate) +
        element('InvoiceType', template.invoiceType) +
        element('Currency', template.currency) +
        elementIf('CustomerID', transaction.customerName || undefined) +
        elementIf('PaymentMethod', transaction.paymentMethod || undefined) +
        openTag('Line') +
        element('ProductCode', `TX-${transaction.id}`) +
        element('Description', 'Venta') +
        element('Quantity', lineQuantity) +
        element('UnitPrice', unitPrice.toFixed(2)) +
        openTag('Tax') +
        element('TaxType', template.taxType) +
        element('TaxPercentage', isFixed ? '0.00' : (vatRate * 100).toFixed(2)) +
        element('TaxAmount', taxAmount.toFixed(2)) +
        closeTag('Tax') +
        element('LineAmount', lineAmount.toFixed(2)) +
        closeTag('Line') +
        openTag('DocumentTotals') +
        element('TaxPayable', taxAmount.toFixed(2)) +
        element('NetTotal', (lineAmount - taxAmount).toFixed(2)) +
        element('GrossTotal', lineAmount.toFixed(2)) +
        closeTag('DocumentTotals');

      return openTag('Invoice') + lines + closeTag('Invoice');
    })
    .join('');

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    openTag('AuditFile', { version: '1.00' }) +
    // Header
    openTag('Header') +
    element('AuditFileVersion', '1.00') +
    element('AuditFileCountry', template.auditFileCountry) +
    element('AuditFileDateCreated', new Date().toISOString()) +
    element('Currency', template.currency) +
    element('TaxAccountingBasis', 'CASH') +
    openTag('Company') +
    elementIf('TaxRegistrationNumber', taxpayer.ruc) +
    element('CompanyName', taxpayer.businessName) +
    elementIf('CompanyTradeName', taxpayer.tradeName) +
    elementIf('CompanyAddress', taxpayer.address) +
    elementIf('CompanyTelephone', taxpayer.phone) +
    elementIf('CompanyEmail', taxpayer.email) +
    elementIf('BusinessActivity', taxpayer.activity) +
    closeTag('Company') +
    openTag('TaxRegistration') +
    element('TaxNumber', taxpayer.ruc) +
    element('TaxName', template.taxType) +
    elementIf('TaxRegime', taxpayer.regime) +
    element('TaxType', template.taxType) +
    closeTag('TaxRegistration') +
    element('FiscalYear', period.fiscalYear) +
    element('StartDate', period.from) +
    element('EndDate', period.to) +
    openTag('EmissionPoint') +
    element('EstablishmentCode', emission.establishmentCode) +
    element('EmissionPointCode', emission.emissionPointCode) +
    element('SequenceStart', emission.sequenceStart) +
    closeTag('EmissionPoint') +
    closeTag('Header') +
    // Source documents
    openTag('SourceDocuments') +
    openTag('SalesInvoices') +
    element('NumberOfEntries', numberEntries) +
    element('TotalDebit', totalGross.toFixed(2)) +
    element('TotalCredit', '0.00') +
    element('TotalTax', totalTax.toFixed(2)) +
    element('NetTotal', totalNet.toFixed(2)) +
    element('GrossTotal', totalGross.toFixed(2)) +
    invoiceNodes +
    closeTag('SalesInvoices') +
    closeTag('SourceDocuments') +
    closeTag('AuditFile');

  const from = period.from.replace(/-/g, '');
  const to = period.to.replace(/-/g, '');
  const currency = template.currency.toLowerCase();

  return {
    fileName: `${template.fileNamePrefix}_${currency}_${taxpayer.ruc}_${from}_${to}.xml`,
    mimeType: 'application/xml',
    content: xml,
  };
}

/**
 * Wraps a perfectly-shaped country generator so each country module keeps the
 * SaftGenerator contract while sharing the common builder.
 */
export function createGenerator(
  template: DeclarationTemplate
): SaftGenerator {
  return (config: TaxDeclarationConfig, input: TaxDeclarationInput): TaxDeclarationOutput =>
    buildDeclaration(template, config, input);
}