import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { ClubBook } from '../types/bookClub';

interface ModalFrameProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}

function ModalFrame({ title, subtitle, onClose, children }: ModalFrameProps) {
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pb: 1.5, borderBottom: '1px solid #E4E0D8' }}>
        <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <IconButton size="small" aria-label="Close modal" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>
      {children}
    </Dialog>
  );
}

export function CreateClubModal({
  initialBookDefaults,
  onClose,
  onSubmit,
}: {
  initialBookDefaults?: {
    id: string;
    title: string;
    author: string;
    totalChapters: number;
    totalPages: number;
    coverUrl?: string;
  };
  onClose: () => void;
  onSubmit: (input: {
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
  }) => Promise<void>;
}) {
  const [name, setName] = useState(initialBookDefaults ? `${initialBookDefaults.title} Circle` : '');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [bookTitle, setBookTitle] = useState(initialBookDefaults?.title || '');
  const [bookAuthor, setBookAuthor] = useState(initialBookDefaults?.author || '');
  const [totalChapters, setTotalChapters] = useState(String(initialBookDefaults?.totalChapters || 12));
  const [totalPages, setTotalPages] = useState(String(initialBookDefaults?.totalPages || 320));
  const [libraryId, setLibraryId] = useState(initialBookDefaults?.id || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        visibility,
        initialBook: bookTitle.trim()
          ? {
              title: bookTitle.trim(),
              author: bookAuthor.trim() || 'Unknown Author',
              totalChapters: Number(totalChapters) || 12,
              totalPages: Number(totalPages) || 320,
              coverUrl: initialBookDefaults?.coverUrl,
              externalLibraryBookId: libraryId.trim() || undefined,
            }
          : undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create club');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalFrame
      title="Create a Reading Circle"
      subtitle="Launch a new group and invite readers from your library shell."
      onClose={onClose}
    >
      <Box component="form" onSubmit={(e) => void handleSubmit(e)}>
        <DialogContent sx={{ pt: 2.5 }}>
          <Stack spacing={2}>
            <TextField
              required
              fullWidth
              size="small"
              label="Club Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Modern Essays & Memoirs"
            />

            <TextField
              fullWidth
              multiline
              minRows={2}
              size="small"
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Reading cadence, themes, or meeting schedule…"
            />

            <FormControl fullWidth size="small">
              <InputLabel id="club-vis-label">Visibility</InputLabel>
              <Select
                labelId="club-vis-label"
                value={visibility}
                label="Visibility"
                onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}
              >
                <MenuItem value="public">Public (listed in Library Directory)</MenuItem>
                <MenuItem value="private">Private (invite code only)</MenuItem>
              </Select>
            </FormControl>

            <Divider />

            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              First Book Selection (optional)
            </Typography>

            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Book Title"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Author"
                  value={bookAuthor}
                  onChange={(e) => setBookAuthor(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Chapters"
                  value={totalChapters}
                  onChange={(e) => setTotalChapters(e.target.value)}
                  slotProps={{ htmlInput: { min: 1 } }}
                />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Pages"
                  value={totalPages}
                  onChange={(e) => setTotalPages(e.target.value)}
                  slotProps={{ htmlInput: { min: 1 } }}
                />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Shell Book ID"
                  value={libraryId}
                  onChange={(e) => setLibraryId(e.target.value)}
                  placeholder="lib-cat-…"
                />
              </Grid>
            </Grid>

            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={!name.trim() || submitting}>
            {submitting ? 'Creating…' : 'Create Club'}
          </Button>
        </DialogActions>
      </Box>
    </ModalFrame>
  );
}

export function JoinClubModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (inviteCode: string) => Promise<void>;
}) {
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(code.trim().toUpperCase());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid invite code');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalFrame
      title="Join via Invite Code"
      subtitle="Try FOLIO842, ATLAS309, or STAR917, or enter a private club code."
      onClose={onClose}
    >
      <Box component="form" onSubmit={(e) => void handleSubmit(e)}>
        <DialogContent sx={{ pt: 2.5 }}>
          <Stack spacing={2}>
            <TextField
              required
              fullWidth
              size="small"
              label="Invite Code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. FOLIO842"
              slotProps={{
                htmlInput: {
                  style: { fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' },
                },
              }}
            />
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={!code.trim() || submitting}>
            {submitting ? 'Joining…' : 'Join Circle'}
          </Button>
        </DialogActions>
      </Box>
    </ModalFrame>
  );
}

