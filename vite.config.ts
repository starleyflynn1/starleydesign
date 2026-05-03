import { defineConfig } from 'vite'
import type { OutputBundle } from 'rollup'
import type { Plugin } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

/**
 * Turns blocking `<link rel="stylesheet" href="/assets/*.css">` into preload + onload
 * so the initial HTML parse is not blocked (addresses Lighthouse "render-blocking requests").
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

/**
 * Emits <link rel="modulepreload"> for lazy chunks still split from the entry bundle (e.g. SeatingChart).
 */
function modulepreloadLazyChunks(): Plugin {
  return {
    name: 'modulepreload-lazy-chunks',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const bundle = ctx.bundle as OutputBundle | undefined
        if (!bundle) return html

        const hrefs: string[] = []
        for (const fileName of Object.keys(bundle)) {
          if (!fileName.endsWith('.js')) continue
          if (fileName.includes('SeatingChart-')) {
            hrefs.push(`      <link rel="modulepreload" crossorigin href="/${fileName}" />`)
          }
        }
        if (hrefs.length === 0) return html

        return html.replace(/<\/head>/i, `${hrefs.join('\n')}\n    </head>`)
      },
    },
  }
}

export default defineConfig({
  build: {
    esbuild: {
      drop: ['console', 'debugger'],
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/lucide-react')) {
            return 'lucide'
          }
        },
      },
    },
  },
  plugins: [
    deferMainCss(),
    modulepreloadLazyChunks(),
    figmaAssetResolver(),
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
