import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { existsSync, accessSync, constants } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import * as vscode from 'vscode'
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient/node'
import {
  expandConfiguredPath,
  installCommand,
  resolveGsx,
  versionRunner,
  type GsxCommand,
  type ResolveEnv,
} from './gsxBinary'
import { inspectGoMod, type GoModFacts } from './goMod'

const execFileAsync = promisify(execFile)
let client: LanguageClient | undefined
const output = vscode.window.createOutputChannel('gsx')

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  context.subscriptions.push(output)
  context.subscriptions.push(
    vscode.commands.registerCommand('gsx.installServer', installServer),
    vscode.commands.registerCommand('gsx.restartServer', restartServer),
  )
  await startServer()
}

export async function deactivate(): Promise<void> {
  await client?.stop()
  client = undefined
}

/**
 * The folder every gsx-related process runs from: the workspace folder of the
 * active .gsx document, else the first workspace folder. Running from here lets
 * version-manager shims (mise, asdf) and GOTOOLCHAIN pick the project's versions
 * rather than whatever VS Code's launch environment happened to have.
 */
function workspaceFolder(): string | undefined {
  const doc = vscode.window.activeTextEditor?.document
  const active = doc?.languageId === 'gsx' ? vscode.workspace.getWorkspaceFolder(doc.uri) : undefined
  return (active ?? vscode.workspace.workspaceFolders?.[0])?.uri.fsPath
}

/** What `go env` reports from the workspace folder; all fields empty when go is unavailable. */
type GoEnv = {
  goBin?: string
  goPath?: string
  goMod?: string   // path of the workspace's go.mod, or undefined outside a module
}

async function goEnv(cwd: string | undefined): Promise<GoEnv> {
  try {
    const { stdout } = await execFileAsync('go', ['env', 'GOBIN', 'GOPATH', 'GOMOD'], { cwd })
    const [goBin, goPath, goMod] = stdout.split('\n').map((l) => l.trim() || undefined)
    // Outside a module, go reports GOMOD as os.DevNull ("/dev/null" or "NUL").
    const inModule = goMod !== undefined && goMod !== '/dev/null' && goMod.toUpperCase() !== 'NUL'
    return { goBin, goPath, goMod: inModule ? goMod : undefined }
  } catch {
    return {} // go not installed — fine, PATH/setting may still resolve
  }
}

async function goModFacts(goMod: string | undefined): Promise<GoModFacts> {
  if (!goMod) return { declaresTool: false, requiresModule: false }
  try {
    return inspectGoMod(await readFile(goMod, 'utf8'))
  } catch {
    return { declaresTool: false, requiresModule: false }
  }
}

async function buildResolveEnv(cwd: string | undefined, facts: GoModFacts, env: GoEnv): Promise<ResolveEnv> {
  const raw = vscode.workspace.getConfiguration('gsx').get<string>('server.path', '')
  const configuredPath = expandConfiguredPath(raw, { workspaceFolder: cwd, homeDir: homedir() })
  const pathDirs = (process.env.PATH ?? '').split(process.platform === 'win32' ? ';' : ':').filter(Boolean)
  const isExecutable = (p: string): boolean => {
    try { accessSync(p, constants.X_OK); return existsSync(p) } catch { return false }
  }
  return {
    configuredPath,
    pathDirs,
    goBin: env.goBin,
    goPath: env.goPath,
    goToolDeclared: facts.declaresTool,
    isExecutable,
  }
}

const display = (c: GsxCommand): string => [c.command, ...c.args].join(' ')

async function startServer(): Promise<void> {
  const cwd = workspaceFolder()
  const env = await goEnv(cwd)
  const facts = await goModFacts(env.goMod)
  const gsx = await resolveGsx(await buildResolveEnv(cwd, facts, env), versionRunner({ cwd }))
  if (!gsx) {
    output.appendLine(
      'No gsx compiler found via gsx.server.path, go.mod tool directive, PATH, GOBIN, or GOPATH/bin' +
        (cwd ? ` (searched from ${cwd}).` : '.') +
        ' (A binary named "gsx" that is not the gsx compiler — e.g. Ghostscript — is ignored.)',
    )
    const pick = await vscode.window.showWarningMessage(
      'gsx language server not found. Install it to get diagnostics, navigation, and formatting.',
      'Install gsx',
    )
    if (pick === 'Install gsx') await installServer()
    return
  }
  const serverOptions: ServerOptions = {
    command: gsx.command,
    args: [...gsx.args, 'lsp'],
    transport: TransportKind.stdio,
    options: { cwd },
  }
  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ language: 'gsx' }],
    outputChannel: output,
  }
  client = new LanguageClient('gsx', 'gsx language server', serverOptions, clientOptions)
  try {
    await client.start()
    output.appendLine(`gsx language server started: ${display(gsx)} lsp${cwd ? ` (cwd ${cwd})` : ''}`)
  } catch (err) {
    output.appendLine(`gsx language server failed to start: ${err}`)
    client = undefined
  }
}

async function installServer(): Promise<void> {
  const cwd = workspaceFolder()
  const facts = await goModFacts((await goEnv(cwd)).goMod)
  // Run in a visible terminal so the user sees progress/errors. From the
  // workspace folder, `go install` without @latest installs the go.mod-pinned
  // version; elsewhere it installs the latest release.
  const term = vscode.window.createTerminal({ name: 'gsx: install', cwd })
  term.show()
  term.sendText(installCommand(facts.requiresModule))
  await vscode.window.showInformationMessage(
    'Installing gsx in a terminal. When it finishes, run "gsx: Restart Language Server".',
  )
}

async function restartServer(): Promise<void> {
  await client?.stop()
  client = undefined
  await startServer()
}
