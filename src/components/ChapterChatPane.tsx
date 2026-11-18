import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import CloseIcon from '@mui/icons-material/Close';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ReplyOutlinedIcon from '@mui/icons-material/ReplyOutlined';
import SendIcon from '@mui/icons-material/Send';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import type {
  BookClub,
  ChapterDiscussion,
  ClubBook,
  ClubMember,
  DiscussionMessage,
  ReadingLog,
  UserProfile,
} from '../types/bookClub';

interface ChapterChatPaneProps {
  club?: BookClub;
  book?: ClubBook;
  discussion?: ChapterDiscussion;
  messages: DiscussionMessage[];
  profiles: UserProfile[];
  members: ClubMember[];
  currentUser: UserProfile;
  userReadingLog?: ReadingLog;
  onSendMessage: (input: {
    discussionId: string;
    body: string;
    quoteExcerpt?: string;
    pageReference?: number;
    replyToId?: string;
  }) => Promise<void>;
  onOpenNewDiscussionModal: () => void;
  onOpenProgressTab: () => void;
  onJoinClub: (clubId: string) => Promise<void>;
}

function formatMessageTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

export function ChapterChatPane({
  club,
  book,
  discussion,
  messages,
  profiles,
  members,
  currentUser,
  userReadingLog,
  onSendMessage,
  onOpenNewDiscussionModal,
  onOpenProgressTab,
  onJoinClub,
}: ChapterChatPaneProps) {
  const [body, setBody] = useState('');
  const [showQuoteInput, setShowQuoteInput] = useState(false);
  const [quoteExcerpt, setQuoteExcerpt] = useState('');
  const [pageReference, setPageReference] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<string, boolean>>({});
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const profileMap = useMemo(() => {
    const map = new Map<string, UserProfile>();
    profiles.forEach((p) => map.set(p.id, p));
    return map;
  }, [profiles]);

  const roleMap = useMemo(() => {
    const map = new Map<string, string>();
    members.forEach((m) => {
      if (m.clubId === club?.id) {
        map.set(m.userId, m.role);
      }
    });
    return map;
  }, [members, club?.id]);

  const isMember = useMemo(
    () => Boolean(club && members.some((m) => m.clubId === club.id && m.userId === currentUser.id)),
    [club, members, currentUser.id]
  );

  const threadMessages = useMemo(() => {
    if (!discussion) return [];
    return messages
      .filter((m) => m.discussionId === discussion.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }, [messages, discussion]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [threadMessages.length, discussion?.id]);

  if (!club || !book) {
    return (
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 5, bgcolor: '#F8F6F1' }}>
        <Box sx={{ maxWidth: 420, textAlign: 'center' }}>
          <Typography variant="h5">Select a Reading Circle</Typography>
          <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
            Choose a book club on the left or create a new group to begin chapter-by-chapter conversations.
          </Typography>
        </Box>
      </Box>
    );
  }

  if (!discussion) {
    return (
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 5, bgcolor: '#F8F6F1' }}>
        <Stack spacing={2} sx={{ maxWidth: 440, textAlign: 'center', alignItems: 'center' }}>
          <ForumOutlinedIcon sx={{ fontSize: 36, color: 'primary.main' }} />
          <Typography variant="h5">Start the first chapter thread for {book.title}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Organize discussions by chapter so readers can share annotations, quotes, and theories at their own pace.
          </Typography>
          <Button variant="contained" onClick={onOpenNewDiscussionModal}>
            New Chapter Discussion
          </Button>
        </Stack>
      </Box>
    );
  }

  const userChapter = userReadingLog?.currentChapter ?? 0;
  const shouldVeilSpoilers =
    discussion.isSpoilerGuarded &&
    userChapter < discussion.chapterNumber &&
    !revealedSpoilers[discussion.id];

  const replyTarget = replyToId ? threadMessages.find((m) => m.id === replyToId) : undefined;
  const replyTargetAuthor = replyTarget ? profileMap.get(replyTarget.userId) : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || sending) return;
    setError(null);
    setSending(true);
    try {
      await onSendMessage({
        discussionId: discussion.id,
        body: body.trim(),
        quoteExcerpt: quoteExcerpt.trim() || undefined,
        pageReference: pageReference ? Number(pageReference) : undefined,
        replyToId: replyToId || undefined,
      });
      setBody('');
      setQuoteExcerpt('');
      setPageReference('');
      setReplyToId(null);
      setShowQuoteInput(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <Box component="main" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, bgcolor: '#F8F6F1' }}>
      {/* Discussion Header */}
      <Box sx={{ px: 3, py: 2.5, bgcolor: '#FFFFFF', borderBottom: '1px solid #E4E0D8' }}>
        <Stack
          direction="row"
          sx={{
            flexWrap: 'wrap',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box sx={{ minWidth: 0, flex: 1, maxWidth: 680 }}>
            <Stack
              direction="row"
              className="tabular-nums"
              sx={{ flexWrap: 'wrap', alignItems: 'center', gap: 1 }}
            >
              <Typography
                variant="caption"
                sx={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'primary.main' }}
              >
                Chapter {String(discussion.chapterNumber).padStart(2, '0')}
              </Typography>
              {discussion.chapterTitle && (
                <>
                  <Typography variant="caption" color="text.secondary" aria-hidden="true">
                    ·
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {discussion.chapterTitle}
                  </Typography>
                </>
              )}
              <Typography variant="caption" color="text.secondary" aria-hidden="true">
                ·
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {book.title}
              </Typography>
              {discussion.isSpoilerGuarded && (
                <>
                  <Typography variant="caption" color="text.secondary" aria-hidden="true">
                    ·
                  </Typography>
                  <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5, color: 'warning.main' }}>
                    <LockOutlinedIcon sx={{ fontSize: 13 }} />
                    <Typography variant="caption">Spoiler guard</Typography>
                  </Stack>
                </>
              )}
            </Stack>

            <Typography variant="h5" sx={{ mt: 0.75, textWrap: 'balance' }}>
              {discussion.title}
            </Typography>

            {discussion.openingPrompt && (
              <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary', lineHeight: 1.6, maxWidth: '68ch' }}>
                {discussion.openingPrompt}
              </Typography>
            )}
          </Box>

          <Button
            variant="outlined"
            size="small"
            startIcon={<BookmarkBorderIcon sx={{ fontSize: 16, color: 'primary.main' }} />}
            onClick={onOpenProgressTab}
            sx={{
              borderColor: '#D8D2C5',
              bgcolor: '#FBF9F5',
              color: 'text.primary',
              fontSize: 12,
            }}
          >
            {userReadingLog
              ? `My pace: Ch. ${userReadingLog.currentChapter} (${Math.round(userReadingLog.percentComplete)}%)`
              : 'Log my pace'}
          </Button>
        </Stack>
      </Box>

      {/* Messages Viewport or Spoiler Veil */}
      {shouldVeilSpoilers ? (
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
          <Paper
            variant="outlined"
            sx={{ maxWidth: 440, p: 3.5, textAlign: 'center', borderRadius: 2 }}
          >
            <LockOutlinedIcon sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
            <Typography variant="h6" sx={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
              Chapter {discussion.chapterNumber} Spoiler Guard
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary', lineHeight: 1.6 }}>
              Your reading log is currently at{' '}
              <Box component="span" sx={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'text.primary' }}>
                Chapter {userChapter}
              </Box>
              . Reveal this thread when you are ready or update your reading progress.
            </Typography>
            <Stack direction="row" sx={{ justifyContent: 'center', flexWrap: 'wrap', gap: 1.5, mt: 2.5 }}>
              <Button
                variant="contained"
                size="small"
                startIcon={<VisibilityOutlinedIcon sx={{ fontSize: 16 }} />}
                onClick={() => setRevealedSpoilers((prev) => ({ ...prev, [discussion.id]: true }))}
              >
                Reveal Discussion Anyway
              </Button>
              <Button variant="outlined" size="small" onClick={onOpenProgressTab}>
                Update My Chapter
              </Button>
            </Stack>
          </Paper>
        </Box>
      ) : (
        <>
          <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
            <Stack spacing={2}>
              {threadMessages.length === 0 ? (
                <Paper
                  variant="outlined"
                  sx={{ p: 4, textAlign: 'center', borderStyle: 'dashed', bgcolor: 'rgba(255,255,255,0.7)' }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    No reflections posted in this chapter yet
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#71717A' }}>
                    Be the first reader to share a passage or reply to the chapter prompt below.
                  </Typography>
                </Paper>
              ) : (
                threadMessages.map((msg) => {
                  const author = profileMap.get(msg.userId);
                  const role = roleMap.get(msg.userId);
                  const parentMsg = msg.replyToId ? threadMessages.find((m) => m.id === msg.replyToId) : undefined;
                  const parentAuthor = parentMsg ? profileMap.get(parentMsg.userId) : undefined;
                  const isSelf = msg.userId === currentUser.id;

                  return (
                    <Paper
                      key={msg.id}
                      variant="outlined"
                      sx={{
                        p: 2.25,
                        borderRadius: 2,
                        borderColor: isSelf ? '#CBD5E1' : '#E4E0D8',
                      }}
                    >
                      <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
                        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              fontSize: 12,
                              fontWeight: 600,
                              bgcolor: author?.avatarColor || '#1E3A8A',
                            }}
                          >
                            {getInitials(author?.displayName || 'Reader')}
                          </Avatar>
                          <Stack direction="row" sx={{ flexWrap: 'wrap', alignItems: 'center', gap: 0.75 }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary' }}>
                              {author?.displayName || 'Club Reader'}
                            </Typography>
                            {role && role !== 'member' && (
                              <>
                                <Typography variant="caption" sx={{ color: '#A1A1AA' }} aria-hidden="true">
                                  ·
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{ fontWeight: 600, color: 'primary.main', textTransform: 'capitalize' }}
                                >
                                  {role}
                                </Typography>
                              </>
                            )}
                            <Typography variant="caption" sx={{ color: '#A1A1AA' }} aria-hidden="true">
                              ·
                            </Typography>
                            <Typography variant="caption" className="tabular-nums" sx={{ color: '#71717A' }}>
                              {formatMessageTime(msg.createdAt)}
                            </Typography>
                            {msg.pageReference && (
                              <>
                                <Typography variant="caption" sx={{ color: '#A1A1AA' }} aria-hidden="true">
                                  ·
                                </Typography>
                                <Typography
                                  variant="caption"
                                  className="tabular-nums"
                                  sx={{ fontFamily: 'var(--font-mono)', color: 'text.secondary' }}
                                >
                                  p. {msg.pageReference}
                                </Typography>
                              </>
                            )}
                          </Stack>
                        </Stack>

                        {isMember && (
                          <Button
                            size="small"
                            startIcon={<ReplyOutlinedIcon sx={{ fontSize: 15 }} />}
                            onClick={() => setReplyToId(msg.id)}
                            sx={{ color: '#71717A', fontSize: 12, minWidth: 0 }}
                          >
                            Reply
                          </Button>
                        )}
                      </Stack>

                      {parentMsg && (
                        <Box
                          sx={{
                            mt: 1.5,
                            px: 1.5,
                            py: 1,
                            borderRadius: 1,
                            bgcolor: '#F8F6F1',
                            border: '1px solid #E4E0D8',
                          }}
                        >
                          <Typography variant="caption" noWrap color="text.secondary" sx={{ display: 'block' }}>
                            <Box component="strong" sx={{ color: 'text.primary' }}>
                              Replying to {parentAuthor?.displayName || 'Reader'}:
                            </Box>{' '}
                            {parentMsg.body}
                          </Typography>
                        </Box>
                      )}

                      {msg.quoteExcerpt && (
                        <Box
                          component="blockquote"
                          sx={{
                            m: 0,
                            mt: 1.5,
                            px: 2,
                            py: 1.25,
                            borderRadius: 1,
                            bgcolor: '#FBF9F5',
                            border: '1px solid #E4E0D8',
                            fontFamily: 'var(--font-display)',
                            fontStyle: 'italic',
                            fontSize: 14,
                            color: '#27272A',
                          }}
                        >
                          “{msg.quoteExcerpt}”
                        </Box>
                      )}

                      <Typography
                        variant="body2"
                        sx={{
                          mt: 1.5,
                          color: 'text.primary',
                          lineHeight: 1.65,
                          whiteSpace: 'pre-wrap',
                          maxWidth: '70ch',
                        }}
                      >
                        {msg.body}
                      </Typography>
                    </Paper>
                  );
                })
              )}
              <div ref={endRef} />
            </Stack>
          </Box>

          {/* Message Composer */}
          <Box component="footer" sx={{ p: 2, bgcolor: '#FFFFFF', borderTop: '1px solid #E4E0D8' }}>
            {!isMember ? (
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  bgcolor: '#FBF9F5',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Join <Box component="strong" sx={{ color: 'text.primary' }}>{club.name}</Box> as{' '}
                  <Box component="strong" sx={{ color: 'text.primary' }}>{currentUser.displayName}</Box> to post in
                  chapter discussions and log reading progress.
                </Typography>
                <Button variant="contained" size="small" onClick={() => void onJoinClub(club.id)}>
                  Join Reading Circle
                </Button>
              </Paper>
            ) : (
              <Box component="form" onSubmit={(e) => void handleSubmit(e)}>
                <Stack spacing={1.5}>
                  {replyTarget && (
                    <Stack
                      direction="row"
                      sx={{
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        px: 1.5,
                        py: 0.75,
                        borderRadius: 1,
                        bgcolor: '#F8F6F1',
                        border: '1px solid #E4E0D8',
                      }}
                    >
                      <Typography variant="caption" noWrap color="text.secondary">
                        Replying to <strong style={{ color: '#18181B' }}>{replyTargetAuthor?.displayName}</strong>:{' '}
                        {replyTarget.body}
                      </Typography>
                      <IconButton size="small" aria-label="Cancel reply" onClick={() => setReplyToId(null)}>
                        <CloseIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Stack>
                  )}

                  {showQuoteInput && (
                    <Grid container spacing={1.5} sx={{ p: 1.5, borderRadius: 1.5, bgcolor: '#FBF9F5', border: '1px solid #E4E0D8' }}>
                      <Grid size={{ xs: 12, sm: 9 }}>
                        <TextField
                          size="small"
                          fullWidth
                          label="Quoted Passage (optional)"
                          value={quoteExcerpt}
                          onChange={(e) => setQuoteExcerpt(e.target.value)}
                          placeholder="Paste a line from the chapter…"
                          sx={{ bgcolor: '#FFFFFF' }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 3 }}>
                        <TextField
                          size="small"
                          fullWidth
                          type="number"
                          label="Page #"
                          value={pageReference}
                          onChange={(e) => setPageReference(e.target.value)}
                          slotProps={{ htmlInput: { min: 1, max: book.totalPages } }}
                          sx={{ bgcolor: '#FFFFFF' }}
                        />
                      </Grid>
                    </Grid>
                  )}

                  {error && <Alert severity="error">{error}</Alert>}

                  <Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-end' }}>
                    <TextField
                      fullWidth
                      multiline
                      maxRows={4}
                      minRows={2}
                      size="small"
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          void handleSubmit(e);
                        }
                      }}
                      placeholder={`Share thoughts on Chapter ${discussion.chapterNumber}… (Enter to send)`}
                      sx={{ bgcolor: '#FBF9F5' }}
                    />

                    <IconButton
                      onClick={() => setShowQuoteInput((v) => !v)}
                      title="Attach quote and page reference"
                      color={showQuoteInput ? 'primary' : 'default'}
                      sx={{
                        border: '1px solid',
                        borderColor: showQuoteInput ? 'primary.main' : '#D8D2C5',
                        borderRadius: 1.5,
                        height: 40,
                        width: 40,
                      }}
                    >
                      <FormatQuoteIcon fontSize="small" />
                    </IconButton>

                    <Button
                      type="submit"
                      variant="contained"
                      disabled={!body.trim() || sending}
                      endIcon={<SendIcon sx={{ fontSize: 15 }} />}
                      sx={{ height: 40, px: 2.5 }}
                    >
                      {sending ? 'Sending…' : 'Send'}
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            )}
          </Box>
        </>
      )}
    </Box>
  );
}
