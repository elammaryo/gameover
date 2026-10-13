# 🎵 GameOver - Music Producer Portfolio

A modern full-stack portfolio showcasing premium beats, Spotify integration, and
custom audio playback.


### Visit Live Studio:  [GameOver Studio](https://gameover.studio)


## 🚀 Features

- **Custom Audio Player** - Built from scratch on the HTML5 Audio API, with a
  real queue (play next, add to queue, drag to reorder, shuffle, repeat)
- **Spotify OAuth 2.0** - Full authentication flow with token refresh
- **AWS S3 Integration** - Secure audio delivery with signed URLs
- **Real-time Playback** - Seamless navigation without interrupting music
- **WebGL Shaders** - LED-matrix aurora backdrop that reacts to playback
- **Responsive Design** - Mobile-first approach

## 🛠️ Tech Stack

### Frontend

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Motion (Framer Motion)

### Backend & Cloud

- Next.js API Routes (serverless)
- AWS S3 (audio storage)
- Spotify Web API
- Vercel (hosting)

### Audio

- HTML5 Audio API
- Custom playback controls
- Queue management
- Progress tracking

## 🏗️ Architecture

```
app/
├── api/              # Next.js API routes
│   ├── beats/        # Audio delivery endpoints
│   └── spotify/      # OAuth & data fetching
├── components/       # Reusable React components
├── models/           # TypeScript types
├── providers/        # React Context providers
└── pages/            # Route pages

lib/
├── beats.ts          # Catalogue helpers, formatting, generated cover sprites
├── queue.ts          # The play queue as a pure reducer (tested on its own)
├── playerTime.ts     # Playback position store (read by seek bars only)
├── coverArt.ts       # Beat covers as PNGs for the lock screen
├── toast.ts          # Small confirmations shown above the player
├── site.ts           # Nav + social links shared by header and footer
├── analytics.ts      # PostHog, started from instrumentation-client.ts
├── visitor.ts        # The returning-visitor ID and Omer's ?me switch
├── spotify.ts        # Server-side Spotify token utilities
└── spotify-auth.ts   # Browser login/logout helpers

public/               # Static assets
```

## 🔒 Security

- ✅ Environment variables for all secrets
- ✅ Server-side API calls only
- ✅ S3 signed URLs with expiration
- ✅ OAuth 2.0 with PKCE flow
- ✅ HttpOnly cookies for tokens
- ✅ No hardcoded credentials

## 📝 API Routes

### Audio Delivery

- `GET /api/beats` - List all beats
- `POST /api/beats/signedUrl` - Generate signed S3 URL

### Analytics

- `GET /api/hello` - Set this browser's visitor ID cookie (and the `?me`
  switch); see Analytics below

### Spotify Auth

- `GET /api/spotify/login` - Initiate OAuth flow
- `GET /api/spotify/callback` - Handle OAuth callback
- `GET /api/spotify/token` - Get/refresh access token

### Spotify Data

- `GET /api/spotify/playlists` - Fetch user playlists
- `GET /api/spotify/stats/topTracks` - User's top tracks
- `GET /api/spotify/stats/topArtists` - User's top artists

### Renewing the public Spotify stats token

The public About page uses the server-side `SPOTIFY_REFRESH_TOKEN`. Spotify
refresh tokens expire after six months, so renew it locally when the stats stop
appearing:

1. In the Spotify developer dashboard, add `http://127.0.0.1:8888/callback` to
   the app's Redirect URIs.
2. From this project, run `npm run spotify:renew-token` and approve Spotify
   access in the browser.
3. Copy the token printed in the terminal to Vercel as
   `SPOTIFY_REFRESH_TOKEN`, then redeploy.

Never commit or expose the printed token; it grants access to the authorized
Spotify account.

## 🎧 Player

One player object for the whole visit (`app/providers/player.ts`) owns the
queue, beat playback, Spotify playback and the OS media controls. Components
read it through hooks in `PlayBarProvider.tsx` (`usePlayer`, `useNowPlaying`,
`usePlayerSelect`); long lists subscribe narrowly so queue edits don't
re-render every row.

