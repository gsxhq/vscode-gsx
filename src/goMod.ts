/** The gsx module path and the tool path a go.mod pins with a `tool` directive. */
export const GSX_MODULE = 'github.com/gsxhq/gsx'
export const GSX_TOOL = 'github.com/gsxhq/gsx/cmd/gsx'

/** What a workspace's go.mod says about gsx. */
export type GoModFacts = {
  /** `tool github.com/gsxhq/gsx/cmd/gsx` is declared, so `go tool gsx` works. */
  declaresTool: boolean
  /** `github.com/gsxhq/gsx` is a required module, so `go install …/cmd/gsx` (no @latest) installs the pinned version. */
  requiresModule: boolean
}

/**
 * Reads the `tool` and `require` directives of a go.mod, in both the one-line
 * form (`require m v1.0.0`) and the block form (`require (\n\tm v1.0.0\n)`).
 * Only the directive keyword and the first token of each entry matter, so
 * versions and `// indirect` markers are ignored.
 */
export function inspectGoMod(text: string): GoModFacts {
  const facts: GoModFacts = { declaresTool: false, requiresModule: false }
  let block: string | null = null // directive keyword of the open `( … )` block, if any
  for (const rawLine of text.split(/\r?\n/)) {
    const line = stripComment(rawLine).trim()
    if (!line) continue
    if (block) {
      if (line === ')') { block = null; continue }
      note(block, line.split(/\s+/)[0]!)
      continue
    }
    const [keyword, ...rest] = line.split(/\s+/)
    if (keyword !== 'tool' && keyword !== 'require') continue
    if (rest[0] === '(') { block = keyword; continue }
    if (rest[0]) note(keyword, rest[0])
  }
  return facts

  function note(directive: string, path: string): void {
    if (directive === 'tool' && path === GSX_TOOL) facts.declaresTool = true
    if (directive === 'require' && path === GSX_MODULE) facts.requiresModule = true
  }
}

function stripComment(line: string): string {
  const i = line.indexOf('//')
  return i < 0 ? line : line.slice(0, i)
}
