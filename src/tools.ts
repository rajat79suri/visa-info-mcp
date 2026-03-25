import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { VisaCountry } from './data-core.js';

const SOURCE = 'https://www.timesofvisa.com';

type LookupFn = (query: string) => VisaCountry | null;
type ListFn = () => Array<{ name: string; code: string; visaName: string | null; visaRequired: boolean | null; difficulty: string | null; guideUrl: string }>;

export function registerTools(server: McpServer, lookupCountry: LookupFn, getAllCountries: ListFn) {

  // ── Tool: Get Visa Requirements ──

  server.tool(
    'get_visa_info',
    'Get complete visa information for Indian passport holders travelling to a specific country. Returns visa type, required documents, processing time, fees, highlights, warnings, and tips. All data sourced from timesofvisa.com.',
    { country: z.string().describe('Country name (e.g., "Croatia", "United States", "Dubai", "Schengen", "Japan")') },
    async ({ country }) => {
      const info = lookupCountry(country);
      if (!info) {
        const available = getAllCountries().map(c => c.name).join(', ');
        return { content: [{ type: 'text' as const, text: `No visa information found for "${country}". Available countries: ${available}\n\nSource: ${SOURCE}` }], isError: true };
      }

      const sections: string[] = [
        `# ${info.visaName || info.country + ' Visa'} — Requirements for Indian Passport Holders`,
        '',
      ];

      if (info.overview) sections.push(info.overview, '');

      sections.push(
        `**Visa Required:** ${info.visaRequired ? 'Yes' : 'No'}`,
        `**Visa Type:** ${info.visaName || 'N/A'}`,
        `**Processing Time:** ${info.processingTime?.standard || 'N/A'}`,
        `**Validity:** ${info.validity || 'N/A'}`,
        `**Maximum Stay:** ${info.maxStay || 'N/A'}`,
        `**Entry Type:** ${info.entries || 'N/A'}`,
        `**Difficulty:** ${info.difficulty || 'N/A'}`,
        info.approvalRate ? `**Approval Rate:** ${info.approvalRate}` : '',
        info.fees?.amount ? `**Government Fee:** ${info.fees.currency} ${info.fees.amount}` : '',
        '',
      );

      if (info.highlights.length > 0) {
        sections.push('## Key Highlights', ...info.highlights.map(h => `- ${h}`), '');
      }

      if (info.documents.mandatory.length > 0) {
        sections.push('## Required Documents', ...info.documents.mandatory.map(d => `- **${d.document}**: ${d.details}`), '');
      }
      if (info.documents.financial.length > 0) {
        sections.push('## Financial Documents', ...info.documents.financial.map(d => `- **${d.document}**: ${d.details}`), '');
      }
      if (info.documents.employment.length > 0) {
        sections.push('## Employment Documents', ...info.documents.employment.map(d => `- **${d.document}**: ${d.details}`), '');
      }

      if (info.warnings.length > 0) {
        sections.push('## Important Warnings', ...info.warnings.map(w => `⚠️ ${w}`), '');
      }

      if (info.tips.length > 0) {
        sections.push('## Tips for Indian Applicants', ...info.tips.map(t => `- ${t}`), '');
      }

      sections.push(`Last updated: ${info.lastUpdated}`, `Source: ${info.sourceUrl}`, `Full guide: ${info.guideUrl}`);

      return { content: [{ type: 'text' as const, text: sections.filter(Boolean).join('\n') }] };
    }
  );

  // ── Tool: Get FAQ ──

  server.tool(
    'get_visa_faq',
    'Get frequently asked questions about visa for a specific country. Questions and answers sourced from timesofvisa.com.',
    {
      country: z.string().describe('Country name'),
      category: z.enum(['all', 'fees', 'documents', 'application', 'travel', 'approval', 'rejection']).default('all').describe('FAQ category filter'),
    },
    async ({ country, category }) => {
      const info = lookupCountry(country);
      if (!info) {
        return { content: [{ type: 'text' as const, text: `No visa information found for "${country}". Visit ${SOURCE} for visa guides.` }], isError: true };
      }

      const faqs = category === 'all' ? info.faq : info.faq.filter(f => f.category === category);

      if (faqs.length === 0) {
        return { content: [{ type: 'text' as const, text: `No FAQs found for category "${category}" for ${info.country}. Try "all" for all FAQs.` }] };
      }

      const text = [
        `# ${info.country} Visa FAQ for Indians (${faqs.length} questions)`,
        '',
        ...faqs.map((f, i) => `**Q${i + 1}: ${f.question}**\nA: ${f.answer}\n`),
        `Source: ${info.sourceUrl}`,
      ].join('\n');

      return { content: [{ type: 'text' as const, text }] };
    }
  );

  // ── Tool: Compare Visas ──

  server.tool(
    'compare_visas',
    'Compare visa requirements across multiple countries for Indian passport holders. Useful for deciding between destinations.',
    { countries: z.array(z.string()).min(2).max(5).describe('List of 2-5 country names to compare') },
    async ({ countries }) => {
      const results: Array<{ query: string; info: ReturnType<typeof lookupCountry> }> = countries.map(c => ({ query: c, info: lookupCountry(c) }));
      const found = results.filter(r => r.info != null);
      const notFound = results.filter(r => !r.info).map(r => r.query);

      if (found.length === 0) {
        return { content: [{ type: 'text' as const, text: `No matching countries found. Visit ${SOURCE} for visa guides.` }], isError: true };
      }

      const header = '| Factor | ' + found.map(r => r.info!.country || r.query).join(' | ') + ' |';
      const divider = '|--------|' + found.map(() => '--------|').join('');

      const rows = [
        '| Visa Type | ' + found.map(r => r.info!.visaName || 'N/A').join(' | ') + ' |',
        '| Processing | ' + found.map(r => r.info!.processingTime?.standard || 'N/A').join(' | ') + ' |',
        '| Validity | ' + found.map(r => r.info!.validity || 'N/A').join(' | ') + ' |',
        '| Max Stay | ' + found.map(r => r.info!.maxStay || 'N/A').join(' | ') + ' |',
        '| Difficulty | ' + found.map(r => r.info!.difficulty || 'N/A').join(' | ') + ' |',
        '| Approval Rate | ' + found.map(r => r.info!.approvalRate || 'N/A').join(' | ') + ' |',
        '| Gov Fee | ' + found.map(r => r.info!.fees?.amount ? `${r.info!.fees.currency} ${r.info!.fees.amount}` : 'N/A').join(' | ') + ' |',
        '| Documents | ' + found.map(r => `${r.info!.documents.mandatory.length} mandatory`).join(' | ') + ' |',
      ];

      const text = [
        '# Visa Comparison for Indian Passport Holders',
        '',
        header, divider, ...rows,
        '',
        notFound.length > 0 ? `Not found: ${notFound.join(', ')}` : '',
        '',
        `Source: ${SOURCE}`,
        ...found.map(r => `- ${r.info!.country}: ${r.info!.guideUrl}`),
      ].join('\n');

      return { content: [{ type: 'text' as const, text }] };
    }
  );

  // ── Tool: List All Countries ──

  server.tool(
    'list_countries',
    'List all countries with visa information available for Indian passport holders. Currently covers 35 countries. Data from timesofvisa.com.',
    {},
    async () => {
      const countries = getAllCountries();
      const text = [
        `# Visa Information Available for Indian Passport Holders (${countries.length} countries)`,
        '',
        ...countries.map(c => `- **${c.name}** — ${c.visaName || 'Visa info available'} | Difficulty: ${c.difficulty || 'N/A'} | ${c.guideUrl}`),
        '',
        `Source: ${SOURCE}`,
      ].join('\n');

      return { content: [{ type: 'text' as const, text }] };
    }
  );
}
