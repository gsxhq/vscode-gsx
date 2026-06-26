import { describe, it, expect } from 'vitest'
import { resolveGsxPath, GSX_INSTALL_CMD, type ResolveEnv } from '../../src/gsxBinary'

const base = (over: Partial<ResolveEnv> = {}): ResolveEnv => ({
  configuredPath: '',
  pathDirs: [],
  goBin: undefined,
  goPath: undefined,
  isExecutable: () => false,
  ...over,
})

describe('resolveGsxPath', () => {
  it('prefers the configured path when executable', () => {
    const env = base({ configuredPath: '/opt/gsx', isExecutable: (p) => p === '/opt/gsx' })
    expect(resolveGsxPath(env)).toBe('/opt/gsx')
  })
  it('falls back to PATH', () => {
    const env = base({ pathDirs: ['/a', '/usr/bin'], isExecutable: (p) => p === '/usr/bin/gsx' })
    expect(resolveGsxPath(env)).toBe('/usr/bin/gsx')
  })
  it('then GOBIN, then GOPATH/bin', () => {
    const gobin = base({ goBin: '/gb', isExecutable: (p) => p === '/gb/gsx' })
    expect(resolveGsxPath(gobin)).toBe('/gb/gsx')
    const gopath = base({ goPath: '/gp', isExecutable: (p) => p === '/gp/bin/gsx' })
    expect(resolveGsxPath(gopath)).toBe('/gp/bin/gsx')
  })
  it('returns null when nothing resolves', () => {
    expect(resolveGsxPath(base())).toBeNull()
  })
  it('exposes the canonical install command', () => {
    expect(GSX_INSTALL_CMD).toBe('go install github.com/gsxhq/gsx/cmd/gsx@latest')
  })
})
