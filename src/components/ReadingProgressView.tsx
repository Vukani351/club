import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Slider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import type {
  BookClub,
  ClubBook,
  ClubMember,
  ReadingLog,
  ReadingStatus,
  UserProfile,
} from '../types/bookClub';
import { BookCover } from './BookCover';

interface ReadingProgressViewProps {
  club?: BookClub;
  book?: ClubBook;
  members: ClubMember[];
  profiles: UserProfile[];
  readingLogs: ReadingLog[];
  currentUser: UserProfile;
  onSaveReadingLog: (input: {
    clubId: string;
    bookId: string;
    currentChapter: number;
    currentPage: number;
    percentComplete: number;
    status: ReadingStatus;
    notes: string;
  }) => Promise<void>;
}

const STATUS_LABELS: Record<ReadingStatus, string> = {
  not_started: 'Not Started',
  reading: 'In Progress',
  caught_up: 'Caught Up',
  finished: 'Finished',
};

export function ReadingProgressView({
  club,
  book,
  members,
  profiles,
  readingLogs,
  currentUser,
  onSaveReadingLog,
}: ReadingProgressViewProps) {
  const clubMembers = useMemo(
    () => members.filter((m) => m.clubId === club?.id),
    [members, club?.id]
  );

  const bookLogs = useMemo(() => {
    if (!club || !book) return [];
    return readingLogs.filter((l) => l.clubId === club.id && l.bookId === book.id);
  }, [readingLogs, club, book]);

  const myLog = useMemo(
    () => bookLogs.find((l) => l.userId === currentUser.id),
    [bookLogs, currentUser.id]
  );

  const [chapter, setChapter] = useState<number>(myLog?.currentChapter ?? 1);
  const [page, setPage] = useState<number>(myLog?.currentPage ?? 0);
  const [status, setStatus] = useState<ReadingStatus>(myLog?.status ?? 'reading');
  const [notes, setNotes] = useState<string>(myLog?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setChapter(myLog?.currentChapter ?? 1);
    setPage(myLog?.currentPage ?? 0);
    setStatus(myLog?.status ?? 'reading');
    setNotes(myLog?.notes ?? '');
  }, [myLog?.id, myLog?.currentChapter, myLog?.currentPage, myLog?.status, myLog?.notes, book?.id]);

  if (!club || !book) {
    return (
      <Box sx={{ flex: 1, p: 6, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Select a reading circle with an active book to view collective reading logs.
        </Typography>
      </Box>
    );
  }

  const computedPercent =
    status === 'finished'
      ? 100
      : book.totalPages > 0 && page > 0
      ? Math.min(100, Math.round((page / book.totalPages) * 1000) / 10)
      : Math.min(100, Math.round((chapter / book.totalChapters) * 1000) / 10);

  const collectiveAvg =
    bookLogs.length > 0
      ? Math.round((bookLogs.reduce((acc, l) => acc + l.percentComplete, 0) / bookLogs.length) * 10) / 10
      : 0;

  const finishedCount = bookLogs.filter((l) => l.status === 'finished').length;
  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  const chapterBuckets = Array.from({ length: book.totalChapters }, (_, idx) => {
    const chNum = idx + 1;
    const count = bookLogs.filter((l) => l.currentChapter === chNum).length;
    return { chNum, count };
  });

  const maxBucket = Math.max(1, ...chapterBuckets.map((b) => b.count));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedNotice(false);
    try {
      await onSaveReadingLog({
        clubId: club.id,
        bookId: book.id,
        currentChapter: chapter,
        currentPage: page,
        percentComplete: computedPercent,
        status,
        notes: notes.trim(),
      });
      setSavedNotice(true);
      window.setTimeout(() => setSavedNotice(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ flex: 1, overflowY: 'auto', bgcolor: '#F8F6F1', p: { xs: 3, lg: 4 } }}>
      <Stack spacing={3.5} sx={{ maxWidth: 1080, mx: 'auto' }}>
        {/* Summary Banner */}
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            borderRadius: 2,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { md: 'center' },
            justifyContent: 'space-between',
            gap: 3,
          }}
        >
          <Stack direction="row" spacing={2.5} sx={{ alignItems: 'flex-start' }}>
            <BookCover
              title={book.title}
              author={book.author}
              coverUrl={book.coverUrl}
              width={80}
              height={112}
            />
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main' }}>
                Collective Reading Ledger · {club.name}
              </Typography>
              <Typography variant="h4" sx={{ mt: 0.5, fontSize: 26 }}>
                {book.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {book.author}
              </Typography>
              <Typography
                variant="caption"
                className="tabular-nums"
                sx={{ display: 'block', mt: 1, color: '#71717A' }}
              >
                {book.totalChapters} Chapters · {book.totalPages} Pages · {clubMembers.length} Circle Members
              </Typography>
            </Box>
          </Stack>

          <Stack
            direction="row"
            spacing={4}
            sx={{
              borderTop: { xs: '1px solid #E4E0D8', md: 'none' },
              borderLeft: { md: '1px solid #E4E0D8' },
              pt: { xs: 2, md: 0 },
              pl: { md: 4 },
              flexShrink: 0,
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary">
                Collective Avg
              </Typography>
              <Typography
                variant="h5"
                className="tabular-nums"
                sx={{ fontFamily: 'var(--font-mono)', fontWeight: 600, mt: 0.25 }}
              >
                {collectiveAvg}%
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Active Logs
              </Typography>
              <Typography
                variant="h5"
                className="tabular-nums"
                sx={{ fontFamily: 'var(--font-mono)', fontWeight: 600, mt: 0.25 }}
              >
                {bookLogs.length}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Completed
              </Typography>
              <Typography
                variant="h5"
                className="tabular-nums"
                sx={{ fontFamily: 'var(--font-mono)', fontWeight: 600, mt: 0.25, color: 'secondary.main' }}
              >
                {finishedCount}
              </Typography>
            </Box>
          </Stack>
        </Paper>

        <Grid container spacing={3} sx={{ alignItems: 'flex-start' }}>
          {/* Update My Reading Log */}
          <Grid size={{ xs: 12, lg: 5 }}>
            <Paper variant="outlined" component="form" onSubmit={(e) => void handleSave(e)} sx={{ p: 3, borderRadius: 2 }}>
              <Stack spacing={2.5}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Update My Reading Log
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    className="tabular-nums"
                    sx={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'primary.main' }}
                  >
                    {computedPercent}%
                  </Typography>
                </Stack>

                <Box>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Current Chapter
                    </Typography>
                    <Typography variant="caption" className="tabular-nums" sx={{ fontFamily: 'var(--font-mono)' }}>
                      Ch. {chapter} / {book.totalChapters}
                    </Typography>
                  </Stack>
                  <Slider
                    min={0}
                    max={book.totalChapters}
                    step={1}
                    value={chapter}
                    onChange={(_e, val) => {
                      const nextCh = Number(val);
                      setChapter(nextCh);
                      const estPage = Math.round((nextCh / book.totalChapters) * book.totalPages);
                      setPage(estPage);
                      if (nextCh >= book.totalChapters) {
                        setStatus('finished');
                      } else if (nextCh === 0) {
                        setStatus('not_started');
                      } else if (status === 'finished' || status === 'not_started') {
                        setStatus('reading');
                      }
                    }}
                    valueLabelDisplay="auto"
                  />
                </Box>

                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Current Page"
                      value={page}
                      onChange={(e) =>
                        setPage(Math.min(book.totalPages, Math.max(0, Number(e.target.value))))
                      }
                      slotProps={{ htmlInput: { min: 0, max: book.totalPages } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="reading-status-label">Reading Status</InputLabel>
                      <Select
                        labelId="reading-status-label"
                        value={status}
                        label="Reading Status"
                        onChange={(e) => setStatus(e.target.value as ReadingStatus)}
                      >
                        <MenuItem value="not_started">Not Started</MenuItem>
                        <MenuItem value="reading">In Progress</MenuItem>
                        <MenuItem value="caught_up">Caught Up</MenuItem>
                        <MenuItem value="finished">Finished</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  size="small"
                  label="Margin Note for the Group"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Where are you pausing today? Any spoiler-free impressions?"
                />

                <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                  <Button type="submit" variant="contained" disabled={saving}>
                    {saving ? 'Syncing Log…' : 'Save Reading Progress'}
                  </Button>
                  {savedNotice && (
                    <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5, color: 'secondary.main' }}>
                      <CheckCircleOutlinedIcon sx={{ fontSize: 16 }} />
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        Synced with club
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </Stack>
            </Paper>
          </Grid>

          {/* Collective Distribution & Member Table */}
          <Grid size={{ xs: 12, lg: 7 }}>
            <Stack spacing={3}>
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Chapter Position Across Readers
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#71717A' }}>
                  See which chapters your circle is currently reading so spoiler guards stay aligned.
                </Typography>

                <Box
                  sx={{
                    mt: 3,
                    display: 'grid',
                    gridTemplateColumns: `repeat(${Math.min(12, chapterBuckets.length)}, minmax(0, 1fr))`,
                    gap: 1,
                    alignItems: 'end',
                    height: 112,
                  }}
                >
                  {chapterBuckets.map(({ chNum, count }) => {
                    const barHeight = count > 0 ? Math.max(20, Math.round((count / maxBucket) * 76)) : 6;
                    return (
                      <Tooltip key={chNum} title={`Chapter ${chNum}: ${count} readers`}>
                        <Stack spacing={0.5} sx={{ alignItems: 'center' }}>
                          <Typography
                            variant="caption"
                            className="tabular-nums"
                            sx={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'text.secondary', minHeight: 14 }}
                          >
                            {count > 0 ? count : ''}
                          </Typography>
                          <Box
                            sx={{
                              width: '100%',
                              height: barHeight,
                              borderRadius: '4px 4px 0 0',
                              bgcolor: count > 0 ? 'primary.main' : '#EFECE4',
                              transition: 'height 200ms ease',
                            }}
                          />
                          <Typography
                            variant="caption"
                            className="tabular-nums"
                            sx={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#71717A' }}
                          >
                            {chNum}
                          </Typography>
                        </Stack>
                      </Tooltip>
                    );
                  })}
                </Box>
              </Paper>

              <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Stack
                  direction="row"
                  sx={{ justifyContent: 'space-between', alignItems: 'center', px: 3, py: 2, borderBottom: '1px solid #E4E0D8' }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Circle Member Progress
                  </Typography>
                  <Typography variant="caption" className="tabular-nums" sx={{ color: '#71717A' }}>
                    {clubMembers.length} members
                  </Typography>
                </Stack>

                {bookLogs.length === 0 ? (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <MenuBookOutlinedIcon sx={{ fontSize: 28, color: '#71717A', mb: 1 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      No reading logs recorded yet
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Save your chapter position on the left to start the ledger.
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#FBF9F5' }}>
                          <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Reader</TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Status</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, fontSize: 12 }}>
                            Chapter
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, fontSize: 12 }}>
                            Page
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, fontSize: 12 }}>
                            Progress
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {bookLogs
                          .slice()
                          .sort((a, b) => b.percentComplete - a.percentComplete)
                          .map((log) => {
                            const profile = profileMap.get(log.userId);
                            return (
                              <TableRow key={log.id} hover>
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {profile?.displayName || 'Reader'}
                                  </Typography>
                                  {log.notes && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      noWrap
                                      sx={{ display: 'block', maxWidth: 260 }}
                                    >
                                      {log.notes}
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      fontWeight: log.status === 'finished' ? 600 : 400,
                                      color: log.status === 'finished' ? 'secondary.main' : 'text.secondary',
                                    }}
                                  >
                                    {STATUS_LABELS[log.status]}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right" className="tabular-nums" sx={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                                  {log.currentChapter} / {book.totalChapters}
                                </TableCell>
                                <TableCell align="right" className="tabular-nums" sx={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                                  {log.currentPage}
                                </TableCell>
                                <TableCell
                                  align="right"
                                  className="tabular-nums"
                                  sx={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'primary.main' }}
                                >
                                  {Math.round(log.percentComplete)}%
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </Box>
  );
}
