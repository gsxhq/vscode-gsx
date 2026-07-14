# Synced grammar corpus gate for vscode-gsx

**Date:** 2026-07-14
**Status:** Approved, pending implementation plan

## Problem

The vscode-gsx TextMate grammar mis-scopes real-world `.gsx` files. Concretely,
in `one-learning-gsx/ui/landing.gsx`, child text containing an apostrophe —
`{ if props.viewing == nil { Here's what needs your attention } }` — makes the
grammar treat the bare `'` as a single-quoted string start. The string scope
then bleeds across ~600 lines until the next `'` (inside an unrelated `js` block's
`querySelectorAll('...')`), rendering the whole region as italic string text.

The grammar tests didn't catch it because the suite is 10 hand-picked
`test/grammar/*.gsx` files, none exercising apostrophe-in-text. There is no
systematic gate over the real language surface.

By contrast, **tree-sitter-gsx already solved the analogous problem**:
`scripts/sync-authoritative-corpus.mjs` vendors all `input.gsx` snippets from the
canonical gsx codegen corpus (`gsx/internal/corpus/testdata/cases/**/*.txtar`)
into `test/corpus-authoritative/`, then runs a **parse gate** — every file must
parse with zero ERROR/MISSING nodes. Low-maintenance, no goldens, catches grammar
gaps the way a hand-picked corpus cannot.

This spec ports that idea to the vscode TextMate grammar.

## The core design tension

A TextMate grammar is a line-based regex tokenizer: it **never fails to parse** —
it always emits *some* scope. So unlike tree-sitter's free zero-ERROR signal, we
must define the pass/fail oracle ourselves.

With no goldens and no external reference, a gate can only check things that are
*self-evidently* true. Checking whether every token is scoped *correctly* would
require ground truth (full snapshot goldens, or a tree-sitter differential).
Snapshot goldens over ~880 files churn dozens of golden files on every
intentional grammar tweak and drown review; a tree-sitter differential couples
two grammars and two toolchains. Both were rejected.

