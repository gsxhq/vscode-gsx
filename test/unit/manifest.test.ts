import { describe, it, expect } from 'vitest'
import pkg from '../../package.json'

describe('package.json manifest', () => {
  it('declares the gsx language for .gsx', () => {
    const langs = pkg.contributes?.languages ?? []
    const gsx = langs.find((l: any) => l.id === 'gsx')
    expect(gsx, 'a language with id "gsx"').toBeTruthy()
    if (!gsx) return
    expect(gsx.extensions).toContain('.gsx')
    expect(gsx.configuration).toBe('./language-configuration.json')
  })
  it('targets the agreed VS Code engine and identity', () => {
    expect(pkg.engines.vscode).toBe('^1.85.0')
    expect(pkg.publisher).toBe('gsxhq')
    expect(pkg.name).toBe('gsx')
  })
})
