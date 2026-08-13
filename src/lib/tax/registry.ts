import type { CountrySpec, TaxCountry } from '@/lib/tax/types';
import { generateEcuadorSaft } from '@/lib/tax/saft/ecuador';
import { generateUnitedStatesSaft } from '@/lib/tax/saft/us';
import { generateCanadaSaft } from '@/lib/tax/saft/canada';
import { generateSpainSaft } from '@/lib/tax/saft/spain';

/**
 * Registry of supported tax-report countries. New countries implement a
 * generator following the SaftGenerator contract and register it here. The
 * engine picks the generator dynamically based on the configured country.
 *
 * Each country carries its operating currency (ISO 4217 code + symbol) and a
 * default tax rate used to prefill the declaration panel.
 */
export const saftRegistry: Record<TaxCountry, CountrySpec> = {
  ca: {
    code: 'ca',
    name: 'Canada',
    format: 'xml',
    generator: generateCanadaSaft,
    currency: 'CAD',
    currencySymbol: 'CA$',
    defaultVatRate: 5,
  },
  ec: {
    code: 'ec',
    name: 'Ecuador',
    format: 'xml',
    generator: generateEcuadorSaft,
    currency: 'USD',
    currencySymbol: '$',
    defaultVatRate: 15,
  },
  es: {
    code: 'es',
    name: 'Spain',
    format: 'xml',
    generator: generateSpainSaft,
    currency: 'EUR',
    currencySymbol: '€',
    defaultVatRate: 21,
  },
  us: {
    code: 'us',
    name: 'United States',
    format: 'xml',
    generator: generateUnitedStatesSaft,
    currency: 'USD',
    currencySymbol: '$',
    defaultVatRate: 7,
  },
};

export const supportedCountries: CountrySpec[] = Object.values(saftRegistry).sort((a, b) =>
  a.name.localeCompare(b.name)
);

export function getCountrySpec(country: TaxCountry): CountrySpec {
  const spec = saftRegistry[country];
  if (!spec) {
    throw new Error(`Unsupported tax-report country: ${country}`);
  }
  return spec;
}

export function getCurrency(country: TaxCountry): { code: string; symbol: string } {
  const spec = getCountrySpec(country);
  return { code: spec.currency, symbol: spec.currencySymbol };
}