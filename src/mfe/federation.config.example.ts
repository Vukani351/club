/**
 * Ready-to-use @module-federation/vite configuration for your parent
 * Library Shell application consuming Folio Circle.
 *
 * Remote entry emitted by this MFE:
 *   /remoteEntry.js  (name: "folio_circle_mfe")
 *
 * Exposed modules:
 *   - folio_circle_mfe/BookClubMfe   (React component - default & named export)
 *   - folio_circle_mfe/mount         (Imperative mountBookClubMfe helper)
 *   - folio_circle_mfe/supabaseClient
 *   - folio_circle_mfe/types
 */
export const FEDERATION_SNIPPET = `// 1. In your Library Shell's vite.config.ts:
import { federation } from '@module-federation/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'library_shell',
      remotes: {
        folio_circle_mfe: {
          type: 'module',
          name: 'folio_circle_mfe',
          entry: 'http://localhost:3000/remoteEntry.js',
        },
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
  ],
});

// 2. Inside a route or drawer in your Library Shell:
import React, { Suspense } from 'react';
import { Box, Typography } from '@mui/material';
import { supabase } from '@/lib/supabase';

const BookClubMfe = React.lazy(() => import('folio_circle_mfe/BookClubMfe'));

export function LibraryBookClubPage({ user, activeCatalogBook }: any) {
  return (
    <Suspense fallback={<Box sx={{ p: 4 }}><Typography>Loading Book Club…</Typography></Box>}>
      <BookClubMfe
        shellUser={{ id: user.id, displayName: user.name }}
        supabaseClient={supabase}
        initialLibraryBook={activeCatalogBook}
        onHostEvent={(event) => {
          if (event.type === 'folio-circle:open-library-title') {
            console.log('Navigate in shell to book:', event.payload.externalLibraryBookId);
          }
        }}
      />
    </Suspense>
  );
}`;
