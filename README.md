# 🎵 GameOver - Music Producer Portfolio

A modern full-stack portfolio showcasing premium beats, Spotify integration, and
custom audio playback.


### Visit Live Studio:  [GameOver Studio](https://gameover.studio)


## 🚀 Features

- **Custom Audio Player** - Built from scratch with React + HTML5 Audio API
- **Spotify OAuth 2.0** - Full authentication flow with token refresh
- **AWS S3 Integration** - Secure audio delivery with signed URLs
- **Real-time Playback** - Seamless navigation without interrupting music
- **WebGL Shaders** - Aurora background animations
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
└── spotify.ts        # Spotify API utilities

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

Custom-built with:

- Tailwind CSS for styling
- WebGL shaders for aurora backgrounds
- Motion for smooth animations
- Elastic interactions for slider components

## 👤 Author

**Omer Elammary**

- Website: [omerelammary.com](https://omerelammary.com)
- LinkedIn: [@omerelammary](https://linkedin.com/in/omerelammary)
- GitHub: [@elammaryo](https://github.com/elammaryo)

---

Built with ❤️ using Next.js and deployed on Vercel
