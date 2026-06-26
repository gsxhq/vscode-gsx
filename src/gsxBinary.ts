import { execFile } from 'node:child_process'
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

// The first line of `gsx version` is "gsx v0.0.0-..." — a line starting with
// "gsx ". We use it to tell the real gsx compiler apart from an unrelated binary
// that merely shares the name. Notably, Homebrew's Ghostscript ships a `gsx`
// symlink that lands on PATH ahead of the Go-installed gsx; running `gsx lsp`
// against it makes Ghostscript treat "lsp" as a PostScript file and drop the
// stdio connection, so the language client never starts.
const GSX_VERSION_SIGNATURE = /^gsx /m

/** A function that runs `<path> version` and resolves to its stdout (or "" on failure). */
export type VersionRunner = (path: string) => Promise<string>

/**
 * Ordered, de-duplicated executable gsx candidates:
 * configured → PATH → GOBIN → GOPATH/bin.
 */
export function gsxCandidates(env: ResolveEnv): string[] {
  const out: string[] = []
  const add = (p: string): void => {
    if (env.isExecutable(p) && !out.includes(p)) out.push(p)
  }
  if (env.configuredPath) add(env.configuredPath)
  for (const dir of env.pathDirs) add(join(dir, BIN))
  if (env.goBin) add(join(env.goBin, BIN))
  if (env.goPath) add(join(env.goPath, 'bin', BIN))
  return out
}

/**
 * Runs `<path> version`, closing stdin so an impostor that reads from it (e.g.
 * Ghostscript) can't block, with a short timeout as a backstop. Resolves to the
 * captured stdout, or "" if the process errors, is killed, or writes nothing.
 */
function runVersion(path: string, timeoutMs = 3000): Promise<string> {
  return new Promise((resolve) => {
    const child = execFile(path, ['version'], { timeout: timeoutMs }, (_err, stdout) => {
      resolve(stdout ?? '')
    })
    child.stdin?.end()
  })
}

/** True iff `<path> version` identifies the binary as the gsx compiler. */
export async function verifyGsx(path: string, run: VersionRunner = runVersion): Promise<boolean> {
  return GSX_VERSION_SIGNATURE.test(await run(path))
}

/**
 * Resolve the gsx language-server binary: the first candidate (configured → PATH
 * → GOBIN → GOPATH/bin) that verifies as the real gsx compiler. Verification
 * skips unrelated binaries named `gsx` (notably Ghostscript). Returns null if no
 * candidate verifies.
 */
export async function resolveGsxPath(
  env: ResolveEnv,
  run: VersionRunner = runVersion,
): Promise<string | null> {
  for (const cand of gsxCandidates(env)) {
    if (await verifyGsx(cand, run)) return cand
  }
  return null
}

export const GSX_INSTALL_CMD = 'go install github.com/gsxhq/gsx/cmd/gsx@latest'
