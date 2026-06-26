import { runTests } from '@vscode/test-electron'
import { resolve } from 'node:path'

async function main() {
  const extensionDevelopmentPath = resolve(__dirname, '../../../')
  const extensionTestsPath = resolve(__dirname, './suite/index')
  await runTests({ extensionDevelopmentPath, extensionTestsPath })
}
main().catch((e) => { console.error(e); process.exit(1) })
