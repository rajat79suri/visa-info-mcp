/**
 * Pure data logic — no Node.js or Workers dependencies.
 * Works in any JavaScript runtime.
 */

// UTM tracking for MCP-driven traffic
const UTM = '?utm_source=mcp&utm_medium=claude&utm_campaign=visa-info';

export interface VisaCountry {
  country: string;
  visaName: string | null;
  visaDescription: string | null;
  visaRequired: boolean | null;
  isSchengenCountry: boolean;
  overview: string | null;
  processingTime: { standard: string | null; minimum: string | null; maximum: string | null };
  validity: string | null;
  maxStay: string | null;
  entries: string | null;
  fees: { amount: number | null; currency: string | null };
  approvalRate: string | null;
  difficulty: string | null;
  documents: {
    mandatory: Array<{ document: string; details: string }>;
    financial: Array<{ document: string; details: string }>;
    employment: Array<{ document: string; details: string }>;
    additional: Array<{ document: string; details: string }>;
  };
  faq: Array<{ question: string; answer: string; category: string }>;
  highlights: string[];
  warnings: string[];
  tips: string[];
  lastUpdated: string;
  sourceUrl: string;
  guideUrl: string;
}

// Country name aliases for flexible lookup
const ALIASES: Record<string, string> = {
  'united states': 'usa', 'america': 'usa', 'us': 'usa',
  'united kingdom': 'uk', 'britain': 'uk', 'england': 'uk',
  'united arab emirates': 'dubai', 'uae': 'dubai', 'emirates': 'dubai',
  'europe': 'schengen', 'schengen area': 'schengen', 'schengen zone': 'schengen',
  'bangkok': 'thailand', 'tokyo': 'japan', 'bali': 'indonesia',
  'south korea': 'southkorea', 'korea': 'southkorea',
  'sri lanka': 'srilanka', 'new zealand': 'newzealand',
  'saudi': 'saudiarabia', 'saudi arabia': 'saudiarabia',
  'abu dhabi': 'dubai', 'mecca': 'saudiarabia',
};

/** Append UTM params to all source/guide URLs and return typed data */
export function initVisaData(rawData: Record<string, any>): Record<string, VisaCountry> {
  for (const country of Object.values(rawData)) {
    if (country.sourceUrl) country.sourceUrl = country.sourceUrl + UTM;
    if (country.guideUrl) country.guideUrl = country.guideUrl + UTM;
  }
  return rawData as Record<string, VisaCountry>;
}

export function lookupCountry(query: string, data: Record<string, VisaCountry>): VisaCountry | null {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return null;

  // Direct key match
  if (data[normalized]) return data[normalized];

  // Alias match
  const aliasKey = ALIASES[normalized];
  if (aliasKey && data[aliasKey]) return data[aliasKey];

  // Exact country name match
  for (const [, info] of Object.entries(data)) {
    if (info.country?.toLowerCase() === normalized) return info;
  }

  // Fuzzy: country name contains query (min 3 chars)
  if (normalized.length >= 3) {
    for (const [, info] of Object.entries(data)) {
      if (info.country?.toLowerCase().includes(normalized)) return info;
      if (info.visaName?.toLowerCase().includes(normalized)) return info;
    }
  }

  return null;
}

export function getAllCountries(data: Record<string, VisaCountry>) {
  return Object.entries(data).map(([code, info]) => ({
    name: info.country || code,
    code,
    visaName: info.visaName,
    visaRequired: info.visaRequired,
    difficulty: info.difficulty,
    guideUrl: info.guideUrl,
  }));
}
