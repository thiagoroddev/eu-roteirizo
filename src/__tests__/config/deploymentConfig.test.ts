import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('deploymentConfig', () => {
  it('garante que o homepage e o script de deploy apontam para teste-prototipo', () => {
    const pkgPath = path.resolve(__dirname, '../../../package.json')
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))

    expect(pkg.homepage).toBe('https://teste-prototipo.pages.dev/')
    expect(pkg.scripts['deploy:test']).toContain('--project-name=teste-prototipo')

    const htmlPath = path.resolve(__dirname, '../../../index.html')
    const html = fs.readFileSync(htmlPath, 'utf8')
    expect(html).toContain('property="og:url" content="https://teste-prototipo.pages.dev/"')
    expect(html).toContain('property="og:image" content="https://teste-prototipo.pages.dev/preview.png"')
  })
})