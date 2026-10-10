#!/usr/bin/env node
// Mirror the published Glasser skill into skills/glasser/SKILL.md.
//
// The source of truth is https://glasser.ai/SKILL.md, released in lockstep with
// the glasser CLI. This repository keeps a byte-identical copy of its body so
// that skill catalogs which need a GitHub file to pin (Paperclip's skills
// catalog, for one) can reference it. Only the frontmatter differs: the
// description is the short form below (catalogs cap it at 300 characters) and
// `metadata.source` points back at the original.
//
// Run after every CLI release, then commit and tag:
//
//   node scripts/sync-glasser-skill.mjs
import { readFileSync, writeFileSync } from "node:fs";

const SOURCE = "https://glasser.ai/SKILL.md";
// Fetched with this repository's source tag: glasser.ai rewrites every
// `glasser login` in the body to carry it, so sign-ups through this copy are
// attributed to it. `metadata.source` below still names the canonical URL.
const FETCH_URL = `${SOURCE}?utm_source=glasser-skills&utm_medium=skill`;
const TARGET = new URL("../skills/glasser/SKILL.md", import.meta.url);
const DESCRIPTION =
  "Find and call 1,000+ paid data endpoints with one key: person and company enrichment, people and company search, " +
  "web, news, maps, scholar and shopping search, SEO, social media, US property data, scraping. Search, inspect the price, " +
  "run, pay per call. Runs through the glasser CLI or its MCP server.";

if (DESCRIPTION.length > 300) throw new Error(`description is ${DESCRIPTION.length} chars; catalogs cap it at 300`);

const response = await fetch(FETCH_URL);
if (!response.ok) throw new Error(`${SOURCE}: HTTP ${response.status}`);
const published = await response.text();
const match = published.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
if (!match) throw new Error(`${SOURCE}: no frontmatter`);
const [, frontmatter, body] = match;
const version = /^version:\s*(.+)$/m.exec(frontmatter)?.[1]?.trim();
if (!version) throw new Error(`${SOURCE}: frontmatter has no version`);

const mirrored = [
  "---",
  "name: glasser",
  `description: ${DESCRIPTION}`,
  `version: ${version}`,
  "metadata:",
  `  source: ${SOURCE}`,
  "  category: research",
  "---",
  body,
].join("\n");

let previous = "";
try {
  previous = readFileSync(TARGET, "utf8");
} catch {}
writeFileSync(TARGET, mirrored);
console.log(`${previous === mirrored ? "unchanged" : "updated"} skills/glasser/SKILL.md (source version ${version})`);
