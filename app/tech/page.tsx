'use client'

import { Fragment } from 'react'
import {
  Cloud,
  Code2,
  Cookie,
  Database,
  DatabaseZap,
  Workflow
} from 'lucide-react'
import {
  SiAmazonwebservices,
  SiFramer,
  SiGithub,
  SiNextdotjs,
  SiReact,
  SiSpotify,
  SiTailwindcss,
  SiTypescript,
  SiVercel
} from 'react-icons/si'
import {
  CtaBand,
  Page,
  PageHeader,
  SectionHeader,
  StatStrip
} from '../components/ui'
import { GITHUB_URL } from '@/lib/site'
import { cn } from '@/lib/utils'

type Tech = {
  name: string
  description?: string
  icon: React.ComponentType<{ className?: string }>
  color?: string
}

const STACK: Array<{
  category: string
  icon: React.ComponentType<{ className?: string }>
  technologies: Tech[]
}> = [
  {
    category: 'Languages & framework',
    icon: Code2,
    technologies: [
      {
        name: 'Next.js 16',
        icon: SiNextdotjs,
        color: '#FFFFFF',
        description: 'React framework + API routes'
      },
      { name: 'React 19', icon: SiReact, color: '#61DAFB', description: 'Client UI + playback context' },
      { name: 'TypeScript', icon: SiTypescript, color: '#3178C6', description: 'Strict mode, app to API' },
      { name: 'Tailwind CSS', icon: SiTailwindcss, color: '#06B6D4', description: 'Design tokens + utilities' },
      { name: 'Motion (Framer)', icon: SiFramer, color: '#FF0055', description: 'Menus, sheets and panels' }
    ]
  },
  {
    category: 'Cloud & backend',
    icon: Cloud,
    technologies: [
      {
        name: 'AWS S3',
        icon: SiAmazonwebservices,
        color: '#FF9900',
        description: 'Cloud storage for audio files'
      },
      {
        name: 'Spotify API + OAuth 2.0',
        icon: SiSpotify,
        color: '#1DB954',
        description: 'Web Playback SDK + token refresh'
      },
      {
        name: 'Vercel',
        icon: SiVercel,
        color: '#FFFFFF',
        description: 'Serverless deployment & hosting'
      }
    ]
  },
  {
    category: 'State & data',
    icon: Database,
    technologies: [
      {
        name: 'React Context API',
        icon: Workflow,
        description: 'Global playback state & queue management'
      },
      {
        name: 'In-memory caching',
        icon: DatabaseZap,
        description: 'S3 URL caching with 55min expiration'
      },
      {
        name: 'Cookie-based sessions',
        icon: Cookie,
        description: 'Spotify OAuth token storage'
      }
    ]
  }
]

const FEATURES = [
  {
    title: 'Spotify OAuth 2.0 integration',
    description:
      'Full OAuth flow with cookie-based session management, automatic token refresh, and server-side token caching. Supports both client credentials and user authorization flows.',
    color: 'var(--color-spotify)'
  },
  {
    title: 'AWS S3 pre-signed URLs',
    description:
      'Dynamic audio delivery with 55-minute URL expiration and intelligent caching. Server-side signing prevents credential exposure while maintaining performance.',
    color: 'var(--color-live)'
  },
  {
    title: 'Dual audio sources',
    description:
      'Unified playback interface supporting both HTML5 Audio API for beats and Spotify Web Playback SDK for streaming. Context-aware controls adapt to the active source.',
    color: '#FF8A2A'
  },
  {
    title: 'Persistent audio playback',
    description:
      'Audio continues playing seamlessly across page navigation using React Context and root layout mounting. Smart state management prevents interruptions during route changes.',
    color: '#A78BFA'
  }
]

