import * as assert from 'node:assert'
import * as vscode from 'vscode'

suite('gsx extension', () => {
  test('registers the gsx language', async () => {
    const langs = await vscode.languages.getLanguages()
    assert.ok(langs.includes('gsx'), 'gsx language is registered')
  })

  test('activates and opens a .gsx document without throwing', async () => {
    const doc = await vscode.workspace.openTextDocument({
      language: 'gsx',
      content: 'package views\n\ncomponent Hello() {\n\t<p>hi</p>\n}\n',
    })
    await vscode.window.showTextDocument(doc)
    assert.strictEqual(doc.languageId, 'gsx')
    // If gsx is on PATH (CI installs it), formatting should be available.
    if (process.env.GSX_ON_PATH === '1') {
      const edits = await vscode.commands.executeCommand<vscode.TextEdit[]>(
        'vscode.executeFormatDocumentProvider', doc.uri, {},
      )
      assert.ok(Array.isArray(edits), 'a formatting provider responded')
    }
  })
})
