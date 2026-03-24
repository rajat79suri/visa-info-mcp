import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load generated data from ToV sync script
const dataPath = join(__dirname, '..', 'data', 'visas.json');
const raw = JSON.parse(readFileSync(dataPath, 'utf-8'));

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

export const VISA_DATA: Record<string, VisaCountry> = raw;

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

export function lookupCountry(query: string): VisaCountry | null {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return null;

  // Direct key match
  if (VISA_DATA[normalized]) return VISA_DATA[normalized];

  // Alias match
  const aliasKey = ALIASES[normalized];
  if (aliasKey && VISA_DATA[aliasKey]) return VISA_DATA[aliasKey];

  // Exact country name match
  for (const [, info] of Object.entries(VISA_DATA)) {
    if (info.country?.toLowerCase() === normalized) return info;
  }

  // Fuzzy: country name contains query (min 3 chars)
  if (normalized.length >= 3) {
    for (const [, info] of Object.entries(VISA_DATA)) {
      if (info.country?.toLowerCase().includes(normalized)) return info;
      if (info.visaName?.toLowerCase().includes(normalized)) return info;
    }
  }

  return null;
}

export function getAllCountries() {
  return Object.entries(VISA_DATA).map(([code, info]) => ({
    name: info.country || code,
    code,
    visaName: info.visaName,
    visaRequired: info.visaRequired,
    difficulty: info.difficulty,
    guideUrl: info.guideUrl,
  }));
}
