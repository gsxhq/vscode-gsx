# Synced Grammar Corpus Gate + Control-Flow-Body Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give vscode-gsx a synced authoritative-corpus EOF-balance gate (like tree-sitter's parse gate) and fix the control-flow-body Go-scope leak that runs a stray apostrophe/quote across the rest of a `.gsx` file.

**Architecture:** Vendor all `input.gsx` snippets from the canonical gsx codegen corpus into `test/corpus-authoritative/`, tokenize each with the real TextMate grammar via `vscode-textmate`, and assert the scope stack returns to root at EOF. Then fix the grammar so control-flow (`if`/`for`/`switch`) bodies parse as gsx child content instead of embedded Go, which flips the gate green and proves the fix.

**Tech Stack:** TextMate grammar (YAML → JSON), `vscode-textmate` + `vscode-oniguruma` (already installed as transitive deps of `vscode-tmgrammar-test`), vitest, `vscode-tmgrammar-test` for curated scope assertions, Node ESM scripts.

## Global Constraints

- Work in the existing worktree `../.worktrees-vscode-gsx/grammar-corpus-gate` (branch `grammar-corpus-gate`), repo `vscode-gsx`. Every `git` command runs there; never commit to `main`.
- **Never hand-edit `syntaxes/gsx.tmLanguage.json`** — it is generated from `syntaxes/gsx.tmLanguage.src.yaml` by `npm run gen:grammar`. Edit the YAML, regenerate.
- **Never hand-edit `test/corpus-authoritative/**`** — it is vendored by the sync script.
- The canonical corpus source is `$GSX_REPO/internal/corpus/testdata/cases/**/*.txtar`, resolving `$GSX_REPO` else `../gsx` via git-common-dir (mirror tree-sitter's `scripts/sync-authoritative-corpus.mjs`).
- Grammar philosophy (from the YAML header): coarse structural coloring, delegate embedded Go/JS/CSS, do not reimplement tree-sitter. No per-delimiter hacks.
- `parseRawGrammar(content, path)` needs a `path` ending in `.json` to pick the JSON parser.
- The EOF-balance oracle: after tokenizing all lines threading `ruleStack`, `ruleStack.depth === INITIAL.depth` (root = 1). A non-root depth = an unterminated (runaway) scope.

---

### Task 1: Sync script + vendored corpus

**Files:**
- Create: `scripts/sync-authoritative-corpus.mjs`
- Modify: `package.json` (add `sync:corpus` script)
- Create (generated, committed): `test/corpus-authoritative/**/*.gsx` + `test/corpus-authoritative/README.md`

**Interfaces:**
- Produces: a populated `test/corpus-authoritative/` directory of `.gsx` files mirroring `cases/**` paths (e.g. `control_flow/if_pos.gsx`). Consumed by Task 2's gate.

- [ ] **Step 1: Write the sync script**

Create `scripts/sync-authoritative-corpus.mjs`. This is adapted from tree-sitter-gsx's script of the same name (same source, same extraction), with vscode paths and an **empty** SKIP set:

```js
#!/usr/bin/env node
// sync-authoritative-corpus.mjs
//
// Vendors the `input.gsx` snippets from the sibling gsx repo's authoritative
// codegen corpus (`internal/corpus/testdata/cases/**/*.txtar`) into
// `test/corpus-authoritative/` as standalone `.gsx` files, so the vscode-gsx
// TextMate grammar has a self-contained gate against the real language syntax.
//
// The gate (test/grammar/authoritative.test.ts) tokenizes each file and asserts
// the scope stack returns to root at EOF — catching "runaway" scopes (an
// unterminated string/comment/embedded block that bleeds across the file), the
// class of bug a hand-picked corpus misses.
//
// Usage:  node scripts/sync-authoritative-corpus.mjs
// gsx repo location: $GSX_REPO, else `<vscode-gsx main checkout>/../gsx`.

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync } from 'node:fs'
import { join, resolve, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function resolveGsxRepo() {
  if (process.env.GSX_REPO) return resolve(process.env.GSX_REPO)
  const commonDir = execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], {
    cwd: repoRoot, encoding: 'utf8',
  }).trim()
  const mainCheckout = dirname(commonDir) // .../vscode-gsx
  return resolve(mainCheckout, '..', 'gsx')
}

// Cases excluded from the gate, keyed by "<category>/<basename>" (no .txtar).
// Starts EMPTY: unlike tree-sitter's parser (which ERRORs on syntactically-
// invalid fixtures), TextMate never errors and the balance invariant holds
// regardless of validity. Add an entry only for a case the gate legitimately
// cannot hold on, with a one-line reason.
const SKIP = new Set([])

function listTxtar(dir) {
  const out = []
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name)
    if (ent.isDirectory()) out.push(...listTxtar(p))
    else if (ent.name.endsWith('.txtar')) out.push(p)
  }
  return out
}

function extractInputGsx(txtar) {
  const lines = readFileSync(txtar, 'utf8').split('\n')
  const start = lines.findIndex((l) => l === '-- input.gsx --')
  if (start === -1) return null
  const body = []
  for (let i = start + 1; i < lines.length; i++) {
    if (/^-- .* --$/.test(lines[i])) break
    body.push(lines[i])
  }
  return body.join('\n').replace(/\n+$/, '') + '\n'
}

const gsxRepo = resolveGsxRepo()
const casesDir = join(gsxRepo, 'internal', 'corpus', 'testdata', 'cases')
const outDir = join(repoRoot, 'test', 'corpus-authoritative')

let txtars
try {
  txtars = listTxtar(casesDir)
} catch {
  console.error(`Cannot read gsx corpus at ${casesDir}`)
  console.error(`Set GSX_REPO to the gsx checkout (currently resolved: ${gsxRepo}).`)
  process.exit(1)
}

rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })

let written = 0, skippedNoInput = 0, skippedExcluded = 0
for (const txtar of txtars) {
  const rel = relative(casesDir, txtar).replace(/\.txtar$/, '')
  if (SKIP.has(rel)) { skippedExcluded++; continue }
  const input = extractInputGsx(txtar)
  if (input == null) { skippedNoInput++; continue }
  const outPath = join(outDir, rel + '.gsx')
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, input)
  written++
}

writeFileSync(join(outDir, 'README.md'),
  `# Authoritative corpus (vendored gate)\n\n` +
  `\`.gsx\` snippets synced from the sibling gsx repo's codegen corpus\n` +
  `(\`internal/corpus/testdata/cases/**/*.txtar\`) by\n` +
  `\`scripts/sync-authoritative-corpus.mjs\`. Re-run \`npm run sync:corpus\`\n` +
  `(with the gsx checkout at \`../gsx\` or \`$GSX_REPO\`) to refresh.\n\n` +
  `These drive an **EOF scope-balance gate** (\`npm run test:corpus\`): every\n` +
  `file must tokenize with the TextMate grammar back to the root scope — no\n` +
  `runaway string/comment/embedded block. They are NOT hand-maintained and\n` +
  `have no goldens. Do not edit by hand.\n`)

