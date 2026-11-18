import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppBar,
  Box,
  Button,
  CssBaseline,
  Paper,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  ThemeProvider,
  Toolbar,
  Typography,
} from '@mui/material';
import type {
  BookClubSnapshot,
  ChapterDiscussion,
  ClubBook,
  DiscussionMessage,
  MfeShellProps,
  MfeWorkspaceTab,
  ReadingLog,
  ReadingStatus,
  UserProfile,
} from '../types/bookClub';
import { folioMuiTheme } from '../theme/muiTheme';
import { BookClubRepository } from '../services/bookClubRepository';
import { emitMfeHostEvent } from './mfeContract';
import { ClubSidebar } from '../components/ClubSidebar';
import { ChapterRail } from '../components/ChapterRail';
import { ChapterChatPane } from '../components/ChapterChatPane';
import { ReadingProgressView } from '../components/ReadingProgressView';
import { ClubDirectoryView } from '../components/ClubDirectoryView';
import { SupabaseConfigView } from '../components/SupabaseConfigView';
import {
  AddBookModal,
  CreateClubModal,
  JoinClubModal,
  NewDiscussionModal,
} from '../components/Modals';

const EMPTY_SNAPSHOT: BookClubSnapshot = {
  profiles: [],
  clubs: [],
  members: [],
  books: [],
  discussions: [],
  messages: [],
  readingLogs: [],
};

