import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { existsSync, accessSync, constants } from 'node:fs'
import * as vscode from 'vscode'
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient/node'
import { resolveGsxPath, GSX_INSTALL_CMD, type ResolveEnv } from './gsxBinary'

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

async function buildResolveEnv(): Promise<ResolveEnv> {
  const configuredPath = vscode.workspace.getConfiguration('gsx').get<string>('server.path', '')
  const pathDirs = (process.env.PATH ?? '').split(process.platform === 'win32' ? ';' : ':').filter(Boolean)
  let goBin: string | undefined
  let goPath: string | undefined
  try {
    const { stdout } = await execFileAsync('go', ['env', 'GOBIN', 'GOPATH'])
    const [b, p] = stdout.split('\n')
    goBin = b?.trim() || undefined
    goPath = p?.trim() || undefined
  } catch { /* go not installed — fine, PATH/setting may still resolve */ }
  const isExecutable = (p: string): boolean => {
    try { accessSync(p, constants.X_OK); return existsSync(p) } catch { return false }
  }
  return { configuredPath, pathDirs, goBin, goPath, isExecutable }
}

async function startServer(): Promise<void> {
  const gsxPath = resolveGsxPath(await buildResolveEnv())
  if (!gsxPath) {
    output.appendLine('gsx binary not found on PATH/GOBIN/GOPATH/bin.')
    const pick = await vscode.window.showWarningMessage(
      'gsx language server not found. Install it to get diagnostics, navigation, and formatting.',
      'Install gsx',
    )
    if (pick === 'Install gsx') await installServer()
    return
  }
  const serverOptions: ServerOptions = {
    command: gsxPath,
    args: ['lsp'],
    transport: TransportKind.stdio,
  }
  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ language: 'gsx' }],
    outputChannel: output,
  }
  client = new LanguageClient('gsx', 'gsx language server', serverOptions, clientOptions)
  try {
    await client.start()
    output.appendLine(`gsx language server started: ${gsxPath} lsp`)
  } catch (err) {
    output.appendLine(`gsx language server failed to start: ${err}`)
    client = undefined
  }
}

async function installServer(): Promise<void> {
  // Run in a visible terminal so the user sees progress/errors.
  const term = vscode.window.createTerminal('gsx: install')
  term.show()
  term.sendText(GSX_INSTALL_CMD)
  await vscode.window.showInformationMessage(
    'Installing gsx in a terminal. When it finishes, run "gsx: Restart Language Server".',
  )
}

async function restartServer(): Promise<void> {
  await client?.stop()
  client = undefined
  await startServer()
}
