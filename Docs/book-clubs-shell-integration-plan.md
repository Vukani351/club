# Book clubs in Library UI: club remote split into separate entry points

## Context
`club/` is a complete Supabase-backed club app (`folio_circle_mfe`) that shows up as a single widget with its own top bar: Discussions, Reading Progress, Club Directory, Supabase Config. You don't want to drop that whole app into the shell. Instead, people should enter clubs from the shell, with the directory, club workspace and reading progress each available separately.

Decisions made:
- **Host:** `Library UI` (it has login, the user's books, and routes). The `library-shell` folder is not used.
- **Identity:** keep Supabase for club data, and bridge library users to Supabase users.
- **Reading progress:** stays club-only (it needs a club and a club book), but gets its own entry point.

## Findings that shape the design
- `club/src/mfe/BookClubMfe.tsx` is one 670-line component that holds all state (snapshot, realtime, handlers) and renders the tabs. The views are already separate components: `ClubDirectoryView`, `ReadingProgressView`, `ClubSidebar` + `ChapterRail` + `ChapterChatPane`.
- **Federation mismatch:** `Library UI` uses `@originjs/vite-plugin-federation`, React 18, MUI 5 and Vite 4. `club` uses `@module-federation/vite`, React 19, MUI 9 and Vite 8. A `Library UI` host can't consume the club's remote with the same mechanism as `bookReviewsRemote`.
- **Identity mismatch:** `profiles.id` is a uuid that references `auth.users`, and RLS uses `auth.uid()`. Library users are integer ids from NestJS (`library-backend/src/models/user.model.ts`). The Library UI JWT is verified by `src/auth/auth.guard.ts`.
- `club/src/index.css` is imported only by `main.tsx` (standalone dev), so it doesn't leak into the host.

## Approach

### 1. Split the club remote into three entry modules (`club/`)
- Move the state and handlers out of `BookClubMfe.tsx` into a shared store (`src/mfe/clubStore.ts`). It is a module-level singleton, so the three entries share one snapshot and one realtime subscription. Keep `BookClubMfe.tsx` as a thin composition for the standalone dev app (`App.tsx`).
- New entry components in `src/mfe/`:
  - `ClubDirectoryEntry.tsx` wraps `ClubDirectoryView` plus the create and join modals. Opening or joining a club emits `folio-circle:club-opened`.
  - `ClubWorkspaceEntry.tsx` takes `clubId`. It renders `ClubSidebar`, `ChapterRail` and `ChapterChatPane`, with no top bar and no tabs.
  - `ReadingProgressEntry.tsx` takes an optional `clubId`. With no `clubId` it shows a picker of the user's clubs, so it works as its own page.
- Expose these three in `vite.config.ts` and `package.json` `exports`. Keep `./BookClubMfe` for backwards compatibility. Add the new event type to `MfeHostEvent` in `src/types/bookClub.ts` and `mfeContract.ts`.
- In embedded mode, hide the "Supabase Config" tab and the "Active Reader Session" switcher (`ClubSidebar.tsx` already has `isShellControlled`).
- Wrap each entry in its own `ThemeProvider` and an Emotion `CacheProvider` with a unique key, so MUI 9 styles don't collide with the host's MUI 5.

### 2. Load the remote from Library UI without a downgrade
Keep the club on React 19 and `@module-federation/vite`. In `Library UI`, load it at runtime with `@module-federation/runtime` (`init` + `loadRemote`). That works with any host bundler. Render it inside the host's own `Suspense` and `MfeErrorBoundary` (`Library UI/src/components/Errorbound`). Don't share React between host and remote, so each remote entry uses its own React. Drop the shared `singleton` entries for React, MUI, Emotion and Supabase from the club's federation config.

**Fallback if that spike fails:** move the club to React 18, MUI 5 and `@originjs/vite-plugin-federation`, copying the `book-reviews-mfe` setup. This is a larger change.

### 3. Identity bridge (`library-backend/`)
- New `src/club-auth/` module (`club-auth.module.ts`, `.controller.ts`, `.service.ts`), registered in `app.module.ts`. Endpoint: `POST /club-auth/token`, guarded by `AuthGuard`, reading `req.user.id`.
- The service derives a stable uuid (uuid v5) from the library user id, so no new column or migration is needed. It makes sure a Supabase auth user with that uuid exists, using the Supabase admin API with the service-role key, and it's idempotent. It then signs a short-lived Supabase JWT (`aud: authenticated`, `role: authenticated`, `sub: <uuid>`) with the Supabase JWT secret and returns `{ token, userId, expiresAt }`.
- New server-only env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`. They go in `.env` files only, never in any UI.
- Check that the `handle_new_user` function in `001_book_club_schema.sql` creates the `profiles` row. If not, the service inserts it. The club's existing `upsertProfile` then syncs the display name.
- In `club/src/lib/supabase.ts`, extend `createBookClubSupabaseClient` with an `accessToken` callback. Entries take a `getAccessToken: () => Promise<string>` prop and build their own client, so `Library UI` needs no Supabase dependency. This also handles token refresh (the host calls the backend again).

### 4. Library UI integration
- `package.json`: add `@module-federation/runtime`.
- `src/clubs/loadClubRemote.ts`: registers the remote once (URL from `src/config.ts`, for example `clubRemoteUrl`).
- `src/hooks/useClubSession.ts`: calls `POST /club-auth/token` with the token from `auth-storage` and returns `shellUser` and `getAccessToken`.
- Pages, following `Pages/Wishlist.jsx` and the `BookDetails.tsx` lazy-remote pattern:
  - `Pages/Clubs.tsx` for the directory, at route `/clubs`.
  - `Pages/ClubDetails.tsx` for the workspace, at `/clubs/:clubId`.
  - `Pages/ReadingProgress.tsx` for progress, at `/reading-progress` and `/clubs/:clubId/progress`.
- `App.tsx`: add the routes behind the existing `!!user ? <Page/> : <Login/>` guard. `components/Header.tsx`: add "Book Clubs" and "Reading Progress" links.
- Handle `onHostEvent`: `club-opened` → `navigate('/clubs/:id')`; `open-library-title` → `navigate('/book/:id')`.
- `src/types/remote-modules.d.ts`: declarations for the three modules.
- Optional, later: a "Start a club for this book" button on `BookDetails`, using the existing `initialLibraryBook` prop.

## Order of work
1. Spike: build the club remote and load one entry in `Library UI` via the runtime loader, checking that styles and React are isolated. Decide on the fallback if it fails.
2. Split the entries and the shared store in `club/`.
3. Backend token endpoint and Supabase auth-user creation.
4. Library UI pages, routes, header links, and event handling.
5. Optional: "Start a club" from `BookDetails`.

## Risks
- Supabase projects on asymmetric JWT keys may not accept tokens signed with the legacy JWT secret. Check the project's JWT settings first.
- Two React copies and two MUI versions on one page increase bundle size. This is acceptable for isolation.
- The club needs real Supabase credentials (`club/.env`, from `.env.example`) and the `001_book_club_schema.sql` migration applied.

## Verification
- `club`: `npm run lint` and `npm run build`. Standalone `npm run dev` still works.
- Backend: call `POST /club-auth/token` with a valid Library UI token and without one (expect 401). Decode the returned JWT and check `sub`, `aud` and `exp`. Call it twice for the same user and check that the uuid is the same.
- End to end: start `library-backend`, `club` (port 30001) and `Library UI` (port 8080). Log in, then:
  - Open `/clubs`, create a club, and join it from a second user in another browser profile.
  - Open the workspace, post a message, and check that it appears for both users in realtime.
  - Save progress at `/reading-progress`, and check the row in Supabase `reading_logs` is owned by the right uuid.
  - Check the host page's styles are unchanged and the browser console has no federation errors.
