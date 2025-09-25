import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  target: 'es2020',
  sourcemap: true,
  dts: true,
  clean: true,
  skipNodeModulesBundle: true,
})
