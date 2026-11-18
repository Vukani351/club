import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient, type Database } from '../lib/supabase';
import type {
  BackendMode,
  BookClub,
  BookClubSnapshot,
  ChapterDiscussion,
  ClubBook,
  ClubMember,
  DiscussionMessage,
  ReadingLog,
  ReadingStatus,
  UserProfile,
} from '../types/bookClub';

export interface RepositoryCallbacks {
  onSnapshot?: (snapshot: BookClubSnapshot) => void;
  onProfileUpserted?: (profile: UserProfile) => void;
  onClubCreated?: (payload: { club: BookClub; member: ClubMember; book?: ClubBook | null }) => void;
  onMemberJoined?: (payload: { club?: BookClub; member: ClubMember }) => void;
  onBookAdded?: (book: ClubBook) => void;
  onDiscussionCreated?: (discussion: ChapterDiscussion) => void;
  onMessageCreated?: (message: DiscussionMessage) => void;
  onReadingLogUpdated?: (log: ReadingLog) => void;
  onConnectionChange?: (connected: boolean) => void;
}

const STORAGE_KEY = 'folio-circle-mfe-snapshot-v1';
const CHANNEL_NAME = 'folio-circle-mfe-sync';

function createInitialSnapshot(): BookClubSnapshot {
  return {
    profiles: [
      {
        id: 'user-elena',
        displayName: 'Elena Vance',
        handle: 'elena_v',
        avatarColor: '#1E3A8A',
        bio: 'Curator of botanical fiction and architectural memoirs.',
      },
      {
        id: 'user-marcus',
        displayName: 'Marcus Chen',
        handle: 'mchen_reads',
        avatarColor: '#14532D',
        bio: 'Slow-reading translated novels and maritime history.',
      },
      {
        id: 'user-sora',
        displayName: 'Sora Takahashi',
        handle: 'sora_t',
        avatarColor: '#78350F',
        bio: 'Annotation enthusiast and weekend astronomy reader.',
      },
      {
        id: 'user-nadia',
        displayName: 'Nadia Lindqvist',
        handle: 'nadia_l',
        avatarColor: '#4C1D95',
        bio: 'Library catalog editor and speculative fiction host.',
      },
    ],
    clubs: [
      {
        id: 'club-folio',
        name: 'The Folio Conservatory',
        slug: 'folio-conservatory',
        description:
          'A weekly reading circle exploring literary fiction, quiet mysteries, and natural history monographs.',
        inviteCode: 'FOLIO842',
        visibility: 'public',
        createdBy: 'user-elena',
        createdAt: '2026-10-14T10:00:00.000Z',
      },
      {
        id: 'club-atlas',
        name: 'Cartography & Speculative',
        slug: 'cartography-speculative',
        description:
          'Deep-dive chapter seminars on worldbuilding, archival maps, and maritime speculative literature.',
        inviteCode: 'ATLAS309',
        visibility: 'public',
        createdBy: 'user-marcus',
        createdAt: '2026-10-20T14:30:00.000Z',
      },
      {
        id: 'club-observatory',
        name: 'Midnight Observatory Readers',
        slug: 'midnight-observatory',
        description:
          'Late-evening essays and novels centered on solitude, science history, and alpine landscapes.',
        inviteCode: 'STAR917',
        visibility: 'public',
        createdBy: 'user-sora',
        createdAt: '2026-11-01T18:15:00.000Z',
      },
    ],
    members: [
      { id: 'mem-1', clubId: 'club-folio', userId: 'user-elena', role: 'host', joinedAt: '2026-10-14T10:00:00.000Z' },
      { id: 'mem-2', clubId: 'club-folio', userId: 'user-marcus', role: 'moderator', joinedAt: '2026-10-15T12:00:00.000Z' },
      { id: 'mem-3', clubId: 'club-folio', userId: 'user-sora', role: 'member', joinedAt: '2026-10-16T09:00:00.000Z' },
      { id: 'mem-4', clubId: 'club-folio', userId: 'user-nadia', role: 'member', joinedAt: '2026-10-18T16:45:00.000Z' },
      { id: 'mem-5', clubId: 'club-atlas', userId: 'user-marcus', role: 'host', joinedAt: '2026-10-20T14:30:00.000Z' },
      { id: 'mem-6', clubId: 'club-atlas', userId: 'user-elena', role: 'member', joinedAt: '2026-10-21T08:15:00.000Z' },
      { id: 'mem-7', clubId: 'club-atlas', userId: 'user-nadia', role: 'member', joinedAt: '2026-10-22T11:10:00.000Z' },
      { id: 'mem-8', clubId: 'club-observatory', userId: 'user-sora', role: 'host', joinedAt: '2026-11-01T18:15:00.000Z' },
      { id: 'mem-9', clubId: 'club-observatory', userId: 'user-elena', role: 'member', joinedAt: '2026-11-02T19:00:00.000Z' },
    ],
    books: [
      {
        id: 'book-conservatory',
        clubId: 'club-folio',
        externalLibraryBookId: 'lib-cat-1042',
        title: 'The Glass Conservatory',
        author: 'Clara V. Thorne',
        totalChapters: 12,
        totalPages: 348,
        coverUrl: '/src/assets/images/cover_glass_conservatory_1794924886983.jpg',
        synopsis:
          'An archivist restores a forgotten nineteenth-century botanical ironwork dome and uncovers coded marginalia left by three generations of caretakers.',
        status: 'current',
        createdBy: 'user-elena',
        createdAt: '2026-10-14T10:05:00.000Z',
      },
      {
        id: 'book-atlas',
        clubId: 'club-atlas',
        externalLibraryBookId: 'lib-cat-2088',
        title: "The Cartographer's Astrolabe",
        author: 'Henrik Lindholm',
        totalChapters: 14,
        totalPages: 412,
        coverUrl: '/src/assets/images/cover_cartographers_atlas_1794924887517.jpg',
        synopsis:
          'A hydrographer aboard an 1840 survey vessel charts phantom islands whose coordinates shift with each lunar tide.',
        status: 'current',
        createdBy: 'user-marcus',
        createdAt: '2026-10-20T14:35:00.000Z',
      },
      {
        id: 'book-observatory',
        clubId: 'club-observatory',
        externalLibraryBookId: 'lib-cat-3115',
        title: 'Letters from the Winter Observatory',
        author: 'Maren Solberg',
        totalChapters: 10,
        totalPages: 276,
        coverUrl: '/src/assets/images/cover_winter_observatory_1794924886428.jpg',
        synopsis:
          'Two astronomers stationed on opposite ridges exchange winter dispatches while tracking a comet unseen since 1759.',
        status: 'current',
        createdBy: 'user-sora',
        createdAt: '2026-11-01T18:20:00.000Z',
      },
    ],
    discussions: [
      {
        id: 'disc-ch1',
        clubId: 'club-folio',
        bookId: 'book-conservatory',
        chapterNumber: 1,
        chapterTitle: 'Ironwork and Condensation',
        title: 'Opening atmosphere and the locked ledger',
        openingPrompt:
          'How does Thorne use physical architecture in the first twenty pages to mirror the protagonist’s reticence?',
        isSpoilerGuarded: false,
        createdBy: 'user-elena',
        createdAt: '2026-10-16T14:00:00.000Z',
        updatedAt: '2026-10-18T11:20:00.000Z',
      },
      {
        id: 'disc-ch3',
        clubId: 'club-folio',
        bookId: 'book-conservatory',
        chapterNumber: 3,
        chapterTitle: 'The Wardian Cases',
        title: 'Botanical smuggling & marginalia dates',
        openingPrompt:
          'Notice the discrepancy between the 1884 shipment manifest and the pencil notes inside Case IV. Intentional red herring or forged provenance?',
        isSpoilerGuarded: false,
        createdBy: 'user-marcus',
        createdAt: '2026-10-22T17:10:00.000Z',
        updatedAt: '2026-10-24T19:05:00.000Z',
      },
      {
        id: 'disc-ch6',
        clubId: 'club-folio',
        bookId: 'book-conservatory',
        chapterNumber: 6,
        chapterTitle: 'Frost on the North Pane',
        title: 'Midpoint turn: Julian’s confession',
        openingPrompt:
          'Did Julian destroy the glasshouse blueprints to protect his sister or to conceal the endowment terms?',
        isSpoilerGuarded: true,
        createdBy: 'user-elena',
        createdAt: '2026-11-04T20:15:00.000Z',
        updatedAt: '2026-11-06T09:40:00.000Z',
      },
      {
        id: 'disc-atlas-ch1',
        clubId: 'club-atlas',
        bookId: 'book-atlas',
        chapterNumber: 1,
        chapterTitle: 'Soundings at Zero Meridian',
        title: 'Navigation instruments as narrative voice',
        openingPrompt:
          'Lindholm opens with logbook coordinates instead of character dialogue. How did that pacing land for you?',
        isSpoilerGuarded: false,
        createdBy: 'user-marcus',
        createdAt: '2026-10-23T15:00:00.000Z',
        updatedAt: '2026-10-25T10:30:00.000Z',
      },
      {
        id: 'disc-obs-ch2',
        clubId: 'club-observatory',
        bookId: 'book-observatory',
        chapterNumber: 2,
        chapterTitle: 'Brass Micrometer',
        title: 'Epistolary rhythm between the two ridges',
        openingPrompt:
          'Compare Signe’s observational precision with Henrik’s increasingly personal postscripts.',
        isSpoilerGuarded: false,
        createdBy: 'user-sora',
        createdAt: '2026-11-03T21:00:00.000Z',
        updatedAt: '2026-11-05T14:15:00.000Z',
      },
    ],
    messages: [
      {
        id: 'msg-1',
        discussionId: 'disc-ch1',
        clubId: 'club-folio',
        userId: 'user-elena',
        body: 'Welcome to Chapter 1! I loved how the conservatory feels almost amphibious on page 14—fogged glass separating the narrator from the city.',
        quoteExcerpt: 'Every pane held a bead of rain that refused to fall until noon.',
        pageReference: 14,
        replyToId: null,
        createdAt: '2026-10-16T14:05:00.000Z',
      },
      {
        id: 'msg-2',
        discussionId: 'disc-ch1',
        clubId: 'club-folio',
        userId: 'user-marcus',
        body: 'That sentence stood out to me too. The prose slows down whenever she steps inside the east wing, almost like the humidity itself changes the sentence cadence.',
        quoteExcerpt: null,
        pageReference: 15,
        replyToId: 'msg-1',
        createdAt: '2026-10-16T14:22:00.000Z',
      },
      {
        id: 'msg-3',
        discussionId: 'disc-ch1',
        clubId: 'club-folio',
        userId: 'user-sora',
        body: 'Also worth flagging the brass key missing from the custodian ring on p. 23—feels like that is going to matter around the midpoint.',
        quoteExcerpt: null,
        pageReference: 23,
        replyToId: null,
        createdAt: '2026-10-17T08:45:00.000Z',
      },
      {
        id: 'msg-4',
        discussionId: 'disc-ch3',
        clubId: 'club-folio',
        userId: 'user-marcus',
        body: 'Look closely at the ink shift in Case IV. Whoever catalogued the ferns in 1891 was writing over an erased shipping date.',
        quoteExcerpt: 'Received from Kew, twelve specimens, crate unsealed.',
        pageReference: 78,
        replyToId: null,
        createdAt: '2026-10-22T17:15:00.000Z',
      },
      {
        id: 'msg-5',
        discussionId: 'disc-ch3',
        clubId: 'club-folio',
        userId: 'user-nadia',
        body: 'Wait—did anyone else cross-reference the gardener’s initials from Chapter 2? They match the stamp on the Wardian crate!',
        quoteExcerpt: null,
        pageReference: 82,
        replyToId: 'msg-4',
        createdAt: '2026-10-23T11:30:00.000Z',
      },
      {
        id: 'msg-6',
        discussionId: 'disc-ch6',
        clubId: 'club-folio',
        userId: 'user-elena',
        body: 'Chapter 6 completely reframes the opening! Julian knowing about the endowment clause since 1912 changes every conversation in the first half.',
        quoteExcerpt: 'A blueprint is only a promise you have not yet broken.',
        pageReference: 168,
        replyToId: null,
        createdAt: '2026-11-04T20:22:00.000Z',
      },
      {
        id: 'msg-7',
        discussionId: 'disc-atlas-ch1',
        clubId: 'club-atlas',
        userId: 'user-marcus',
        body: 'I appreciated how the ship log format immediately anchors the uncertainty—every measurement has a margin of error noted in the margin.',
        quoteExcerpt: null,
        pageReference: 9,
        replyToId: null,
        createdAt: '2026-10-23T15:12:00.000Z',
      },
      {
        id: 'msg-8',
        discussionId: 'disc-obs-ch2',
        clubId: 'club-observatory',
        userId: 'user-sora',
        body: 'The barometer readings at the top of each letter subtly track their emotional distance as the storm closes the pass.',
        quoteExcerpt: null,
        pageReference: 44,
        replyToId: null,
        createdAt: '2026-11-03T21:14:00.000Z',
      },
    ],
    readingLogs: [
      {
        id: 'log-1',
        clubId: 'club-folio',
        bookId: 'book-conservatory',
        userId: 'user-elena',
        currentChapter: 8,
        currentPage: 234,
        percentComplete: 67.2,
        status: 'caught_up',
        notes: 'Pacing through Part II; loving the winter greenhouse scenes.',
        updatedAt: '2026-11-15T19:00:00.000Z',
      },
      {
        id: 'log-2',
        clubId: 'club-folio',
        bookId: 'book-conservatory',
        userId: 'user-marcus',
        currentChapter: 7,
        currentPage: 198,
        percentComplete: 56.9,
        status: 'reading',
        notes: 'Annotating the provenance timeline as I go.',
        updatedAt: '2026-11-14T21:30:00.000Z',
      },
      {
        id: 'log-3',
        clubId: 'club-folio',
        bookId: 'book-conservatory',
        userId: 'user-sora',
        currentChapter: 5,
        currentPage: 142,
        percentComplete: 40.8,
        status: 'reading',
        notes: 'Catching up this weekend before Ch. 6 thread.',
        updatedAt: '2026-11-13T17:45:00.000Z',
      },
      {
        id: 'log-4',
        clubId: 'club-folio',
        bookId: 'book-conservatory',
        userId: 'user-nadia',
        currentChapter: 12,
        currentPage: 348,
        percentComplete: 100,
        status: 'finished',
        notes: 'Finished! Avoiding spoilers in earlier chapter threads.',
        updatedAt: '2026-11-16T09:15:00.000Z',
      },
      {
        id: 'log-5',
        clubId: 'club-atlas',
        bookId: 'book-atlas',
        userId: 'user-marcus',
        currentChapter: 6,
        currentPage: 174,
        percentComplete: 42.2,
        status: 'reading',
        notes: 'Charting the meridian crossings.',
        updatedAt: '2026-11-12T10:00:00.000Z',
      },
      {
        id: 'log-6',
        clubId: 'club-atlas',
        bookId: 'book-atlas',
        userId: 'user-elena',
        currentChapter: 4,
        currentPage: 112,
        percentComplete: 27.2,
        status: 'reading',
        notes: 'Just reached the archipelago sequence.',
        updatedAt: '2026-11-11T15:40:00.000Z',
      },
      {
        id: 'log-7',
        clubId: 'club-observatory',
        bookId: 'book-observatory',
        userId: 'user-sora',
        currentChapter: 4,
        currentPage: 108,
        percentComplete: 39.1,
        status: 'reading',
        notes: 'Reading two letters per evening.',
        updatedAt: '2026-11-15T22:00:00.000Z',
      },
    ],
  };
}

