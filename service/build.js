#!/usr/bin/env node
import { build } from 'esbuild'
import esbuildPluginTsc from 'esbuild-plugin-tsc'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

await build({
  entryPoints: [join(__dirname, './src/api/fn.ts')],
  outdir: join(__dirname, './dist/api/'),
  bundle: true,
  plugins: [
    esbuildPluginTsc({
      force: true,
      tsx: false,
      tsconfigPath: './tsconfig.json',
    }),
  ],
  banner: {
    js: `import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
`,
  },
  //inject: polyfills.map((p) => `${srcDir}/${p}`),
  external: ['@aws-sdk/*'],
  outExtension: { '.js': '.mjs' },
  sourcemap: false,
  minify: false,
  splitting: false,
  platform: 'node',
  format: 'esm',
  treeShaking: true,
  target: ['esnext'],
})
