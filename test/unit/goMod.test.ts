import { describe, it, expect } from 'vitest'
import { inspectGoMod } from '../../src/goMod'

describe('inspectGoMod', () => {
  it('reports nothing for a module that does not mention gsx', () => {
    expect(inspectGoMod('module example.com/app\n\ngo 1.24\n')).toEqual({
      declaresTool: false,
      requiresModule: false,
    })
  })
  it('detects a single-line require', () => {
    const text = 'module example.com/app\n\ngo 1.24\n\nrequire github.com/gsxhq/gsx v0.1.0\n'
    expect(inspectGoMod(text)).toEqual({ declaresTool: false, requiresModule: true })
  })
  it('detects a require inside a block, including // indirect entries', () => {
    const text = [
      'module example.com/app',
      'go 1.24',
      'require (',
      '\tgithub.com/other/lib v1.2.3',
      '\tgithub.com/gsxhq/gsx v0.1.0 // indirect',
      ')',
      '',
    ].join('\n')
    expect(inspectGoMod(text)).toEqual({ declaresTool: false, requiresModule: true })
  })
  it('detects a single-line tool directive', () => {
    const text = 'module example.com/app\ngo 1.24\ntool github.com/gsxhq/gsx/cmd/gsx\nrequire github.com/gsxhq/gsx v0.1.0\n'
    expect(inspectGoMod(text)).toEqual({ declaresTool: true, requiresModule: true })
  })
  it('detects a tool directive inside a block', () => {
    const text = [
      'module example.com/app',
      'tool (',
      '\tgolang.org/x/tools/cmd/stringer',
      '\tgithub.com/gsxhq/gsx/cmd/gsx',
      ')',
      'require github.com/gsxhq/gsx v0.1.0',
    ].join('\n')
    expect(inspectGoMod(text)).toEqual({ declaresTool: true, requiresModule: true })
  })
  it('does not match a different module with the same prefix', () => {
    const text = 'require github.com/gsxhq/gsx-extras v0.1.0\ntool github.com/gsxhq/gsx-extras/cmd/gsx\n'
    expect(inspectGoMod(text)).toEqual({ declaresTool: false, requiresModule: false })
  })
  it('ignores commented-out lines', () => {
    const text = '// tool github.com/gsxhq/gsx/cmd/gsx\n// require github.com/gsxhq/gsx v0.1.0\n'
    expect(inspectGoMod(text)).toEqual({ declaresTool: false, requiresModule: false })
  })
  it('handles CRLF line endings', () => {
    const text = 'module x\r\ntool github.com/gsxhq/gsx/cmd/gsx\r\nrequire github.com/gsxhq/gsx v0.1.0\r\n'
    expect(inspectGoMod(text)).toEqual({ declaresTool: true, requiresModule: true })
  })
})
