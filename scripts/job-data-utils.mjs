import { readFile, writeFile } from "node:fs/promises";

export const escapeScriptContent = (value) =>
  value.replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");

export const serializeJobsForBrowser = (jobs) =>
  `window.JOB_DATA = ${escapeScriptContent(JSON.stringify(jobs, null, 2))};\n`;

export const readJsonFile = async (filePath) => JSON.parse(await readFile(filePath, "utf8"));

export const writeJsonFile = async (filePath, data) =>
  writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");

export const writeBrowserJobsFile = async (filePath, jobs) =>
  writeFile(filePath, serializeJobsForBrowser(jobs), "utf8");

export const getToday = () => new Date().toISOString().slice(0, 10);

export const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
