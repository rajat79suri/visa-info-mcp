#!/usr/bin/env node

/**
 * Times of Visa — MCP Server (stdio transport)
 *
 * Provides visa requirements, processing times, and document checklists
 * for Indian passport holders across 35 countries.
 *
 * All data sourced from https://www.timesofvisa.com
 * Generated via scripts/sync-from-tov.ts — never hardcoded.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { lookupCountry, getAllCountries } from './data.js';
import { registerTools } from './tools.js';

const server = new McpServer({
  name: 'visa-info',
  version: '1.0.2',
});

registerTools(server, lookupCountry, getAllCountries);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
