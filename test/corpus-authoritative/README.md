# Authoritative corpus (vendored gate)

`.gsx` snippets synced from the sibling gsx repo's codegen corpus
(`internal/corpus/testdata/cases/**/*.txtar`) by
`scripts/sync-authoritative-corpus.mjs`. Re-run `npm run sync:corpus`
(with the gsx checkout at `../gsx` or `$GSX_REPO`) to refresh.

These drive an **EOF scope-balance gate** (`npm run test:corpus`): every
file must tokenize with the TextMate grammar back to the root scope — no
runaway string/comment/embedded block. They are NOT hand-maintained and
have no goldens. Do not edit by hand.
