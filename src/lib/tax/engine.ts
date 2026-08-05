import { getCountrySpec } from '@/lib/tax/registry';
import type {
  TaxCountry,
  TaxDeclarationConfig,
  TaxDeclarationInput,
  TaxDeclarationOutput,
} from '@/lib/tax/types';

/**
 * Dynamic SAF-T declaration engine. Based on the configured country it selects
 * the matching SAF-T generator and produces a tax declaration (XML by default).
 */
export function generateTaxDeclaration(
  country: TaxCountry,
  config: TaxDeclarationConfig,
  input: TaxDeclarationInput
): TaxDeclarationOutput {
  const spec = getCountrySpec(country);
  return spec.generator(config, input);
}