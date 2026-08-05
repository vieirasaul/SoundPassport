# SoundPassport

SoundPassport turns a listener's Spotify taste into a playful, passport-style record of their musical identity. After connecting Spotify, the app transforms top artists, tracks, genres, and listening eras into a seven-page interactive booklet with fictional destinations, artist offices, a traveler classification, and shareable artwork.

## Features

- Personalized musical identity page built from the listener's Spotify profile and top music
- Seven-page animated passport with manual navigation, autoplay, and reduced-motion support
- Top artists and tracks compared across Spotify's short-, medium-, and long-term ranges
- Genre-based fictional territories, artist ambassadors, and a musical nationality
- MusicBrainz enrichment for public artist metadata such as origin, active year, and genre tags
- Traveler profiles based on the overlap between current and long-term favorite artists
- PNG export for the active page and ZIP export for the full passport
- Instagram-compatible image sharing and X share links
- Signed public passport cards with generated Open Graph images
- English, Brazilian Portuguese, and Spanish interfaces with automatic locale detection
- Responsive layout and accessible controls
- Graceful Spotify rate-limit handling with cached fallback data

## Tech stack

| Area | Technology |
| --- | --- |
| Framework | Next.js 16 App Router |
| UI | React 19, TypeScript, Tailwind CSS 4 |
| Authentication | Spotify OAuth 2.0 Authorization Code flow with PKCE |
| Data | Spotify Web API and MusicBrainz Web Service |
| Image export | `html-to-image` |
| Archive export | `JSZip` |
| Icons | Lucide React |
| Quality | ESLint 9 with the Next.js configuration |

## How it works

1. The listener connects through Spotify's authorization page.
2. SoundPassport exchanges the authorization code using PKCE and reads the listener's profile and top listening data.
3. The server combines Spotify rankings from multiple time ranges and enriches public artist information with MusicBrainz.
4. The result is rendered as an interactive passport. Successful snapshots are cached in server memory for 12 hours and can be used as stale fallback data for up to 7 days.
5. The listener can download pages or share a signed summary card. A passport is never made public automatically.

## Requirements

- Node.js 20.9 or newer
- npm
- A Spotify developer application
- OpenSSL, or another way to generate a strong random secret

## Run locally

1. Install the dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template:

   ```bash
   cp .env.example .env.local
   ```

3. Create an application in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).

4. Add this exact redirect URI to the Spotify application's allowlist:

   ```text
   http://127.0.0.1:3000/api/auth/callback
   ```

5. Add the Spotify client ID to `.env.local`, then generate and set the session secret:

   ```bash
   openssl rand -base64 32
   ```

6. Start the development server:

   ```bash
   npm run dev
   ```

7. Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

Use `127.0.0.1`, not `localhost`. Spotify does not accept `localhost` as an HTTP redirect host, and using a different hostname would prevent the temporary OAuth cookies from reaching the callback.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `SPOTIFY_CLIENT_ID` | Yes | Client ID from the Spotify Developer Dashboard. No client secret is needed because the app uses PKCE. |
| `AUTH_SECRET` | Yes | High-entropy value used to encrypt Spotify sessions and sign public passport links. |
| `APP_URL` | Recommended | Canonical application origin used for authentication redirects and share URLs. Defaults to the request origin in authentication flows and to `http://127.0.0.1:3000` when building share URLs. |
| `SPOTIFY_REDIRECT_URI` | Recommended | Exact callback URL registered with Spotify. Falls back to `<request-origin>/api/auth/callback`. |

Example development configuration:

```dotenv
SPOTIFY_CLIENT_ID=your_spotify_client_id
APP_URL=http://127.0.0.1:3000
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/api/auth/callback
AUTH_SECRET=your_generated_secret
```

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js development server. |
| `npm run build` | Create a production build. |
| `npm run start` | Run the production build. |
| `npm run lint` | Run ESLint across the project. |

## Spotify permissions

SoundPassport requests these read-only scopes:

- `user-read-private` — identify the connected Spotify profile
- `user-top-read` — read top artists and tracks across supported time ranges
- `user-read-recently-played` — read recent listening history for future and evolving passport entries

These permissions cannot modify a library, follow artists, create playlists, control playback, publish content, or access payment details.

## Privacy and security

- Spotify handles the sign-in screen; SoundPassport never receives the listener's password.
- OAuth state and the PKCE verifier live in short-lived, HTTP-only cookies.
- Spotify access and refresh tokens are AES-GCM encrypted inside an HTTP-only, same-site session cookie.
- Session cookies expire after 30 days and are marked secure over HTTPS.
- Cached passport snapshots contain derived passport data, not Spotify access tokens. The cache is process-local and disappears when the server restarts.
- Disconnecting clears the browser session and the listener's cached passport snapshot.
- MusicBrainz receives public artist names only, never Spotify credentials or the listener's account identifier.
- Public share URLs contain a limited passport summary protected by an HMAC signature; they do not expose Spotify tokens or the full listening dataset.

## Internationalization

Routes are locale-prefixed and available in:

- English: `/en`
- Brazilian Portuguese: `/pt-BR`
- Spanish: `/es`

The root route chooses a language from the saved locale cookie or the browser's `Accept-Language` header, then redirects to the matching localized route. Translation dictionaries live in `i18n/dictionaries/`.

## Project structure

```text
app/
  [locale]/                  Localized pages and passport experience
  api/auth/spotify/          Login, callback, refresh, and logout routes
components/                  Shared UI and interactive passport components
i18n/                       Locale configuration and translation dictionaries
lib/auth/spotify.ts          PKCE, token exchange, refresh, and session encryption
lib/spotify/data.ts          Spotify queries, MusicBrainz enrichment, and caching
lib/share/passport-token.ts  Signed public-share payloads
proxy.ts                     Locale detection and routing
```

## Production deployment

Build and run the app with:

```bash
npm run build
npm run start
```

For production:

1. Register the production HTTPS callback in the Spotify Developer Dashboard, for example `https://soundpassport.example.com/api/auth/callback`.
2. Set `SPOTIFY_REDIRECT_URI` to that exact callback URL.
3. Set `APP_URL` to the matching canonical origin, without a trailing path.
4. Provide a strong, persistent `AUTH_SECRET`. Changing it invalidates existing sessions and signed share links.
5. Ensure the deployment can make outbound HTTPS requests to Spotify and MusicBrainz.

The passport cache is currently in memory. It is not shared between instances and is cleared on restart, so a distributed deployment should replace it with a shared cache if consistent cross-instance reuse is important.
