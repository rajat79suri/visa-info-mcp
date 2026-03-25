# Times of Visa — MCP Server

Visa requirements, processing times, document checklists, and FAQs for **Indian passport holders** across **35 countries**. All data sourced from [timesofvisa.com](https://www.timesofvisa.com).

## Tools

| Tool | Description |
|------|-------------|
| `get_visa_info` | Complete visa info — documents, processing time, fees, tips, warnings |
| `get_visa_faq` | Frequently asked questions with category filter (fees, documents, travel, etc.) |
| `compare_visas` | Side-by-side comparison of 2-5 countries |
| `list_countries` | List all 35 supported countries |

## Countries Covered

USA, UK, Canada, Australia, Schengen, France, Germany, Italy, Switzerland, UAE/Dubai, Singapore, Thailand, Japan, New Zealand, Malaysia, Indonesia, Maldives, Mexico, Sri Lanka, Saudi Arabia, Oman, Egypt, Turkey, South Korea, Vietnam, Qatar, Philippines, Nepal, Georgia, Azerbaijan, Croatia, Finland, Greece, Portugal, Spain

## Install in Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "visa-info": {
      "command": "npx",
      "args": ["-y", "visa-info-mcp"]
    }
  }
}
```

Restart Claude Desktop. The visa tools will appear automatically.

## Usage Examples

**"What documents do I need for a Croatia visa from India?"**
→ Calls `get_visa_info` with country "Croatia" — returns full document checklist from timesofvisa.com

**"Compare Dubai vs Thailand vs Singapore visa for Indians"**
→ Calls `compare_visas` — returns processing time, difficulty, fees, documents side-by-side

**"Is Japan visa free for Indians?"**
→ Calls `get_visa_faq` — returns real FAQ from timesofvisa.com Japan guide

## Data Source

All data is synced from [Times of Visa](https://www.timesofvisa.com) country guides. No fabricated or AI-generated content. Every response includes source URLs.

## Development

```bash
npm install
npm run build
npm run dev          # run with tsx
npm run inspect      # test with MCP Inspector
```

### Update visa data

```bash
npx tsx scripts/sync-from-tov.ts
npm run build
```

## License

MIT
