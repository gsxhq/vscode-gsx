import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist/**', 'out-test/**', 'node_modules/**'] },
  ...tseslint.configs.recommended,
  // Test files use `any` in a few places where the JSON schema type is opaque;
  // relax no-explicit-any there rather than casting through `unknown` everywhere.
  {
    files: ['test/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
)
