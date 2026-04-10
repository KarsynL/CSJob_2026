# Job Radar AU/NZ

A static job website for Australia and New Zealand that rebuilds its job list from public web pages on a weekly schedule.

## Files

- `index.html`: UI shell
- `styles.css`: styling
- `app.js`: filtering, active-status logic, and rendering
- `jobs.js`: generated job dataset used by the browser
- `jobs.discovery.json`: public source pages to collect from
- `scripts/collect-jobs.mjs`: weekly collector that rebuilds `jobs.js`
- `scripts/job-data-utils.mjs`: shared helpers for generated data files
- `.github/workflows/weekly-job-collect.yml`: weekly GitHub Actions workflow

## How It Works

The website is static, but its data can be refreshed automatically.

Each weekly collection run:

1. Reads [`jobs.discovery.json`](/Users/karsyn/Documents/Playground/jobs.discovery.json)
2. Fetches the public listing/search pages configured there
3. Extracts likely job links using simple HTML rules
4. Normalizes them into the website job format
5. Overwrites [`jobs.js`](/Users/karsyn/Documents/Playground/jobs.js) from scratch

There is no saved seed JSON in the collection pipeline anymore.

## Current Sources

Configured sources currently include public pages for:

- ANU jobs
- Canva jobs
- LinkedIn jobs search
- SEEK jobs search
- Indeed jobs search
- Google search results

These are defined in [`jobs.discovery.json`](/Users/karsyn/Documents/Playground/jobs.discovery.json).

## Run Locally

Open [`index.html`](/Users/karsyn/Documents/Playground/index.html) directly in a browser, or run:

```bash
cd /Users/karsyn/Documents/Playground
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000).

## Test The Collector

Dry-run the source configuration without changing [`jobs.js`](/Users/karsyn/Documents/Playground/jobs.js):

```bash
cd /Users/karsyn/Documents/Playground
npm run collect:jobs:offline
```

Run the real collector:

```bash
cd /Users/karsyn/Documents/Playground
npm run collect:jobs
```

Then reload the site and inspect [`jobs.js`](/Users/karsyn/Documents/Playground/jobs.js).

## Configure What Gets Collected

Edit [`jobs.discovery.json`](/Users/karsyn/Documents/Playground/jobs.discovery.json).

Each source can define:

- `url`: public listing/search page
- `source`: `company`, `linkedin`, `seek`, or `indeed`
- `region`, `track`, `roleFamily`, `workMode`
- `includeKeywords`: words that should appear in a likely match
- `excludeKeywords`: words to filter out
- `tags`
- optional `priorityScore`

## Weekly GitHub Automation

The workflow is in [`.github/workflows/weekly-job-collect.yml`](/Users/karsyn/Documents/Playground/.github/workflows/weekly-job-collect.yml).

It:

- runs weekly
- rebuilds [`jobs.js`](/Users/karsyn/Documents/Playground/jobs.js) from public sources
- commits the updated generated file back to GitHub

The current cron is set to Sunday `22:00 UTC`, which is Monday morning in Sydney.

## Publish With GitHub Pages

1. Push this repository to GitHub.
2. In GitHub, open `Settings` -> `Pages`.
3. Under `Build and deployment`, choose `Deploy from a branch`.
4. Select your default branch and the `/ (root)` folder.
5. Save.

If Actions is enabled, the weekly collector can refresh the generated job data and GitHub Pages will serve the updated static site.

## Limitations

This collector uses lightweight public-page scraping, so it is inherently fragile.

- Company career pages are the most reliable sources.
- LinkedIn, SEEK, Indeed, and Google can block scraping or change their markup.
- Some weeks a source may return fewer jobs or none at all.
- Generated summaries, locations, and labels are approximate and may need refinement later.

## Current Active Logic

In the UI, a role is treated as open when:

- `status` is `"active"`
- `closingDate` is empty or on/after today

The freshness badge in [`app.js`](/Users/karsyn/Documents/Playground/app.js) still uses the role’s `verifiedDate`.

## Good Next Steps

- Add more reliable company career pages to [`jobs.discovery.json`](/Users/karsyn/Documents/Playground/jobs.discovery.json)
- Add source-specific parsers for ANU, Canva, SEEK, Indeed, and LinkedIn
- Improve ranking so strong matches score above generic collected roles
- Add richer deduplication and better location extraction
