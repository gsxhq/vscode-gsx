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

We choose an **invariant gate** built on two *structural* checks (not heuristics —
this matters given the repo's "no simple heuristics" rule):

1. **EOF scope balance.** After tokenizing a whole file, the scope stack must
   return to root `source.gsx`. A runaway string/comment/embedded block that
   never closes leaves a non-root scope open at EOF and trips this.
2. **Forbidden scopes.** A small deny-set of scopes the gsx grammar must never
   emit at its own level. gsx attributes are `"..."`, expression-valued literals
   are backticks (`` f` ``/`` js` ``/`` css` ``), and embedded JS/CSS/Go carry
   their *own* grammar's scopes — so `string.quoted.single.gsx` should never
   exist anywhere. Its appearance across the corpus is, by definition, the bug.
   Each deny-set entry is documented with why it is impossible in valid gsx.

EOF-balance alone can miss a runaway that happens to rebalance on an even count
of `'`; the forbidden-scope check closes that hole. The two together fire on the
`landing.gsx` bug regardless of apostrophe parity — this pairing is a required
validation step, not an assumption (see Validation).

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
fixtures because its *parser* ERRORs on them. TextMate never errors, and the two
invariants hold regardless of semantic/syntactic validity, so the gate runs over
*all* vendored files. The SKIP set starts **empty**; entries are added only for
cases the gate legitimately cannot hold on, each with a documented reason.

### 2. Invariant gate — `test/grammar/authoritative.test.ts`

A vitest test (vitest is already the runner; `vscode-textmate` + `vscode-oniguruma`
are already present as transitive deps of `vscode-tmgrammar-test`). It:

- Loads `syntaxes/gsx.tmLanguage.json` plus the existing go/js/css stub grammars
  under `test/grammar/stubs/` via `vscode-textmate`.
- Tokenizes every `test/corpus-authoritative/**/*.gsx` line by line, threading
  the ruleStack across lines.
- Asserts **EOF balance** (final ruleStack depth returns to the root scope) and
  **forbidden scopes** (no token's scope list intersects the deny-set).
- On failure, reports file path + line number + offending scope + snippet.

The deny-set and its justifications live next to the test as a documented
constant.

### 3. Grammar fix — `syntaxes/gsx.tmLanguage.src.yaml`

Remove or correctly-scope whatever rule lets a bare `'` in child-text position
open a `string.quoted.single`. Regenerate `gsx.tmLanguage.json` via
`npm run gen:grammar`. The gate is the regression guard; this is the fix for the
reported bug.

### 4. Curated positive case

The gate proves *absence of runaway*, not the *positive* correct scope of
apostrophe-in-text. Add one small curated `test/grammar/*.gsx` case with scope
assertions pinning that `Here's` in child text is plain text content — so a
future grammar change that under-scopes (rather than over-scopes) is also caught.

### 5. Wiring

- `package.json`: `sync:corpus` (runs the sync script) and `test:corpus` (runs
  the vitest gate). Add `test:corpus` to whatever aggregate `npm test` / CI job
  runs the grammar tests.
- README: document the manual re-sync model (re-run `sync:corpus` when the
  canonical gsx corpus changes) — identical to tree-sitter's documented model.

## Validation (required before trusting the gate)

1. **Red on today's grammar.** With the current (buggy) grammar, the gate must
   *fail* — demonstrate both that some vendored case trips an invariant AND,
   specifically, that a minimal apostrophe-in-text fixture trips the
   forbidden-scope check. Confirm the gate would have flagged `landing.gsx`.
2. **Green after the fix.** After the grammar fix, the whole vendored corpus
   passes both invariants.
3. **Curated assertions pass** for the new positive apostrophe case.

## Out of scope

- Snapshot goldens over the vendored corpus (rejected: maintenance/churn).
- tree-sitter differential oracle (rejected: cross-grammar coupling).
- Automating the sync in CI to re-pull from gsx on every run (manual re-sync,
  matching tree-sitter).
- Refactoring the shared txtar extractor into a package (YAGNI).
