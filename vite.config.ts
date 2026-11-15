import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';

function singleFileHtmlPlugin(): Plugin {
  return {
    name: 'single-file-html',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const htmlAsset = bundle['index.html'];
      if (!htmlAsset || htmlAsset.type !== 'asset') return;

      let html = String(htmlAsset.source);
      const cssToRemove: string[] = [];
      const jsToRemove: string[] = [];

      for (const [fileName, item] of Object.entries(bundle)) {
        if (item.type === 'asset' && fileName.endsWith('.css')) {
          const escapedName = fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const linkRegex = new RegExp(
            `<link[^>]*href=["'][^"']*${escapedName}["'][^>]*>`,
            'gi',
          );
          if (linkRegex.test(html)) {
            const cssText = String(item.source);
            html = html.replace(linkRegex, () => `<style>${cssText}</style>`);
            cssToRemove.push(fileName);
          }
        } else if (item.type === 'chunk' && item.isEntry && fileName.endsWith('.js')) {
          const escapedName = fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const scriptRegex = new RegExp(
            `<script[^>]*src=["'][^"']*${escapedName}["'][^>]*>\\s*</script>`,
            'gi',
          );
          if (scriptRegex.test(html)) {
            const safeJs = item.code.replace(/<\/script/gi, '<\\/script');
            html = html.replace(
              scriptRegex,
              () => `<script type="module">${safeJs}</script>`,
            );
            jsToRemove.push(fileName);
          }
        }
      }

      for (const name of [...cssToRemove, ...jsToRemove]) {
        delete bundle[name];
      }
      htmlAsset.source = html;
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), singleFileHtmlPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname ?? process.cwd(), '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
