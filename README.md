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
| `gsx.server.path` | `""` | Absolute path to the `gsx` binary. Empty = auto-discover via `PATH`, `GOBIN`, `GOPATH/bin`. |
| `gsx.trace.server` | `"off"` | Trace LSP communication (`off` / `messages` / `verbose`). |

## Commands

| Command | Description |
|---|---|
| `gsx: Install/Update Language Server` | Run `go install` to (re)install the `gsx` binary. |
| `gsx: Restart Language Server` | Restart the `gsx lsp` process without reloading the window. |

## How it works

When a `.gsx` file is opened the extension resolves the `gsx` binary (setting
> `PATH` > `GOBIN` > `GOPATH/bin`) and launches `gsx lsp` as a stdio LSP
server. All diagnostics, hover, go-to-definition, references, and formatting
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

## Links

- Documentation: [gsxhq.github.io](https://gsxhq.github.io)
- Source: [github.com/gsxhq/gsx](https://github.com/gsxhq/gsx)
- Extension source: [github.com/gsxhq/vscode-gsx](https://github.com/gsxhq/vscode-gsx)
