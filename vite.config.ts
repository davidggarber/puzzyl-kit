import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'PuzzylKit',
      formats: ['es', 'umd'],
      fileName: (format) => `kit.${format}.js`,
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        // Expose every named export on globalThis so puzzle pages that load
        // kit.umd.js via <script> can call toggleClass(), theBoiler(), etc.
        // without a namespace prefix.
        outro: 'if(typeof globalThis!=="undefined")Object.assign(globalThis,PuzzylKit);',
      },
    },
  },
})
