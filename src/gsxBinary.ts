import { execFile } from 'node:child_process'
import { isAbsolute, join, resolve } from 'node:path'
import { GSX_TOOL } from './goMod'

/**
 * How to invoke gsx: a program plus the arguments that precede the gsx
 * subcommand (`version`, `lsp`). A plain binary has no leading args; the
 * module-pinned form is `go tool gsx`.
 */
export type GsxCommand = {
  command: string
  args: string[]
}

/** A gsx binary at `path`. */
export function binary(path: string): GsxCommand {
  return { command: path, args: [] }
}

/**
 * gsx as declared by the workspace's go.mod `tool` directive. Run from the
 * workspace folder, `go tool gsx` builds and runs the exact pinned version, so
 * no separate install is needed.
 */
export const GO_TOOL_GSX: GsxCommand = { command: 'go', args: ['tool', 'gsx'] }

const isGoTool = (c: GsxCommand): boolean => c.command === 'go' && c.args[0] === 'tool'

/** Inputs for binary resolution — all environment access is injected for testability. */
export type ResolveEnv = {
  configuredPath: string          // the gsx.server.path setting, already expanded ("" if unset)
  pathDirs: string[]              // PATH split into directories
  goBin?: string                  // `go env GOBIN` (empty/undefined if unset)
  goPath?: string                 // `go env GOPATH`
  goToolDeclared: boolean         // the workspace go.mod has `tool github.com/gsxhq/gsx/cmd/gsx`
  isExecutable: (p: string) => boolean
}

/** Where a setting's placeholders resolve to. */
export type PathContext = {
  workspaceFolder?: string
  homeDir: string
}

/**
 * Expands `gsx.server.path` so a repo can commit a project-relative value:
 * `${workspaceFolder}` and a leading `~` are substituted, and a relative path is
 * resolved against the workspace folder. With no workspace folder open, the
 * value is returned as written (a relative path then resolves against the
 * extension host's cwd, as before).
 */
export function expandConfiguredPath(raw: string, ctx: PathContext): string {
  let p = raw
  if (!p) return ''
  if (p === '~' || p.startsWith('~/')) p = ctx.homeDir + p.slice(1)
  if (ctx.workspaceFolder) {
    p = p.replaceAll('${workspaceFolder}', ctx.workspaceFolder)
    if (!isAbsolute(p)) p = resolve(ctx.workspaceFolder, p)
  }
  return p
}

const BIN = process.platform === 'win32' ? 'gsx.exe' : 'gsx'

// The first line of `gsx version` is "gsx v0.0.0-..." — a line starting with
// "gsx ". We use it to tell the real gsx compiler apart from an unrelated binary
// that merely shares the name. Notably, Homebrew's Ghostscript ships a `gsx`
// symlink that lands on PATH ahead of the Go-installed gsx; running `gsx lsp`
// against it makes Ghostscript treat "lsp" as a PostScript file and drop the
// stdio connection, so the language client never starts.
const GSX_VERSION_SIGNATURE = /^gsx /m

/** A function that runs `<cmd> version` and resolves to its stdout (or "" on failure). */
export type VersionRunner = (cmd: GsxCommand) => Promise<string>

/**
 * Ordered, de-duplicated gsx candidates:
 * configured → `go tool gsx` (if go.mod declares it) → PATH → GOBIN → GOPATH/bin.
 * The explicit setting stays first because it is the user's override.
 */
export function gsxCandidates(env: ResolveEnv): GsxCommand[] {
  const out: GsxCommand[] = []
  const seen = new Set<string>()
  const add = (p: string): void => {
    if (env.isExecutable(p) && !seen.has(p)) { seen.add(p); out.push(binary(p)) }
  }
  if (env.configuredPath) add(env.configuredPath)
  if (env.goToolDeclared) out.push(GO_TOOL_GSX)
  for (const dir of env.pathDirs) add(join(dir, BIN))
  if (env.goBin) add(join(env.goBin, BIN))
  if (env.goPath) add(join(env.goPath, 'bin', BIN))
  return out
}

/** Options for the real version probe. */
export type RunOptions = {
  cwd?: string
}

// A binary answers `version` instantly; a mise/asdf shim at editor startup can
// take a few seconds while many extensions spawn processes at once. The first
// `go tool gsx` run compiles the module, so it gets much longer; a build
// failure exits quickly regardless.
const BINARY_TIMEOUT_MS = 10_000
const GO_TOOL_TIMEOUT_MS = 60_000

/**
 * Runs `<cmd> version` in `cwd`, closing stdin so an impostor that reads from
 * it (e.g. Ghostscript) can't block, with a timeout as a backstop. Resolves to
 * the captured stdout, or "" if the process errors, is killed, or writes nothing.
 */
export function versionRunner(opts: RunOptions): VersionRunner {
  return (cmd) =>
    new Promise((resolve) => {
      const timeout = isGoTool(cmd) ? GO_TOOL_TIMEOUT_MS : BINARY_TIMEOUT_MS
      const child = execFile(
        cmd.command,
        [...cmd.args, 'version'],
        { timeout, cwd: opts.cwd },
        (_err, stdout) => { resolve(stdout ?? '') },
      )
      child.stdin?.end()
    })
}

/** True iff `<cmd> version` identifies the command as the gsx compiler. */
export async function verifyGsx(cmd: GsxCommand, run: VersionRunner): Promise<boolean> {
  return GSX_VERSION_SIGNATURE.test(await run(cmd))
}

/**
 * Resolve the gsx language-server command: the first candidate (configured →
 * go tool → PATH → GOBIN → GOPATH/bin) that verifies as the real gsx compiler.
 * Verification skips unrelated binaries named `gsx` (notably Ghostscript) and a
 * `go tool gsx` that fails to build. Returns null if no candidate verifies.
 */
export async function resolveGsx(env: ResolveEnv, run: VersionRunner): Promise<GsxCommand | null> {
  for (const cand of gsxCandidates(env)) {
    if (await verifyGsx(cand, run)) return cand
  }
  return null
}

/**
 * The shell command Install/Update runs. When the workspace's go.mod requires
 * the gsx module, `go install` without `@latest` (run from the workspace
 * folder) installs exactly the version the project builds with.
 */
export function installCommand(workspaceRequiresModule: boolean): string {
  return workspaceRequiresModule ? `go install ${GSX_TOOL}` : `go install ${GSX_TOOL}@latest`
}