export function AddBookModal({
  clubName,
  onClose,
  onSubmit,
}: {
  clubName: string;
  onClose: () => void;
  onSubmit: (input: {
    title: string;
    author: string;
    totalChapters: number;
    totalPages: number;
    synopsis: string;
    externalLibraryBookId?: string;
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [totalChapters, setTotalChapters] = useState('12');
  const [totalPages, setTotalPages] = useState('320');
  const [synopsis, setSynopsis] = useState('');
  const [libraryId, setLibraryId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        title: title.trim(),
        author: author.trim(),
        totalChapters: Math.max(1, Number(totalChapters) || 12),
        totalPages: Math.max(1, Number(totalPages) || 320),
        synopsis: synopsis.trim(),
        externalLibraryBookId: libraryId.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add title');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalFrame
      title={`Select Title for ${clubName}`}
      subtitle="Assign a new current read and link it to your library catalog ID if desired."
      onClose={onClose}
    >
      <Box component="form" onSubmit={(e) => void handleSubmit(e)}>
        <DialogContent sx={{ pt: 2.5 }}>
          <Stack spacing={2}>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  required
                  fullWidth
                  size="small"
                  label="Book Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Piranesi"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  required
                  fullWidth
                  size="small"
                  label="Author"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="e.g. Susanna Clarke"
                />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Chapters"
                  value={totalChapters}
                  onChange={(e) => setTotalChapters(e.target.value)}
                  slotProps={{ htmlInput: { min: 1 } }}
                />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Pages"
                  value={totalPages}
                  onChange={(e) => setTotalPages(e.target.value)}
                  slotProps={{ htmlInput: { min: 1 } }}
                />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Library ID"
                  value={libraryId}
                  onChange={(e) => setLibraryId(e.target.value)}
                  placeholder="Optional"
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              multiline
              minRows={2}
              size="small"
              label="Synopsis (optional)"
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              placeholder="Brief note for club members…"
            />

            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={!title.trim() || !author.trim() || submitting}>
            {submitting ? 'Saving…' : 'Set as Current Read'}
          </Button>
        </DialogActions>
      </Box>
    </ModalFrame>
  );
}

export function NewDiscussionModal({
  book,
  onClose,
  onSubmit,
}: {
  book: ClubBook;
  onClose: () => void;
  onSubmit: (input: {
    chapterNumber: number;
    chapterTitle: string;
    title: string;
    openingPrompt: string;
    isSpoilerGuarded: boolean;
  }) => Promise<void>;
}) {
  const [chapterNumber, setChapterNumber] = useState('1');
  const [chapterTitle, setChapterTitle] = useState('');
  const [title, setTitle] = useState('');
  const [openingPrompt, setOpeningPrompt] = useState('');
  const [isSpoilerGuarded, setIsSpoilerGuarded] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        chapterNumber: Math.min(book.totalChapters, Math.max(1, Number(chapterNumber) || 1)),
        chapterTitle: chapterTitle.trim(),
        title: title.trim(),
        openingPrompt: openingPrompt.trim(),
        isSpoilerGuarded,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create chapter discussion');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalFrame
      title="New Chapter Discussion"
      subtitle={`Open a dedicated chat thread for a chapter of ${book.title}.`}
      onClose={onClose}
    >
      <Box component="form" onSubmit={(e) => void handleSubmit(e)}>
        <DialogContent sx={{ pt: 2.5 }}>
          <Stack spacing={2}>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 4 }}>
                <TextField
                  required
                  fullWidth
                  size="small"
                  type="number"
                  label="Chapter #"
                  value={chapterNumber}
                  onChange={(e) => setChapterNumber(e.target.value)}
                  slotProps={{ htmlInput: { min: 1, max: book.totalChapters } }}
                />
              </Grid>
              <Grid size={{ xs: 8 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Chapter Name (optional)"
                  value={chapterTitle}
                  onChange={(e) => setChapterTitle(e.target.value)}
                  placeholder="e.g. The Locked Glasshouse"
                />
              </Grid>
            </Grid>

            <TextField
              required
              fullWidth
              size="small"
              label="Discussion Topic"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Symbolism of the winter solstice ledger"
            />

            <TextField
              fullWidth
              multiline
              minRows={3}
              size="small"
              label="Opening Question / Prompt"
              value={openingPrompt}
              onChange={(e) => setOpeningPrompt(e.target.value)}
              placeholder="Kick off the chapter chat with a question or quote…"
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={isSpoilerGuarded}
                  onChange={(e) => setIsSpoilerGuarded(e.target.checked)}
                />
              }
              label={
                <Typography variant="caption" color="text.secondary">
                  Guard spoilers for readers whose logged chapter is behind Chapter {chapterNumber || 1}
                </Typography>
              }
            />

            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={!title.trim() || submitting}>
            {submitting ? 'Creating…' : 'Open Chapter Thread'}
          </Button>
        </DialogActions>
      </Box>
    </ModalFrame>
  );
}
