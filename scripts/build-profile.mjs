import { mkdir, readFile, rm, writeFile } from "node:fs/promises";

const LOGIN = "alphaNumericEntity";
const ROOT = new URL("../", import.meta.url);
const README = new URL("README.md", ROOT);
const START = "<!-- profile:start -->";
const END = "<!-- profile:end -->";
const WIDTH = 860;
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

const PROJECTS = [
  {
    name: "PDFAirlock",
    url: "https://pdfairlock.com",
    kind: "Web app · AGPL-3.0",
    lines: ["PDF tools that run entirely in", "your browser. Its connect-src", "'self' policy stops the file from", "leaving the page. Works offline."],
  },
  {
    name: "pdf-redaction-check",
    url: "https://github.com/alphaNumericEntity/pdf-redaction-check",
    kind: "Node CLI + library · MIT",
    lines: ["Finds text left under black", "boxes, unapplied Redact marks", "and removed text still kept in", "a PDF's earlier saved versions."],
  },
  {
    name: "no-phone-home",
    url: "https://github.com/alphaNumericEntity/no-phone-home",
    kind: "CI check · MIT",
    lines: ["Fails CI when a page can contact", "a host you didn't allow. Checks the", "served policy, a real browser run,", "workers and scripted user flows."],
  },
];

const THEMES = {
  light: { bg: "#ffffff", panel: "#f6f8fa", border: "#d0d7de", text: "#1f2328", muted: "#59636e", accent: "#0969da", open: "#1a7f37", reviewed: "#9a6700", approved: "#0969da", changes: "#bc4c00", merged: "#8250df" },
  dark: { bg: "#0d1117", panel: "#161b22", border: "#30363d", text: "#e6edf3", muted: "#9198a1", accent: "#4493f8", open: "#3fb950", reviewed: "#d29922", approved: "#4493f8", changes: "#db6d28", merged: "#ab7df8" },
};

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

function escapeXml(text) {
  return String(text).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function cleanTitle(text) {
  return text.replace(/[\u0000-\u001F\u007F￾￿]/g, " ").replace(/\s+/g, " ").trim();
}

function formatStars(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, "")}k`;
  return String(n);
}

function fit(text, maxChars) {
  const chars = Array.from(text);
  return chars.length <= maxChars ? text : `${chars.slice(0, maxChars - 1).join("").trimEnd()}…`;
}

function plural(n, word) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function svg(height, theme, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}" font-family="${FONT}">
<rect x="0.5" y="0.5" width="${WIDTH - 1}" height="${height - 1}" rx="12" fill="${theme.bg}" stroke="${theme.border}"/>
${body}
</svg>
`;
}

async function reviewState(pr) {
  const [owner, repo] = pr.repo.split("/");
  const reviews = await api(`/repos/${owner}/${repo}/pulls/${pr.number}/reviews?per_page=100`);
  const latest = new Map();
  for (const review of reviews) {
    if (review.state === "APPROVED" || review.state === "CHANGES_REQUESTED") latest.set(review.user?.login, review.state);
  }
  const states = [...latest.values()];
  if (states.includes("CHANGES_REQUESTED")) return "changes";
  if (states.includes("APPROVED")) return "approved";
  return reviews.some((review) => review.user?.login !== LOGIN) ? "reviewed" : "open";
}

const STATUS_LABEL = { merged: "Merged", approved: "Approved", changes: "Changes asked", reviewed: "In review", open: "Open" };

