import * as vscode from 'vscode'

export function activate(_context: vscode.ExtensionContext): void {
  // LanguageClient wiring is added in Task 4.
  console.log('gsx extension activated')
}

export function deactivate(): void {}
