import { build } from "esbuild";
import fs from 'node:fs/promises'

await fs.cp('src', 'dist', { recursive: true })
await fs.rm('dist/scripts', { recursive: true })

build({
  entryPoints: ['src/scripts/main.js'],
  bundle: true,
  minify: true,
  outdir: 'dist/scripts'
})