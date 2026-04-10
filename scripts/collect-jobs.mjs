import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getToday,
  readJsonFile,
  slugify,
  writeBrowserJobsFile
} from "./job-data-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const sourcesPath = path.join(projectRoot, "jobs.discovery.json");
const outputPath = path.join(projectRoot, "jobs.js");
const offlineMode = process.argv.includes("--offline");
const today = getToday();

const USER_AGENT =
  "Mozilla/5.0 (compatible; JobRadarBot/1.0; +https://github.com/your-account/your-repo)";

const MAX_RESULTS_PER_SOURCE = 12;
const DEFAULT_PRIORITY_SCORE = 72;

const decodeHtml = (value) =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

const stripTags = (value) => value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const normalizeUrl = (href, baseUrl) => {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
};

const fetchHtml = async (url) => {
  const response = await fetch(url, {
    headers: {
      "user-agent": USER_AGENT,
      accept: "text/html,application/xhtml+xml"
    },
    redirect: "follow"
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.text();
};

const extractAnchors = (html, baseUrl) => {
  const anchors = [];
  const anchorPattern = /<a\b[^>]*href=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi;

  for (const match of html.matchAll(anchorPattern)) {
    const href = normalizeUrl(match[2], baseUrl);
    const text = decodeHtml(stripTags(match[3]));

    if (!href || !text) {
      continue;
    }

    anchors.push({ href, text });
  }

  return anchors;
};

const looksRelevant = (anchor, sourceConfig) => {
  const combined = `${anchor.text} ${anchor.href}`.toLowerCase();
  const hasIncludeKeyword =
    !sourceConfig.includeKeywords?.length ||
    sourceConfig.includeKeywords.some((keyword) => combined.includes(keyword.toLowerCase()));
  const hasExcludeKeyword =
    sourceConfig.excludeKeywords?.some((keyword) => combined.includes(keyword.toLowerCase())) || false;
  const looksLikeJobPage =
    /job|jobs|career|careers|position|opening|opportunit|listing|vacanc/i.test(combined);

  return hasIncludeKeyword && !hasExcludeKeyword && looksLikeJobPage;
};

const guessOrganization = (sourceConfig, url) => {
  if (sourceConfig.organization && sourceConfig.organization !== "Unknown") {
    return sourceConfig.organization;
  }

  return new URL(url).hostname.replace(/^www\./, "");
};

const buildSummary = (title, sourceConfig, organization) =>
  `Weekly auto-collected ${sourceConfig.track} role from ${organization}: ${title}.`;

const buildJob = (anchor, sourceConfig) => {
  const organization = guessOrganization(sourceConfig, anchor.href);

  return {
    id: `${sourceConfig.id}-${slugify(anchor.text)}`,
    title: anchor.text,
    organization,
    location: sourceConfig.location || (sourceConfig.region === "new-zealand" ? "New Zealand" : "Australia"),
    region: sourceConfig.region,
    track: sourceConfig.track,
    roleFamily: sourceConfig.roleFamily,
    source: sourceConfig.source,
    status: "active",
    workMode: sourceConfig.workMode || "hybrid",
    postedDate: null,
    postedLabel: `Collected ${today}`,
    closingDate: null,
    priorityScore: sourceConfig.priorityScore || DEFAULT_PRIORITY_SCORE,
    verifiedDate: today,
    sourceNote: `Weekly auto-collected from ${sourceConfig.url} on ${today}. Public search pages can change, so review before applying.`,
    tags: sourceConfig.tags || [],
    summary: buildSummary(anchor.text, sourceConfig, organization),
    url: anchor.href
  };
};

const uniqueByUrl = (jobs) => {
  const seen = new Set();
  return jobs.filter((job) => {
    if (seen.has(job.url)) {
      return false;
    }

    seen.add(job.url);
    return true;
  });
};

const collectFromSource = async (sourceConfig) => {
  if (offlineMode) {
    return [];
  }

  const html = await fetchHtml(sourceConfig.url);
  const anchors = extractAnchors(html, sourceConfig.url);
  const jobs = [];

  for (const anchor of anchors) {
    if (!looksRelevant(anchor, sourceConfig)) {
      continue;
    }

    jobs.push(buildJob(anchor, sourceConfig));

    if (jobs.length >= MAX_RESULTS_PER_SOURCE) {
      break;
    }
  }

  return uniqueByUrl(jobs);
};

const main = async () => {
  const sources = await readJsonFile(sourcesPath);

  if (offlineMode) {
    console.log(`Offline mode: validated ${sources.length} source definition(s); jobs.js left unchanged`);
    return;
  }

  const allJobs = [];

  for (const sourceConfig of sources) {
    try {
      const jobs = await collectFromSource(sourceConfig);
      allJobs.push(...jobs);
      console.log(`Source ${sourceConfig.id}: collected ${jobs.length} job(s)`);
    } catch (error) {
      console.warn(`Source ${sourceConfig.id}: ${error.message}`);
    }
  }

  const jobs = uniqueByUrl(allJobs).sort((a, b) => b.priorityScore - a.priorityScore);
  await writeBrowserJobsFile(outputPath, jobs);
  console.log(`Wrote ${jobs.length} jobs to ${path.relative(projectRoot, outputPath)}`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
