import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import * as vt from 'vscode-textmate'
import * as oniguruma from 'vscode-oniguruma'

const ROOT = join(__dirname, '..', '..') // vscode-gsx repo root
const STUBS: Record<string, string> = {
  'source.js': 'test/grammar/stubs/javascript.tmLanguage.json',
  'source.css': 'test/grammar/stubs/css.tmLanguage.json',
  'source.go': 'test/grammar/stubs/go.tmLanguage.json',
}

export const ROOT_DEPTH = vt.INITIAL.depth

let onigReady: Promise<void> | null = null
function ensureOniguruma(): Promise<void> {
  if (!onigReady) {
    const wasm = readFileSync(join(ROOT, 'node_modules/vscode-oniguruma/release/onig.wasm'))
    onigReady = oniguruma.loadWASM(wasm.buffer as ArrayBuffer)
  }
  return onigReady
}

export async function loadGsxGrammar(): Promise<vt.IGrammar> {
  await ensureOniguruma()
  const registry = new vt.Registry({
    onigLib: Promise.resolve({
      createOnigScanner: (patterns) => new oniguruma.OnigScanner(patterns),
      createOnigString: (s) => new oniguruma.OnigString(s),
    }),
    loadGrammar: async (scopeName) => {
      if (scopeName === 'source.gsx') {
        return vt.parseRawGrammar(
          readFileSync(join(ROOT, 'syntaxes/gsx.tmLanguage.json'), 'utf8'),
          'gsx.tmLanguage.json',
        )
      }
      const rel = STUBS[scopeName]
      if (!rel) return null
      return vt.parseRawGrammar(readFileSync(join(ROOT, rel), 'utf8'), rel)
    },
  })
  const grammar = await registry.loadGrammar('source.gsx')
  if (!grammar) throw new Error('failed to load source.gsx grammar')
  return grammar
}

export interface EofResult {
  depth: number
  climbLines: { line: number; text: string; depth: number }[]
}

// Tokenize the whole text threading the ruleStack across lines and report the
// final scope-stack depth. A depth above ROOT_DEPTH means an unterminated
// (runaway) string/comment/embedded scope. climbLines records where the depth
// rose (diagnostic aid for locating the runaway origin).
export function eofDepth(grammar: vt.IGrammar, text: string): EofResult {
  const lines = text.split('\n')
  let ruleStack = vt.INITIAL
  const climbLines: EofResult['climbLines'] = []
  let prevDepth = ruleStack.depth
  lines.forEach((line, i) => {
    const r = grammar.tokenizeLine(line, ruleStack)
    ruleStack = r.ruleStack
    if (ruleStack.depth > prevDepth) {
      climbLines.push({ line: i + 1, text: line, depth: ruleStack.depth })
    }
    prevDepth = ruleStack.depth
  })
  return { depth: ruleStack.depth, climbLines }
}
