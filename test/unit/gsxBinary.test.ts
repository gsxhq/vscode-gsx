import { describe, it, expect } from 'vitest'
import {
  gsxCandidates,
  verifyGsx,
  resolveGsx,
  installCommand,
  binary,
  GO_TOOL_GSX,
  type ResolveEnv,
  type GsxCommand,
  type VersionRunner,
} from '../../src/gsxBinary'

const base = (over: Partial<ResolveEnv> = {}): ResolveEnv => ({
  configuredPath: '',
  pathDirs: [],
  goBin: undefined,
  goPath: undefined,
  goToolDeclared: false,
  isExecutable: () => false,
  ...over,
})

// Fake `<cmd> version` output keyed by the command's display form: real gsx
// prints "gsx v…"; Ghostscript prints its own banner; anything unlisted behaves
// as producing no output.
const key = (c: GsxCommand): string => [c.command, ...c.args].join(' ')
const fakeRunner = (versions: Record<string, string>): VersionRunner =>
  async (c) => versions[key(c)] ?? ''

const GSX_OUT = 'gsx v0.0.0-20260626125930-80b9fc36aae4\n  commit: 80b9fc36aae4\n'
const GHOSTSCRIPT_OUT = 'GPL Ghostscript 10.06.0 (2025-09-09)\nCopyright (C) 2025 Artifex Software\n'

describe('gsxCandidates', () => {
  it('orders configured → go tool → PATH → GOBIN → GOPATH/bin', () => {
    const env = base({
      configuredPath: '/opt/gsx',
      pathDirs: ['/a', '/usr/bin'],
      goBin: '/gb',
      goPath: '/gp',
      goToolDeclared: true,
      isExecutable: (p) =>
        ['/opt/gsx', '/usr/bin/gsx', '/gb/gsx', '/gp/bin/gsx'].includes(p),
    })
    expect(gsxCandidates(env)).toEqual([
      binary('/opt/gsx'),
      GO_TOOL_GSX,
      binary('/usr/bin/gsx'),
      binary('/gb/gsx'),
      binary('/gp/bin/gsx'),
    ])
  })
  it('omits go tool when go.mod does not declare it', () => {
    const env = base({ pathDirs: ['/usr/bin'], isExecutable: (p) => p === '/usr/bin/gsx' })
    expect(gsxCandidates(env)).toEqual([binary('/usr/bin/gsx')])
  })
  it('skips non-executable candidates', () => {
    const env = base({ pathDirs: ['/a', '/usr/bin'], isExecutable: (p) => p === '/usr/bin/gsx' })
    expect(gsxCandidates(env)).toEqual([binary('/usr/bin/gsx')])
  })
  it('de-duplicates repeated paths', () => {
    const env = base({
      pathDirs: ['/usr/bin', '/usr/bin'],
      goPath: '/gp',
      isExecutable: (p) => p === '/usr/bin/gsx',
    })
    expect(gsxCandidates(env)).toEqual([binary('/usr/bin/gsx')])
  })
  it('returns empty when nothing is executable', () => {
    expect(gsxCandidates(base())).toEqual([])
  })
})

describe('verifyGsx', () => {
  it('accepts the gsx compiler by its version signature', async () => {
    expect(await verifyGsx(binary('/gp/bin/gsx'), fakeRunner({ '/gp/bin/gsx': GSX_OUT }))).toBe(true)
  })
  it('accepts go tool gsx by its version signature', async () => {
    expect(await verifyGsx(GO_TOOL_GSX, fakeRunner({ 'go tool gsx': GSX_OUT }))).toBe(true)
  })
  it('rejects Ghostscript (a different binary named gsx)', async () => {
    expect(
      await verifyGsx(binary('/opt/homebrew/bin/gsx'), fakeRunner({ '/opt/homebrew/bin/gsx': GHOSTSCRIPT_OUT })),
    ).toBe(false)
  })
  it('rejects a binary that produces no output', async () => {
    expect(await verifyGsx(binary('/x/gsx'), fakeRunner({}))).toBe(false)
  })
})

describe('resolveGsx', () => {
  it('skips a shadowing Ghostscript on PATH and falls through to the real gsx', async () => {
    const env = base({
      pathDirs: ['/opt/homebrew/bin', '/Users/me/go/bin'],
      isExecutable: () => true,
    })
    const run = fakeRunner({
      '/opt/homebrew/bin/gsx': GHOSTSCRIPT_OUT,
      '/Users/me/go/bin/gsx': GSX_OUT,
    })
    expect(await resolveGsx(env, run)).toEqual(binary('/Users/me/go/bin/gsx'))
  })
  it('prefers the configured path when it verifies', async () => {
    const env = base({ configuredPath: '/opt/gsx', goToolDeclared: true, isExecutable: (p) => p === '/opt/gsx' })
    const run = fakeRunner({ '/opt/gsx': GSX_OUT, 'go tool gsx': GSX_OUT })
    expect(await resolveGsx(env, run)).toEqual(binary('/opt/gsx'))
  })
  it('prefers go tool gsx over a gsx on PATH when go.mod declares the tool', async () => {
    const env = base({ pathDirs: ['/usr/bin'], goToolDeclared: true, isExecutable: () => true })
    const run = fakeRunner({ '/usr/bin/gsx': GSX_OUT, 'go tool gsx': GSX_OUT })
    expect(await resolveGsx(env, run)).toEqual(GO_TOOL_GSX)
  })
  it('falls through to PATH when go tool gsx fails to run', async () => {
    const env = base({ pathDirs: ['/usr/bin'], goToolDeclared: true, isExecutable: () => true })
    const run = fakeRunner({ '/usr/bin/gsx': GSX_OUT })
    expect(await resolveGsx(env, run)).toEqual(binary('/usr/bin/gsx'))
  })
  it('falls back through GOBIN then GOPATH/bin', async () => {
    const gobin = base({ goBin: '/gb', isExecutable: (p) => p === '/gb/gsx' })
    expect(await resolveGsx(gobin, fakeRunner({ '/gb/gsx': GSX_OUT }))).toEqual(binary('/gb/gsx'))
    const gopath = base({ goPath: '/gp', isExecutable: (p) => p === '/gp/bin/gsx' })
    expect(await resolveGsx(gopath, fakeRunner({ '/gp/bin/gsx': GSX_OUT }))).toEqual(binary('/gp/bin/gsx'))
  })
  it('returns null when nothing resolves', async () => {
    expect(await resolveGsx(base(), fakeRunner({}))).toBeNull()
  })
  it('returns null when the only candidate is an impostor', async () => {
    const env = base({ pathDirs: ['/opt/homebrew/bin'], isExecutable: () => true })
    expect(
      await resolveGsx(env, fakeRunner({ '/opt/homebrew/bin/gsx': GHOSTSCRIPT_OUT })),
    ).toBeNull()
  })
})

describe('installCommand', () => {
  it('installs @latest when the workspace does not require the gsx module', () => {
    expect(installCommand(false)).toBe('go install github.com/gsxhq/gsx/cmd/gsx@latest')
  })
  it('installs the version pinned by go.mod when the workspace requires the gsx module', () => {
    expect(installCommand(true)).toBe('go install github.com/gsxhq/gsx/cmd/gsx')
  })
})
