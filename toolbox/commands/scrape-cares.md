# Scrape CARES Portal

Scrape the CARES Experiment Portal using Playwright + Edge SSO. Extracts screenshots, table data, and text from portal pages.

**Tool location:** `C:\Users\emeskel\Claude\cares-guide\scrape-cares-tool.mjs`

## Usage

Run the scraper from the cares-guide directory:

```bash
cd C:/Users/emeskel/Claude/cares-guide

# Scrape specific pages
node scrape-cares-tool.mjs all-experiments
node scrape-cares-tool.mjs ingestion
node scrape-cares-tool.mjs seval-jobs

# Filter by experiment name
node scrape-cares-tool.mjs all-experiments --filter LargeCorpus
node scrape-cares-tool.mjs all-experiments --filter TechDocs

# Multiple pages at once
node scrape-cares-tool.mjs ingestion da-overview seval-jobs

# Scrape everything
node scrape-cares-tool.mjs all

# Force re-authentication (if session expired)
node scrape-cares-tool.mjs --login
node scrape-cares-tool.mjs --login all-experiments --filter LargeCorpus
```

## Available Pages

| Page | What It Scrapes |
|------|----------------|
| `all-experiments` | All Experiments list (unchecks "only my jobs", supports --filter) |
| `ingestion` | DA Ingestion Status (vectorized file counts, index rates) |
| `da-overview` | DA Overview table |
| `seval-jobs` | Seval Jobs list (unchecks "only my jobs", supports --filter) |
| `schedules` | Schedules list |
| `datasets` | Dataset Management |
| `start-experiment` | Start Experiment form |
| `home` | Home page |
| `all` | All of the above |

## Output

Data saved to: `C:\Users\emeskel\Claude\cares-guide\cares-data\live\`

For each page scraped:
- `{page}.png` — Full-page screenshot
- `{page}.json` — Structured data (tables with headers/rows, forms, links, headings)
- `{page}.txt` — Raw text content

When using `--filter`, output files include the filter: `all-experiments-largecorpus.json`

## Authentication

- Uses Playwright with a **persistent Edge profile** (`edge-temp/`) + Windows SSO (domain-joined machine)
- Auth persists between runs via the browser profile (cookies stay until expired)
- If SSO fails, browser window opens for manual login
- Use `--login` flag to force re-navigation through SSO
- Use `--headless` for headless mode (may not work with SSO on first auth)

## Troubleshooting

- **Browser fails to launch**: Ensure Microsoft Edge is installed
- **SSO timeout**: Run without `--headless`, let it open the browser window
- **Empty tables / stale data**: Portal SPA may be slow to render; re-run
- **`edge-temp/` growing large**: Delete the directory to reclaim disk space

## After Scraping

Read the JSON files to analyze the data:
```bash
cat cares-data/live/all-experiments-largecorpus.json
```

Or read screenshots to see the portal visually:
```
Read cares-data/live/ingestion.png
```

## Common Workflows

### Find BYOA candidates for a dataset
```bash
node scrape-cares-tool.mjs all-experiments --filter LargeCorpus
```
Then check JSON for Completed DAGeneralE2ERun experiments from other users.

### Validate tenant vectorization
```bash
node scrape-cares-tool.mjs ingestion
```
Check Vectorized File Count matches Files Count in the JSON output.

### Check experiment health before creating schedule
```bash
node scrape-cares-tool.mjs all-experiments seval-jobs --filter AQG_TechDocs
```

## Portal Details
- URL: `https://caresportal.microsoft-int.com/`
- User: `emeskel@microsoft.com`
- Auth: Azure AD via Windows SSO
