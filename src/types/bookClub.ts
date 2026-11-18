export type MemberRole = 'host' | 'moderator' | 'member';
export type BookStatus = 'current' | 'upcoming' | 'completed';
export type ReadingStatus = 'not_started' | 'reading' | 'caught_up' | 'finished';
export type ClubVisibility = 'public' | 'private';
export type BackendMode = 'supabase' | 'local_preview';

export interface UserProfile {
  id: string;
  displayName: string;
  handle: string;
  avatarColor: string;
  bio?: string;
}

export interface BookClub {
  id: string;
  name: string;
  slug: string;
  description: string;
  inviteCode: string;
  visibility: ClubVisibility;
  createdBy: string;
  createdAt: string;
}

export interface ClubMember {
  id: string;
  clubId: string;
  userId: string;
  role: MemberRole;
  joinedAt: string;
}

export interface ClubBook {
  id: string;
  clubId: string;
  externalLibraryBookId?: string | null;
  title: string;
  author: string;
  totalChapters: number;
  totalPages: number;
  coverUrl?: string | null;
  synopsis?: string;
  status: BookStatus;
  createdBy: string;
  createdAt: string;
}

export interface ChapterDiscussion {
  id: string;
  clubId: string;
  bookId: string;
  chapterNumber: number;
  chapterTitle: string;
  title: string;
  openingPrompt: string;
  isSpoilerGuarded: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DiscussionMessage {
  id: string;
  discussionId: string;
  clubId: string;
  userId: string;
  body: string;
  quoteExcerpt?: string | null;
  pageReference?: number | null;
  replyToId?: string | null;
  createdAt: string;
}

export interface ReadingLog {
  id: string;
  clubId: string;
  bookId: string;
  userId: string;
  currentChapter: number;
  currentPage: number;
  percentComplete: number;
  status: ReadingStatus;
  notes: string;
  updatedAt: string;
}

export interface BookClubSnapshot {
  profiles: UserProfile[];
  clubs: BookClub[];
  members: ClubMember[];
  books: ClubBook[];
  discussions: ChapterDiscussion[];
  messages: DiscussionMessage[];
  readingLogs: ReadingLog[];
}

export type MfeWorkspaceTab = 'discussions' | 'progress' | 'directory' | 'config';

export interface MfeShellUser {
  id: string;
  displayName: string;
  handle?: string;
  avatarColor?: string;
}

export type MfeHostEvent =
  | { type: 'folio-circle:club-changed'; payload: { clubId: string; clubName: string } }
  | { type: 'folio-circle:discussion-created'; payload: { discussion: ChapterDiscussion } }
  | { type: 'folio-circle:progress-updated'; payload: { readingLog: ReadingLog } }
  | { type: 'folio-circle:open-library-title'; payload: { externalLibraryBookId: string; title: string } };

export interface MfeShellProps {
  /** Authenticated user passed down from the parent Library Shell */
  shellUser?: MfeShellUser;
  /** Optional pre-configured Supabase client shared by the host shell */
  supabaseClient?: unknown;
  /** Initial club ID when deep-linking from the Library Shell */
  initialClubId?: string;
  /** Initial library book ID to pre-select or start a club from */
  initialLibraryBook?: {
    id: string;
    title: string;
    author: string;
    totalChapters: number;
    totalPages: number;
    coverUrl?: string;
  };
  /** When true, adapts header spacing for embedding inside a host shell frame */
  embedded?: boolean;
  /** Callback to emit MFE lifecycle and domain events to the host shell */
  onHostEvent?: (event: MfeHostEvent) => void;
}