console.log(`synced ${written} input.gsx snippets → test/corpus-authoritative/`)
console.log(`  (skipped: ${skippedNoInput} without input.gsx, ${skippedExcluded} excluded)`)
console.log(`  source: ${casesDir}`)
```

- [ ] **Step 2: Add the `sync:corpus` npm script**

In `package.json` `scripts`, add after `gen:grammar`:

```json
    "sync:corpus": "node scripts/sync-authoritative-corpus.mjs",
```

- [ ] **Step 3: Run the sync**

Run: `npm run sync:corpus`
Expected: `synced <N> input.gsx snippets → test/corpus-authoritative/` with N in the 800s, `source:` pointing at `../gsx/internal/corpus/testdata/cases`.

- [ ] **Step 4: Verify the vendored control-flow cases landed**

Run: `ls test/corpus-authoritative/control_flow/ && sed -n '1,4p' test/corpus-authoritative/control_flow/if_pos.gsx`
Expected: files including `if_pos.gsx`, `for.gsx`, `switch_default.gsx`; `if_pos.gsx` contains the `component Status(n int)` snippet with `{ if n > 0 { <span>pos</span> } … }`.

- [ ] **Step 5: Commit**

```bash
cd ../.worktrees-vscode-gsx/grammar-corpus-gate
git add scripts/sync-authoritative-corpus.mjs package.json test/corpus-authoritative
git commit -m "feat(test): vendor authoritative gsx corpus for grammar gate"
```

---

### Task 2: EOF-balance gate (goes RED on the current grammar)

**Files:**
- Create: `test/grammar/tokenize.ts` (shared tokenizer harness)
- Create: `test/grammar/authoritative.test.ts` (the gate)
- Modify: `vitest.config.ts` (include `test/grammar/**/*.test.ts`)
- Modify: `package.json` (add `test:corpus` script)

**Interfaces:**
- `test/grammar/tokenize.ts` produces:
  - `loadGsxGrammar(): Promise<IGrammar>` — a `vscode-textmate` grammar for `source.gsx` with the go/js/css stubs wired in.
  - `eofDepth(grammar: IGrammar, text: string): { depth: number; climbLines: {line: number; text: string; depth: number}[] }` — tokenizes all lines threading `ruleStack`, returns the final stack depth and, for diagnostics, the lines where depth increased and never came back down.
  - `ROOT_DEPTH: number` — `INITIAL.depth`.
- Consumed by Task 2's gate and reusable by future grammar tests.

- [ ] **Step 1: Write the tokenizer harness**

Create `test/grammar/tokenize.ts`:

```ts
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import * as vt from 'vscode-textmate'
import * as oniguruma from 'vscode-oniguruma'

