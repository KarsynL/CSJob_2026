# Job Radar AU/NZ

A lightweight local job index tailored for:

- Cyber-security and AI-related research fellow / assistant / post-doc roles in Australia and New Zealand
- Software engineer, data analyst, and cyber-security industry roles in Australia
- Active listings from LinkedIn, Seek, Indeed, and company career sites

## Files

- `index.html`: the UI shell
- `styles.css`: visual design
- `jobs.js`: job dataset
- `app.js`: filtering, active status logic, and priority ranking

## Run locally

Open [`index.html`](/Users/karsyn/Documents/Playground/index.html) in a browser.

The current dataset has been refreshed with real, source-linked opportunities that were visible on March 31, 2026.

Or run a local static server from `/Users/karsyn/Documents/Playground`:

```bash
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000).

## Publish with GitHub Pages

This project is already structured for GitHub Pages because it is a static site with `index.html` at the repo root.

### Option 1: Deploy from the main branch

1. Create a new GitHub repository.
2. Add that repo as the remote for this folder.
3. Push the files to the default branch.
4. In GitHub, open `Settings` -> `Pages`.
5. Under `Build and deployment`, choose `Deploy from a branch`.
6. Select your default branch and the `/ (root)` folder.
7. Save.

Your public link will usually look like:

```text
https://YOUR_GITHUB_USERNAME.github.io/REPOSITORY_NAME/
```

### Commands to connect and push

Replace `YOUR_GITHUB_USERNAME` and `REPOSITORY_NAME` with your own values:

```bash
git add .
git commit -m "Initial job radar site"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/REPOSITORY_NAME.git
git push -u origin main
```

If you prefer SSH:

```bash
git remote add origin git@github.com:YOUR_GITHUB_USERNAME/REPOSITORY_NAME.git
git push -u origin main
```

### After publishing

- GitHub Pages may take a minute or two to go live.
- If the site does not load at first, refresh after the Pages deployment finishes.
- Once published, you can share the GitHub Pages URL directly.

## Update the jobs list

Edit [`jobs.js`](/Users/karsyn/Documents/Playground/jobs.js) and add entries in this shape:

```js
{
  id: "unique-id",
  title: "Postdoctoral Research Fellow in Cyber Security",
  organization: "University name or company",
  location: "City, Country",
  region: "australia" | "new-zealand",
  track: "research" | "industry",
  roleFamily: "cybersecurity" | "ai-research" | "software-engineering" | "data-analytics",
  source: "linkedin" | "seek" | "indeed" | "company",
  status: "active" | "inactive",
  workMode: "remote" | "hybrid" | "on-site",
  postedDate: "YYYY-MM-DD",
  postedLabel: "Listed 3 days ago",
  closingDate: "YYYY-MM-DD",
  priorityScore: 0-100,
  verifiedDate: "YYYY-MM-DD",
  sourceNote: "What was verified and where",
  tags: ["keyword 1", "keyword 2"],
  summary: "Why this role matters to you.",
  url: "https://..."
}
```

## What "active" means right now

A role is shown as active only when:

- `status` is `"active"`
- `verifiedDate` is still inside the 1-day freshness window in [`app.js`](/Users/karsyn/Documents/Playground/app.js)
- `closingDate` is either empty or on/after today's date in [`app.js`](/Users/karsyn/Documents/Playground/app.js)

When a posting does not expose a close date in the search result, the app keeps it active only if it has been re-verified within the daily window.

## Good next steps

- Replace the sample entries with real jobs
- Re-verify entries every day or two, especially LinkedIn / SEEK results without explicit closing dates
- Add an import script that normalizes jobs from LinkedIn / Seek / Indeed / company pages into `jobs.js`
- Add saved status fields like `not-applied`, `applied`, `interview`, `rejected`
- Add deduplication by title + organization + location + source URL
