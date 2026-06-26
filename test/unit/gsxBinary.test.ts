import { describe, it, expect } from 'vitest'
import {
  gsxCandidates,
  verifyGsx,
  resolveGsxPath,
  GSX_INSTALL_CMD,
  type ResolveEnv,
  type VersionRunner,
} from '../../src/gsxBinary'

const base = (over: Partial<ResolveEnv> = {}): ResolveEnv => ({
  configuredPath: '',
  pathDirs: [],
  goBin: undefined,
  goPath: undefined,
  isExecutable: () => false,
  ...over,
})

// Fake `<path> version` output: real gsx prints "gsx v…"; Ghostscript prints its
// own banner; anything unlisted behaves as producing no output.
const fakeRunner = (versions: Record<string, string>): VersionRunner =>
  async (p) => versions[p] ?? ''

const GSX_OUT = 'gsx v0.0.0-20260626125930-80b9fc36aae4\n  commit: 80b9fc36aae4\n'
const GHOSTSCRIPT_OUT = 'GPL Ghostscript 10.06.0 (2025-09-09)\nCopyright (C) 2025 Artifex Software\n'

describe('gsxCandidates', () => {
  it('orders configured → PATH → GOBIN → GOPATH/bin', () => {
    const env = base({
      configuredPath: '/opt/gsx',
      pathDirs: ['/a', '/usr/bin'],
      goBin: '/gb',
      goPath: '/gp',
      isExecutable: (p) =>
        ['/opt/gsx', '/usr/bin/gsx', '/gb/gsx', '/gp/bin/gsx'].includes(p),
    })
    expect(gsxCandidates(env)).toEqual(['/opt/gsx', '/usr/bin/gsx', '/gb/gsx', '/gp/bin/gsx'])
  })
  it('skips non-executable candidates', () => {
    const env = base({ pathDirs: ['/a', '/usr/bin'], isExecutable: (p) => p === '/usr/bin/gsx' })
    expect(gsxCandidates(env)).toEqual(['/usr/bin/gsx'])
  })
  it('de-duplicates repeated paths', () => {
    const env = base({
      pathDirs: ['/usr/bin', '/usr/bin'],
      goPath: '/gp',
      isExecutable: (p) => p === '/usr/bin/gsx',
    })
    expect(gsxCandidates(env)).toEqual(['/usr/bin/gsx'])
  })
  it('returns empty when nothing is executable', () => {
    expect(gsxCandidates(base())).toEqual([])
  })
})

describe('verifyGsx', () => {
  it('accepts the gsx compiler by its version signature', async () => {
    expect(await verifyGsx('/gp/bin/gsx', fakeRunner({ '/gp/bin/gsx': GSX_OUT }))).toBe(true)
  })
  it('rejects Ghostscript (a different binary named gsx)', async () => {
    expect(
      await verifyGsx('/opt/homebrew/bin/gsx', fakeRunner({ '/opt/homebrew/bin/gsx': GHOSTSCRIPT_OUT })),
    ).toBe(false)
  })
  it('rejects a binary that produces no output', async () => {
    expect(await verifyGsx('/x/gsx', fakeRunner({}))).toBe(false)
  })
})

describe('resolveGsxPath', () => {
  it('skips a shadowing Ghostscript on PATH and falls through to the real gsx', async () => {
    const env = base({
      pathDirs: ['/opt/homebrew/bin', '/Users/me/go/bin'],
      isExecutable: () => true,
    })
    const run = fakeRunner({
      '/opt/homebrew/bin/gsx': GHOSTSCRIPT_OUT,
      '/Users/me/go/bin/gsx': GSX_OUT,
    })
    expect(await resolveGsxPath(env, run)).toBe('/Users/me/go/bin/gsx')
  })
  it('prefers the configured path when it verifies', async () => {
    const env = base({ configuredPath: '/opt/gsx', isExecutable: (p) => p === '/opt/gsx' })
    expect(await resolveGsxPath(env, fakeRunner({ '/opt/gsx': GSX_OUT }))).toBe('/opt/gsx')
  })
  it('falls back through GOBIN then GOPATH/bin', async () => {
    const gobin = base({ goBin: '/gb', isExecutable: (p) => p === '/gb/gsx' })
    expect(await resolveGsxPath(gobin, fakeRunner({ '/gb/gsx': GSX_OUT }))).toBe('/gb/gsx')
    const gopath = base({ goPath: '/gp', isExecutable: (p) => p === '/gp/bin/gsx' })
    expect(await resolveGsxPath(gopath, fakeRunner({ '/gp/bin/gsx': GSX_OUT }))).toBe('/gp/bin/gsx')
  })
  it('returns null when nothing resolves', async () => {
    expect(await resolveGsxPath(base(), fakeRunner({}))).toBeNull()
  })
  it('returns null when the only candidate is an impostor', async () => {
    const env = base({ pathDirs: ['/opt/homebrew/bin'], isExecutable: () => true })
    expect(
      await resolveGsxPath(env, fakeRunner({ '/opt/homebrew/bin/gsx': GHOSTSCRIPT_OUT })),
    ).toBeNull()
  })
})

describe('GSX_INSTALL_CMD', () => {
  it('exposes the canonical install command', () => {
    expect(GSX_INSTALL_CMD).toBe('go install github.com/gsxhq/gsx/cmd/gsx@latest')
  })
})
