/**
 * Tax Declaration Engine — Multi-country + fixed tax tests
 *
 * Covers the country generators (EC/US/CA/ES), per-country currency handling,
 * and the "special contributor" fixed-tax override in the shared builder.
 */

import { generateTaxDeclaration } from '@/lib/tax/engine';
import { supportedCountries, getCurrency } from '@/lib/tax/registry';
import type { TaxDeclarationConfig, TaxDeclarationInput, TaxCountry } from '@/lib/tax/types';

const makeConfig = (overrides: Partial<TaxDeclarationConfig> = {}): TaxDeclarationConfig => ({
  country: 'ec',
  taxpayer: {
    ruc: '1799999999001',
    businessName: 'Test Restaurant',
    tradeName: 'Tests',
    address: 'Av. Test 123',
    email: 'test@example.com',
    phone: '+593999999999',
    activity: 'Restaurant',
    regime: 'General',
  },
  period: {
    from: '2026-01-01',
    to: '2026-01-31',
    fiscalYear: 2026,
  },
  emission: {
    establishmentCode: '001',
    emissionPointCode: '001',
    sequenceStart: 1,
  },
  vatRate: 0.15,
  ...overrides,
});

const makeInput = (overrides: Partial<TaxDeclarationInput> = {}): TaxDeclarationInput => ({
  transactions: [
    { id: 1, date: '2026-01-05T10:00:00Z', table: 1, itemsCount: 2, total: 100, paymentMethod: 'Cash' },
    { id: 2, date: '2026-01-12T10:00:00Z', table: 2, itemsCount: 3, total: 50, paymentMethod: 'Card' },
  ],
  ...overrides,
});

describe('Tax country registry', () => {
  it('registers Ecuador, United States, Canada and Spain', () => {
    const codes = supportedCountries.map((c) => c.code);
    expect(codes).toEqual(expect.arrayContaining(['ec', 'us', 'ca', 'es']));
  });

  it('exposes the operating currency per country', () => {
    expect(getCurrency('ec')).toEqual({ code: 'USD', symbol: '$' });
    expect(getCurrency('us')).toEqual({ code: 'USD', symbol: '$' });
    expect(getCurrency('ca')).toEqual({ code: 'CAD', symbol: 'CA$' });
    expect(getCurrency('es')).toEqual({ code: 'EUR', symbol: '€' });
  });
});

describe('generateTaxDeclaration', () => {
  it('produces valid XML with the correct header for every country', () => {
    const expectations: Array<[TaxCountry, string, string, string]> = [
      ['ec', 'EC', 'IVA', 'USD'],
      ['us', 'US', 'SALES_TAX', 'USD'],
      ['ca', 'CA', 'GST_HST', 'CAD'],
      ['es', 'ES', 'IVA', 'EUR'],
    ];

    expectations.forEach(([country, auditCountry, taxType, currency]) => {
      const output = generateTaxDeclaration(country, makeConfig({ country }), makeInput());
      expect(output.mimeType).toBe('application/xml');
      expect(output.content).toContain(`<AuditFileCountry>${auditCountry}</AuditFileCountry>`);
      expect(output.content).toContain(`<Currency>${currency}</Currency>`);
      expect(output.content).toContain(`<TaxType>${taxType}</TaxType>`);
      expect(output.content).toContain('<TaxAmount>');
      expect(output.content).toContain('</AuditFile>');
    });
  });

  it('names the generated file with the country currency code', () => {
    const ec = generateTaxDeclaration('ec', makeConfig({ country: 'ec' }), makeInput());
    expect(ec.fileName).toMatch(/^SAF-T_usd_/);
    const ca = generateTaxDeclaration('ca', makeConfig({ country: 'ca' }), makeInput());
    expect(ca.fileName).toMatch(/^CA_GST_HST_cad_/);
  });

  it('computes percentage tax per invoice and in the totals', () => {
    const output = generateTaxDeclaration('es', makeConfig({ country: 'es', vatRate: 0.21 }), makeInput());
    expect(output.content).toContain('<TotalTax>31.50</TotalTax>');
    expect(output.content).toContain('<TaxAmount>21.00</TaxAmount>');
    expect(output.content).toContain('<TaxAmount>10.50</TaxAmount>');
    expect(output.content).toContain('<NetTotal>118.50</NetTotal>');
  });
});

describe('generateTaxDeclaration - fixed tax (special contributors)', () => {
  it('replaces the percentage rate with a flat amount across the period', () => {
    const output = generateTaxDeclaration(
      'ec',
      makeConfig({ country: 'ec', taxMode: 'fixed', fixedTaxAmount: 25 }),
      makeInput()
    );
    expect(output.content).toContain('<TotalTax>25.00</TotalTax>');
    expect(output.content).toContain('<TaxPercentage>0.00</TaxPercentage>');
    // 100/150 gross split => 66.67% and 33.33% of the flat tax
    expect(output.content).toContain('<NetTotal>125.00</NetTotal>');
    expect(output.content).toContain('<TaxAmount>16.67</TaxAmount>');
    expect(output.content).toContain('<TaxAmount>8.33</TaxAmount>');
  });

  it('applies fixed tax to single-transaction declarations', () => {
    const single = makeInput({ transactions: [makeInput().transactions[0]] });
    const output = generateTaxDeclaration('us', makeConfig({ country: 'us', taxMode: 'fixed', fixedTaxAmount: 10 }), single);
    expect(output.content).toContain('<TotalTax>10.00</TotalTax>');
    expect(output.content).toContain('<TaxAmount>10.00</TaxAmount>');
  });

  it('falls back to the percentage rate when fixed mode has no amount', () => {
    const output = generateTaxDeclaration('ec', makeConfig({ country: 'ec', taxMode: 'fixed' }), makeInput());
    expect(output.content).toContain('<TotalTax>22.50</TotalTax>');
  });
});