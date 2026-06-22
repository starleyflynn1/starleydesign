import { copyFileSync, writeFileSync } from 'fs'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { criticalPathHtml } from './vite-critical-path'

/**
 * Loads the main stylesheet without blocking first paint. Requires matching
 * critical rules in index.html (shell, footer, LCP poster slot, calendar grid).
 */
function deferMainCss(): Plugin {
  return {
    name: 'defer-main-css',
    transformIndexHtml(html) {
      return html.replace(/<link\s+[^>]*rel="stylesheet"[^>]*>/gi, (tag) => {
        const hrefMatch = tag.match(/\bhref="([^"]+)"/)
        if (!hrefMatch || !/\/assets\/[^"]+\.css/.test(hrefMatch[1])) return tag
        const href = hrefMatch[1]
        const hasCrossorigin = /\bcrossorigin\b/i.test(tag)
        const crossoriginAttr = hasCrossorigin ? ' crossorigin' : ''
        return `<link rel="preload" href="${href}" as="style"${crossoriginAttr} onload="this.onload=null;this.rel='stylesheet'">\n      <noscript>${tag}</noscript>`
      })
    },
  }
}

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

function ghPagesArtifacts(): Plugin {
  return {
    name: 'gh-pages-artifacts',
    closeBundle() {
      if (process.env.GITHUB_PAGES !== 'true') return
      copyFileSync('dist/index.html', 'dist/404.html')
      writeFileSync('dist/.nojekyll', '')
    },
  }
}

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/starleydesign/' : '/',
  build: {
    esbuild: {
      drop: ['console', 'debugger'],
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/lucide-react')) {
            return 'lucide';
          }
        },
      },
    },
  },
  plugins: [
    deferMainCss(),
    criticalPathHtml(),
    figmaAssetResolver(),
    ghPagesArtifacts(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
