# Changelog

## Unreleased
- Attribute names follow gsx's widened HTML authoring rule: any character except whitespace, controls, `"`, `'`, `<`, `>`, `/`, `=`, `{`, `}` — so punctuation-led names like `.prop`, `?disabled`, `#ref`, `[a]`, `(b)`, `*ngIf`, `on:click|preventDefault`, `a&b`, `$x`, `!y`, and non-ASCII names are highlighted as attribute names (in `name="…"`, `name={…}`, bare, and `` name=f`…` ``/`` js`…` ``/`` css`…` `` forms, on elements and component tags) instead of being left uncolored.

## 0.0.11
- Highlight processing instructions: `<?marker name=...>` and `<?start name=...>` ... `<?end>` now get their own tag highlighting, matching gsx's new syntax.
- Fix: a `case ...:`/`default:` appearing mid-sentence inside switch-arm prose is no longer miscolored as a Go keyword — only a label that starts its own line is highlighted, matching gsx's parser.
- Highlight bare `//` line comments in element/component child content (previously only recognized between attributes).

## 0.0.10
- Fix: text inside `{if}`/`{for}`/`{switch}` branch and case bodies is treated as plain content again, not embedded Go — an apostrophe or quote in ordinary body prose could previously open a runaway string/rune highlight that bled across the rest of the file.

## 0.0.9
- Highlight `` js`...` `` / `` css`...` `` literals wherever a Go expression is valid (variable initializers, call arguments, `{{ }}` statements), not just as attribute values.

## 0.0.8
- Interpolation is now opt-in: a bare `` `...` ``/`"..."` string or attribute value no longer interpolates. Use an `f`, `js`, or `css`-prefixed string (backtick or double-quote form) to get `@{ }` holes highlighted.
- Highlight `<tag>`, fragment (`<>...</>`), and component tag literals used as Go values — inside `{ }`/`{{ }}` interpolations, top-level Go, and function bodies.

## 0.0.7
- Highlight plain (non-`js`/`css`) interpolating attribute literals, e.g. `` class=`badge-@{variant}` `` — the backtick string and its `@{ }` holes are now colored instead of left plain.

## 0.0.6
- Fix: `@{ ... }` holes inside `` js`...` ``/`` css`...` `` literals are now recognized at any nesting depth (e.g. inside a JS object literal), instead of only at the literal's top level.

## 0.0.5
- Highlight `//` and `/* */` source comments between attributes (previously only the braced `{/* */}`/`{// }` form was recognized there).

## 0.0.4
- Internal: switched the release process to a manual, one-click workflow (no user-facing change).

## 0.0.3
- Highlight generic components: type-parameter lists in `component Name[T ...](...)` declarations and explicit type arguments at call sites (`<Name[int] .../>`), with the bracketed constraints/type args highlighted as embedded Go.

## 0.0.2
- Highlight Go syntax inside `class={...}` and `style={...}` attribute values, including value-form `if`/`switch` expressions and unbraced switch arms.

## 0.0.1
- Initial release: gsx syntax highlighting + `gsx lsp` language client (diagnostics, go-to-definition, hover, references, formatting).