const ROOT = join(__dirname, '..', '..') // vscode-gsx repo root
const STUBS: Record<string, string> = {
  'source.js': 'test/grammar/stubs/javascript.tmLanguage.json',
  'source.css': 'test/grammar/stubs/css.tmLanguage.json',
  'source.go': 'test/grammar/stubs/go.tmLanguage.json',
}

export const ROOT_DEPTH = vt.INITIAL.depth

let onigReady: Promise<void> | null = null
function ensureOniguruma(): Promise<void> {
  if (!onigReady) {
    const wasm = readFileSync(join(ROOT, 'node_modules/vscode-oniguruma/release/onig.wasm'))
    onigReady = oniguruma.loadWASM(wasm.buffer as ArrayBuffer)
  }
  return onigReady
}

export async function loadGsxGrammar(): Promise<vt.IGrammar> {
  await ensureOniguruma()
  const registry = new vt.Registry({
    onigLib: Promise.resolve({
      createOnigScanner: (p) => new oniguruma.OnigScanner(p),
      createOnigString: (s) => new oniguruma.OnigString(s),
    }),
    loadGrammar: async (scopeName) => {
      if (scopeName === 'source.gsx') {
        return vt.parseRawGrammar(
          readFileSync(join(ROOT, 'syntaxes/gsx.tmLanguage.json'), 'utf8'),
          'gsx.tmLanguage.json',
        )
      }
      const rel = STUBS[scopeName]
      if (!rel) return null
      return vt.parseRawGrammar(readFileSync(join(ROOT, rel), 'utf8'), rel)
    },
  })
  const grammar = await registry.loadGrammar('source.gsx')
  if (!grammar) throw new Error('failed to load source.gsx grammar')
  return grammar
}

export function eofDepth(grammar: vt.IGrammar, text: string) {
  const lines = text.split('\n')
  let ruleStack = vt.INITIAL
  const climbLines: { line: number; text: string; depth: number }[] = []
  let prevDepth = ruleStack.depth
  lines.forEach((line, i) => {
    const r = grammar.tokenizeLine(line, ruleStack)
    ruleStack = r.ruleStack
    if (ruleStack.depth > prevDepth) climbLines.push({ line: i + 1, text: line, depth: ruleStack.depth })
    prevDepth = ruleStack.depth
  })
  return { depth: ruleStack.depth, climbLines }
}
```

- [ ] **Step 2: Write the gate test**

Create `test/grammar/authoritative.test.ts`:

```ts
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { loadGsxGrammar, eofDepth, ROOT_DEPTH } from './tokenize'
import type { IGrammar } from 'vscode-textmate'

const CORPUS = join(__dirname, 'corpus-authoritative')

function listGsx(dir: string): string[] {
  const out: string[] = []
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name)
    if (ent.isDirectory()) out.push(...listGsx(p))
    else if (ent.name.endsWith('.gsx')) out.push(p)
  }
  return out
}

describe('authoritative corpus EOF scope balance', () => {
  let grammar: IGrammar
  beforeAll(async () => { grammar = await loadGsxGrammar() })

  const files = statSync(CORPUS, { throwIfNoEntry: false }) ? listGsx(CORPUS) : []
  it('has a populated vendored corpus', () => {
    expect(files.length).toBeGreaterThan(100)
  })

  for (const file of files) {
    const rel = relative(CORPUS, file)
    it(`balances at EOF: ${rel}`, () => {
      const { depth, climbLines } = eofDepth(grammar, readFileSync(file, 'utf8'))
      if (depth !== ROOT_DEPTH) {
        const origin = climbLines.map((c) => `  L${c.line} (depth→${c.depth}): ${c.text}`).join('\n')
        throw new Error(
          `${rel}: scope stack did not return to root (final depth ${depth}, ` +
          `root ${ROOT_DEPTH}) — a runaway scope. Depth climbed at:\n${origin}`,
        )
      }
    })
  }
})
```

- [ ] **Step 3: Include grammar tests in vitest**

Modify `vitest.config.ts` `test.include`:

```ts
    include: ['test/unit/**/*.test.ts', 'test/grammar/**/*.test.ts'],