We choose an **invariant gate** built on one *structural* check (not a heuristic —
this matters given the repo's "no simple heuristics" rule):

**EOF scope balance.** After tokenizing a whole file, the scope stack must return
to root `source.gsx`. A runaway string/comment/embedded block that never closes
leaves a non-root scope open at EOF and trips this.

**A forbidden-scope deny-set was considered and rejected.** Prototyping (see
below) showed the runaway scope is `string.quoted.single.go` / `.double.go` —
the *embedded Go* grammar, not a gsx-level scope. Those scopes are entirely
legitimate in real Go-expression positions (`{ foo('x') }`, switch `case "warn":`),
so blanket-forbidding them would false-positive on correct code. Distinguishing a
Go string in a *value* position (correct) from one in *child text* (the bug)
requires child-vs-value ground truth, which a cheap gate does not have.

**Honest coverage boundary (stated, not hidden — per the repo's no-silent-caps
rule).** EOF-balance catches the *runaway* class: an unterminated string/comment
that bleeds across the rest of the file (exactly what destroyed `landing.gsx` —
final scope-stack depth 4 ≠ root). It does **not** catch a *balanced, localized*
mis-scope — e.g. `{ if n>0 { say "hi" } }` where `"hi"` is child text wrongly
shown as a one-token Go string but the stack rebalances on the same line. That
narrower quality issue is fixed by the grammar rework below (which the gate then
proves, by turning green); the gate's standing job is "no runaway ever bleeds
across a file again."

This mirrors tree-sitter's actual **two-tier** structure:

- **Curated tier** — the existing hand-picked `test/grammar/*.gsx` keep their
  real scope *assertions* (tree-sitter's curated corpus with tree goldens): the
  "is scoping correct" tier.
- **Gate tier** — the vendored corpus is a cheap invariant gate (tree-sitter's
  zero-ERROR gate), no goldens.

## Components

### 1. Sync script — `scripts/sync-authoritative-corpus.mjs`

A sibling of tree-sitter's script. Reads the **same** canonical source
(`$GSX_REPO/internal/corpus/testdata/cases/**/*.txtar`, resolving `$GSX_REPO`
else `../gsx` via git-common-dir), extracts each `-- input.gsx --` section, and
clean-and-rewrites `test/corpus-authoritative/*.gsx` (so deletions in the source
propagate). Writes a self-describing README into the vendored dir.

**Not shared with tree-sitter's output**: reading `../tree-sitter-gsx/...`
across repos breaks CI isolation (vscode-gsx CI checks out only itself). **Not a
shared npm package** for the ~40-line txtar extractor: that would couple two
independently-versioned public packages (YAGNI). The ~40 lines of extraction are
duplicated deliberately.

**SKIP set differs from tree-sitter's.** tree-sitter skips syntactically-invalid
fixtures because its *parser* ERRORs on them. TextMate never errors, and the
balance invariant holds regardless of semantic/syntactic validity, so the gate
runs over *all* vendored files. The SKIP set starts **empty**; entries are added
only for cases the gate legitimately cannot hold on, each with a documented reason.

### 2. Invariant gate — `test/grammar/authoritative.test.ts`

A vitest test (vitest is already the runner; `vscode-textmate` + `vscode-oniguruma`
are already present as transitive deps of `vscode-tmgrammar-test`). It:

- Loads `syntaxes/gsx.tmLanguage.json` plus the existing go/js/css stub grammars
  under `test/grammar/stubs/` via `vscode-textmate`.
- Tokenizes every `test/corpus-authoritative/**/*.gsx` line by line, threading
  the ruleStack across lines.
- Asserts **EOF balance** (final ruleStack depth returns to the root scope).
- On failure, reports file path + final depth + the last lines that raised the
  depth (the runaway origin).

### 3. Grammar fix — `syntaxes/gsx.tmLanguage.src.yaml`

**Root cause (confirmed by prototype).** The `#interp` rule (`{ … }`, line 102)
sets `contentName: source.go` over the *entire* brace region. For a control-flow
block `{ if COND { …body… } }`, the body's child text is therefore tokenized as
Go, so a plain apostrophe/quote in prose (`Here's`, `say "hi"`) opens a Go
string/rune literal that runs away. Plain child text *outside* `{ }` is already
fine — `#markup` does not include `source.go`. So the fix is scoped to
control-flow bodies, **not** an architectural child-content rework.

**Fix (prototyped and verified).** Add child-content control-flow rules and wire
them into `#markup` *before* `#interp` (so `{ if/for/switch … }` is claimed by
them, while a plain `{ expr }` value still falls to `#interp` → Go):

- `#control-flow` — `begin: (\{)\s*(if|for)\b`, `end: \}`. Patterns: `#control-body`,
  an `else` keyword, then `source.go` (the condition/clause — real Go, strings
  there are correct).
- `#control-body` — `begin: \{`, `end: \}`, patterns `#markup`. The braced branch
  body as child content. Listed before `source.go` so it claims the body `{`;
  consuming the body's `}` keeps the outer `#control-flow` `end` aligned to the
  true closing brace.
- `#control-flow-switch` — `begin: (\{)\s*(switch)\b`, `end: \}`. Patterns:
  `#switch-body`, then `source.go` (the switch subject expression).
- `#switch-body` — `begin: \{`, `end: \}`, patterns `#switch-case`.
- `#switch-case` — `begin: \b(case|default)\b([^:]*)(:)` (the case value in group 2
  is `source.go` — case values are real Go), `end: (?=\b(?:case|default)\b|\})`
  (a lookahead, so the body ends at the next case/default or the closing brace
  without consuming it), patterns `#markup`. The unbraced case body as child
  content.

Prototype results (all leaks gone, all EOF-balanced): if/else-if/else bodies,
`for … range` bodies, nested `if`-in-`if`, and switch case bodies all render
their child text as text; `{ foo('x') }` value form and switch `case "warn":`
values stay correct Go strings.

**Out of scope for this fix:** control flow in *attribute value* position
(`class={ switch … }`) is handled by the separate `class-value`/`style-value`
rules where case bodies are Go *values* (`{ "green" }`), not child content — that
path is unaffected and correct. Regenerate `gsx.tmLanguage.json` via
`npm run gen:grammar`.

### 4. Curated positive cases

The gate proves *absence of runaway*, not the *positive* correct scope. Add
curated `test/grammar/*.gsx` cases with scope assertions pinning that child text
inside `if`/`for`/`switch` bodies (including apostrophes and quotes) is plain text
content, and that condition/case *values* remain Go — so a future change that
under- or over-scopes is caught.

### 5. Wiring

- `package.json`: `sync:corpus` (runs the sync script) and `test:corpus` (runs
  the vitest gate). Add `test:corpus` to whatever aggregate `npm test` / CI job
  runs the grammar tests.
- README: document the manual re-sync model (re-run `sync:corpus` when the
  canonical gsx corpus changes) — identical to tree-sitter's documented model.

## Validation (required before trusting the gate)

1. **Red on today's grammar.** With the current (buggy) grammar, the EOF-balance
   gate must *fail* on the vendored corpus (the control-flow-body cases leave the
   scope stack open). Confirm it flags a `landing.gsx`-shaped fixture.
2. **Green after the fix.** After the grammar fix, the whole vendored corpus is
   EOF-balanced and the gate passes.
3. **Curated assertions pass** for the new positive if/for/switch cases.

## Out of scope

- Snapshot goldens over the vendored corpus (rejected: maintenance/churn).
- A forbidden-scope deny-set (rejected: the runaway scope is legitimate Go in
  value positions; can't be blanket-forbidden without ground truth).
- tree-sitter differential oracle (rejected: cross-grammar coupling).
- An architectural child-content rework (not needed: plain child text is already
  correct; only control-flow bodies leak).
- Control flow in attribute-value position (separate, already-correct path).
- Automating the sync in CI to re-pull from gsx on every run (manual re-sync,
  matching tree-sitter).
- Refactoring the shared txtar extractor into a package (YAGNI).
