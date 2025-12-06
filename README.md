# 🎵 GameOver - Music Producer Portfolio

A modern full-stack portfolio showcasing premium beats, Spotify integration, and
custom audio playback.


### Visit Live Studio:  [GameOver Studio](https://gameover.studio)   ![Website Deploy](https://deploy-badge.vercel.app/?url=http%3A%2F%2Fgameover.studio&name=GameOver)


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

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/elammaryo/gameover.git
cd gameover

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Fill in your API keys and secrets

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🔐 Environment Variables

See `.env.example` for required variables:

- **Spotify API**: Get credentials from
  [Spotify Developer Dashboard](https://developer.spotify.com)
- **AWS S3**: Configure bucket and IAM credentials
- **Redirect URI**: Set to `http://localhost:3000/api/spotify/callback` for dev

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

## 🎨 Design

Custom-built with:

- Tailwind CSS for styling
- WebGL shaders for aurora backgrounds
- Motion for smooth animations
- Elastic interactions for slider components

## 📄 License

MIT License - see [LICENSE](LICENSE)

## 🤝 Contributing

This is a personal portfolio project, but feel free to fork and customize for
your own use!

## 👤 Author

**Omer Elammary**

- Website: [gameover.studio](https://gameover.studio)
- LinkedIn: [@omerelammary](https://linkedin.com/in/omerelammary)
- GitHub: [@elammaryo](https://github.com/elammaryo)

---

Built with ❤️ using Next.js and deployed on Vercel