- **Beats** (`app/providers/beatEngine.ts`): one `<audio>` element. Every
  load gets a token, so a skip during a load simply replaces it. S3 links
  are reused for 40 minutes at most; if a link expires mid-track or the
  download stalls, the engine fetches a fresh one and carries on from the
  same second. The next beat's link is fetched ahead of time. Beats that
  won't load are skipped with a note (three in a row and it stops and says
  so). Skips and pauses fade briefly, except where the browser can't (iOS,
  background tabs). With the screen off, a silent clip on a second element
  bridges each track change until the next track plays: iOS only keeps a
  page running in the background while it's playing audio, and would
  otherwise suspend it while the next track loads. While a beat plays the
  page also declares itself a music player (`navigator.audioSession`).
- **Streaming copies** (`lib/streamCopy.ts`): beats whose masters are
  lossless (WAV, AIFF, FLAC) stream from an MP3 copy at 320 kbps once
  there is one (`Beats/stream/<id>.mp3`, next to the master): a quarter of
  the data or less, so playback doesn't stutter on a slow or busy
  connection (a phone's Wi-Fi shares its radio with Bluetooth headphones).
  `npm run stream-copies` makes the missing ones (needs ffmpeg, and the S3
  settings in `.env.local` for a key that can write to the bucket); the
  site picks them up within a few minutes, with no deploy.
- **Queue** (`lib/queue.ts`): what you started (a studio list, a pack, a
  playlist) plays in order or shuffled; *Play next* / *Add to queue* (the ⋯
  on a row) go ahead of it. Reorder by dragging the handle (or focus it and
  use ↑ ↓), remove, clear, shuffle (the rest of the whole list, shuffled;
  turning it off carries on in order), repeat off / all / one. The
  *Previous* button restarts the track after 3 seconds.
- **Spotify**: the Web Playback SDK plays the run of Spotify tracks from the
  current one; the queue follows Spotify as it moves on, and takes over at
  the next track change if you edited the queue or a beat comes next.
- **Phones** (like Spotify): the dock and the Now Playing artwork are pages
  of a carousel (`TrackPager.tsx`): they follow your finger with the
  previous and next tracks either side; let go past halfway or flick to
  change track (swiping back always goes to the previous track), otherwise
  they spring back. Swipe up on the dock to open Now Playing; pull the sheet
  down from anywhere to close it (`useSheetDrag.ts`): it follows the finger
  and closes when pulled far enough or flicked.
- **Motion**: track changes slide in the direction you skipped (dock, Now
  Playing, the list's highlight). Reduced motion keeps only fades.
- **Keys**: Space plays / pauses anywhere (outside inputs); media keys and
  lock-screen controls work through the Media Session API.

The queue rules have tests (`tests/queue.test.mjs`): run `npm test`.

## 🎨 Design

A drum-machine / arcade system on ink surfaces with bone text. Each section
keeps its own colours (home cyan/pink/purple, studio red, Spotify green,
about purple, tech indigo/cyan), set on `<html data-theme>` by
`lib/theme.ts` and used through the `--color-theme*` tokens.

- **Title**: the original GAMEOVER logotype and gradient, traced to vector
  (`public/brand/gameover-wordmark.svg`, `app/components/brand/Wordmark.tsx`)
- **Icon**: the title's G as a liquid-chrome slab (`public/brand/gameover-g*`,
  `public/gameover-icon.svg`, `app/favicon.ico`, `app/apple-icon.png`,
  `public/icons/*`). In the icon tiles the G sits 2 units left of and 1 up
  from its box's centre (of 90 × 88): its flat right side outweighs the
  curve, so centring the box made it look shifted right. Live on the site
  it's WebGL (`brand/GIcon.tsx`): it
  leans toward the pointer, flips like a coin, bounces on the beat and
  glitches now and then. `scripts/build-g-icon.py` builds its distance field.
- **Title screen → studio**: START plays a stage transition
  (`StageTransition.tsx`): a portal into an LED warp, a "STAGE 01" card over a
  16-step sequencer, and an 808 drop that breaks the screen into pixels.
  Sound effects are synthesised with Web Audio (`lib/sfx.ts`) and can be
  switched off on the title screen. Their audio engine closes a few seconds
  after the last sound: while one is open, Safari runs all of the page's
  audio, the beat included, on a tiny buffer, which can stutter.
- **Beat sync**: `lib/beatClock.ts` turns the playing beat's BPM and position
  into kick / hi-hat envelopes; the LED backdrop, meters and cover playheads
  move in time. Clicks send ripples through the LED wall.
- **Type**: Archivo (expanded display), Geist + Geist Mono (UI, HUD labels),
  Silkscreen (arcade moments: the title screen HUD, the 404)
- **Covers**: every beat gets a generated pad sprite coloured by its mood;
  packs spell their initial on the pad grid
- **Backdrop**: the original aurora shader sampled per cell and drawn as LEDs,
  mounted once in the layout and cross-faded per route
- **Glow cards**: hover a card (press it, on a phone) and its glass lights up
  in the card's own colour: a pool of tint under the pointer, a lit rim, a
  sheen and a coloured shadow. Add `glow-card` and set `--glow`; children
  pop with the `lit:` variant (`lit:scale-110`, `lit:text-(--glow)`). One
  listener keeps the light under the pointer
  (`app/components/arcade/useGlowTracker.ts`). Socials light up in their
  platform's colours (`lib/site.ts`).
- Tailwind CSS v4, Motion for sheets and menus; everything respects
  `prefers-reduced-motion`

## 🕹️ Arcade layer

Small game touches that answer what you do (`app/components/arcade`,
`lib/arcade.ts`, mounted once in the layout). Spoilers:

- **Trophies** (`lib/trophies.ts`): 12 achievements, saved on the device.
  An "Achievement unlocked" toast pops for each; the About page has the
  trophy case (with hints) and the footer keeps count.
- **Tap along**: while a beat plays, tap on any empty part of a page (not
  the footer's GAMEOVER, which has its own thing). Each tap shows a note;
  after three in time it says GO, then grades each tap (PERFECT / GREAT /
  GOOD / MISS) against your own groove and counts the combo; every 8 is a
  milestone, 32 sets the LED wall off.
- **Typed codes**: `gameover` switches the screen off like a CRT, winds the
  beat down like a tape and counts down CONTINUE? (any key or tap brings it
  all back); `808` drops an 808. On phones: search for either in the
  studio, or tap the giant GAMEOVER at the bottom of a page until it fills
  up (each tap lights more of it).
- Pixel bursts come from one canvas (`Particles.tsx`) that only runs while
  something is flying. Sounds only ever answer a click or key press.

## 📈 Analytics

Two, for different depths, both counting gameover.studio only. Added on
2026-10-13, the same setup as omerelammary.com.

- **Vercel Web Analytics** (`app/components/SiteAnalytics.tsx`): page views,
  visitors, countries, devices and referrers, without cookies. In the Vercel
  dashboard.
- **PostHog** (`lib/analytics.ts`, started from `instrumentation-client.ts`
  before React hydrates): city-level location, device, referrers, page changes
  (the music keeps playing between pages, so most moves never reload),
  recordings of how people use the studio, and the same browser coming back
  over weeks. Free tier. It shares a PostHog project with omerelammary.com
  (us.posthog.com, project 150186) because PostHog's free plan allows one
  project per organization; the two sites are told apart by domain. Recordings
  are switched on in the project's settings.
  - Everything goes through `/coin`, which `next.config.ts` rewrites to
    PostHog's servers, so the browser only talks to gameover.studio and
    blockers that filter by domain let it through. `skipTrailingSlashRedirect`
    is on because PostHog's API paths end in a slash and the SDK's POSTs don't
    survive a redirect; pages answer with or without the slash.
  - A returning visitor is a returning browser, known by `go_id`: a random
    UUID that the site's server sets for 400 days (`app/api/hello/route.ts`)
    on a browser's first visit. It comes from the server because Safari
    deletes what a page's script stores after seven days of Safari use without
    the visitor interacting with the site, and a cookie set in an HTTP response
    isn't covered by that. Each browser gets an anonymous profile in PostHog's
    People tab. A phone and a laptop are still two visitors.
  - Omer's own browsers: `gameover.studio/?me`, opened once on each, has the
    server set `go_me` for 400 days; PostHog then never loads there and Vercel
    Analytics drops every event. `/?notme` undoes it. The flag leaves the
    address bar as the page loads, and a toast confirms the switch.
  - Inputs are masked in recordings. Canvases (the LED backdrop, the G, the
    stage transition, the arcade's particles) come out empty in a replay.
  - `npm test` covers the ID route (`tests/hello.test.mjs`).

## 👤 Author

**Omer Elammary**

- Website: [omerelammary.com](https://omerelammary.com)
- LinkedIn: [@omerelammary](https://linkedin.com/in/omerelammary)
- GitHub: [@elammaryo](https://github.com/elammaryo)

---

Built with ❤️ using Next.js and deployed on Vercel
