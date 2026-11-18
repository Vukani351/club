import {
  Box,
  Button,
  Divider,
  FormControl,
  InputLabel,
  LinearProgress,
  List,
  ListItemButton,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined';
import LibraryAddOutlinedIcon from '@mui/icons-material/LibraryAddOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import type {
  BackendMode,
  BookClub,
  ClubBook,
  ClubMember,
  ReadingLog,
  UserProfile,
} from '../types/bookClub';
import { BookCover } from './BookCover';

interface ClubSidebarProps {
  clubs: BookClub[];
  members: ClubMember[];
  books: ClubBook[];
  readingLogs: ReadingLog[];
  profiles: UserProfile[];
  activeClubId: string;
  currentUser: UserProfile;
  isShellControlled?: boolean;
  backendMode: BackendMode;
  onSelectClub: (clubId: string) => void;
  onSwitchUser: (userId: string) => void;
  onOpenJoinModal: () => void;
  onOpenAddBookModal: () => void;
  onOpenLibraryBook?: (externalId: string, title: string) => void;
  onOpenConfigTab: () => void;
}

export function ClubSidebar({
  clubs,
  members,
  books,
  readingLogs,
  profiles,
  activeClubId,
  currentUser,
  isShellControlled = false,
  backendMode,
  onSelectClub,
  onSwitchUser,
  onOpenJoinModal,
  onOpenAddBookModal,
  onOpenLibraryBook,
  onOpenConfigTab,
}: ClubSidebarProps) {
  const activeClub = clubs.find((c) => c.id === activeClubId) || clubs[0];
  const activeBook =
    books.find((b) => b.clubId === activeClub?.id && b.status === 'current') ||
    books.find((b) => b.clubId === activeClub?.id);

  const clubMembers = members.filter((m) => m.clubId === activeClub?.id);
  const bookLogs = activeBook
    ? readingLogs.filter((l) => l.clubId === activeClub?.id && l.bookId === activeBook.id)
    : [];

  const avgPercent =
    bookLogs.length > 0
      ? Math.round(bookLogs.reduce((acc, log) => acc + log.percentComplete, 0) / bookLogs.length)
      : 0;

  const avgChapter =
    bookLogs.length > 0
      ? Math.round(bookLogs.reduce((acc, log) => acc + log.currentChapter, 0) / bookLogs.length)
      : 0;

  return (
    <Box
      component="aside"
      sx={{
        width: { xs: '100%', lg: 276 },
        flexShrink: 0,
        borderBottom: { xs: '1px solid #E4E0D8', lg: 'none' },
        borderRight: { lg: '1px solid #E4E0D8' },
        bgcolor: '#FBF9F5',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Reading Circles List */}
        <Box>
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              Your Reading Circles
            </Typography>
            <Button
              size="small"
              startIcon={<KeyOutlinedIcon sx={{ fontSize: 14 }} />}
              onClick={onOpenJoinModal}
              sx={{ fontSize: 12, minWidth: 0, px: 1, py: 0.25 }}
            >
              Join code
            </Button>
          </Stack>

          <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {clubs.map((club) => {
              const isSelected = club.id === activeClub?.id;
              const memberCount = members.filter((m) => m.clubId === club.id).length;
              const isMember = members.some((m) => m.clubId === club.id && m.userId === currentUser.id);
              return (
                <ListItemButton
                  key={club.id}
                  selected={isSelected}
                  onClick={() => onSelectClub(club.id)}
                  sx={{
                    borderRadius: 1.5,
                    px: 1.5,
                    py: 1.25,
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    border: isSelected ? '1px solid #D8D2C5' : '1px solid transparent',
                    bgcolor: isSelected ? '#FFFFFF !important' : 'transparent',
                    '&:hover': {
                      bgcolor: isSelected ? '#FFFFFF' : 'rgba(239, 236, 228, 0.7)',
                    },
                  }}
                >
                  <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                    <Typography variant="body2" noWrap sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {club.name}
                    </Typography>
                    {isMember && <CheckIcon sx={{ fontSize: 15, color: 'secondary.main', flexShrink: 0 }} />}
                  </Stack>
                  <Typography
                    variant="caption"
                    className="tabular-nums"
                    sx={{ mt: 0.25, color: '#71717A', display: 'flex', gap: 0.75 }}
                  >
                    <span>{memberCount} readers</span>
                    <span aria-hidden="true">·</span>
                    <Box component="span" sx={{ fontFamily: 'var(--font-mono)' }}>
                      {club.inviteCode}
                    </Box>
                  </Typography>
                </ListItemButton>
              );
            })}
          </List>
        </Box>

        {/* Active Book & Collective Pace */}
        {activeClub && (
          <Box sx={{ pt: 2.5, borderTop: '1px solid #E4E0D8' }}>
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                Current Selection
              </Typography>
              <Button
                size="small"
                startIcon={<LibraryAddOutlinedIcon sx={{ fontSize: 14 }} />}
                onClick={onOpenAddBookModal}
                sx={{ fontSize: 12, minWidth: 0, px: 1, py: 0.25 }}
              >
                Switch title
              </Button>
            </Stack>

            {activeBook ? (
              <Stack spacing={1.75}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                  <BookCover
                    title={activeBook.title}
                    author={activeBook.author}
                    coverUrl={activeBook.coverUrl}
                    width={64}
                    height={96}
                  />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                      sx={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 14,
                        fontWeight: 600,
                        lineHeight: 1.25,
                        color: 'text.primary',
                      }}
                    >
                      {activeBook.title}
                    </Typography>
                    <Typography variant="caption" noWrap sx={{ display: 'block', mt: 0.25, color: 'text.secondary' }}>
                      {activeBook.author}
                    </Typography>
                    <Typography
                      variant="caption"
                      className="tabular-nums"
                      sx={{ display: 'block', mt: 0.75, color: '#71717A' }}
                    >
                      {activeBook.totalChapters} ch · {activeBook.totalPages} pp
                    </Typography>
                    {activeBook.externalLibraryBookId && onOpenLibraryBook && (
                      <Button
                        size="small"
                        onClick={() =>
                          onOpenLibraryBook(activeBook.externalLibraryBookId!, activeBook.title)
                        }
                        sx={{ mt: 0.5, p: 0, minWidth: 0, fontSize: 12 }}
                      >
                        View in Library Shell
                      </Button>
                    )}
                  </Box>
                </Stack>

                <Box>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline', mb: 0.75 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                      Collective pace
                    </Typography>
                    <Typography
                      variant="caption"
                      className="tabular-nums"
                      sx={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'text.primary' }}
                    >
                      {avgPercent}%
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={avgPercent}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: '#E4E0D8',
                      '& .MuiLinearProgress-bar': { bgcolor: '#1E3A8A' },
                    }}
                  />
                  <Stack
                    direction="row"
                    className="tabular-nums"
                    sx={{ justifyContent: 'space-between', mt: 0.75, color: '#71717A' }}
                  >
                    <Typography variant="caption" sx={{ fontSize: 11 }}>
                      Avg. Ch. {avgChapter} of {activeBook.totalChapters}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: 11 }}>
                      {clubMembers.length} in circle
                    </Typography>
                  </Stack>
                </Box>
              </Stack>
            ) : (
              <Box
                sx={{
                  border: '1px dashed #D8D2C5',
                  borderRadius: 1.5,
                  p: 2,
                  textAlign: 'center',
                }}
              >
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                  No book assigned yet.
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  onClick={onOpenAddBookModal}
                  sx={{ mt: 1.25 }}
                >
                  Select First Title
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Reader Session Footer */}
      <Box sx={{ p: 2, borderTop: '1px solid #E4E0D8', bgcolor: '#F5F2EB' }}>
        {isShellControlled ? (
          <Box sx={{ mb: 1.5, px: 1.5, py: 1, borderRadius: 1, bgcolor: '#FFFFFF', border: '1px solid #E4E0D8' }}>
            <Typography variant="caption" sx={{ display: 'block', fontSize: 10, color: '#71717A' }}>
              Shell Reader Session
            </Typography>
            <Typography variant="body2" noWrap sx={{ fontWeight: 600, fontSize: 12 }}>
              {currentUser.displayName}
            </Typography>
          </Box>
        ) : (
          <FormControl fullWidth size="small" sx={{ bgcolor: '#FFFFFF', mb: 1.5 }}>
            <InputLabel id="reader-identity-label">Active Reader Session</InputLabel>
            <Select
              labelId="reader-identity-label"
              value={currentUser.id}
              label="Active Reader Session"
              onChange={(e) => onSwitchUser(e.target.value)}
              sx={{ fontSize: 12 }}
            >
              {profiles.map((p) => (
                <MenuItem key={p.id} value={p.id} sx={{ fontSize: 12 }}>
                  {p.displayName} (@{p.handle})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <Divider sx={{ mb: 1.25 }} />

        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 0.75, color: '#71717A' }}>
            <GroupOutlinedIcon sx={{ fontSize: 14 }} />
            <Typography variant="caption" sx={{ fontSize: 11 }}>
              {backendMode === 'supabase' ? 'Supabase RLS + Realtime' : 'Browser Sync (Supabase Ready)'}
            </Typography>
          </Stack>
          <Button size="small" onClick={onOpenConfigTab} sx={{ fontSize: 11, minWidth: 0, p: 0 }}>
            Config
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