const ROUTES: Array<{
  group: string
  routes: Array<{ method: 'GET' | 'POST'; endpoint: string; description: string }>
}> = [
  {
    group: 'Audio delivery',
    routes: [
      { method: 'GET', endpoint: '/api/beats', description: 'Returns all beats with metadata' },
      { method: 'GET', endpoint: '/api/beats/playlists', description: 'Returns the beat packs' },
      {
        method: 'POST',
        endpoint: '/api/beats/signedUrl',
        description: 'Generates a signed URL for a specific beat'
      }
    ]
  },
  {
    group: 'Spotify OAuth',
    routes: [
      {
        method: 'GET',
        endpoint: '/api/spotify/login',
        description: 'Initiates Spotify OAuth 2.0 authorization flow'
      },
      {
        method: 'GET',
        endpoint: '/api/spotify/callback',
        description: 'Handles OAuth callback and exchanges code for tokens'
      },
      {
        method: 'GET',
        endpoint: '/api/spotify/token',
        description: 'Retrieves or refreshes Spotify access token'
      },
      {
        method: 'POST',
        endpoint: '/api/spotify/logout',
        description: 'Clears the Spotify session cookies'
      }
    ]
  },
  {
    group: 'Spotify data',
    routes: [
      {
        method: 'GET',
        endpoint: '/api/spotify/playlists',
        description: 'Fetches user playlists from Spotify API'
      },
      {
        method: 'GET',
        endpoint: '/api/spotify/playlist/[id]',
        description: 'Fetches one playlist with its tracks'
      },
      {
        method: 'GET',
        endpoint: '/api/spotify/stats/topTracks',
        description: 'Fetches user’s most played tracks'
      },
      {
        method: 'GET',
        endpoint: '/api/spotify/stats/topArtists',
        description: 'Fetches user’s top artists'
      }
    ]
  }
]

// Real code from app/providers/PlayBarProvider.tsx
const SNIPPET = `// Reuse a signed S3 URL until it's about to expire
const cached = urlCache.get(track.id)
const now = Date.now()
let audioUrl: string

if (cached && cached.expiresAt > now) {
  audioUrl = cached.url
} else {
  const url = await getBeatSignedUrl(track.id)
  const expiresAt = now + 55 * 60 * 1000
  audioUrl = url
  setUrlCache(prev => new Map(prev).set(track.id, { url, expiresAt }))
}

setSelectedTrack({ ...track, audioUrl })
setIsPlaying(true)`

const SECURITY = [
  {
    title: 'Token & session security',
    points: [
      'Spotify tokens stored in HttpOnly, Secure cookies and cleared on logout',
      'Refresh flow runs server-side only; client never sees secrets',
      'Short-lived access tokens; refresh token retained for 30 days'
    ]
  },
  {
    title: 'Signed URL access control',
    points: [
      'S3 pre-signed URLs generated per request with 55-minute expiry',
      'Bucket kept private; audio is never publicly exposed',
      'URLs cached with TTL to avoid stale or reused links'
    ]
  },
  {
    title: 'API design & validation',
    points: [
      'Beat/playlist IDs and required fields are validated before calling Spotify/S3',
      'All secrets stay server-side; Spotify client secret never ships to the client',
      'API routes handle OAuth exchanges and signing; UI consumes safe endpoints'
    ]
  },
  {
    title: 'Resilience & error handling',
    points: [
      'Graceful fallbacks between Spotify SDK and HTML5 Audio playback',
      'Ad-block detection with user-facing guidance instead of silent failure',
      'Consistent try/catch with user-friendly error states in the UI'
    ]
  }
]

