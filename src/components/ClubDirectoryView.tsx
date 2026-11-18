import { useState } from 'react';
import {
  Box,
  Button,
  Divider,
  Grid,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined';
import SearchIcon from '@mui/icons-material/Search';
import type { BookClub, ClubBook, ClubMember, ReadingLog, UserProfile } from '../types/bookClub';
import { BookCover } from './BookCover';

interface ClubDirectoryViewProps {
  clubs: BookClub[];
  books: ClubBook[];
  members: ClubMember[];
  readingLogs: ReadingLog[];
  currentUser: UserProfile;
  onOpenClub: (clubId: string) => void;
  onJoinClub: (clubId: string) => Promise<void>;
  onOpenCreateClubModal: () => void;
  onOpenJoinModal: () => void;
}

export function ClubDirectoryView({
  clubs,
  books,
  members,
  readingLogs,
  currentUser,
  onOpenClub,
  onJoinClub,
  onOpenCreateClubModal,
  onOpenJoinModal,
}: ClubDirectoryViewProps) {
  const [query, setQuery] = useState('');

  const filteredClubs = clubs.filter((club) => {
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    const clubBook = books.find((b) => b.clubId === club.id && b.status === 'current');
    return (
      club.name.toLowerCase().includes(q) ||
      club.description.toLowerCase().includes(q) ||
      (clubBook?.title.toLowerCase().includes(q) ?? false) ||
      (clubBook?.author.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <Box sx={{ flex: 1, overflowY: 'auto', bgcolor: '#F8F6F1', p: { xs: 3, lg: 4 } }}>
      <Stack spacing={3} sx={{ maxWidth: 1080, mx: 'auto' }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          sx={{
            alignItems: { sm: 'flex-end' },
            justifyContent: 'space-between',
            gap: 2,
            pb: 2.5,
            borderBottom: '1px solid #E4E0D8',
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontSize: 30 }}>
              Reading Circles Directory
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Discover active book clubs, join via invite code, or open a new group around any library title.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.25} sx={{ flexShrink: 0 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<KeyOutlinedIcon sx={{ fontSize: 16 }} />}
              onClick={onOpenJoinModal}
              sx={{ bgcolor: '#FFFFFF', borderColor: '#D8D2C5', color: 'text.primary' }}
            >
              Enter Invite Code
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon sx={{ fontSize: 16 }} />}
              onClick={onOpenCreateClubModal}
            >
              Create Club
            </Button>
          </Stack>
        </Stack>

        <TextField
          size="small"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by circle name, book title, or author…"
          sx={{ maxWidth: 420, bgcolor: '#FFFFFF' }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: '#71717A' }} />
                </InputAdornment>
              ),
            },
          }}
        />

        <Grid container spacing={2.5}>
          {filteredClubs.map((club) => {
            const clubBook =
              books.find((b) => b.clubId === club.id && b.status === 'current') ||
              books.find((b) => b.clubId === club.id);
            const memberCount = members.filter((m) => m.clubId === club.id).length;
            const isMember = members.some((m) => m.clubId === club.id && m.userId === currentUser.id);
            const bookLogs = clubBook
              ? readingLogs.filter((l) => l.clubId === club.id && l.bookId === clubBook.id)
              : [];
            const avgProgress =
              bookLogs.length > 0
                ? Math.round(bookLogs.reduce((acc, l) => acc + l.percentComplete, 0) / bookLogs.length)
                : 0;

            return (
              <Grid key={club.id} size={{ xs: 12, md: 6 }}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    height: '100%',
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 2.5,
                  }}
                >
                  <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
                    {clubBook ? (
                      <BookCover
                        title={clubBook.title}
                        author={clubBook.author}
                        coverUrl={clubBook.coverUrl}
                        width={80}
                        height={112}
                      />
                    ) : (
                      <BookCover title={club.name} author="New Circle" width={80} height={112} />
                    )}

                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="caption" className="tabular-nums" sx={{ color: '#71717A' }}>
                        {memberCount} readers ·{' '}
                        <Box component="span" sx={{ fontFamily: 'var(--font-mono)' }}>
                          {club.inviteCode}
                        </Box>{' '}
                        · <Box component="span" sx={{ textTransform: 'capitalize' }}>{club.visibility}</Box>
                      </Typography>

                      <Typography variant="h6" sx={{ mt: 0.5, fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                        {club.name}
                      </Typography>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          mt: 0.75,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: 1.5,
                        }}
                      >
                        {club.description}
                      </Typography>

                      {clubBook && (
                        <Box sx={{ mt: 1.5, pt: 1.25, borderTop: '1px solid #EFECE4' }}>
                          <Typography variant="caption" color="text.primary">
                            <Box component="span" sx={{ color: '#71717A' }}>
                              Reading:{' '}
                            </Box>
                            <Box component="strong" sx={{ fontWeight: 600 }}>
                              {clubBook.title}
                            </Box>{' '}
                            <Box
                              component="span"
                              className="tabular-nums"
                              sx={{ fontFamily: 'var(--font-mono)', color: '#71717A' }}
                            >
                              ({avgProgress}% avg)
                            </Box>
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Stack>

                  <Box>
                    <Divider sx={{ mb: 1.5, borderColor: '#EFECE4' }} />
                    <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                      <Typography variant="caption" sx={{ color: '#71717A' }}>
                        {isMember ? 'Joined circle' : 'Open to join'}
                      </Typography>

                      <Stack direction="row" spacing={1}>
                        {!isMember && (
                          <Button variant="outlined" size="small" onClick={() => void onJoinClub(club.id)}>
                            Join Circle
                          </Button>
                        )}
                        <Button
                          variant="contained"
                          size="small"
                          endIcon={<ArrowForwardIcon sx={{ fontSize: 15 }} />}
                          onClick={() => onOpenClub(club.id)}
                        >
                          Open Discussions
                        </Button>
                      </Stack>
                    </Stack>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Stack>
    </Box>
  );
}
