import { federation } from '@module-federation/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      federation({
        name: 'folio_circle_mfe',
        filename: 'remoteEntry.js',
        manifest: true,
        dts: false,
        exposes: {
          './BookClubMfe': './src/mfe/BookClubMfe.tsx',
          './mount': './src/mfe/index.ts',
          './supabaseClient': './src/lib/supabase.ts',
          './types': './src/types/bookClub.ts',
        },
        shared: {
          react: { singleton: true },
          'react-dom': { singleton: true },
          '@mui/material': { singleton: true },
          '@emotion/react': { singleton: true },
          '@emotion/styled': { singleton: true },
          '@supabase/supabase-js': { singleton: true },
        },
      }),
      // Copies src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." still resolve in production builds.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(import.meta.dirname, 'dist');
          const srcAssets = path.resolve(import.meta.dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, { recursive: true, force: true });
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    build: {
      target: 'esnext',
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      cors: true,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    preview: {
      port: 3000,
      host: '0.0.0.0',
      cors: true,
    },
  };
});