/* Tiny highlighter: enough for one TypeScript snippet, no dependency. */
const TOKEN =
  /(\/\/[^\n]*)|('(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|\b(const|let|if|else|await|new|return|async)\b|\b(\d+)\b|([A-Za-z_$][\w$]*)(?=\()|(:\s*string)\b/g

function highlight(code: string) {
  const out: React.ReactNode[] = []
  let last = 0
  for (const m of code.matchAll(TOKEN)) {
    const i = m.index ?? 0
    if (i > last) out.push(code.slice(last, i))
    const [text, comment, str, kw, num, fn, type] = m
    const cls = comment
      ? 'text-bone-dim italic'
      : str
        ? 'text-[#C6F432]'
        : kw
          ? 'text-signal-hi'
          : num
            ? 'text-warn'
            : fn
              ? 'text-live'
              : type
                ? 'text-[#A78BFA]'
                : ''
    out.push(
      <span key={i} className={cls}>
        {text}
      </span>
    )
    last = i + text.length
  }
  out.push(code.slice(last))
  return out
}

export default function TechPage() {
  return (
    <Page>
      <PageHeader eyebrow='Tech stack' title='Built for performance & creativity'>
        A modern full stack Next.js portfolio with OAuth 2.0, AWS cloud
        integration, and custom audio playback architecture.
      </PageHeader>

      {/* STACK */}
      <section aria-labelledby='stack' className='mt-16 sm:mt-20'>
        <SectionHeader id='stack' eyebrow='The stack' title='What it runs on' />
        <div className='flex flex-col gap-3 sm:gap-4'>
          {STACK.map(group => {
            const GroupIcon = group.icon
            return (
              <div
                key={group.category}
                className='surface grid gap-5 rounded-3xl p-4 sm:p-6 lg:grid-cols-[15rem_1fr] lg:gap-8'
              >
                <div className='flex items-center gap-3 px-1 lg:flex-col lg:items-start lg:gap-4 lg:px-2 lg:pt-2'>
                  <span className='flex size-11 items-center justify-center rounded-xl bg-white/[0.05] text-bone ring-1 ring-white/10 ring-inset'>
                    <GroupIcon className='size-5' />
                  </span>
                  <h3 className='font-display-tight text-xl text-bone'>
                    {group.category}
                  </h3>
                </div>
                <ul className='grid gap-2 sm:grid-cols-2 xl:grid-cols-3'>
                  {group.technologies.map(tech => {
                    const Icon = tech.icon
                    return (
                      <li
                        key={tech.name}
                        className='group flex items-center gap-3.5 rounded-2xl border border-line bg-white/[0.02] p-3 transition-colors hover:border-line-strong hover:bg-white/[0.04]'
                      >
                        <span
                          className='flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-bone-muted transition-transform duration-300 ease-snap group-hover:scale-105'
                          style={tech.color ? { color: tech.color } : undefined}
                        >
                          <Icon className='size-[22px]' />
                        </span>
                        <span className='flex min-w-0 flex-col'>
                          <span className='font-semibold text-bone'>{tech.name}</span>
                          {tech.description && (
                            <span className='text-[13px] text-bone-dim'>
                              {tech.description}
                            </span>
                          )}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      </section>

      {/* FEATURES */}
      <section aria-labelledby='features' className='mt-20 sm:mt-28'>
        <SectionHeader id='features' eyebrow='Key features' title='What makes it tick' />
        <ol className='grid gap-3 sm:gap-4 md:grid-cols-2'>
          {FEATURES.map((feature, i) => (
            <li
              key={feature.title}
              className='surface relative isolate flex flex-col gap-4 overflow-hidden rounded-3xl p-6 sm:p-8'
              style={{
                backgroundImage: `radial-gradient(60% 80% at 100% 0%, color-mix(in srgb, ${feature.color} 10%, transparent), transparent 70%)`
              }}
            >
              <span className='flex items-center gap-3'>
                <span
                  aria-hidden
                  className='size-2 rounded-[2px]'
                  style={{
                    backgroundColor: feature.color,
                    boxShadow: `0 0 10px ${feature.color}`
                  }}
                />
                <span className='tabular font-mono text-xs tracking-[0.2em] text-bone-dim'>
                  0{i + 1}
                </span>
              </span>
              <h3 className='font-display-tight text-xl text-bone sm:text-2xl'>
                {feature.title}
              </h3>
              <p className='text-[15px] leading-relaxed text-bone-muted'>
                {feature.description}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* API ROUTES */}
      <section aria-labelledby='api' className='mt-20 sm:mt-28'>
        <SectionHeader id='api' eyebrow='Backend' title='API routes' />
        <div className='surface overflow-hidden rounded-3xl'>
          {ROUTES.map((group, gi) => (
            <Fragment key={group.group}>
              <h3
                className={cn(
                  'hud-label bg-white/[0.02] px-5 py-3.5 sm:px-6',
                  gi > 0 && 'border-t border-line'
                )}
              >
                {group.group}
              </h3>
              <ul>
                {group.routes.map(route => (
                  <li
                    key={route.endpoint}
                    className='grid grid-cols-[3.75rem_minmax(0,1fr)] items-baseline gap-x-4 gap-y-1 border-t border-line px-5 py-3.5 sm:px-6 md:grid-cols-[3.75rem_minmax(0,19rem)_1fr]'
                  >
                    <span
                      className={cn(
                        'inline-flex h-6 w-fit items-center rounded-md px-2 font-mono text-[10.5px] font-medium tracking-[0.08em]',
                        route.method === 'GET'
                          ? 'bg-live/10 text-live ring-1 ring-live/25 ring-inset'
                          : 'bg-warn/10 text-warn ring-1 ring-warn/25 ring-inset'
                      )}
                    >
                      {route.method}
                    </span>
                    <code className='truncate font-mono text-[13px] text-bone sm:text-sm'>
                      {route.endpoint}
                    </code>
                    <span className='col-start-2 text-sm text-bone-muted md:col-start-auto'>
                      {route.description}
                    </span>
                  </li>
                ))}
              </ul>
            </Fragment>
          ))}
        </div>
      </section>

      {/* CODE */}
      <section aria-labelledby='code' className='mt-20 sm:mt-28'>
        <SectionHeader id='code' eyebrow='Under the hood' title='Signed audio, cached' />
        <figure className='overflow-hidden rounded-3xl border border-line-strong bg-ink-950/80 shadow-[0_40px_90px_-50px_rgb(0_0_0/0.9)]'>
          <figcaption className='flex items-center gap-4 border-b border-line bg-white/[0.03] px-5 py-3'>
            <span aria-hidden className='flex gap-1.5'>
              <span className='size-2.5 rounded-[3px] bg-signal' />
              <span className='size-2.5 rounded-[3px] bg-warn' />
              <span className='size-2.5 rounded-[3px] bg-live' />
            </span>
            <span className='font-mono text-xs text-bone-muted'>
              providers/PlayBarProvider.tsx
            </span>
          </figcaption>
          <pre className='overflow-x-auto p-5 text-[13px] leading-[1.75] sm:p-6 sm:text-sm'>
            <code className='font-mono text-bone-muted'>{highlight(SNIPPET)}</code>
          </pre>
        </figure>
      </section>

      {/* PERFORMANCE */}
      <section aria-labelledby='performance' className='mt-20 sm:mt-28'>
        <SectionHeader id='performance' eyebrow='Performance' title='Fast by default' />
        <StatStrip
          items={[
            { label: 'First load', value: '<2s', accent: 'var(--color-live)' },
            { label: 'Bundle size', value: '~220KB', accent: '#A78BFA' },
            { label: 'Lighthouse', value: '95+', accent: 'var(--color-spotify)' }
          ]}
        />
      </section>

      {/* SECURITY */}
      <section aria-labelledby='security' className='mt-20 sm:mt-28'>
        <SectionHeader
          id='security'
          eyebrow='Security & best practices'
          title='Locked down'
        />
        <div className='grid gap-3 sm:gap-4 md:grid-cols-2'>
          {SECURITY.map(item => (
            <article key={item.title} className='surface rounded-3xl p-6 sm:p-7'>
              <h3 className='font-display-tight text-lg text-bone sm:text-xl'>
                {item.title}
              </h3>
              <ul className='mt-4 flex flex-col gap-3'>
                {item.points.map(point => (
                  <li
                    key={point}
                    className='flex gap-3 text-[15px] leading-relaxed text-bone-muted'
                  >
                    <span
                      aria-hidden
                      className='mt-[0.6em] size-1.5 shrink-0 rounded-[2px] bg-live'
                    />
                    {point}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <CtaBand
        className='mt-24 sm:mt-32'
        icon={<SiGithub />}
        accent='var(--color-bone)'
        title='Check out the code'
        href={GITHUB_URL}
        cta='View on GitHub'
      >
        View the full source code, architecture decisions, and implementation
        details. Clean codebase, full TypeScript, production-ready.
      </CtaBand>
    </Page>
  )
}
