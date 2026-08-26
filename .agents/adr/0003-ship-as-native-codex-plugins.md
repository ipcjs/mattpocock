# Ship the skill set as native Codex plugins

[ADR 0002](./0002-ship-as-a-claude-code-plugin.md) deferred a native Codex plugin because Codex then accepted only one skills path. Current Codex accepts an array of paths, so the complete `mattpocock-skills` plugin can now point at `skills/engineering/` and `skills/productivity/` without exposing the non-promoted buckets or moving and duplicating skill files.

## Decision

The repository publishes `mattpocock-skills` as the complete native Codex plugin. Its manifest lists the two promoted bucket roots. The `ipcjs/mattpocock` fork is the documented marketplace source because the Codex plugin change is not accepted upstream.

The same marketplace also contains `matt-engineering`, `matt-productivity`, `matt-misc`, and `matt-in-progress`. Each plugin root is its bucket directory, and each manifest explicitly lists the direct child directories that contain a `SKILL.md`. These per-bucket plugins exist only for selective personal installation and are deliberately not documented. There is no `matt-deprecated` plugin.

## Consequences

`package.json` remains the version source for the Claude and Codex plugin manifests. `scripts/sync-plugin-version.mjs` also regenerates the Claude promoted-skill list and each per-bucket Codex skill list from the filesystem. The complete Codex plugin's two-root selection remains an intentional fixed boundary.
