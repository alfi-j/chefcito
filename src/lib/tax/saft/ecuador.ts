import {
  openTag,
  closeTag,
  element,
  elementIf,
} from '@/lib/tax/xml';
import type {
  SaftGenerator,
  TaxDeclarationInput,
  TaxDeclarationOutput,
} from '@/lib/tax/types';

/**
 * SAF-T (Ecuador) — Anexo Transaccional Simplificado (SRI).
 * Builds a transaction-based XML declaration for the given period.
 */
export const generateEcuadorSaft: SaftGenerator = (
  config,
  input: TaxDeclarationInput
): TaxDeclarationOutput => {
  const { taxpayer, period, emission } = config;
  const vatRate = input.vatRate ?? config.vatRate ?? 0.15;
  const transactions = input.transactions ?? [];

  const numberEntries = transactions.length;
  const totalGross = transactions.reduce((sum, t) => sum + t.total, 0);
  const totalTax = parseFloat((totalGross * vatRate).toFixed(2));
  const totalNet = parseFloat((totalGross - totalTax).toFixed(2));

  const invoiceNodes = transactions
    .map((transaction, index) => {
      const seqNo = emission.sequenceStart + index;
      const invoiceDate = transaction.date.slice(0, 10);
      const lineQuantity = transaction.itemsCount || 1;
      const unitPrice = lineQuantity > 0 ? transaction.total / lineQuantity : 0;
      const lineAmount = transaction.total;
      const taxAmount = parseFloat((lineAmount * vatRate).toFixed(2));

      const lines =
        element('InvoiceNo', seqNo) +
        element('InvoiceDate', invoiceDate) +
        element('InvoiceType', 'FACTURA') +
        elementIf('CustomerID', transaction.customerName || undefined) +
        elementIf('PaymentMethod', transaction.paymentMethod || undefined) +
        openTag('Line') +
        element('ProductCode', `TX-${transaction.id}`) +
        element('Description', 'Venta') +
        element('Quantity', lineQuantity) +
        element('UnitPrice', unitPrice.toFixed(2)) +
        openTag('Tax') +
        element('TaxType', 'IVA') +
        element('TaxPercentage', (vatRate * 100).toFixed(2)) +
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
    element('AuditFileCountry', 'EC') +
    element('AuditFileDateCreated', new Date().toISOString()) +
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
    elementIf('TaxRegime', taxpayer.regime) +
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
    openTag('SalesInvoices') +
    invoiceNodes +
    closeTag('SalesInvoices') +
    closeTag('SalesInvoices') +
    closeTag('SourceDocuments') +
    closeTag('AuditFile');

  const from = period.from.replace(/-/g, '');
  const to = period.to.replace(/-/g, '');

  return {
    fileName: `SAF-T_${taxpayer.ruc}_${from}_${to}.xml`,
    mimeType: 'application/xml',
    content: xml,
  };
};