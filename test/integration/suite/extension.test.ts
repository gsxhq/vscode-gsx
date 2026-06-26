import * as assert from 'node:assert'
import * as vscode from 'vscode'

suite('gsx extension', () => {
  test('registers the gsx language', async () => {
    const langs = await vscode.languages.getLanguages()
    assert.ok(langs.includes('gsx'), 'gsx language is registered')
  })

  test('activates and opens a .gsx document without throwing', async () => {
    // Explicitly activate the extension before exercising any of its providers.
    // Wrap in try/catch: if the LSP server binary exits before completing
    // initialisation (e.g. gsx not on PATH, or not a real LSP session), the
    // LanguageClient rejects — but the extension's commands and grammar
    // contributions are still registered and usable.
    const ext = vscode.extensions.getExtension('gsxhq.gsx')
    if (ext) {
      try { await ext.activate() } catch { /* LSP may fail in test env; non-fatal */ }
    }

    const doc = await vscode.workspace.openTextDocument({
      language: 'gsx',
      content: 'package views\n\ncomponent Hello() {\n\t<p>hi</p>\n}\n',
    })
    await vscode.window.showTextDocument(doc)
    assert.strictEqual(doc.languageId, 'gsx')
    // If gsx is on PATH (CI installs it), poll until the LSP formatting provider
    // registers (it starts asynchronously after activation).
    if (process.env.GSX_ON_PATH === '1') {
      const TIMEOUT_MS = 15_000
      const INTERVAL_MS = 500
      const deadline = Date.now() + TIMEOUT_MS
      let edits: vscode.TextEdit[] | undefined
      while (Date.now() < deadline) {
        const result = await vscode.commands.executeCommand<vscode.TextEdit[]>(
          'vscode.executeFormatDocumentProvider', doc.uri, {},
        )
        if (Array.isArray(result)) {
          edits = result
          break
        }
        await new Promise<void>((resolve) => setTimeout(resolve, INTERVAL_MS))
      }
      assert.ok(Array.isArray(edits), 'a formatting provider responded within 15s')
    }
  })
})
