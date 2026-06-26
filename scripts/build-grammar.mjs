// Generate syntaxes/gsx.tmLanguage.json from the authored YAML source.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import yaml from 'js-yaml'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(root, 'syntaxes', 'gsx.tmLanguage.src.yaml')
const out = join(root, 'syntaxes', 'gsx.tmLanguage.json')
const grammar = yaml.load(readFileSync(src, 'utf8'))
writeFileSync(out, JSON.stringify(grammar, null, 2) + '\n')
console.log(`generated ${out}`)