```

- [ ] **Step 4: Add the `test:corpus` script**

In `package.json` `scripts`, add:

```json
    "test:corpus": "vitest run test/grammar/authoritative.test.ts",
```

- [ ] **Step 5: Run the gate — verify it FAILS (RED) on the current grammar**

Run: `npm run test:corpus`
Expected: FAIL. At least the `control_flow/*` cases (and any other control-flow-in-child cases across the corpus) fail with "scope stack did not return to root … a runaway scope", the diagnostic pointing at the `{ if … {` / `{ for … {` / `{ switch … {` line. This is the reproduced `landing.gsx` bug class.

Record which files fail (copy the failing list into the commit message) — Task 3 must turn all of them green.

- [ ] **Step 6: Commit (RED gate)**

```bash
git add test/grammar/tokenize.ts test/grammar/authoritative.test.ts vitest.config.ts package.json
git commit -m "test(grammar): add EOF-balance gate over authoritative corpus (currently RED)

Reproduces the control-flow-body Go-scope runaway: <N> corpus cases leave
the scope stack open at EOF. Fixed in the next commit."
```

---

### Task 3: Grammar fix — control-flow bodies parse as child content (flips gate GREEN)

**Files:**
- Modify: `syntaxes/gsx.tmLanguage.src.yaml` (add rules, wire into `#markup`)
- Regenerate: `syntaxes/gsx.tmLanguage.json` (via `npm run gen:grammar`)

**Interfaces:**
- Consumes: `#markup` (existing child-content pattern list), `source.go` (embedded Go).
- Produces: repository rules `#control-flow`, `#control-body`, `#control-flow-switch`, `#switch-body`, `#switch-case`. After this task the Task 2 gate passes.

- [ ] **Step 1: Wire the new rules into `#markup`**

In `syntaxes/gsx.tmLanguage.src.yaml`, in the `markup:` repository entry (currently ends with `- include: '#interp'`), insert the two control-flow includes **before** `#interp` so `{ if/for/switch … }` is claimed by them and a plain `{ expr }` value still falls through to `#interp`:

```yaml
  markup:
    patterns:
      - include: '#comments'
      - include: '#go-block'
      - include: '#script-element'
      - include: '#style-element'
      - include: '#doctype'
      - include: '#fragment'
      - include: '#component-tag'
      - include: '#element-tag'
      - include: '#control-flow'
      - include: '#control-flow-switch'
      - include: '#interp'
```

- [ ] **Step 2: Add the control-flow repository rules**

In `syntaxes/gsx.tmLanguage.src.yaml`, add these entries to `repository:` (place them immediately after the `interp:` entry for locality). The comments explain the model:

```yaml
  # Control-flow blocks in child position: { if … }, { for … }, { switch … }.
  # Unlike a plain { expr } value (see #interp), the BRANCH BODIES are gsx child
  # content — text, elements, nested interps — NOT Go. Scoping them as Go (the old
  # behavior via #interp's contentName: source.go) made a plain apostrophe/quote in
  # body prose open a Go string/rune literal that ran away across the file.
  control-flow:
    name: meta.embedded.block.go.gsx
    begin: '(\{)\s*(if|for)\b'
    beginCaptures:
      '1': { name: punctuation.section.embedded.begin.gsx }
      '2': { name: keyword.control.go }
    end: '(\})'
    endCaptures: { '1': { name: punctuation.section.embedded.end.gsx } }
    patterns:
      # Branch body { child-content }. Listed FIRST so it claims the body-opening
      # `{` before source.go can read it as a Go block; consuming the body's `}`
      # keeps this rule's `end` aligned to the true closing brace.
      - include: '#control-body'
      - name: keyword.control.go
        match: '\belse\b'
      # The condition / for-clause between the keyword and the body `{` is real Go.
      - include: source.go
  control-body:
    begin: '(\{)'
    beginCaptures: { '1': { name: punctuation.section.embedded.begin.gsx } }
    end: '(\})'
    endCaptures: { '1': { name: punctuation.section.embedded.end.gsx } }
    patterns:
      - include: '#markup'
  # Switch is separate: its case bodies are UNBRACED (they run from `case V:` /
  # `default:` to the next case/default or the closing brace).
  control-flow-switch:
    name: meta.embedded.block.go.gsx
    begin: '(\{)\s*(switch)\b'
    beginCaptures:
      '1': { name: punctuation.section.embedded.begin.gsx }
      '2': { name: keyword.control.go }
    end: '(\})'
    endCaptures: { '1': { name: punctuation.section.embedded.end.gsx } }
    patterns:
      - include: '#switch-body'
      # The switch subject expression between `switch` and the body `{` is real Go.
      - include: source.go
  switch-body:
    begin: '(\{)'
    beginCaptures: { '1': { name: punctuation.section.embedded.begin.gsx } }
    end: '(\})'
    endCaptures: { '1': { name: punctuation.section.embedded.end.gsx } }
    patterns:
      - include: '#switch-case'
  switch-case:
    # `case VALUE:` or `default:` — VALUE (group 2) is real Go; the body after `:`
    # is child content until the next case/default or the closing brace (a
    # lookahead end, so the delimiter is not consumed).
    begin: '\b(case|default)\b([^:]*)(:)'
    beginCaptures:
      '1': { name: keyword.control.go }
      '2': { name: meta.embedded.line.go.gsx, patterns: [{ include: source.go }] }
      '3': { name: punctuation.separator.gsx }
    end: '(?=\b(?:case|default)\b|\})'
    patterns:
      - include: '#markup'
```

- [ ] **Step 3: Regenerate the JSON grammar**

Run: `npm run gen:grammar`
Expected: `generated .../syntaxes/gsx.tmLanguage.json`. Confirm the JSON now contains the new rules: `grep -c 'control-flow-switch\|switch-case' syntaxes/gsx.tmLanguage.json` returns a nonzero count.

- [ ] **Step 4: Run the gate — verify it PASSES (GREEN)**

Run: `npm run test:corpus`
Expected: PASS. Every vendored file balances at EOF.

If any file still fails: inspect it. If it is a genuine *different* grammar bug, fix the grammar. If it is a legitimately un-gate-able case, add it to the `SKIP` set in `scripts/sync-authoritative-corpus.mjs` **with a one-line reason**, re-run `npm run sync:corpus`, and re-run the gate. Do not leave a red without a decision.

- [ ] **Step 5: Verify no regression in the curated grammar tests**

Run: `npm run test:grammar`
Expected: PASS (the existing 10 `test/grammar/*.gsx` scope assertions still hold — the new rules only affect control-flow child bodies).

- [ ] **Step 6: Commit (GREEN)**

```bash
git add syntaxes/gsx.tmLanguage.src.yaml syntaxes/gsx.tmLanguage.json
git commit -m "fix(grammar): control-flow bodies parse as child content, not Go

{ if/for/switch … } branch bodies are gsx child content; scoping them as
embedded Go let a stray apostrophe/quote in body text open a Go
string/rune literal that ran away across the file. New #control-flow /
#control-flow-switch rules re-enter #markup for bodies; conditions, for-
clauses, switch subjects and case values stay Go. Flips the corpus gate
green."
```

---

### Task 4: Curated positive scope assertions

**Files:**
- Create: `test/grammar/control-flow.gsx`

**Interfaces:**
- Consumes: nothing new. Run by the existing `test:grammar` script (`vscode-tmgrammar-test … "test/grammar/**/*.gsx"`).

