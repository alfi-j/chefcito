import type { CountrySpec, TaxCountry } from '@/lib/tax/types';
import { generateEcuadorSaft } from '@/lib/tax/saft/ecuador';

/**
 * Registry of supported SAF-T countries. New countries implement a generator
 * following the SaftGenerator contract and register it here. The engine picks
 * the generator dynamically based on the configured country.
 */
export const saftRegistry: Record<TaxCountry, CountrySpec> = {
  ec: {
    code: 'ec',
    name: 'Ecuador',
    format: 'xml',
    generator: generateEcuadorSaft,
  },
};

export const supportedCountries: CountrySpec[] = Object.values(saftRegistry);

export function getCountrySpec(country: TaxCountry): CountrySpec {
  const spec = saftRegistry[country];
  if (!spec) {
    throw new Error(`Unsupported SAF-T country: ${country}`);
  }
  return spec;
}