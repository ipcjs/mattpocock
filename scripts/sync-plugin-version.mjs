#!/usr/bin/env node
// Synchronizes plugin versions and the generated Claude and Codex skill lists.
// Runs as part of `npm run version`, immediately after `changeset version`.
// With --check it changes nothing and exits 1 if any generated value differs.

import {
  existsSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const { version } = JSON.parse(readFileSync(join(repo, "package.json"), "utf8"));

function skillPaths(bucketPath, prefix = ".") {
  return readdirSync(bucketPath, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() && existsSync(join(bucketPath, entry.name, "SKILL.md")),
    )
    .map((entry) => entry.name)
    .sort()
    .map((name) => `${prefix}/${name}`);
}

function findCodexPluginManifests() {
  const rootManifest = join(repo, ".codex-plugin", "plugin.json");
  const bucketManifests = readdirSync(join(repo, "skills"), {
    withFileTypes: true,
  })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(repo, "skills", entry.name, ".codex-plugin", "plugin.json"))
    .filter(existsSync);

  return [rootManifest, ...bucketManifests].filter(existsSync).sort();
}

const claudePath = join(repo, ".claude-plugin", "plugin.json");
const claudeSkills = ["engineering", "productivity"].flatMap((bucket) =>
  skillPaths(join(repo, "skills", bucket), `./skills/${bucket}`),
);
const manifestSpecs = [
  { path: claudePath, skills: claudeSkills },
  ...findCodexPluginManifests().map((path) => {
    const pluginRoot = dirname(dirname(path));
    return {
      path,
      skills: resolve(pluginRoot) === resolve(repo) ? undefined : skillPaths(pluginRoot),
    };
  }),
];

const manifests = manifestSpecs.map(({ path, skills }) => ({
  path,
  skills,
  plugin: JSON.parse(readFileSync(path, "utf8")),
}));

const stale = manifests.filter(
  ({ plugin, skills }) =>
    plugin.version !== version ||
    (skills !== undefined && JSON.stringify(plugin.skills) !== JSON.stringify(skills)),
);

if (stale.length === 0) {
  console.log(`plugin manifests and generated skill lists are in sync at ${version}`);
  process.exit(0);
}

if (process.argv.includes("--check")) {
  for (const { path, plugin, skills } of stale) {
    const label = relative(repo, path);
    if (plugin.version !== version) {
      console.error(`${label} version is ${plugin.version}, package.json is ${version}.`);
    }
    if (
      skills !== undefined &&
      JSON.stringify(plugin.skills) !== JSON.stringify(skills)
    ) {
      console.error(`${label} skills list is out of sync.`);
    }
  }
  console.error("Run `node scripts/sync-plugin-version.mjs`.");
  process.exit(1);
}

for (const { path, plugin, skills } of stale) {
  const updated = { ...plugin, version };
  if (skills !== undefined) {
    updated.skills = skills;
  }
  writeFileSync(path, `${JSON.stringify(updated, null, 2)}\n`);
  console.log(`updated ${relative(repo, path)}`);
}
