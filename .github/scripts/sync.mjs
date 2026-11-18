#!/usr/bin/env node
// Keeps the README skills table and marketplace.json in step with skills/.
//
//   node .github/scripts/sync.mjs          rewrite README.md and marketplace.json
//   node .github/scripts/sync.mjs --check  exit 1 if either would change
//
// Three things are kept in step:
//   - the README table between <!-- SKILLS:START --> and <!-- SKILLS:END -->,
//     grouped by metadata.category
//   - the skill count at the start of plugins[0].description in marketplace.json
//   - the prerequisite block in every SKILL.md, which is whatever sits between
//     the H1 and the first "##" and is rewritten from templates/glasser-prereq.md;
//     a mirror (frontmatter with metadata.source) keeps its published body as is
// Zero dependencies; Node 20+.

import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const SKILLS_DIR = join(ROOT, "skills");
const README_FILE = join(ROOT, "README.md");
const MARKETPLACE_FILE = join(ROOT, ".claude-plugin/marketplace.json");
const PREREQ_FILE = join(ROOT, "templates/glasser-prereq.md");

const CHECK = process.argv.includes("--check");

// Display names for categories, in the order the README shows them. A category
// not listed here is shown with its first letter capitalised, after the listed
// ones, so adding a category needs no change to this file.
const CATEGORY_TITLES = {
  core: "Core",
  seo: "SEO/GEO",
  marketing: "Marketing",
  sales: "Sales",
  ecommerce: "E-commerce",
  research: "Research",
  investment: "Investment",
};

function frontmatter(text) {
  const lines = text.split("\n");
  if (lines[0] !== "---") return {};
  const end = lines.indexOf("---", 1);
  const out = { metadata: {} };
  let inMeta = false;
  for (const line of lines.slice(1, end)) {
    if (!line.trim()) continue;
    if (/^\s/.test(line)) {
      if (!inMeta) continue;
      const m = line.match(/^\s+([A-Za-z_]+):\s(.*)$/);
      if (m) out.metadata[m[1]] = unquote(m[2].trim());
      continue;
    }
    inMeta = false;
    const m = line.match(/^([A-Za-z_]+):(?:\s(.*))?$/);
    if (!m) continue;
    if (m[1] === "metadata") { inMeta = true; continue; }
    out[m[1]] = unquote((m[2] ?? "").trim());
  }
  return out;
}

function unquote(v) {
  if (v.length >= 2 && ((v[0] === '"' && v.at(-1) === '"') || (v[0] === "'" && v.at(-1) === "'"))) return v.slice(1, -1);
  return v;
}

