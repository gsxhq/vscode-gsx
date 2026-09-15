import { describe, it, expect } from 'vitest'
import { expandConfiguredPath } from '../../src/gsxBinary'

describe('expandConfiguredPath', () => {
  const ctx = { workspaceFolder: '/ws/proj', homeDir: '/home/me' }

  it('returns "" for an empty setting', () => {
    expect(expandConfiguredPath('', ctx)).toBe('')
  })
  it('leaves an absolute path alone', () => {
    expect(expandConfiguredPath('/opt/gsx', ctx)).toBe('/opt/gsx')
  })
  it('expands ${workspaceFolder}', () => {
    expect(expandConfiguredPath('${workspaceFolder}/bin/gsx', ctx)).toBe('/ws/proj/bin/gsx')
  })
  it('expands a leading ~', () => {
    expect(expandConfiguredPath('~/go/bin/gsx', ctx)).toBe('/home/me/go/bin/gsx')
  })
  it('does not expand ~ in the middle of a path', () => {
    expect(expandConfiguredPath('/opt/~/gsx', ctx)).toBe('/opt/~/gsx')
  })
  it('resolves a relative path against the workspace folder', () => {
    expect(expandConfiguredPath('bin/gsx', ctx)).toBe('/ws/proj/bin/gsx')
  })
  it('keeps a relative path as-is when there is no workspace folder', () => {
    expect(expandConfiguredPath('bin/gsx', { homeDir: '/home/me' })).toBe('bin/gsx')
  })
  it('leaves ${workspaceFolder} unexpanded when there is no workspace folder', () => {
    expect(expandConfiguredPath('${workspaceFolder}/bin/gsx', { homeDir: '/home/me' })).toBe('${workspaceFolder}/bin/gsx')
  })
})
