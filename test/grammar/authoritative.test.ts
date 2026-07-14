import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import type { IGrammar } from 'vscode-textmate'
import { loadGsxGrammar, eofDepth, ROOT_DEPTH } from './tokenize'

const CORPUS = join(__dirname, '..', 'corpus-authoritative')

function listGsx(dir: string): string[] {
  const out: string[] = []
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name)
    if (ent.isDirectory()) out.push(...listGsx(p))
    else if (ent.name.endsWith('.gsx')) out.push(p)
  }
  return out
}

describe('authoritative corpus EOF scope balance', () => {
  let grammar: IGrammar
  beforeAll(async () => {
    grammar = await loadGsxGrammar()
  })

  const files = statSync(CORPUS, { throwIfNoEntry: false }) ? listGsx(CORPUS) : []

  it('has a populated vendored corpus', () => {
    expect(files.length).toBeGreaterThan(100)
  })

  for (const file of files) {
    const rel = relative(CORPUS, file)
    it(`balances at EOF: ${rel}`, () => {
      const { depth, climbLines } = eofDepth(grammar, readFileSync(file, 'utf8'))
      if (depth !== ROOT_DEPTH) {
        const origin = climbLines
          .map((c) => `  L${c.line} (depth→${c.depth}): ${c.text}`)
          .join('\n')
        throw new Error(
          `${rel}: scope stack did not return to root (final depth ${depth}, ` +
            `root ${ROOT_DEPTH}) — a runaway scope. Depth climbed at:\n${origin}`,
        )
      }
    })
  }
})
