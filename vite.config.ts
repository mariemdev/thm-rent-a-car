import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      // Disable HMR for production to avoid WebSocket errors
      hmr: process.env.NODE_ENV === 'production' ? false : process.env.DISABLE_HMR !== 'true',
      allowedHosts: ['thmrentcar.com', 'www.thmrentcar.com']
    },
  };
});
