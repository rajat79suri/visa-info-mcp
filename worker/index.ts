import { McpAgent } from 'agents/mcp';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerTools } from '../src/tools.js';
import { lookupCountry, getAllCountries } from './data-worker.js';

export class VisaMCP extends McpAgent {
  server = new McpServer({
    name: 'visa-info',
    version: '1.0.2',
  });

  async init() {
    registerTools(this.server, lookupCountry, getAllCountries);
  }
}

export default {
  fetch(request: Request, env: any, ctx: ExecutionContext) {
    const url = new URL(request.url);

    // MCP endpoint
    if (url.pathname === '/mcp' || url.pathname.startsWith('/mcp/')) {
      return VisaMCP.serve('/mcp').fetch(request, env, ctx);
    }

    // Health check / landing page
    if (url.pathname === '/') {
      return new Response(JSON.stringify({
        name: 'visa-info-mcp',
        version: '1.0.2',
        description: 'Visa requirements MCP server for Indian passport holders',
        mcp_endpoint: '/mcp',
        source: 'https://www.timesofvisa.com',
        countries: 35,
      }, null, 2), {
        headers: { 'content-type': 'application/json' },
      });
    }

    return new Response('Not Found', { status: 404 });
  },
};
