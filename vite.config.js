import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Plugin Vite untuk menjalankan API serverless secara lokal saat npm run dev
function apiDevServerPlugin() {
  return {
    name: 'api-dev-server',
    configureServer(server) {
      // Helper polyfill res status & json
      const setupPolyfills = (res) => {
        res.status = function(code) {
          res.statusCode = code;
          return this;
        };
        res.json = function(data) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
          return this;
        };
      };

      server.middlewares.use('/api/recommend', async (req, res) => {
        try {
          const { default: handler } = await import('./api/recommend.js');
          setupPolyfills(res);
          await handler(req, res);
        } catch (err) {
          console.error('[Vite Dev API Error /api/recommend]:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Internal Server Error', details: err.message }));
        }
      });

      server.middlewares.use('/api/identify-culture', async (req, res) => {
        try {
          const { default: handler } = await import('./api/identify-culture.js');
          setupPolyfills(res);
          await handler(req, res);
        } catch (err) {
          console.error('[Vite Dev API Error /api/identify-culture]:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Internal Server Error', details: err.message }));
        }
      });
    }
  };
}

export default defineConfig({
  root: '.',
  publicDir: 'public',
  plugins: [apiDevServerPlugin()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        petualangan: resolve(__dirname, 'src/pages/petualangan.html'),
        lencana: resolve(__dirname, 'src/pages/lencana.html'),
        masuk: resolve(__dirname, 'src/pages/masuk.html'),
        onboarding: resolve(__dirname, 'src/pages/onboarding.html'),
        komponen: resolve(__dirname, 'src/pages/komponen.html'),
        kamus: resolve(__dirname, 'src/pages/kamus.html'),
        budaya: resolve(__dirname, 'src/pages/budaya.html'),
        kenaliBudaya: resolve(__dirname, 'src/pages/kenali-budaya.html'),
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