- [ ] **Step 1: Write the curated scope-assertion test**

The gate proves *absence of runaway*; this pins the *positive* scopes so a future change that under- or over-scopes control-flow is also caught. Create `test/grammar/control-flow.gsx` (assertion syntax: `// <-` marks the first char of the line above; `//   ^` marks the column under the caret):

```gsx
// SYNTAX TEST "source.gsx" "control-flow bodies are child content"
package views

component Demo(n int, kind string) {
  <p>{ if n > 0 { Don't panic } else { it's fine } }</p>
//     ^ keyword.control.go
//         ^ source.go
//              ^ punctuation.section.embedded.begin.gsx
//                 ^ meta.tag.element.gsx
//                 ^ text is NOT string.quoted.single.go
  <ul>{ for _, it := range items { <li>it's ok</li> } }</ul>
//      ^ keyword.control.go
  <span>{ switch kind {
//        ^ keyword.control.go
  case "warn":
//^ keyword.control.go
//     ^ string.quoted.double.go
    <b>can't warn</b>
//     ^ meta.tag.element.gsx
  default:
//^ keyword.control.go
    <b>it's info</b>
  } }</span>
}
```

Note: the assertion lines target the load-bearing tokens — the control keywords stay `keyword.control.go`, the switch case *value* `"warn"` stays a Go string, and the apostrophes in body text (`Don't`, `it's`, `can't`) fall under element/text scope, NOT `string.quoted.single.go`. Adjust the exact `^` columns to match `vscode-tmgrammar-test` output when you run it (column positions are 0-based from the caret).

