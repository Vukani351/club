import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Divider,
  InputAdornment,
  List,
  ListItemButton,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import type { ChapterDiscussion, ClubBook, DiscussionMessage } from '../types/bookClub';

interface ChapterRailProps {
  activeBook?: ClubBook;
  discussions: ChapterDiscussion[];
  messages: DiscussionMessage[];
  activeDiscussionId: string;
  onSelectDiscussion: (discussionId: string) => void;
  onOpenNewDiscussionModal: () => void;
}

export function ChapterRail({
  activeBook,
  discussions,
  messages,
  activeDiscussionId,
  onSelectDiscussion,
  onOpenNewDiscussionModal,
}: ChapterRailProps) {
  const [search, setSearch] = useState('');
  const [chapterFilter, setChapterFilter] = useState<string>('all');

  const availableChapters = useMemo(() => {
    return Array.from(new Set(discussions.map((d) => d.chapterNumber))).sort((a, b) => a - b);
  }, [discussions]);

  const filtered = useMemo(() => {
    return discussions
      .filter((d) => {
        if (chapterFilter !== 'all' && d.chapterNumber !== Number(chapterFilter)) {
          return false;
        }
        if (search.trim()) {
          const q = search.trim().toLowerCase();
          return (
            d.title.toLowerCase().includes(q) ||
            d.chapterTitle.toLowerCase().includes(q) ||
            d.openingPrompt.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => a.chapterNumber - b.chapterNumber || a.createdAt.localeCompare(b.createdAt));
  }, [discussions, chapterFilter, search]);

  return (
    <Box
      component="section"
      aria-label="Chapter Discussions"
      sx={{
        width: { xs: '100%', lg: 316 },
        flexShrink: 0,
        borderBottom: { xs: '1px solid #E4E0D8', lg: 'none' },
        borderRight: { lg: '1px solid #E4E0D8' },
        bgcolor: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid #E4E0D8' }}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1.5 }}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Chapter Threads
            </Typography>
            <Typography variant="caption" className="tabular-nums" sx={{ color: '#71717A' }}>
              {discussions.length} {discussions.length === 1 ? 'discussion' : 'discussions'}
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="small"
            disabled={!activeBook}
            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
            onClick={onOpenNewDiscussionModal}
          >
            New Thread
          </Button>
        </Stack>

        <Stack direction="row" spacing={1}>
          <TextField
            size="small"
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chapters…"
            aria-label="Search chapter discussions"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 16, color: '#71717A' }} />
                  </InputAdornment>
                ),
                sx: { fontSize: 12, bgcolor: '#FBF9F5' },
              },
            }}
          />

          <Select
            size="small"
            value={chapterFilter}
            onChange={(e) => setChapterFilter(e.target.value)}
            aria-label="Filter by chapter number"
            className="tabular-nums"
            sx={{ minWidth: 94, fontSize: 12, bgcolor: '#FBF9F5' }}
          >
            <MenuItem value="all" sx={{ fontSize: 12 }}>
              All ch.
            </MenuItem>
            {availableChapters.map((ch) => (
              <MenuItem key={ch} value={String(ch)} sx={{ fontSize: 12 }}>
                Ch. {ch}
              </MenuItem>
            ))}
          </Select>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              No chapter threads match
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#71717A' }}>
              Start a chapter-specific discussion so members can compare notes without spoilers.
            </Typography>
            {activeBook && (
              <Button variant="outlined" size="small" onClick={onOpenNewDiscussionModal} sx={{ mt: 1.5 }}>
                Create Chapter Discussion
              </Button>
            )}
          </Box>
        ) : (
          <List disablePadding>
            {filtered.map((discussion, idx) => {
              const isActive = discussion.id === activeDiscussionId;
              const replyCount = messages.filter((m) => m.discussionId === discussion.id).length;

              return (
                <Box key={discussion.id}>
                  {idx > 0 && <Divider sx={{ borderColor: '#EFECE4' }} />}
                  <ListItemButton
                    selected={isActive}
                    onClick={() => onSelectDiscussion(discussion.id)}
                    sx={{
                      p: 2,
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      bgcolor: isActive ? '#F4F1EA !important' : 'transparent',
                      '&:hover': { bgcolor: isActive ? '#F4F1EA' : '#FBF9F5' },
                    }}
                  >
                    <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                      <Typography
                        variant="caption"
                        className="tabular-nums"
                        sx={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 600,
                          color: 'primary.main',
                        }}
                      >
                        Ch. {String(discussion.chapterNumber).padStart(2, '0')}
                        {discussion.chapterTitle ? ` · ${discussion.chapterTitle}` : ''}
                      </Typography>
                      {discussion.isSpoilerGuarded && (
                        <LockOutlinedIcon
                          sx={{ fontSize: 14, color: 'warning.main', flexShrink: 0 }}
                          titleAccess="Spoiler guarded"
                        />
                      )}
                    </Stack>

                    <Typography
                      variant="body2"
                      sx={{ mt: 0.5, fontWeight: 600, color: 'text.primary', lineHeight: 1.35 }}
                    >
                      {discussion.title}
                    </Typography>

                    <Stack direction="row" className="tabular-nums" sx={{ gap: 0.75, mt: 1, color: '#71717A' }}>
                      <Typography variant="caption">
                        {replyCount} {replyCount === 1 ? 'message' : 'messages'}
                      </Typography>
                      {discussion.isSpoilerGuarded && (
                        <>
                          <Typography variant="caption" aria-hidden="true">
                            ·
                          </Typography>
                          <Typography variant="caption">Spoiler guarded</Typography>
                        </>
                      )}
                    </Stack>
                  </ListItemButton>
                </Box>
              );
            })}
          </List>
        )}
      </Box>
    </Box>
  );
}