function heroSvg(stats, theme) {
  const merged = stats.merged > 0
    ? `${plural(stats.merged, "pull request")} merged into ${plural(stats.mergedProjects, "project")}`
    : `${plural(stats.open, "pull request")} open in ${plural(stats.openProjects, "project")}`;
  const second = stats.merged > 0
    ? `${stats.open} more open · projects with ${formatStars(stats.stars)} GitHub stars between them`
    : `projects with ${formatStars(stats.stars)} GitHub stars between them`;
  return svg(150, theme, `
<text x="32" y="50" font-size="26" font-weight="600" fill="${theme.text}">alphaNumericEntity</text>
<text x="32" y="78" font-size="15" fill="${theme.muted}">I build privacy-first tools, and fix bugs in the open-source libraries underneath them.</text>
<line x1="32" y1="98" x2="${WIDTH - 32}" y2="98" stroke="${theme.border}"/>
<text x="32" y="126" font-size="15" fill="${theme.text}"><tspan font-weight="600">${escapeXml(merged)}</tspan><tspan fill="${theme.muted}"> · ${escapeXml(second)}</tspan></text>
<text x="${WIDTH - 32}" y="50" font-size="13" fill="${theme.muted}" text-anchor="end">Sydney, Australia</text>`);
}

function projectsSvg(theme) {
  const gap = 16;
  const cardWidth = (WIDTH - 64 - gap * 2) / 3;
  const cards = PROJECTS.map((project, i) => {
    const x = 32 + i * (cardWidth + gap);
    const lines = project.lines
      .map((line, j) => `<text x="${x + 16}" y="${118 + j * 19}" font-size="12.5" fill="${theme.muted}">${escapeXml(line)}</text>`)
      .join("\n");
    return `<rect x="${x}" y="52" width="${cardWidth}" height="150" rx="8" fill="${theme.panel}" stroke="${theme.border}"/>
<text x="${x + 16}" y="80" font-size="15" font-weight="600" fill="${theme.accent}">${escapeXml(project.name)}</text>
<text x="${x + 16}" y="98" font-size="11.5" fill="${theme.muted}" font-family="${MONO}">${escapeXml(project.kind)}</text>
${lines}`;
  });
  return svg(226, theme, `
<text x="32" y="36" font-size="13" font-weight="600" letter-spacing="1.2" fill="${theme.muted}">MY PROJECTS</text>
${cards.join("\n")}`);
}

function sectionTitleSvg(text, theme) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="44" viewBox="0 0 ${WIDTH} 44" font-family="${FONT}">
<text x="24" y="30" font-size="13" font-weight="600" letter-spacing="1.2" fill="${theme.muted}">${escapeXml(text)}</text>
</svg>
`;
}

function prSvg(pr, theme) {
  const color = theme[pr.status] ?? theme.open;
  const label = STATUS_LABEL[pr.status];
  const pillWidth = 18 + label.length * 7;
  return svg(62, theme, `
<text x="24" y="27" font-size="13" font-weight="600" fill="${theme.text}">${escapeXml(pr.repo)}<tspan font-weight="400" fill="${theme.muted}">  ★ ${formatStars(pr.stars)}</tspan></text>
<text x="24" y="45" font-size="12.5" fill="${theme.muted}">${escapeXml(fit(pr.title, 96))}</text>
<rect x="${WIDTH - 24 - pillWidth}" y="20" width="${pillWidth}" height="22" rx="11" fill="none" stroke="${color}"/>
<text x="${WIDTH - 24 - pillWidth / 2}" y="35" font-size="12" font-weight="600" fill="${color}" text-anchor="middle">${label}</text>`);
}

function emptySvg(theme) {
  return svg(62, theme, `
