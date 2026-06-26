import { glob } from 'glob'
import Mocha from 'mocha'
import { resolve } from 'node:path'

export async function run(): Promise<void> {
  const mocha = new Mocha({ ui: 'tdd', color: true, timeout: 60000 })
  const files = await glob('**/*.test.js', { cwd: __dirname })
  files.forEach((f) => mocha.addFile(resolve(__dirname, f)))
  await new Promise<void>((res, rej) =>
    mocha.run((failures) => (failures ? rej(new Error(`${failures} tests failed`)) : res())),
  )
}
