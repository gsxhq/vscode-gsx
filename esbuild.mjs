import esbuild from 'esbuild'

const watch = process.argv.includes('--watch')
const ctx = await esbuild.context({
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  external: ['vscode'],            // provided by the VS Code runtime
  format: 'cjs',
  platform: 'node',
  target: 'node18',
  sourcemap: true,
})
if (watch) { await ctx.watch() } else { await ctx.rebuild(); await ctx.dispose() }