<text x="24" y="36" font-size="13" fill="${theme.muted}">Nothing open right now.</text>`);
}

function prSlug(pr) {
  return `${pr.repo.replace("/", "-")}-${pr.number}`.replace(/[^A-Za-z0-9._-]/g, "-");
}

function picture(name, alt, href) {
  const img = `<picture><source media="(prefers-color-scheme: dark)" srcset="assets/dark/${name}.svg"><img src="assets/light/${name}.svg" width="100%" alt="${escapeXml(alt)}"></picture>`;
  return href ? `<a href="${href}">${img}</a>` : img;
}

const query = encodeURIComponent(`is:pr author:${LOGIN} -user:${LOGIN}`);
const items = [];
for (let page = 1; page <= 10; page++) {
  const result = await api(`/search/issues?q=${query}&sort=created&order=desc&per_page=100&page=${page}`);
  if (result.incomplete_results) throw new Error("GitHub search returned incomplete results");
  items.push(...result.items);
  if (result.items.length < 100) break;
}
const relevant = items.filter((item) => item.state === "open" || item.pull_request?.merged_at);
const repoNames = [...new Set(relevant.map((item) => item.repository_url.split("/repos/")[1]))];
const stars = new Map();
for (const name of repoNames) {
  stars.set(name, await api(`/repos/${name}`).then((repo) => repo.stargazers_count, () => 0));
}

const prs = [];
for (const item of relevant) {
  const repo = item.repository_url.split("/repos/")[1];
  const merged = Boolean(item.pull_request?.merged_at);
  const pr = { repo, number: item.number, title: cleanTitle(item.title), url: item.html_url, stars: stars.get(repo), mergedAt: item.pull_request?.merged_at ?? null };
  prs.push({ ...pr, status: merged ? "merged" : await reviewState(pr).catch(() => "open") });
}
const order = { merged: 0, approved: 1, changes: 2, reviewed: 3, open: 4 };
prs.sort((a, b) => order[a.status] - order[b.status] || (b.mergedAt ?? "").localeCompare(a.mergedAt ?? "") || b.stars - a.stars);

const mergedPrs = prs.filter((pr) => pr.status === "merged");
const openPrs = prs.filter((pr) => pr.status !== "merged");
const stats = {
  merged: mergedPrs.length,
  mergedProjects: new Set(mergedPrs.map((pr) => pr.repo)).size,
  open: openPrs.length,
  openProjects: new Set(openPrs.map((pr) => pr.repo)).size,
  stars: repoNames.reduce((sum, name) => sum + (stars.get(name) ?? 0), 0),
};

for (const [mode, theme] of Object.entries(THEMES)) {
  const dir = new URL(`assets/${mode}/`, ROOT);
  const prDir = new URL("prs/", dir);
  await mkdir(dir, { recursive: true });
  await rm(new URL("contributions.svg", dir), { force: true });
  await rm(prDir, { recursive: true, force: true });
  await mkdir(prDir, { recursive: true });
  await writeFile(new URL("hero.svg", dir), heroSvg(stats, theme));
  await writeFile(new URL("projects.svg", dir), projectsSvg(theme));
  await writeFile(new URL("contributions-title.svg", dir), sectionTitleSvg("PULL REQUESTS TO OTHER PEOPLE'S PROJECTS", theme));
  if (prs.length === 0) await writeFile(new URL("empty.svg", prDir), emptySvg(theme));
  for (const pr of prs) await writeFile(new URL(`${prSlug(pr)}.svg`, prDir), prSvg(pr, theme));
}

const searchUrl = `https://github.com/search?q=${query}&type=pullrequests`;
const heroAlt = stats.merged > 0
  ? `${plural(stats.merged, "pull request")} merged into ${plural(stats.mergedProjects, "project")}, ${stats.open} open`
  : `${plural(stats.open, "pull request")} open in ${plural(stats.openProjects, "project")}`;
const prPictures = prs.length === 0
  ? picture("prs/empty", "No open pull requests right now")
  : prs.map((pr) => picture(`prs/${prSlug(pr)}`, `${pr.repo}: ${pr.title} (${STATUS_LABEL[pr.status]})`, pr.url)).join("\n");

const section = `<p align="center">
${picture("hero", `alphaNumericEntity. ${heroAlt}.`, searchUrl)}
${picture("projects", "My projects: PDFAirlock, pdf-redaction-check and no-phone-home", "https://github.com/alphaNumericEntity?tab=repositories")}
${picture("contributions-title", "Pull requests to other people's projects")}
${prPictures}
</p>`;

const readme = await readFile(README, "utf8");
const start = readme.indexOf(START);
const end = readme.indexOf(END);
if (start === -1 || end < start) throw new Error("profile markers missing or out of order in README.md");
const next = `${readme.slice(0, start + START.length)}\n${section}\n${readme.slice(end)}`;
if (next !== readme) await writeFile(README, next);
console.log(`${prs.length} pull requests: ${stats.merged} merged, ${stats.open} open`);
