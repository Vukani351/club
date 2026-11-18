import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { BookClubMfe } from './BookClubMfe';
import type { MfeShellProps } from '../types/bookClub';

export { BookClubMfe, BookClubMfe as default } from './BookClubMfe';
export { MFE_MANIFEST, emitMfeHostEvent } from './mfeContract';
export { getSupabaseClient, createBookClubSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
export type * from '../types/bookClub';

/**
 * Imperative mount helper for non-React or vanilla Vite Library Shell hosts.
 */
export function mountBookClubMfe(
  container: HTMLElement,
  props: MfeShellProps = {}
): { unmount: () => void; update: (nextProps: MfeShellProps) => void } {
  const root: Root = createRoot(container);
  root.render(createElement(BookClubMfe, props));

  return {
    update: (nextProps: MfeShellProps) => {
      root.render(createElement(BookClubMfe, props ? { ...props, ...nextProps } : nextProps));
    },
    unmount: () => {
      root.unmount();
    },
  };
}
