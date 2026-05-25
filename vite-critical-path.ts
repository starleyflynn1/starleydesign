import type { OutputBundle, OutputChunk, Plugin } from 'vite'

function assetHref(fileName: string) {
  return fileName.startsWith('assets/') ? `/${fileName}` : `/assets/${fileName}`
}

function findChunkFile(bundle: OutputBundle, prefix: string) {
  for (const item of Object.values(bundle)) {
    if (item.type === 'chunk' && item.fileName.includes(prefix)) {
      return item.fileName
    }
  }
  return undefined
}

/**
 * Starts JS/CSS/page-chunk downloads immediately and drops non-critical preloads
 * (e.g. motion) from the default modulepreload chain.
 */
export function criticalPathHtml(): Plugin {
  const routeChunkMap: Record<string, string> = {}
  let entryFile: string | undefined
  let lucideFile: string | undefined
  let cssFile: string | undefined

  return {
    name: 'critical-path-html',
    apply: 'build',
    generateBundle(_options, bundle) {
      entryFile = Object.values(bundle).find(
        (item): item is OutputChunk => item.type === 'chunk' && item.isEntry
      )?.fileName

      lucideFile = findChunkFile(bundle, 'lucide-')
      cssFile = Object.values(bundle).find(
        (item) => item.type === 'asset' && item.fileName.endsWith('.css')
      )?.fileName

      const stage =
        findChunkFile(bundle, 'HomeStageHost-') ?? findChunkFile(bundle, 'StagePage-')
      const backstage = findChunkFile(bundle, 'BackstagePage-')
      const director = findChunkFile(bundle, 'DirectorPage-')
      const script = findChunkFile(bundle, 'ScriptPage-')

      if (stage) routeChunkMap['/'] = assetHref(stage)
      if (backstage) routeChunkMap['/backstage'] = assetHref(backstage)
      if (director) routeChunkMap['/director'] = assetHref(director)
      if (script) routeChunkMap['/script'] = assetHref(script)
    },
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const earlyLinks: string[] = []
        if (cssFile) {
          earlyLinks.push(`<link rel="preload" href="${assetHref(cssFile)}" as="style" crossorigin>`)
        }
        if (entryFile) {
          earlyLinks.push(`<link rel="modulepreload" href="${assetHref(entryFile)}" crossorigin>`)
        }
        if (lucideFile) {
          earlyLinks.push(`<link rel="modulepreload" href="${assetHref(lucideFile)}" crossorigin>`)
        }

        const routePreloadScript = `<script>
(function () {
  try {
    var path = (location.pathname || '/').replace(/\\/+$/, '') || '/';
    var routes = ${JSON.stringify(routeChunkMap)};
    var href = routes[path];
    if (href) {
      var link = document.createElement('link');
      link.rel = 'modulepreload';
      link.href = href;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }
    if (path === '/' || path === '') {
      var img = document.createElement('link');
      img.rel = 'preload';
      img.as = 'image';
      img.href = '/images/shows/design-system-320.webp';
      img.setAttribute('imagesrcset', '/images/shows/design-system-320.webp 320w, /images/shows/design-system-480.webp 480w, /images/shows/design-system-680.webp 680w');
      img.setAttribute('imagesizes', '(max-width: 768px) 92vw, (max-width: 1280px) 46vw, 292px');
      img.type = 'image/webp';
      img.fetchPriority = 'high';
      document.head.appendChild(img);
    }
  } catch (e) {}
})();
</script>`

        let output = html
        output = output.replace(/<link\s+[^>]*rel="modulepreload"[^>]*motion[^>]*>\s*/gi, '')
        output = output.replace(/<link\s+[^>]*href="[^"]*motion-[^"]+\.js"[^>]*>\s*/gi, '')
        output = output.replace(
          /<link\s+[^>]*rel="preload"[^>]*as="image"[^>]*design-system[^>]*>\s*/gi,
          ''
        )
        output = output.replace(/<link\s+[^>]*rel="modulepreload"[^>]*>\s*/gi, '')
        output = output.replace(
          /<link\s+[^>]*rel="preload"[^>]*as="style"[^>]*\/assets\/[^"]+\.css"[^>]*>\s*(?!.*onload)/gi,
          ''
        )

        const inject = `${earlyLinks.join('\n      ')}\n      ${routePreloadScript}`
        output = output.replace(/<head>/i, `<head>\n      ${inject}`)

        return output
      },
    },
  }
}
