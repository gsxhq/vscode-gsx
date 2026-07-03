# Changelog

## 0.0.3
- Highlight generic components: type-parameter lists in `component Name[T ...](...)` declarations and explicit type arguments at call sites (`<Name[int] .../>`), with the bracketed constraints/type args highlighted as embedded Go.

## 0.0.2
- Highlight Go syntax inside `class={...}` and `style={...}` attribute values, including value-form `if`/`switch` expressions and unbraced switch arms.

## 0.0.1
- Initial release: gsx syntax highlighting + `gsx lsp` language client (diagnostics, go-to-definition, hover, references, formatting).
