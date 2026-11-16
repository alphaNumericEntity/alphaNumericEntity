import { readFile, writeFile } from "node:fs/promises";

const LOGIN = "alphaNumericEntity";
const README = new URL("../README.md", import.meta.url);
const START = "<!-- contributions:start -->";
const END = "<!-- contributions:end -->";

const headers = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  ...(process.env.GITHUB_TOKEN && { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }),
};

async function api(path) {
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

function formatStars(n) {
  return n >= 1000 ? `${Math.round(n / 1000)}k` : String(n);
}

function escapeCell(text) {
  return text.replaceAll("|", "\\|").replaceAll("[", "\\[").replaceAll("]", "\\]");
}

const query = encodeURIComponent(`is:pr author:${LOGIN} -user:${LOGIN}`);
const { items } = await api(`/search/issues?q=${query}&sort=created&order=desc&per_page=50`);

const shown = items.filter((pr) => pr.state === "open" || pr.pull_request?.merged_at);
const repoNames = [...new Set(shown.map((pr) => pr.repository_url.split("/repos/")[1]))];
const stars = new Map(
  await Promise.all(repoNames.map(async (name) => [name, (await api(`/repos/${name}`)).stargazers_count]))
);

const rows = shown.map((pr) => {
  const repo = pr.repository_url.split("/repos/")[1];
  const mergedAt = pr.pull_request?.merged_at;
  const status = mergedAt ? `Merged ${mergedAt.slice(0, 10)}` : "Open";
  return `| [${repo}](https://github.com/${repo}) ★${formatStars(stars.get(repo))} | [${escapeCell(pr.title)}](${pr.html_url}) | ${status} |`;
});

const table = ["| Project | Pull request | Status |", "|---|---|---|", ...rows].join("\n");
const readme = await readFile(README, "utf8");
const start = readme.indexOf(START);
const end = readme.indexOf(END);
if (start === -1 || end === -1) throw new Error("contribution markers not found in README.md");
const next = `${readme.slice(0, start + START.length)}\n${table}\n${readme.slice(end)}`;
if (next !== readme) await writeFile(README, next);
console.log(`${rows.length} pull requests listed`);
