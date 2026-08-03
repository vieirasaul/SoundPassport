# SoundPassport

SoundPassport turns Spotify listening data into a personal, passport-style music record.

## Local development

Install dependencies and copy the environment template:

```bash
npm install
cp .env.example .env.local
```

Create an application in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard), then add this exact redirect URI to its allowlist:

```text
http://127.0.0.1:3000/api/auth/callback
```

Add the Spotify client ID to `.env.local` and generate the session encryption secret:

```bash
openssl rand -base64 32
```

Run the app:

```bash
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). Spotify does not accept `localhost` as an HTTP redirect host, and opening the app under a different hostname would prevent the temporary OAuth cookies from reaching the callback.

For production, register the production HTTPS callback in Spotify and set `SPOTIFY_REDIRECT_URI` to that exact URL.
Set `APP_URL` to the matching canonical application origin (for example, `https://soundpassport.example.com`) so login, refresh, and logout never switch hosts.

## Authentication

Authentication uses Spotify Authorization Code with PKCE. OAuth state and the PKCE verifier are stored in short-lived HTTP-only cookies. Spotify access and refresh tokens are stored inside an AES-GCM encrypted, HTTP-only session cookie and are never exposed to client JavaScript.

The app requests `user-read-private`, `user-top-read`, and `user-read-recently-played`. These permissions provide the connected profile, top tracks across Spotify's supported time ranges, and the latest listening-history entries used to build the passport.
