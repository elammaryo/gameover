# 🎵 GameOver - Music Producer Portfolio

A modern full-stack portfolio showcasing premium beats, Spotify integration, and
custom audio playback.


### Visit Live Studio:  [GameOver Studio](https://gameover.studio)


## 🚀 Features

- **Custom Audio Player** - Built from scratch with React + HTML5 Audio API
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
├── site.ts           # Nav + social links shared by header and footer
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

## 🎨 Design

A drum-machine / arcade system: ink surfaces, bone text, one **signal red**
for actions and one **live cyan** for whatever is playing. Content brings the
colour.

- **Mark**: a "G" lit on a 5×5 pad grid with one cyan pad mid-hit
  (`app/icon.svg`, `app/favicon.ico`, `app/apple-icon.png`, `public/icons/*`,
  `app/components/brand/`)
- **Type**: Archivo (expanded display), Geist + Geist Mono (UI, HUD labels),
  Silkscreen (arcade moments: hi-scores, the 404)
- **Covers**: every beat gets a generated pad sprite coloured by its mood;
  packs spell their initial on the pad grid
- **Backdrop**: the original aurora shader sampled per cell and drawn as LEDs,
  mounted once in the layout and cross-faded per route
- **Tokens** live in `app/globals.css` (`ink-*`, `bone*`, `signal`, `live`)
  with shared pieces in `app/components/ui.tsx`
- Tailwind CSS v4, Motion for sheets and menus, respects
  `prefers-reduced-motion`

## 👤 Author

**Omer Elammary**

- Website: [omerelammary.com](https://omerelammary.com)
- LinkedIn: [@omerelammary](https://linkedin.com/in/omerelammary)
- GitHub: [@elammaryo](https://github.com/elammaryo)

---

Built with ❤️ using Next.js and deployed on Vercel
