import { join } from 'node:path'

/** Inputs for binary resolution — all environment access is injected for testability. */
export type ResolveEnv = {
  configuredPath: string          // the gsx.server.path setting ("" if unset)
  pathDirs: string[]              // PATH split into directories
  goBin?: string                  // `go env GOBIN` (empty/undefined if unset)
  goPath?: string                 // `go env GOPATH`
  isExecutable: (p: string) => boolean
}

const BIN = process.platform === 'win32' ? 'gsx.exe' : 'gsx'

/** Resolve the gsx binary path: configured → PATH → GOBIN → GOPATH/bin. null if none. */
export function resolveGsxPath(env: ResolveEnv): string | null {
  if (env.configuredPath && env.isExecutable(env.configuredPath)) return env.configuredPath
  for (const dir of env.pathDirs) {
    const p = join(dir, BIN)
    if (env.isExecutable(p)) return p
  }
  if (env.goBin) {
    const p = join(env.goBin, BIN)
    if (env.isExecutable(p)) return p
  }
  if (env.goPath) {
    const p = join(env.goPath, 'bin', BIN)
    if (env.isExecutable(p)) return p
  }
  return null
}

export const GSX_INSTALL_CMD = 'go install github.com/gsxhq/gsx/cmd/gsx@latest'
