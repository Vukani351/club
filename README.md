# Folio Circle Book Club

Folio Circle is a Supabase-backed book club application and micro-frontend for a library shell. It lets readers create or join clubs, organize club books, discuss chapters, and track personal and collective reading progress.

The app can run by itself at `http://localhost:30001`, or it can be mounted inside another application through Module Federation. It also includes a browser-only preview mode when Supabase credentials are not configured.

## Features

- Create and join public or private book clubs
- Add books and assign club hosts or moderators
- Organize chapter-based discussions
- Post, quote, and reply to discussion messages
- Track reading chapter, page, status, and notes
- View club directories and reading progress
- Receive live discussion and data updates with Supabase Realtime
- Run with local preview storage without a Supabase project
- Mount as a standalone page or a library-shell micro-frontend

## How it works

### Application structure

- `src/App.tsx` renders the standalone application.
- `src/mfe/BookClubMfe.tsx` is the main embeddable React component.
- `src/mfe/index.ts` exports the component and provides `mountBookClubMfe()` for imperative or non-React hosts.
- `src/components/` contains the club directory, workspace, discussion rail, chat, progress, and configuration views.
- `src/services/bookClubRepository.ts` manages data loading and writes.
- `src/lib/supabase.ts` creates and manages the Supabase client.
- `supabase/migrations/001_book_club_schema.sql` defines the database schema and row-level security policies.

### Data modes

**Supabase mode** is used when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are valid. It provides authentication, database storage, row-level security, and realtime updates.

**Local preview mode** is used when Supabase is not configured. Data is seeded and stored in browser `localStorage`, and separate browser tabs can synchronize through `BroadcastChannel`.

### Shell integration

The project exposes Module Federation entry `./BookClubMfe` through `remoteEntry.js`. It accepts these optional shell properties:

- `shellUser` — the current library user's ID and display name
- `supabaseClient` — an optional host-provided Supabase client
- `initialClubId` — the club to open initially
- `initialLibraryBook` — catalog book details for preselection or club creation
- `embedded` — hides standalone-only presentation
- `onHostEvent` — receives navigation and data events from the micro-frontend

The host contract and proposed Library UI integration are documented in [Docs/book-clubs-shell-integration-plan.md](Docs/book-clubs-shell-integration-plan.md).

## Requirements

- Node.js 20 or newer
- npm
- A Supabase project for persistent and shared data

## Getting started

### 1. Install dependencies

```bash
cd "club"
npm install
```

### 2. Configure Supabase

Copy the environment template:

```bash
cp .env.example .env
```

Set the project URL and anonymous key in `.env`:

```dotenv
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

These values are available from the Supabase project settings under **API**.

### 3. Create the database schema

Open the Supabase SQL Editor for the project and run:

```text
supabase/migrations/001_book_club_schema.sql
```

The migration creates profiles, clubs, memberships, books, discussions, messages, reading logs, realtime support, and row-level security policies.

You can also use the **Supabase Config** tab inside the running app for setup guidance.

### 4. Start the app

```bash
npm run dev
```

Open:

```text
http://localhost:30001
```

Without valid Supabase environment variables, the app starts in local preview mode and data remains in the browser.

## Available commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the standalone app and federation remote on port 30001 |
| `npm run build` | Create a production build in `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run TypeScript checks with `tsc --noEmit` |
| `npm run clean` | Remove the `dist/` directory |

## Supabase setup details

The migration includes the `handle_new_user` trigger, which creates a profile when Supabase Auth creates a user. Users must sign in or sign up through the app's **Supabase Config** view before they can create and update club data protected by row-level security.

For shell integration, a library-shell backend should bridge its authenticated library user to a stable Supabase UUID and pass a short-lived Supabase access token to this app. Do not place the Supabase service-role key or JWT secret in the Vite environment or browser bundle.

## Micro-frontend output

A development build exposes the remote entry at:

```text
http://localhost:30001/remoteEntry.js
```

The available named exports include:

- `./BookClubMfe`
- `./mount`
- `./supabaseClient`
- `./types`

The standalone mount helper can be used as:

```ts
import { mountBookClubMfe } from 'club-mfe';

const mounted = mountBookClubMfe(document.getElementById('club-root')!, {
  shellUser: {
    id: 'supabase-user-uuid',
    displayName: 'Library Reader',
  },
  embedded: true,
});

mounted.update({
  initialClubId: 'club-uuid',
});

// mounted.unmount();
```

## Troubleshooting

### The app opens with a preview or local data message

Check that both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env` are set and that placeholder values are removed. Restart `npm run dev` after changing environment variables.

### Sign-in or database requests fail

Confirm that the migration ran successfully and that email/password authentication is enabled in Supabase Auth. Review the Supabase RLS policies and browser console for authentication errors.

### Realtime messages do not appear

Verify that the tables are included in the Supabase Realtime publication and that `supabase_realtime` is enabled. The migration provides setup guidance for this in the Supabase Config view.

### The federation remote cannot load

Use `http://localhost:30001/remoteEntry.js` during development, and ensure the remote and host allow the required origins. Rebuild after changes to `vite.config.ts` or federated exports.