function loadSkills() {
  if (!existsSync(SKILLS_DIR)) return [];
  return readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith(".") && existsSync(join(SKILLS_DIR, e.name, "SKILL.md")))
    .map((e) => {
      const fm = frontmatter(readFileSync(join(SKILLS_DIR, e.name, "SKILL.md"), "utf8"));
      return {
        dir: e.name,
        name: fm.name || e.name,
        description: fm.description || "",
        category: fm.metadata.category || "other",
        version: fm.metadata.version || fm.version || "",
        mirror: Boolean(fm.metadata.source),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

// The description field is written for the agent's trigger matching and can
// run to several hundred characters. The table shows only its first sentence.
function summary(description) {
  const first = description.match(/^(.+?[.!?])(\s|$)/);
  const s = (first ? first[1] : description).trim();
  return s.replace(/\|/g, "\\|");
}

function categoryTitle(c) {
  return CATEGORY_TITLES[c] ?? c.charAt(0).toUpperCase() + c.slice(1);
}

function renderTable(skills) {
  const byCategory = new Map();
  for (const s of skills) {
    if (!byCategory.has(s.category)) byCategory.set(s.category, []);
    byCategory.get(s.category).push(s);
  }
  const order = [...byCategory.keys()].sort((a, b) => {
    const ia = Object.keys(CATEGORY_TITLES).indexOf(a);
    const ib = Object.keys(CATEGORY_TITLES).indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
  const blocks = order.map((c) => {
    const rows = byCategory.get(c).map((s) => `| [${s.name}](skills/${s.dir}/) | ${summary(s.description)} |`);
    return [`### ${categoryTitle(c)}`, "", "| Skill | What it does |", "|---|---|", ...rows].join("\n");
  });
  return blocks.join("\n\n");
}

function syncReadme(skills) {
  const content = readFileSync(README_FILE, "utf8");
  const re = /(<!-- SKILLS:START -->)\n?[\s\S]*?\n?(<!-- SKILLS:END -->)/;
  if (!re.test(content)) return { ok: false, msg: "README.md has no <!-- SKILLS:START --> ... <!-- SKILLS:END --> markers" };
  const next = content.replace(re, `$1\n${renderTable(skills)}\n$2`);
  if (next === content) return { ok: true, changed: false };
  if (!CHECK) writeFileSync(README_FILE, next);
  return { ok: true, changed: true, msg: "README.md skills table is out of date; run node .github/scripts/sync.mjs" };
}

function syncMarketplace(skills) {
  if (!existsSync(MARKETPLACE_FILE)) return { ok: false, msg: ".claude-plugin/marketplace.json missing" };
  const raw = readFileSync(MARKETPLACE_FILE, "utf8");
  const m = JSON.parse(raw);
  const plugin = m.plugins?.[0];
  if (!plugin) return { ok: false, msg: "marketplace.json has no plugins[0]" };
  const desc = plugin.description.replace(/^\d+ skills?\b/, `${skills.length} skill${skills.length === 1 ? "" : "s"}`);
  if (desc === plugin.description) return { ok: true, changed: false };
  plugin.description = desc;
  if (!CHECK) writeFileSync(MARKETPLACE_FILE, JSON.stringify(m, null, 2) + "\n");
  return { ok: true, changed: true, msg: "marketplace.json skill count is out of date; run node .github/scripts/sync.mjs" };
}

// Rewrites the region between the H1 and the first "##" of each SKILL.md so it
// is exactly the prerequisite block. Changing the wording is then one edit to
// templates/glasser-prereq.md followed by one run of this script.
function syncPrereq(skills) {
  if (!existsSync(PREREQ_FILE)) return { ok: false, msg: "templates/glasser-prereq.md missing" };
  const block = readFileSync(PREREQ_FILE, "utf8").replace(/\s+$/, "");
  const stale = [];
  for (const s of skills) {
    if (s.mirror) continue;
    const file = join(SKILLS_DIR, s.dir, "SKILL.md");
    const text = readFileSync(file, "utf8");
    const lines = text.split("\n");
    const fmEnd = lines[0] === "---" ? lines.indexOf("---", 1) : -1;
    const h1 = lines.findIndex((l, i) => i > fmEnd && /^# /.test(l));
    if (h1 === -1) return { ok: false, msg: `skills/${s.dir}/SKILL.md has no H1; cannot place the prerequisite block` };
    let firstH2 = lines.findIndex((l, i) => i > h1 && /^## /.test(l));
    if (firstH2 === -1) firstH2 = lines.length;
    const next = [...lines.slice(0, h1 + 1), "", ...block.split("\n"), "", ...lines.slice(firstH2)].join("\n");
    if (next === text) continue;
    stale.push(s.dir);
    if (!CHECK) writeFileSync(file, next);
  }
  if (!stale.length) return { ok: true, changed: false };
  return { ok: true, changed: true, msg: `prerequisite block out of date in: ${stale.join(", ")}; run node .github/scripts/sync.mjs` };
}

function main() {
  const skills = loadSkills();
  const results = [syncPrereq(skills), syncReadme(skills), syncMarketplace(skills)];
  const failed = results.filter((r) => !r.ok);
  const changed = results.filter((r) => r.ok && r.changed);

  for (const r of failed) console.log(r.msg);
  if (failed.length) process.exit(1);

  if (CHECK) {
    for (const r of changed) console.log(r.msg);
    process.exit(changed.length ? 1 : 0);
  }
  console.log(changed.length ? `Updated ${changed.length} file(s) for ${skills.length} skill(s)` : `Already in sync (${skills.length} skills)`);
}

main();