export function BookClubMfe({
  shellUser,
  supabaseClient,
  initialClubId,
  initialLibraryBook,
  embedded = true,
  onHostEvent,
}: MfeShellProps) {
  const repoRef = useRef<BookClubRepository | null>(null);
  if (!repoRef.current) {
    repoRef.current = new BookClubRepository(supabaseClient);
  }
  const repo = repoRef.current;

  const [snapshot, setSnapshot] = useState<BookClubSnapshot>(EMPTY_SNAPSHOT);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  const [activeTab, setActiveTab] = useState<MfeWorkspaceTab>('discussions');
  const [activeClubId, setActiveClubId] = useState<string>(initialClubId || '');
  const [activeDiscussionId, setActiveDiscussionId] = useState<string>('');
  const [activeUserId, setActiveUserId] = useState<string>(shellUser?.id || '');

  const [showCreateClub, setShowCreateClub] = useState(false);
  const [showJoinClub, setShowJoinClub] = useState(false);
  const [showAddBook, setShowAddBook] = useState(false);
  const [showNewDiscussion, setShowNewDiscussion] = useState(false);

  useEffect(() => {
    if (!shellUser?.id) return;
    setActiveUserId(shellUser.id);
    void repo
      .upsertProfile({
        id: shellUser.id,
        displayName: shellUser.displayName,
        handle: shellUser.handle,
        avatarColor: shellUser.avatarColor,
      })
      .then((profile) => {
        setSnapshot((prev) => {
          const exists = prev.profiles.some((p) => p.id === profile.id);
          return {
            ...prev,
            profiles: exists
              ? prev.profiles.map((p) => (p.id === profile.id ? profile : p))
              : [...prev.profiles, profile],
          };
        });
      })
      .catch(() => {});
  }, [shellUser?.id, shellUser?.displayName, shellUser?.handle, shellUser?.avatarColor, repo]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setLoadError(null);

    void repo
      .fetchSnapshot()
      .then((data) => {
        if (!mounted) return;
        setSnapshot(data);
        const matchedBookClub = initialLibraryBook
          ? data.books.find(
              (b) =>
                b.externalLibraryBookId === initialLibraryBook.id ||
                b.title.toLowerCase() === initialLibraryBook.title.toLowerCase()
            )?.clubId
          : undefined;
        setActiveClubId((prev) => prev || initialClubId || matchedBookClub || data.clubs[0]?.id || '');
        setActiveUserId((prev) => prev || shellUser?.id || data.profiles[0]?.id || '');
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        setLoadError(err instanceof Error ? err.message : 'Unable to load book club data');
        setLoading(false);
      });

    const unsubscribe = repo.subscribe({
      onConnectionChange: (connected) => {
        if (mounted) setIsRealtimeConnected(connected);
      },
      onSnapshot: (snap) => {
        if (mounted) setSnapshot(snap);
      },
      onProfileUpserted: (profile) => {
        setSnapshot((prev) => {
          const exists = prev.profiles.some((p) => p.id === profile.id);
          return {
            ...prev,
            profiles: exists
              ? prev.profiles.map((p) => (p.id === profile.id ? profile : p))
              : [...prev.profiles, profile],
          };
        });
      },
      onClubCreated: ({ club, member, book }) => {
        setSnapshot((prev) => ({
          ...prev,
          clubs: prev.clubs.some((c) => c.id === club.id) ? prev.clubs : [club, ...prev.clubs],
          members: prev.members.some((m) => m.id === member.id) ? prev.members : [...prev.members, member],
          books: book && !prev.books.some((b) => b.id === book.id) ? [book, ...prev.books] : prev.books,
        }));
      },
      onMemberJoined: ({ member }) => {
        setSnapshot((prev) => ({
          ...prev,
          members: prev.members.some((m) => m.id === member.id) ? prev.members : [...prev.members, member],
        }));
      },
      onBookAdded: (book: ClubBook) => {
        setSnapshot((prev) => {
          if (prev.books.some((b) => b.id === book.id)) return prev;
          const updatedBooks =
            book.status === 'current'
              ? prev.books.map((b) =>
                  b.clubId === book.clubId && b.status === 'current' ? { ...b, status: 'completed' as const } : b
                )
              : prev.books;
          return { ...prev, books: [book, ...updatedBooks] };
        });
      },
      onDiscussionCreated: (discussion: ChapterDiscussion) => {
        setSnapshot((prev) => ({
          ...prev,
          discussions: prev.discussions.some((d) => d.id === discussion.id)
            ? prev.discussions
            : [...prev.discussions, discussion],
        }));
      },
      onMessageCreated: (message: DiscussionMessage) => {
        setSnapshot((prev) => ({
          ...prev,
          messages: prev.messages.some((m) => m.id === message.id)
            ? prev.messages
            : [...prev.messages, message],
        }));
      },
      onReadingLogUpdated: (log: ReadingLog) => {
        setSnapshot((prev) => {
          const exists = prev.readingLogs.some((l) => l.id === log.id);
          return {
            ...prev,
            readingLogs: exists
              ? prev.readingLogs.map((l) => (l.id === log.id ? log : l))
              : [...prev.readingLogs, log],
          };
        });
      },
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [repo, initialClubId, shellUser?.id]);

  const currentUser: UserProfile = useMemo(() => {
    return (
      snapshot.profiles.find((p) => p.id === activeUserId) ||
      snapshot.profiles[0] || {
        id: 'guest',
        displayName: 'Guest Reader',
        handle: 'guest',
        avatarColor: '#1E3A8A',
      }
    );
  }, [snapshot.profiles, activeUserId]);

  const activeClub = useMemo(
    () => snapshot.clubs.find((c) => c.id === activeClubId) || snapshot.clubs[0],
    [snapshot.clubs, activeClubId]
  );

  const activeBook = useMemo(() => {
    if (!activeClub) return undefined;
    return (
      snapshot.books.find((b) => b.clubId === activeClub.id && b.status === 'current') ||
      snapshot.books.find((b) => b.clubId === activeClub.id)
    );
  }, [snapshot.books, activeClub]);

  const activeBookDiscussions = useMemo(() => {
    if (!activeClub || !activeBook) return [];
    return snapshot.discussions.filter(
      (d) => d.clubId === activeClub.id && d.bookId === activeBook.id
    );
  }, [snapshot.discussions, activeClub, activeBook]);

  useEffect(() => {
    if (activeBookDiscussions.length === 0) {
      setActiveDiscussionId('');
      return;
    }
    const stillValid = activeBookDiscussions.some((d) => d.id === activeDiscussionId);
    if (!stillValid) {
      const sorted = [...activeBookDiscussions].sort((a, b) => a.chapterNumber - b.chapterNumber);
      setActiveDiscussionId(sorted[0].id);
    }
  }, [activeBookDiscussions, activeDiscussionId]);

  const activeDiscussion = useMemo(
    () => activeBookDiscussions.find((d) => d.id === activeDiscussionId),
    [activeBookDiscussions, activeDiscussionId]
  );

  const userReadingLog = useMemo(() => {
    if (!activeClub || !activeBook) return undefined;
    return snapshot.readingLogs.find(
      (l) => l.clubId === activeClub.id && l.bookId === activeBook.id && l.userId === currentUser.id
    );
  }, [snapshot.readingLogs, activeClub, activeBook, currentUser.id]);

  const handleSelectClub = useCallback(
    (clubId: string) => {
      setActiveClubId(clubId);
      const club = snapshot.clubs.find((c) => c.id === clubId);
      if (club) {
        emitMfeHostEvent(
          { type: 'folio-circle:club-changed', payload: { clubId: club.id, clubName: club.name } },
          onHostEvent
        );
      }
    },
    [snapshot.clubs, onHostEvent]
  );

  const handleCreateClub = async (input: {
    name: string;
    description: string;
    visibility: 'public' | 'private';
    initialBook?: {
      title: string;
      author: string;
      totalChapters: number;
      totalPages: number;
      coverUrl?: string;
      externalLibraryBookId?: string;
    };
  }) => {
    const result = await repo.createClub({
      ...input,
      createdBy: currentUser.id,
    });
    setSnapshot((prev) => ({
      ...prev,
      clubs: prev.clubs.some((c) => c.id === result.club.id) ? prev.clubs : [result.club, ...prev.clubs],
      members: prev.members.some((m) => m.id === result.member.id)
        ? prev.members
        : [...prev.members, result.member],
      books:
        result.book && !prev.books.some((b) => b.id === result.book!.id)
          ? [result.book, ...prev.books]
          : prev.books,
    }));
    setActiveClubId(result.club.id);
    setActiveTab('discussions');
  };

  const handleJoinByCode = async (inviteCode: string) => {
    const result = await repo.joinClub({ inviteCode, userId: currentUser.id });
    setSnapshot((prev) => ({
      ...prev,
      members: prev.members.some((m) => m.id === result.member.id)
        ? prev.members
        : [...prev.members, result.member],
    }));
    setActiveClubId(result.club.id);
    setActiveTab('discussions');
  };

  const handleJoinByClubId = async (clubId: string) => {
    const result = await repo.joinClub({ clubId, userId: currentUser.id });
    setSnapshot((prev) => ({
      ...prev,
      members: prev.members.some((m) => m.id === result.member.id)
        ? prev.members
        : [...prev.members, result.member],
    }));
  };

  const handleAddBook = async (input: {
    title: string;
    author: string;
    totalChapters: number;
    totalPages: number;
    synopsis: string;
    externalLibraryBookId?: string;
  }) => {
    if (!activeClub) return;
    const book = await repo.addBook({
      clubId: activeClub.id,
      ...input,
      status: 'current',
      createdBy: currentUser.id,
    });
    setSnapshot((prev) => {
      if (prev.books.some((b) => b.id === book.id)) return prev;
      return {
        ...prev,
        books: [
          book,
          ...prev.books.map((b) =>
            b.clubId === activeClub.id && b.status === 'current'
              ? { ...b, status: 'completed' as const }
              : b
          ),
        ],
      };
    });
  };

  const handleCreateDiscussion = async (input: {
    chapterNumber: number;
    chapterTitle: string;
    title: string;
    openingPrompt: string;
    isSpoilerGuarded: boolean;
  }) => {
    if (!activeClub || !activeBook) return;
    const discussion = await repo.createChapterDiscussion({
      clubId: activeClub.id,
      bookId: activeBook.id,
      ...input,
      createdBy: currentUser.id,
    });
    setSnapshot((prev) => ({
      ...prev,
      discussions: prev.discussions.some((d) => d.id === discussion.id)
        ? prev.discussions
        : [...prev.discussions, discussion],
    }));
    setActiveDiscussionId(discussion.id);
    emitMfeHostEvent(
      { type: 'folio-circle:discussion-created', payload: { discussion } },
      onHostEvent
    );
  };

  const handleSendMessage = async (input: {
    discussionId: string;
    body: string;
    quoteExcerpt?: string;
    pageReference?: number;
    replyToId?: string;
  }) => {
    if (!activeClub) return;
    const msg = await repo.sendMessage({
      ...input,
      clubId: activeClub.id,
      userId: currentUser.id,
    });
    setSnapshot((prev) => ({
      ...prev,
      messages: prev.messages.some((m) => m.id === msg.id) ? prev.messages : [...prev.messages, msg],
    }));
  };

  const handleSaveReadingLog = async (input: {
    clubId: string;
    bookId: string;
    currentChapter: number;
    currentPage: number;
    percentComplete: number;
    status: ReadingStatus;
    notes: string;
  }) => {
    const saved = await repo.upsertReadingLog({
      ...input,
      userId: currentUser.id,
    });
    setSnapshot((prev) => {
      const exists = prev.readingLogs.some((l) => l.id === saved.id);
      return {
        ...prev,
        readingLogs: exists
          ? prev.readingLogs.map((l) => (l.id === saved.id ? saved : l))
          : [...prev.readingLogs, saved],
      };
    });
    emitMfeHostEvent(
      { type: 'folio-circle:progress-updated', payload: { readingLog: saved } },
      onHostEvent
    );
  };

  return (
    <ThemeProvider theme={folioMuiTheme}>
      {!embedded && <CssBaseline />}
      {loading ? (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
          <Stack spacing={1.5} sx={{ width: '100%', maxWidth: 420 }}>
            <Skeleton variant="text" width={160} height={32} />
            <Skeleton variant="rounded" height={96} />
            <Skeleton variant="rounded" height={96} />
          </Stack>
        </Box>
      ) : loadError ? (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
          <Paper variant="outlined" sx={{ maxWidth: 420, p: 3, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontFamily: 'var(--font-display)' }}>
              Could not load Book Club MFE
            </Typography>
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              {loadError}
            </Typography>
            <Button variant="contained" size="small" onClick={() => window.location.reload()} sx={{ mt: 2 }}>
              Retry Connection
            </Button>
          </Paper>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.default',
            color: 'text.primary',
            height: embedded ? '100%' : { xs: 'auto', lg: '100vh' },
            minHeight: embedded ? 720 : '100vh',
            border: embedded ? '1px solid #E4E0D8' : 'none',
            borderRadius: embedded ? 2 : 0,
            overflow: embedded ? 'hidden' : 'visible',
          }}
        >
          {/* Strict 3-Zone Top Bar Contract using Material UI AppBar & Tabs */}
          <AppBar
            position="static"
            color="inherit"
            elevation={0}
            sx={{ bgcolor: '#FFFFFF', borderBottom: '1px solid #E4E0D8', flexShrink: 0 }}
          >
            <Toolbar sx={{ justifyContent: 'space-between', gap: 4, minHeight: 56, px: { xs: 2, sm: 3 } }}>
              {/* Zone 1: Brand Wordmark */}
              <Typography
                component="button"
                type="button"
                onClick={() => setActiveTab('discussions')}
                sx={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 20,
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                  color: 'text.primary',
                  background: 'none',
                  border: 'none',
                  p: 0,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                Folio Circle
              </Typography>

              {/* Zone 2: 4 concise single-line nav tabs */}
              <Tabs
                value={activeTab}
                onChange={(_e, val) => setActiveTab(val as MfeWorkspaceTab)}
                variant="scrollable"
                scrollButtons="auto"
                aria-label="Book Club Views"
                sx={{ minHeight: 48 }}
              >
                <Tab value="discussions" label="Discussions" />
                <Tab value="progress" label="Reading Progress" />
                <Tab value="directory" label="Club Directory" />
                <Tab value="config" label="Supabase Config" />
              </Tabs>

              {/* Zone 3: 1 Primary CTA */}
              <Button
                variant="contained"
                size="small"
                onClick={() => setShowCreateClub(true)}
                sx={{ flexShrink: 0 }}
              >
                New Club
              </Button>
            </Toolbar>
          </AppBar>

          {/* Main Workspace */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: { xs: 'column', lg: 'row' },
              minHeight: 0,
            }}
          >
            <ClubSidebar
              clubs={snapshot.clubs}
              members={snapshot.members}
              books={snapshot.books}
              readingLogs={snapshot.readingLogs}
              profiles={snapshot.profiles}
              activeClubId={activeClub?.id || ''}
              currentUser={currentUser}
              isShellControlled={Boolean(shellUser?.id)}
              backendMode={repo.getMode()}
              onSelectClub={handleSelectClub}
              onSwitchUser={(uid) => setActiveUserId(uid)}
              onOpenJoinModal={() => setShowJoinClub(true)}
              onOpenAddBookModal={() => setShowAddBook(true)}
              onOpenLibraryBook={(externalId, title) =>
                emitMfeHostEvent(
                  {
                    type: 'folio-circle:open-library-title',
                    payload: { externalLibraryBookId: externalId, title },
                  },
                  onHostEvent
                )
              }
              onOpenConfigTab={() => setActiveTab('config')}
            />

            {activeTab === 'discussions' && (
              <>
                <ChapterRail
                  activeBook={activeBook}
                  discussions={activeBookDiscussions}
                  messages={snapshot.messages}
                  activeDiscussionId={activeDiscussion?.id || ''}
                  onSelectDiscussion={(id) => setActiveDiscussionId(id)}
                  onOpenNewDiscussionModal={() => setShowNewDiscussion(true)}
                />
                <ChapterChatPane
                  club={activeClub}
                  book={activeBook}
                  discussion={activeDiscussion}
                  messages={snapshot.messages}
                  profiles={snapshot.profiles}
                  members={snapshot.members}
                  currentUser={currentUser}
                  userReadingLog={userReadingLog}
                  onSendMessage={handleSendMessage}
                  onOpenNewDiscussionModal={() => setShowNewDiscussion(true)}
                  onOpenProgressTab={() => setActiveTab('progress')}
                  onJoinClub={handleJoinByClubId}
                />
              </>
            )}

            {activeTab === 'progress' && (
              <ReadingProgressView
                club={activeClub}
                book={activeBook}
                members={snapshot.members}
                profiles={snapshot.profiles}
                readingLogs={snapshot.readingLogs}
                currentUser={currentUser}
                onSaveReadingLog={handleSaveReadingLog}
              />
            )}

            {activeTab === 'directory' && (
              <ClubDirectoryView
                clubs={snapshot.clubs}
                books={snapshot.books}
                members={snapshot.members}
                readingLogs={snapshot.readingLogs}
                currentUser={currentUser}
                onOpenClub={(clubId) => {
                  handleSelectClub(clubId);
                  setActiveTab('discussions');
                }}
                onJoinClub={handleJoinByClubId}
                onOpenCreateClubModal={() => setShowCreateClub(true)}
                onOpenJoinModal={() => setShowJoinClub(true)}
              />
            )}

            {activeTab === 'config' && (
              <SupabaseConfigView
                backendMode={repo.getMode()}
                isRealtimeConnected={isRealtimeConnected}
              />
            )}
          </Box>

          {showCreateClub && (
            <CreateClubModal
              initialBookDefaults={initialLibraryBook}
              onClose={() => setShowCreateClub(false)}
              onSubmit={handleCreateClub}
            />
          )}

          {showJoinClub && (
            <JoinClubModal
              onClose={() => setShowJoinClub(false)}
              onSubmit={handleJoinByCode}
            />
          )}

          {showAddBook && activeClub && (
            <AddBookModal
              clubName={activeClub.name}
              onClose={() => setShowAddBook(false)}
              onSubmit={handleAddBook}
            />
          )}

          {showNewDiscussion && activeBook && (
            <NewDiscussionModal
              book={activeBook}
              onClose={() => setShowNewDiscussion(false)}
              onSubmit={handleCreateDiscussion}
            />
          )}
        </Box>
      )}
    </ThemeProvider>
  );
}

export default BookClubMfe;
