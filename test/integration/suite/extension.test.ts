import * as assert from 'node:assert'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import * as vscode from 'vscode'

suite('gsx extension', () => {
  test('registers the gsx language', async () => {
    const langs = await vscode.languages.getLanguages()
    assert.ok(langs.includes('gsx'), 'gsx language is registered')
  })

  test('activates and formats a .gsx file via the language server', async () => {
    // Explicitly activate the extension before exercising any of its providers.
    // Wrap in try/catch: if the LSP server binary exits before completing
    // initialisation (e.g. gsx not on PATH, or not a real LSP session), the
    // LanguageClient rejects — but the extension's commands and grammar
    // contributions are still registered and usable.
    const ext = vscode.extensions.getExtension('gsxhq.gsx')
    if (ext) {
      try { await ext.activate() } catch { /* LSP may fail in test env; non-fatal */ }
    }

    // The server formats documents by their .gsx path, so the buffer must be a
    // real file on disk — an untitled buffer has no .gsx URI and is skipped. The
    // content is deliberately non-canonical (extra spaces, unindented markup) so
    // a working formatter returns a non-empty edit rather than an empty result.
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsx-it-'))
    const file = path.join(dir, 'views.gsx')
    fs.writeFileSync(file, 'package views\n\ncomponent   Hello( )  {\n<p>hi</p>\n}\n')
    try {
      const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(file))
      await vscode.window.showTextDocument(doc)
      assert.strictEqual(doc.languageId, 'gsx')

      // If gsx is on PATH (CI installs it), poll until the LSP formatting
      // provider registers (it starts asynchronously after activation) and
      // returns edits for the messy file.
      if (process.env.GSX_ON_PATH === '1') {
        const TIMEOUT_MS = 15_000
        const INTERVAL_MS = 500
        const deadline = Date.now() + TIMEOUT_MS
        let edits: vscode.TextEdit[] | undefined
        while (Date.now() < deadline) {
          const result = await vscode.commands.executeCommand<vscode.TextEdit[]>(
            'vscode.executeFormatDocumentProvider', doc.uri, { tabSize: 2, insertSpaces: false },
          )
          if (Array.isArray(result) && result.length > 0) {
            edits = result
            break
          }
          await new Promise<void>((resolve) => setTimeout(resolve, INTERVAL_MS))
        }
        assert.ok(edits && edits.length > 0, 'gsx language server returned formatting edits within 15s')
        // Apply the edits (VS Code may return them minimized into several chunks)
        // and assert the formatter actually canonicalized the messy declaration.
        const wsEdit = new vscode.WorkspaceEdit()
        wsEdit.set(doc.uri, edits)
        assert.ok(await vscode.workspace.applyEdit(wsEdit), 'formatting edits applied')
        assert.ok(
          doc.getText().includes('component Hello()'),
          'formatting normalized the component declaration',
        )
      }
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })
})
