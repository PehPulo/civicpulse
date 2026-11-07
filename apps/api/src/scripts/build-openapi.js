import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import yaml from 'js-yaml'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '../../../..')
const yamlPath = join(rootDir, 'docs/openapi.yaml')
const jsonPath = join(__dirname, '../openapi.json')

const content = readFileSync(yamlPath, 'utf-8')
const parsed = yaml.load(content)

writeFileSync(jsonPath, JSON.stringify(parsed, null, 2) + '\n', 'utf-8')
console.log('✔ openapi.json generated successfully from docs/openapi.yaml')
