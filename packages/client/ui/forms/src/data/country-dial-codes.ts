/**
 * Country calling codes for `PhoneField`. Not exhaustive — reorder so your
 * primary market is first, and add rows as needed; every entry must have a
 * unique ISO-3166-1 alpha-2.
 */
export interface CountryDialCode {
  iso: string; // ISO-3166-1 alpha-2, uppercase
  name: string;
  dial: string; // E.164 calling code, no '+'
}

export const COUNTRY_DIAL_CODES: readonly CountryDialCode[] = [
  { iso: 'GH', name: 'Ghana', dial: '233' },
  { iso: 'NG', name: 'Nigeria', dial: '234' },
  { iso: 'KE', name: 'Kenya', dial: '254' },
  { iso: 'ZA', name: 'South Africa', dial: '27' },
  { iso: 'CI', name: "Côte d'Ivoire", dial: '225' },
  { iso: 'SN', name: 'Senegal', dial: '221' },
  { iso: 'CM', name: 'Cameroon', dial: '237' },
  { iso: 'TZ', name: 'Tanzania', dial: '255' },
  { iso: 'UG', name: 'Uganda', dial: '256' },
  { iso: 'RW', name: 'Rwanda', dial: '250' },
  { iso: 'ET', name: 'Ethiopia', dial: '251' },
  { iso: 'ZM', name: 'Zambia', dial: '260' },
  { iso: 'ZW', name: 'Zimbabwe', dial: '263' },
  { iso: 'BW', name: 'Botswana', dial: '267' },
  { iso: 'NA', name: 'Namibia', dial: '264' },
  { iso: 'MW', name: 'Malawi', dial: '265' },
  { iso: 'MZ', name: 'Mozambique', dial: '258' },
  { iso: 'AO', name: 'Angola', dial: '244' },
  { iso: 'BJ', name: 'Benin', dial: '229' },
  { iso: 'BF', name: 'Burkina Faso', dial: '226' },
  { iso: 'TG', name: 'Togo', dial: '228' },
  { iso: 'ML', name: 'Mali', dial: '223' },
  { iso: 'NE', name: 'Niger', dial: '227' },
  { iso: 'GN', name: 'Guinea', dial: '224' },
  { iso: 'SL', name: 'Sierra Leone', dial: '232' },
  { iso: 'LR', name: 'Liberia', dial: '231' },
  { iso: 'GM', name: 'Gambia', dial: '220' },
  { iso: 'CD', name: 'DR Congo', dial: '243' },
  { iso: 'CG', name: 'Congo', dial: '242' },
  { iso: 'GA', name: 'Gabon', dial: '241' },
  { iso: 'EG', name: 'Egypt', dial: '20' },
  { iso: 'MA', name: 'Morocco', dial: '212' },
  { iso: 'DZ', name: 'Algeria', dial: '213' },
  { iso: 'TN', name: 'Tunisia', dial: '216' },
  { iso: 'LY', name: 'Libya', dial: '218' },
  { iso: 'SD', name: 'Sudan', dial: '249' },
  { iso: 'MU', name: 'Mauritius', dial: '230' },
  { iso: 'GB', name: 'United Kingdom', dial: '44' },
  { iso: 'US', name: 'United States', dial: '1' },
  { iso: 'CA', name: 'Canada', dial: '1' },
  { iso: 'FR', name: 'France', dial: '33' },
  { iso: 'DE', name: 'Germany', dial: '49' },
  { iso: 'NL', name: 'Netherlands', dial: '31' },
  { iso: 'ES', name: 'Spain', dial: '34' },
  { iso: 'IT', name: 'Italy', dial: '39' },
  { iso: 'PT', name: 'Portugal', dial: '351' },
  { iso: 'IE', name: 'Ireland', dial: '353' },
  { iso: 'BE', name: 'Belgium', dial: '32' },
  { iso: 'CH', name: 'Switzerland', dial: '41' },
  { iso: 'SE', name: 'Sweden', dial: '46' },
  { iso: 'AE', name: 'United Arab Emirates', dial: '971' },
  { iso: 'SA', name: 'Saudi Arabia', dial: '966' },
  { iso: 'QA', name: 'Qatar', dial: '974' },
  { iso: 'IN', name: 'India', dial: '91' },
  { iso: 'PK', name: 'Pakistan', dial: '92' },
  { iso: 'CN', name: 'China', dial: '86' },
  { iso: 'PH', name: 'Philippines', dial: '63' },
  { iso: 'AU', name: 'Australia', dial: '61' },
  { iso: 'BR', name: 'Brazil', dial: '55' },
] as const;

// TEMPLATE: set this to your primary market's ISO code.
const DEFAULT_ISO = 'US';

/** The dial code for an ISO country, falling back to `DEFAULT_ISO`. */
export function dialForIso(iso: string | null | undefined): string {
  const match = COUNTRY_DIAL_CODES.find((c) => c.iso === (iso ?? '').toUpperCase());
  return (match ?? COUNTRY_DIAL_CODES.find((c) => c.iso === DEFAULT_ISO)!).dial;
}

/** Longest matching dial code for an E.164-ish string, or null. */
export function isoForDialPrefix(value: string): CountryDialCode | null {
  const digits = value.replace(/[^\d]/g, '');
  return (
    [...COUNTRY_DIAL_CODES]
      .sort((a, b) => b.dial.length - a.dial.length)
      .find((c) => digits.startsWith(c.dial)) ?? null
  );
}

/**
 * Split a stored phone value into `{ dial, national }`. Handles `+233...`,
 * `233...`, or a bare national number (which keeps the fallback dial).
 */
export function parsePhone(
  value: string | null | undefined,
  fallbackIso: string | null | undefined,
): { dial: string; national: string } {
  const fallbackDial = dialForIso(fallbackIso);
  if (!value) return { dial: fallbackDial, national: '' };

  const digits = value.replace(/[^\d]/g, '');
  const hadPlus = value.trim().startsWith('+');
  const match = isoForDialPrefix(digits);

  if (match && (hadPlus || digits.length > match.dial.length + 4)) {
    return { dial: match.dial, national: digits.slice(match.dial.length) };
  }
  return { dial: fallbackDial, national: digits };
}
