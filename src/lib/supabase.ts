import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          handle: string;
          avatar_color: string;
          bio: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          handle: string;
          avatar_color?: string;
          bio?: string;
        };
        Update: {
          display_name?: string;
          handle?: string;
          avatar_color?: string;
          bio?: string;
        };
        Relationships: [];
      };
      book_clubs: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string;
          invite_code: string;
          visibility: 'public' | 'private';
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string;
          invite_code?: string;
          visibility?: 'public' | 'private';
          created_by: string;
        };
        Update: {
          name?: string;
          description?: string;
          visibility?: 'public' | 'private';
        };
        Relationships: [];
      };
      club_members: {
        Row: {
          id: string;
          club_id: string;
          user_id: string;
          role: 'host' | 'moderator' | 'member';
          joined_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          user_id: string;
          role?: 'host' | 'moderator' | 'member';
        };
        Update: {
          role?: 'host' | 'moderator' | 'member';
        };
        Relationships: [];
      };
      club_books: {
        Row: {
          id: string;
          club_id: string;
          external_library_book_id: string | null;
          title: string;
          author: string;
          total_chapters: number;
          total_pages: number;
          cover_url: string | null;
          synopsis: string;
          status: 'current' | 'upcoming' | 'completed';
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          external_library_book_id?: string | null;
          title: string;
          author: string;
          total_chapters: number;
          total_pages: number;
          cover_url?: string | null;
          synopsis?: string;
          status?: 'current' | 'upcoming' | 'completed';
          created_by: string;
        };
        Update: {
          status?: 'current' | 'upcoming' | 'completed';
          title?: string;
          author?: string;
        };
        Relationships: [];
      };
      chapter_discussions: {
        Row: {
          id: string;
          club_id: string;
          book_id: string;
          chapter_number: number;
          chapter_title: string;
          title: string;
          opening_prompt: string;
          is_spoiler_guarded: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          book_id: string;
          chapter_number: number;
          chapter_title?: string;
          title: string;
          opening_prompt?: string;
          is_spoiler_guarded?: boolean;
          created_by: string;
        };
        Update: {
          title?: string;
          opening_prompt?: string;
          is_spoiler_guarded?: boolean;
        };
        Relationships: [];
      };
      discussion_messages: {
        Row: {
          id: string;
          discussion_id: string;
          club_id: string;
          user_id: string;
          body: string;
          quote_excerpt: string | null;
          page_reference: number | null;
          reply_to_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          discussion_id: string;
          club_id: string;
          user_id: string;
          body: string;
          quote_excerpt?: string | null;
          page_reference?: number | null;
          reply_to_id?: string | null;
        };
        Update: {
          body?: string;
        };
        Relationships: [];
      };
      reading_logs: {
        Row: {
          id: string;
          club_id: string;
          book_id: string;
          user_id: string;
          current_chapter: number;
          current_page: number;
          percent_complete: number;
          status: 'not_started' | 'reading' | 'caught_up' | 'finished';
          notes: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          book_id: string;
          user_id: string;
          current_chapter: number;
          current_page: number;
          percent_complete: number;
          status: 'not_started' | 'reading' | 'caught_up' | 'finished';
          notes?: string;
        };
        Update: {
          current_chapter?: number;
          current_page?: number;
          percent_complete?: number;
          status?: 'not_started' | 'reading' | 'caught_up' | 'finished';
          notes?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      !supabaseUrl.includes('your-project-ref') &&
      !supabaseAnonKey.includes('your-supabase-anon-key') &&
      supabaseUrl.startsWith('https://')
  );
}

let cachedClient: SupabaseClient<Database> | null = null;

export function createBookClubSupabaseClient(
  url?: string,
  anonKey?: string
): SupabaseClient<Database> | null {
  const resolvedUrl = url || supabaseUrl;
  const resolvedKey = anonKey || supabaseAnonKey;
  if (!resolvedUrl || !resolvedKey || !resolvedUrl.startsWith('http')) {
    return null;
  }

  return createClient<Database>(resolvedUrl, resolvedKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'folio-circle-mfe-auth',
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
}

export function getSupabaseClient(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!cachedClient) {
    cachedClient = createBookClubSupabaseClient();
  }
  return cachedClient;
}
