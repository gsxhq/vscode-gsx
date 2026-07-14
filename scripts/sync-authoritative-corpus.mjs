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
