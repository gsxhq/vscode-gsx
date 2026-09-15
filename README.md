# gsx — VS Code Extension

VS Code language support for [gsx](https://gsxhq.github.io) — JSX-style HTML templating for Go.

## What it is

gsx is a Go templating language that uses JSX-style syntax: components are
capitalized tags, holes are `{ expr }` blocks, and files embed Go, CSS, and
JavaScript inline. This extension provides syntax highlighting and a full
language client backed by `gsx lsp`.

## Requirements

The extension requires the **`gsx` binary** for diagnostics, hover,
go-to-definition, references, and formatting. Install it with:

```
go install github.com/gsxhq/gsx/cmd/gsx@latest
```

Alternatively, when you open a `.gsx` file without `gsx` on your PATH the
extension shows a one-click **"Install gsx"** prompt that runs the command for
you.

To pin gsx per project instead, declare it as a tool in your `go.mod`:

```
go get -tool github.com/gsxhq/gsx/cmd/gsx@latest
```

The extension then runs `go tool gsx lsp` from the workspace folder, so every
contributor gets the version the project builds with and no separate install
is needed. When `go.mod` requires `github.com/gsxhq/gsx`, **Install/Update**
also drops `@latest` and installs that pinned version.

## Features

- **Syntax highlighting** — tags, components, holes (`{ expr }`), embedded Go
  blocks, and embedded `<style>`/`<script>` with proper scope nesting
- **Diagnostics** — parse and type errors shown inline, powered by `gsx lsp`
- **Hover** — Go identifier documentation on hover
- **Go-to-definition** — navigate to symbol definitions across the workspace
- **Find references** — list all references to a symbol
- **Formatting** — format-on-save via `gsx lsp` / `gsx fmt`

## Settings

| Setting | Default | Description |
|---|---|---|
| `gsx.server.path` | `""` | Path to the `gsx` binary. `${workspaceFolder}` and a leading `~` are expanded, and a relative path is resolved against the workspace folder, so a repo can commit a project-relative path. Empty = auto-discover via the `go.mod` `tool` directive, `PATH`, `GOBIN`, `GOPATH/bin`. |
| `gsx.trace.server` | `"off"` | Trace LSP communication (`off` / `messages` / `verbose`). |

## Commands

| Command | Description |
|---|---|
| `gsx: Install/Update Language Server` | Run `go install` from the workspace folder to (re)install the `gsx` binary (the `go.mod`-pinned version when the module is required, else `@latest`). |
| `gsx: Restart Language Server` | Restart the `gsx lsp` process without reloading the window. |

## How it works

When a `.gsx` file is opened the extension resolves the `gsx` command (setting
> `go tool gsx` if `go.mod` declares the tool > `PATH` > `GOBIN` > `GOPATH/bin`),
running every probe from the workspace folder, and launches `gsx lsp` as a
stdio LSP server from that folder. All diagnostics, hover, go-to-definition, references, and formatting
responses come from that process. Syntax highlighting works independently of
the binary via the bundled TextMate grammar.

## Testing the grammar

Two tiers, run together by `npm test`:

- **Curated scope assertions** (`npm run test:grammar`) — the `test/grammar/*.gsx`
  files pin exact scopes at specific positions (`vscode-tmgrammar-test`).
- **Corpus balance gate** (`npm run test:corpus`) — `test/corpus-authoritative/`
  holds `.gsx` snippets vendored from the canonical gsx codegen corpus
  (`gsx/internal/corpus/testdata/cases/**`). The gate tokenizes each with the
  grammar and asserts the scope stack returns to root at EOF, catching *runaway*
  scopes (an unterminated string/comment/embedded block that bleeds across the
  file). It does not check per-token correctness — the curated tier does that.

Re-sync the corpus when the gsx corpus changes: `npm run sync:corpus` (gsx
checkout at `../gsx` or `$GSX_REPO`). This mirrors tree-sitter-gsx's
authoritative-corpus gate.

## Releasing

Releases are one-click via the `Release` GitHub Actions workflow
(`workflow_dispatch`). It runs the full CI gate, bumps `package.json`, tags,
pushes to `main`, cuts a GitHub release, and publishes to the VS Code
Marketplace + Open VSX. Update `CHANGELOG.md` on `main` **before** triggering —
the workflow does not touch it.

Trigger from the CLI (`version` is `patch` / `minor` / `major`, or an explicit
version like `0.0.4`):

```bash
gh workflow run release.yml -f version=patch
gh run watch "$(gh run list --workflow release.yml --limit 1 --json databaseId --jq '.[0].databaseId')"
```

Or from the GitHub UI: Actions → Release → Run workflow.

If a marketplace upload fails after the tag and GitHub release were already
created (the stores occasionally time out), do not re-run `Release` — it refuses
to release an existing tag. Run the `Publish` workflow with that tag instead; it
rebuilds the tag and uploads to both stores, skipping any that already have it:

```bash
gh workflow run publish.yml -f tag=v0.0.12
```

## Links

- Documentation: [gsxhq.github.io](https://gsxhq.github.io)
- Source: [github.com/gsxhq/gsx](https://github.com/gsxhq/gsx)
- Extension source: [github.com/gsxhq/vscode-gsx](https://github.com/gsxhq/vscode-gsx)
