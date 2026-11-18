import type { MfeHostEvent } from '../types/bookClub';

export const MFE_MANIFEST = {
  id: 'folio-circle-book-club',
  name: 'Folio Circle',
  exposes: {
    './BookClubMfe': './src/mfe/BookClubMfe.tsx',
    './supabaseClient': './src/lib/supabase.ts',
    './types': './src/types/bookClub.ts',
  },
  customEvents: [
    'folio-circle:club-changed',
    'folio-circle:discussion-created',
    'folio-circle:progress-updated',
    'folio-circle:open-library-title',
  ],
} as const;

export function emitMfeHostEvent(
  event: MfeHostEvent,
  onHostEvent?: (event: MfeHostEvent) => void
): void {
  onHostEvent?.(event);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(event.type, {
        detail: event.payload,
        bubbles: true,
        composed: true,
      })
    );
  }
}