- [ ] **Step 2: Run the curated test — iterate columns until it passes**

Run: `npm run test:grammar`
Expected: initially may report column mismatches; adjust the `//   ^` caret columns per the tool's reported actual scopes until PASS. The assertions must express: keywords = `keyword.control.go`; case value = `string.quoted.double.go`; body apostrophe text = anything EXCEPT a `string.*.go` / `comment.*.go` scope.

- [ ] **Step 3: Commit**

```bash
git add test/grammar/control-flow.gsx
git commit -m "test(grammar): curated scope assertions for control-flow child bodies"
```

---

### Task 5: Wiring + docs

**Files:**
- Modify: `package.json` (aggregate `test` script)
- Modify: `README.md` (document the sync + gate)

**Interfaces:** none downstream.

- [ ] **Step 1: Add an aggregate `test` script**

`package.json` currently has no `test` script. Add one that runs all three test tiers so CI and contributors get the gate for free:

```json
    "test": "npm run test:unit && npm run test:grammar && npm run test:corpus",
```

(Leave `test:unit`, `test:grammar`, `test:corpus` as-is. `test:corpus` reads the committed `gsx.tmLanguage.json`; run `npm run gen:grammar` first if the YAML changed.)

- [ ] **Step 2: Document in README**

Add a short subsection to `README.md` under the existing testing/development notes (match surrounding prose style — keep it concise):

```markdown
### Grammar corpus gate

`test/corpus-authoritative/` holds `.gsx` snippets vendored from the canonical
gsx codegen corpus (`gsx/internal/corpus/testdata/cases/**`). `npm run test:corpus`
tokenizes each with the grammar and asserts the scope stack returns to root at
EOF — catching *runaway* scopes (an unterminated string/comment/embedded block
that bleeds across the file). It does not check per-token correctness; the curated
`test/grammar/*.gsx` scope-assertion tests (`npm run test:grammar`) do that.

Re-sync when the gsx corpus changes: `npm run sync:corpus` (gsx checkout at
`../gsx` or `$GSX_REPO`). This mirrors tree-sitter-gsx's authoritative-corpus gate.
```

- [ ] **Step 3: Full test run**

Run: `npm run gen:grammar && npm test`
Expected: all three tiers PASS.

- [ ] **Step 4: Commit**

```bash
git add package.json README.md
git commit -m "chore: wire corpus gate into npm test + document the sync"
```

---

## Verification (end-to-end, before opening the PR)

- [ ] `npm run sync:corpus` re-vendors cleanly (no diff if the gsx corpus is unchanged).
- [ ] `npm run gen:grammar && npm test` — all green.
- [ ] Sanity-check the original report: tokenize `~/work/one-learning-gsx/ui/landing.gsx` with `loadGsxGrammar`/`eofDepth` (a throwaway script) and confirm final depth is now root (was 4). The apostrophe on the `Here's what needs your attention` line no longer opens a runaway Go string.
- [ ] Open the PR (branch `grammar-corpus-gate`). Body: link the spec, summarize the two-tier gate + control-flow fix, note the corpus is vendored (re-sync via `npm run sync:corpus`).

## Self-Review notes (traceability to spec)

- Spec Component 1 (sync script, empty SKIP, own copy) → Task 1.
- Spec Component 2 (EOF-balance gate, no forbidden-scope) → Task 2.
- Spec Component 3 (control-flow/switch child-content rules) → Task 3.
- Spec Component 4 (curated positive cases) → Task 4.
- Spec Component 5 (wiring/README) → Task 5.
- Spec Validation (red→green, landing.gsx) → Task 2 Step 5 (red), Task 3 Step 4 (green), end-to-end Verification (landing.gsx).