function readLocalSnapshot(): BookClubSnapshot {
  if (typeof window === 'undefined') return createInitialSnapshot();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = createInitialSnapshot();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as BookClubSnapshot;
  } catch {
    return createInitialSnapshot();
  }
}

function writeLocalSnapshot(snapshot: BookClubSnapshot): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore storage quota errors
  }
}

function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function mapProfileRow(row: Database['public']['Tables']['profiles']['Row']): UserProfile {
  return {
    id: row.id,
    displayName: row.display_name,
    handle: row.handle,
    avatarColor: row.avatar_color,
    bio: row.bio,
  };
}

function mapClubRow(row: Database['public']['Tables']['book_clubs']['Row']): BookClub {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    inviteCode: row.invite_code,
    visibility: row.visibility,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

function mapMemberRow(row: Database['public']['Tables']['club_members']['Row']): ClubMember {
  return {
    id: row.id,
    clubId: row.club_id,
    userId: row.user_id,
    role: row.role,
    joinedAt: row.joined_at,
  };
}

function mapBookRow(row: Database['public']['Tables']['club_books']['Row']): ClubBook {
  return {
    id: row.id,
    clubId: row.club_id,
    externalLibraryBookId: row.external_library_book_id,
    title: row.title,
    author: row.author,
    totalChapters: row.total_chapters,
    totalPages: row.total_pages,
    coverUrl: row.cover_url,
    synopsis: row.synopsis,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

function mapDiscussionRow(row: Database['public']['Tables']['chapter_discussions']['Row']): ChapterDiscussion {
  return {
    id: row.id,
    clubId: row.club_id,
    bookId: row.book_id,
    chapterNumber: row.chapter_number,
    chapterTitle: row.chapter_title,
    title: row.title,
    openingPrompt: row.opening_prompt,
    isSpoilerGuarded: row.is_spoiler_guarded,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMessageRow(row: Database['public']['Tables']['discussion_messages']['Row']): DiscussionMessage {
  return {
    id: row.id,
    discussionId: row.discussion_id,
    clubId: row.club_id,
    userId: row.user_id,
    body: row.body,
    quoteExcerpt: row.quote_excerpt,
    pageReference: row.page_reference,
    replyToId: row.reply_to_id,
    createdAt: row.created_at,
  };
}

function mapLogRow(row: Database['public']['Tables']['reading_logs']['Row']): ReadingLog {
  return {
    id: row.id,
    clubId: row.club_id,
    bookId: row.book_id,
    userId: row.user_id,
    currentChapter: row.current_chapter,
    currentPage: row.current_page,
    percentComplete: Number(row.percent_complete),
    status: row.status,
    notes: row.notes,
    updatedAt: row.updated_at,
  };
}

export class BookClubRepository {
  private supabase: SupabaseClient<Database> | null;
  private realtimeChannel: RealtimeChannel | null = null;
  private broadcastChannel: BroadcastChannel | null = null;

  constructor(injectedSupabase?: unknown) {
    this.supabase = (injectedSupabase as SupabaseClient<Database> | undefined) || getSupabaseClient();
    if (!this.supabase && typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
    }
  }

  public getMode(): BackendMode {
    return this.supabase ? 'supabase' : 'local_preview';
  }

  public getSupabase(): SupabaseClient<Database> | null {
    return this.supabase;
  }

  private emitLocalEvent(type: string, payload: unknown): void {
    this.broadcastChannel?.postMessage({ type, payload });
  }

  public async fetchSnapshot(): Promise<BookClubSnapshot> {
    if (this.supabase) {
      const [profilesRes, clubsRes, membersRes, booksRes, discussionsRes, messagesRes, logsRes] =
        await Promise.all([
          this.supabase.from('profiles').select('*'),
          this.supabase.from('book_clubs').select('*').order('created_at', { ascending: false }),
          this.supabase.from('club_members').select('*'),
          this.supabase.from('club_books').select('*').order('created_at', { ascending: false }),
          this.supabase.from('chapter_discussions').select('*').order('chapter_number', { ascending: true }),
          this.supabase.from('discussion_messages').select('*').order('created_at', { ascending: true }),
          this.supabase.from('reading_logs').select('*'),
        ]);

      if (clubsRes.error) throw clubsRes.error;

      return {
        profiles: (profilesRes.data || []).map(mapProfileRow),
        clubs: (clubsRes.data || []).map(mapClubRow),
        members: (membersRes.data || []).map(mapMemberRow),
        books: (booksRes.data || []).map(mapBookRow),
        discussions: (discussionsRes.data || []).map(mapDiscussionRow),
        messages: (messagesRes.data || []).map(mapMessageRow),
        readingLogs: (logsRes.data || []).map(mapLogRow),
      };
    }

    return readLocalSnapshot();
  }

  public subscribe(callbacks: RepositoryCallbacks): () => void {
    if (this.supabase) {
      const channel = this.supabase
        .channel('folio-circle-realtime')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'chapter_discussions' },
          (payload) => {
            callbacks.onDiscussionCreated?.(
              mapDiscussionRow(payload.new as Database['public']['Tables']['chapter_discussions']['Row'])
            );
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'discussion_messages' },
          (payload) => {
            callbacks.onMessageCreated?.(
              mapMessageRow(payload.new as Database['public']['Tables']['discussion_messages']['Row'])
            );
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'reading_logs' },
          (payload) => {
            if (payload.new) {
              callbacks.onReadingLogUpdated?.(
                mapLogRow(payload.new as Database['public']['Tables']['reading_logs']['Row'])
              );
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'club_members' },
          (payload) => {
            callbacks.onMemberJoined?.({
              member: mapMemberRow(payload.new as Database['public']['Tables']['club_members']['Row']),
            });
          }
        )
        .subscribe((status) => {
          callbacks.onConnectionChange?.(status === 'SUBSCRIBED');
        });

      this.realtimeChannel = channel;
      return () => {
        if (this.realtimeChannel && this.supabase) {
          void this.supabase.removeChannel(this.realtimeChannel);
        }
      };
    }

    // Pure-Vite multi-tab browser synchronization via BroadcastChannel
    callbacks.onConnectionChange?.(true);
    const bc = this.broadcastChannel;
    if (!bc) return () => {};

    const handleMessage = (event: MessageEvent<{ type: string; payload: unknown }>) => {
      const { type, payload } = event.data || {};
      switch (type) {
        case 'profile:upserted':
          callbacks.onProfileUpserted?.(payload as UserProfile);
          break;
        case 'club:created':
          callbacks.onClubCreated?.(payload as { club: BookClub; member: ClubMember; book?: ClubBook | null });
          break;
        case 'member:joined':
          callbacks.onMemberJoined?.(payload as { club?: BookClub; member: ClubMember });
          break;
        case 'book:added':
          callbacks.onBookAdded?.(payload as ClubBook);
          break;
        case 'discussion:created':
          callbacks.onDiscussionCreated?.(payload as ChapterDiscussion);
          break;
        case 'message:created':
          callbacks.onMessageCreated?.(payload as DiscussionMessage);
          break;
        case 'reading_log:updated':
          callbacks.onReadingLogUpdated?.(payload as ReadingLog);
          break;
        default:
          break;
      }
    };

    bc.addEventListener('message', handleMessage);
    return () => {
      bc.removeEventListener('message', handleMessage);
    };
  }

  public async upsertProfile(input: {
    id?: string;
    displayName: string;
    handle?: string;
    avatarColor?: string;
    bio?: string;
  }): Promise<UserProfile> {
    if (this.supabase) {
      if (!input.id) throw new Error('Authenticated user ID required for Supabase profile');
      const { data, error } = await this.supabase
        .from('profiles')
        .upsert({
          id: input.id,
          display_name: input.displayName,
          handle: input.handle || input.displayName.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
          avatar_color: input.avatarColor || '#1E3A8A',
          bio: input.bio || '',
        })
        .select()
        .single();
      if (error) throw error;
      return mapProfileRow(data);
    }

    const snap = readLocalSnapshot();
    const existing = input.id ? snap.profiles.find((p) => p.id === input.id) : undefined;
    if (existing) {
      existing.displayName = input.displayName.trim();
      if (input.handle?.trim()) existing.handle = input.handle.trim();
      if (input.avatarColor) existing.avatarColor = input.avatarColor;
      if (input.bio !== undefined) existing.bio = input.bio;
      writeLocalSnapshot(snap);
      this.emitLocalEvent('profile:upserted', existing);
      return existing;
    }

    const created: UserProfile = {
      id: input.id || generateId('user'),
      displayName: input.displayName.trim(),
      handle:
        input.handle?.trim() ||
        input.displayName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_') + '_' + Math.floor(Math.random() * 90 + 10),
      avatarColor: input.avatarColor || '#1E3A8A',
      bio: input.bio || '',
    };
    snap.profiles.push(created);
    writeLocalSnapshot(snap);
    this.emitLocalEvent('profile:upserted', created);
    return created;
  }

  public async createClub(input: {
    name: string;
    description: string;
    visibility: 'public' | 'private';
    createdBy: string;
    initialBook?: {
      title: string;
      author: string;
      totalChapters: number;
      totalPages: number;
      coverUrl?: string;
      externalLibraryBookId?: string;
    };
  }): Promise<{ club: BookClub; member: ClubMember; book?: ClubBook | null }> {
    if (this.supabase) {
      const slug = `${input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).slice(2, 6)}`;
      const { data: clubRow, error: clubErr } = await this.supabase
        .from('book_clubs')
        .insert({
          name: input.name,
          slug,
          description: input.description,
          visibility: input.visibility,
          created_by: input.createdBy,
        })
        .select()
        .single();
      if (clubErr) throw clubErr;

      const { data: memRow, error: memErr } = await this.supabase
        .from('club_members')
        .insert({ club_id: clubRow.id, user_id: input.createdBy, role: 'host' })
        .select()
        .single();
      if (memErr) throw memErr;

      let book: ClubBook | null = null;
      if (input.initialBook?.title.trim()) {
        const { data: bookRow, error: bookErr } = await this.supabase
          .from('club_books')
          .insert({
            club_id: clubRow.id,
            title: input.initialBook.title,
            author: input.initialBook.author,
            total_chapters: input.initialBook.totalChapters,
            total_pages: input.initialBook.totalPages,
            cover_url: input.initialBook.coverUrl || null,
            external_library_book_id: input.initialBook.externalLibraryBookId || null,
            status: 'current',
            created_by: input.createdBy,
          })
          .select()
          .single();
        if (bookErr) throw bookErr;
        book = mapBookRow(bookRow);
      }

      return {
        club: mapClubRow(clubRow),
        member: mapMemberRow(memRow),
        book,
      };
    }

    const snap = readLocalSnapshot();
    const now = new Date().toISOString();
    const club: BookClub = {
      id: generateId('club'),
      name: input.name.trim(),
      slug: `${input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).slice(2, 6)}`,
      description: input.description.trim() || 'A collaborative reading circle.',
      inviteCode: Math.random().toString(36).slice(2, 10).toUpperCase(),
      visibility: input.visibility,
      createdBy: input.createdBy,
      createdAt: now,
    };
    const member: ClubMember = {
      id: generateId('mem'),
      clubId: club.id,
      userId: input.createdBy,
      role: 'host',
      joinedAt: now,
    };
    let book: ClubBook | null = null;
    if (input.initialBook?.title.trim()) {
      book = {
        id: generateId('book'),
        clubId: club.id,
        externalLibraryBookId: input.initialBook.externalLibraryBookId || null,
        title: input.initialBook.title.trim(),
        author: input.initialBook.author.trim() || 'Unknown Author',
        totalChapters: Math.max(1, Number(input.initialBook.totalChapters) || 12),
        totalPages: Math.max(1, Number(input.initialBook.totalPages) || 320),
        coverUrl: input.initialBook.coverUrl || null,
        synopsis: '',
        status: 'current',
        createdBy: input.createdBy,
        createdAt: now,
      };
      snap.books.unshift(book);
    }

    snap.clubs.unshift(club);
    snap.members.push(member);
    writeLocalSnapshot(snap);
    this.emitLocalEvent('club:created', { club, member, book });
    return { club, member, book };
  }

  public async joinClub(input: {
    inviteCode?: string;
    clubId?: string;
    userId: string;
  }): Promise<{ club: BookClub; member: ClubMember }> {
    if (this.supabase) {
      let query = this.supabase.from('book_clubs').select('*');
      if (input.clubId) {
        query = query.eq('id', input.clubId);
      } else if (input.inviteCode) {
        query = query.eq('invite_code', input.inviteCode.trim().toUpperCase());
      }
      const { data: clubRow, error: clubErr } = await query.single();
      if (clubErr) throw clubErr;

      const { data: memRow, error: memErr } = await this.supabase
        .from('club_members')
        .upsert(
          { club_id: clubRow.id, user_id: input.userId, role: 'member' },
          { onConflict: 'club_id,user_id' }
        )
        .select()
        .single();
      if (memErr) throw memErr;

      return { club: mapClubRow(clubRow), member: mapMemberRow(memRow) };
    }

    const snap = readLocalSnapshot();
    const club = input.clubId
      ? snap.clubs.find((c) => c.id === input.clubId)
      : snap.clubs.find((c) => c.inviteCode.toUpperCase() === (input.inviteCode || '').trim().toUpperCase());

    if (!club) {
      throw new Error('No matching book club found for that invite code');
    }

    const existing = snap.members.find((m) => m.clubId === club.id && m.userId === input.userId);
    if (existing) return { club, member: existing };

    const member: ClubMember = {
      id: generateId('mem'),
      clubId: club.id,
      userId: input.userId,
      role: 'member',
      joinedAt: new Date().toISOString(),
    };
    snap.members.push(member);
    writeLocalSnapshot(snap);
    this.emitLocalEvent('member:joined', { club, member });
    return { club, member };
  }

  public async addBook(input: {
    clubId: string;
    title: string;
    author: string;
    totalChapters: number;
    totalPages: number;
    coverUrl?: string;
    synopsis?: string;
    status?: 'current' | 'upcoming' | 'completed';
    externalLibraryBookId?: string;
    createdBy: string;
  }): Promise<ClubBook> {
    if (this.supabase) {
      if (input.status === 'current' || !input.status) {
        await this.supabase
          .from('club_books')
          .update({ status: 'completed' })
          .eq('club_id', input.clubId)
          .eq('status', 'current');
      }
      const { data, error } = await this.supabase
        .from('club_books')
        .insert({
          club_id: input.clubId,
          title: input.title,
          author: input.author,
          total_chapters: input.totalChapters,
          total_pages: input.totalPages,
          cover_url: input.coverUrl || null,
          synopsis: input.synopsis || '',
          status: input.status || 'current',
          external_library_book_id: input.externalLibraryBookId || null,
          created_by: input.createdBy,
        })
        .select()
        .single();
      if (error) throw error;
      return mapBookRow(data);
    }

    const snap = readLocalSnapshot();
    if (input.status === 'current' || !input.status) {
      snap.books.forEach((b) => {
        if (b.clubId === input.clubId && b.status === 'current') {
          b.status = 'completed';
        }
      });
    }
    const book: ClubBook = {
      id: generateId('book'),
      clubId: input.clubId,
      externalLibraryBookId: input.externalLibraryBookId || null,
      title: input.title.trim(),
      author: input.author.trim(),
      totalChapters: Math.max(1, Number(input.totalChapters) || 12),
      totalPages: Math.max(1, Number(input.totalPages) || 300),
      coverUrl: input.coverUrl || null,
      synopsis: input.synopsis?.trim() || '',
      status: input.status || 'current',
      createdBy: input.createdBy,
      createdAt: new Date().toISOString(),
    };
    snap.books.unshift(book);
    writeLocalSnapshot(snap);
    this.emitLocalEvent('book:added', book);
    return book;
  }

  public async createChapterDiscussion(input: {
    clubId: string;
    bookId: string;
    chapterNumber: number;
    chapterTitle: string;
    title: string;
    openingPrompt: string;
    isSpoilerGuarded: boolean;
    createdBy: string;
  }): Promise<ChapterDiscussion> {
    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('chapter_discussions')
        .insert({
          club_id: input.clubId,
          book_id: input.bookId,
          chapter_number: input.chapterNumber,
          chapter_title: input.chapterTitle,
          title: input.title,
          opening_prompt: input.openingPrompt,
          is_spoiler_guarded: input.isSpoilerGuarded,
          created_by: input.createdBy,
        })
        .select()
        .single();
      if (error) throw error;
      return mapDiscussionRow(data);
    }

    const snap = readLocalSnapshot();
    const now = new Date().toISOString();
    const discussion: ChapterDiscussion = {
      id: generateId('disc'),
      clubId: input.clubId,
      bookId: input.bookId,
      chapterNumber: Math.max(1, Number(input.chapterNumber) || 1),
      chapterTitle: input.chapterTitle.trim() || `Chapter ${Number(input.chapterNumber) || 1}`,
      title: input.title.trim(),
      openingPrompt: input.openingPrompt.trim(),
      isSpoilerGuarded: input.isSpoilerGuarded,
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
    };
    snap.discussions.push(discussion);
    writeLocalSnapshot(snap);
    this.emitLocalEvent('discussion:created', discussion);
    return discussion;
  }

  public async sendMessage(input: {
    discussionId: string;
    clubId: string;
    userId: string;
    body: string;
    quoteExcerpt?: string;
    pageReference?: number;
    replyToId?: string;
  }): Promise<DiscussionMessage> {
    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('discussion_messages')
        .insert({
          discussion_id: input.discussionId,
          club_id: input.clubId,
          user_id: input.userId,
          body: input.body,
          quote_excerpt: input.quoteExcerpt || null,
          page_reference: input.pageReference || null,
          reply_to_id: input.replyToId || null,
        })
        .select()
        .single();
      if (error) throw error;
      return mapMessageRow(data);
    }

    const snap = readLocalSnapshot();
    const now = new Date().toISOString();
    const message: DiscussionMessage = {
      id: generateId('msg'),
      discussionId: input.discussionId,
      clubId: input.clubId,
      userId: input.userId,
      body: input.body.trim(),
      quoteExcerpt: input.quoteExcerpt?.trim() || null,
      pageReference: input.pageReference ? Number(input.pageReference) : null,
      replyToId: input.replyToId || null,
      createdAt: now,
    };
    snap.messages.push(message);
    const disc = snap.discussions.find((d) => d.id === input.discussionId);
    if (disc) disc.updatedAt = now;
    writeLocalSnapshot(snap);
    this.emitLocalEvent('message:created', message);
    return message;
  }

  public async upsertReadingLog(input: {
    clubId: string;
    bookId: string;
    userId: string;
    currentChapter: number;
    currentPage: number;
    percentComplete: number;
    status: ReadingStatus;
    notes: string;
  }): Promise<ReadingLog> {
    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('reading_logs')
        .upsert(
          {
            club_id: input.clubId,
            book_id: input.bookId,
            user_id: input.userId,
            current_chapter: input.currentChapter,
            current_page: input.currentPage,
            percent_complete: input.percentComplete,
            status: input.status,
            notes: input.notes,
          },
          { onConflict: 'club_id,book_id,user_id' }
        )
        .select()
        .single();
      if (error) throw error;
      return mapLogRow(data);
    }

    const snap = readLocalSnapshot();
    const now = new Date().toISOString();
    const existing = snap.readingLogs.find(
      (l) => l.clubId === input.clubId && l.bookId === input.bookId && l.userId === input.userId
    );
    if (existing) {
      existing.currentChapter = input.currentChapter;
      existing.currentPage = input.currentPage;
      existing.percentComplete = Math.min(100, Math.max(0, input.percentComplete));
      existing.status = input.status;
      existing.notes = input.notes;
      existing.updatedAt = now;
      writeLocalSnapshot(snap);
      this.emitLocalEvent('reading_log:updated', existing);
      return existing;
    }

    const log: ReadingLog = {
      id: generateId('log'),
      clubId: input.clubId,
      bookId: input.bookId,
      userId: input.userId,
      currentChapter: input.currentChapter,
      currentPage: input.currentPage,
      percentComplete: Math.min(100, Math.max(0, input.percentComplete)),
      status: input.status,
      notes: input.notes,
      updatedAt: now,
    };
    snap.readingLogs.push(log);
    writeLocalSnapshot(snap);
    this.emitLocalEvent('reading_log:updated', log);
    return log;
  }
}
