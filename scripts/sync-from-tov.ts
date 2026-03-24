#!/usr/bin/env tsx

/**
 * Sync MCP visa data from Times of Visa source files
 *
 * Reads visa-requirements/*.ts files from the ToV codebase and generates
 * a clean JSON data file for the MCP server. Only includes data that
 * actually exists on timesofvisa.com — nothing fabricated.
 *
 * Usage: npx tsx scripts/sync-from-tov.ts
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

// Set TOV_PATH env var to your local Visa-Platform-Fresh checkout
const TOV_PATH = process.env.TOV_PATH || '../Visa-Platform-Fresh';
const VISA_DATA_DIR = join(TOV_PATH, 'src/data/visa-requirements/india');
const OUTPUT_FILE = join(import.meta.dirname, '..', 'data', 'visas.json');
const SOURCE_URL = 'https://www.timesofvisa.com';

async function main() {
  const files = (await readdir(VISA_DATA_DIR)).filter(f => f.endsWith('.ts') && f !== 'types.ts');

  console.log(`Found ${files.length} country files`);

  const countries: Record<string, any> = {};

  for (const file of files) {
    const code = file.replace('.ts', '');
    const content = await readFile(join(VISA_DATA_DIR, file), 'utf-8');

    try {
      // Extract key fields using regex (avoids needing to import TypeScript)
      const extract = (field: string) => {
        const regex = new RegExp(`${field}:\\s*['"\`]([^'"\`]+)['"\`]`);
        const match = content.match(regex);
        return match ? match[1] : null;
      };

      const extractBool = (field: string) => {
        const regex = new RegExp(`${field}:\\s*(true|false)`);
        const match = content.match(regex);
        return match ? match[1] === 'true' : null;
      };

      const extractNumber = (field: string) => {
        const regex = new RegExp(`${field}:\\s*(\d+)`);
        const match = content.match(regex);
        return match ? parseInt(match[1]) : null;
      };

      // Extract document checklist
      const extractDocuments = (section: string) => {
        const docs: Array<{ document: string; details: string }> = [];
        const sectionRegex = new RegExp(`${section}:\\s*\\[([\\s\\S]*?)\\],`, 'g');
        const sectionMatch = sectionRegex.exec(content);
        if (sectionMatch) {
          const docRegex = /document:\s*['"`]([^'"`]+)['"`],\s*\n\s*details:\s*['"`]([^'"`]+)['"`]/g;
          let docMatch;
          while ((docMatch = docRegex.exec(sectionMatch[1])) !== null) {
            docs.push({ document: docMatch[1], details: docMatch[2] });
          }
        }
        return docs;
      };

      // Extract FAQ
      const faqs: Array<{ question: string; answer: string; category: string }> = [];
      const faqRegex = /question:\s*['"`]([^'"`]+)['"`],\s*\n\s*answer:\s*['"`]([^'"`]+)['"`],\s*\n\s*category:\s*['"`]([^'"`]+)['"`]/g;
      let faqMatch;
      while ((faqMatch = faqRegex.exec(content)) !== null) {
        faqs.push({ question: faqMatch[1], answer: faqMatch[2], category: faqMatch[3] });
      }

      // Extract processing time object
      const standardTime = extract('standard');
      const minimumTime = extract('minimum');
      const maximumTime = extract('maximum');

      // Extract fees
      const visaFeeAmount = extractNumber('amount');
      const visaFeeCurrency = extract('currency');

      // Extract highlights (array of strings)
      const highlights: string[] = [];
      const highlightsRegex = /highlights:\s*\[([\s\S]*?)\]/;
      const highlightsMatch = content.match(highlightsRegex);
      if (highlightsMatch) {
        const itemRegex = /'([^']+)'/g;
        let item;
        while ((item = itemRegex.exec(highlightsMatch[1])) !== null) {
          highlights.push(item[1]);
        }
      }

      // Extract warnings
      const warnings: string[] = [];
      const warningsRegex = /warnings:\s*\[([\s\S]*?)\]/;
      const warningsMatch = content.match(warningsRegex);
      if (warningsMatch) {
        const itemRegex = /'([^']+)'/g;
        let item;
        while ((item = itemRegex.exec(warningsMatch[1])) !== null) {
          warnings.push(item[1]);
        }
      }

      // Extract tips
      const tips: string[] = [];
      const tipsRegex = /\btips:\s*\[([\s\S]*?)\]/;
      const tipsMatch = content.match(tipsRegex);
      if (tipsMatch) {
        const itemRegex = /'([^']+)'/g;
        let item;
        while ((item = itemRegex.exec(tipsMatch[1])) !== null) {
          tips.push(item[1]);
        }
      }

      // Build slug for guide URL
      const guideSlug = code === 'dubai' ? 'dubai' : code;

      countries[code] = {
        country: extract('destination') || code,
        visaName: extract('visaName'),
        visaDescription: extract('visaDescription'),
        visaRequired: extractBool('visaRequired'),
        isSchengenCountry: extractBool('isSchengenCountry') || false,
        overview: extract('overview'),
        processingTime: {
          standard: standardTime,
          minimum: minimumTime,
          maximum: maximumTime,
        },
        validity: extract('typical'),
        maxStay: extract('perVisit'),
        entries: extract('entries'),
        fees: {
          amount: visaFeeAmount,
          currency: visaFeeCurrency,
        },
        approvalRate: extract('approvalRate'),
        difficulty: extract('difficulty'),
        documents: {
          mandatory: extractDocuments('mandatory'),
          financial: extractDocuments('financial'),
          employment: extractDocuments('employment'),
          additional: extractDocuments('additional'),
        },
        faq: faqs,
        highlights,
        warnings,
        tips,
        lastUpdated: extract('feeLastUpdated') || extract('processingTimeLastUpdated') || '2026-03-24',
        sourceUrl: `${SOURCE_URL}/${guideSlug}-visa-for-indians/`,
        guideUrl: `${SOURCE_URL}/${guideSlug}-visa-for-indians/`,
      };

      console.log(`  ✅ ${code} — ${faqs.length} FAQs, ${highlights.length} highlights`);
    } catch (err) {
      console.error(`  ❌ ${code} — ${(err as Error).message}`);
    }
  }

  await writeFile(OUTPUT_FILE, JSON.stringify(countries, null, 2));
  console.log(`\nSaved ${Object.keys(countries).length} countries to ${OUTPUT_FILE}`);
}

main().catch(console.error);
