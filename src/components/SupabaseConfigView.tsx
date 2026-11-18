import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import type { BackendMode } from '../types/bookClub';
import { FEDERATION_SNIPPET } from '../mfe/federation.config.example';
import { getSupabaseClient } from '../lib/supabase';

interface SupabaseConfigViewProps {
  backendMode: BackendMode;
  isRealtimeConnected: boolean;
}

const ENV_TEMPLATE = `VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
VITE_MFE_SHELL_ORIGIN="http://localhost:5173"`;

const RLS_SUMMARY_SQL = `-- Run full migration at: supabase/migrations/001_book_club_schema.sql
-- Tables provisioned with Row Level Security (RLS):
--   1. public.profiles (synced with auth.users via handle_new_user trigger)
--   2. public.book_clubs (invite codes + public/private visibility)
--   3. public.club_members (host / moderator / member RBAC)
--   4. public.club_books (linked via external_library_book_id to your Library Shell)
--   5. public.chapter_discussions (chapter-indexed threads + spoiler guard)
--   6. public.discussion_messages (real-time chat + quote excerpts + replies)
--   7. public.reading_logs (collective chapter & page progress tracking)`;

export function SupabaseConfigView({
  backendMode,
  isRealtimeConnected,
}: SupabaseConfigViewProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const supabase = getSupabaseClient();

  const handleCopy = async (id: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(id);
      window.setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Clipboard blocked in restricted iframe contexts
    }
  };

  const handleSupabaseAuth = async (mode: 'signin' | 'signup') => {
    if (!supabase || !authEmail.trim() || !authPassword) return;
    setAuthLoading(true);
    setAuthMessage(null);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authPassword,
        });
        if (error) throw error;
        setAuthMessage('Confirmation email sent. Check your inbox to complete registration.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail.trim(),
          password: authPassword,
        });
        if (error) throw error;
        setAuthMessage('Signed in to Supabase session.');
      }
    } catch (err) {
      setAuthMessage(err instanceof Error ? err.message : 'Authentication error');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <Box sx={{ flex: 1, overflowY: 'auto', bgcolor: '#F8F6F1', p: { xs: 3, lg: 4 } }}>
      <Stack spacing={3} sx={{ maxWidth: 920, mx: 'auto' }}>
        <Box sx={{ pb: 2.5, borderBottom: '1px solid #E4E0D8' }}>
          <Typography variant="h4" sx={{ fontSize: 30 }}>
            Supabase & Micro-Frontend Configuration
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 680 }}>
            Connect Folio Circle directly to your Supabase project for Postgres storage, Row Level Security, and Realtime chapter chat, or mount it inside your parent Library Shell.
          </Typography>
        </Box>

        {/* Active Runtime Mode */}
        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            borderRadius: 2,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
            <StorageOutlinedIcon sx={{ color: 'primary.main', mt: 0.25 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {backendMode === 'supabase'
                  ? 'Connected to Supabase Postgres + Realtime'
                  : 'Running on Pure Vite Browser Preview (Supabase Ready)'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {backendMode === 'supabase'
                  ? 'All clubs, chapter discussions, messages, and reading logs are persisted in Supabase with RLS.'
                  : 'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env to switch automatically from browser preview sync to Supabase.'}
              </Typography>
            </Box>
          </Stack>

          <Typography variant="caption" className="tabular-nums" sx={{ fontFamily: 'var(--font-mono)', color: 'text.secondary' }}>
            Sync channel: {isRealtimeConnected ? 'Active' : 'Initializing'}
          </Typography>
        </Paper>

        {/* Supabase Auth Box */}
        {supabase && (
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <SecurityOutlinedIcon sx={{ fontSize: 18, color: 'secondary.main' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Supabase Auth Session
                </Typography>
              </Stack>

              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="email"
                    label="Email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="reader@library.org"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="password"
                    label="Password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                  />
                </Grid>
              </Grid>

              {authMessage && <Alert severity="info">{authMessage}</Alert>}

              <Stack direction="row" spacing={1.25}>
                <Button
                  variant="contained"
                  size="small"
                  disabled={authLoading}
                  onClick={() => void handleSupabaseAuth('signin')}
                >
                  Sign In
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={authLoading}
                  onClick={() => void handleSupabaseAuth('signup')}
                >
                  Create Account
                </Button>
              </Stack>
            </Stack>
          </Paper>
        )}

        {/* .env Configuration */}
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                1. Environment Variables (.env)
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Declared in <code>.env.example</code> and read by <code>src/lib/supabase.ts</code>.
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={copiedKey === 'env' ? <CheckIcon color="secondary" /> : <ContentCopyIcon />}
              onClick={() => void handleCopy('env', ENV_TEMPLATE)}
            >
              {copiedKey === 'env' ? 'Copied' : 'Copy'}
            </Button>
          </Stack>
          <Box
            component="pre"
            sx={{
              m: 0,
              p: 2,
              borderRadius: 1.5,
              bgcolor: '#18181B',
              color: '#F4F4F5',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              overflowX: 'auto',
              lineHeight: 1.6,
            }}
          >
            {ENV_TEMPLATE}
          </Box>
        </Paper>

        {/* SQL Schema & RLS Overview */}
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            2. Supabase PostgreSQL Schema & Row Level Security
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, mb: 1.5 }}>
            Full SQL migration with <code>supabase_realtime</code> publication and RLS policies lives in{' '}
            <code>supabase/migrations/001_book_club_schema.sql</code>.
          </Typography>
          <Box
            component="pre"
            sx={{
              m: 0,
              p: 2,
              borderRadius: 1.5,
              bgcolor: '#18181B',
              color: '#F4F4F5',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              overflowX: 'auto',
              lineHeight: 1.6,
            }}
          >
            {RLS_SUMMARY_SQL}
          </Box>
        </Paper>

        {/* Library Shell MFE Integration */}
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <LayersOutlinedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  3. Mounting inside your Library Shell App
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Import <code>BookClubMfe</code> directly or expose via Vite Module Federation.
                </Typography>
              </Box>
            </Stack>
            <Button
              variant="outlined"
              size="small"
              startIcon={copiedKey === 'mfe' ? <CheckIcon color="secondary" /> : <ContentCopyIcon />}
              onClick={() => void handleCopy('mfe', FEDERATION_SNIPPET)}
            >
              {copiedKey === 'mfe' ? 'Copied' : 'Copy'}
            </Button>
          </Stack>
          <Box
            component="pre"
            sx={{
              m: 0,
              p: 2,
              borderRadius: 1.5,
              bgcolor: '#18181B',
              color: '#F4F4F5',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              overflowX: 'auto',
              lineHeight: 1.6,
            }}
          >
            {FEDERATION_SNIPPET}
          </Box>
        </Paper>
      </Stack>
    </Box>
  );
}
