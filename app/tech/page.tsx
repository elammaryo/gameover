'use client'

import { useEffect } from 'react'
import { NavBar } from '../components/NavBar'
import BlurText from '../components/BlurText'
import Aurora from '../components/Aurora'
import {
  SiReact,
  SiNextdotjs,
  SiTypescript,
  SiTailwindcss,
  SiAmazon,
  SiSpotify,
  SiVercel,
  SiFramer
} from 'react-icons/si'
import { HiServer, HiSparkles } from 'react-icons/hi2'
import { HiCode } from 'react-icons/hi'

const techStack = [
  {
    category: 'Frontend',
    icon: <HiCode size={24} />,
    technologies: [
      {
        name: 'Next.js 16',
        icon: <SiNextdotjs size={32} />,
        color: '#FFFFFF',
        description: 'UI framework + API routes'
      },
      { name: 'React 19', icon: <SiReact size={32} />, color: '#61DAFB' },
      {
        name: 'TypeScript',
        icon: <SiTypescript size={32} />,
        color: '#3178C6'
      },
      {
        name: 'Tailwind CSS',
        icon: <SiTailwindcss size={32} />,
        color: '#06B6D4'
      },
      {
        name: 'Motion (Framer)',
        icon: <SiFramer size={32} />,
        color: '#FF0055'
      }
    ]
  },
  {
    category: 'Backend & Infrastructure',
    icon: <HiServer size={24} />,
    technologies: [
      { name: 'AWS S3', icon: <SiAmazon size={32} />, color: '#FF9900' },
      { name: 'Vercel', icon: <SiVercel size={32} />, color: '#FFFFFF' },
      {
        name: 'Spotify API',
        icon: <SiSpotify size={32} />,
        color: '#1DB954',
        description: 'Web Playback SDK (coming soon)'
      }
    ]
  },
  {
    category: 'Creative & UI',
    icon: <HiSparkles size={24} />,
    technologies: [
      {
        name: 'Custom Audio Player',
        description: 'Built-in controls & visualizer'
      },
      {
        name: 'Elastic Interactions',
        description: 'Physics-based UI components'
      },
      {
        name: 'Dynamic Animations',
        description: 'Motion-powered transitions'
      }
    ]
  }
]

const features = [
  {
    title: 'AWS S3 Audio Delivery',
    description:
      'Next.js API routes generate signed URLs for secure, real-time beat streaming from S3.',
    gradient: 'from-cyan-500 to-blue-600'
  },
  {
    title: 'Custom Audio Player',
    description:
      'Built from scratch with seek controls, volume management, and playback queue system.',
    gradient: 'from-purple-500 to-fuchsia-600'
  },
  {
    title: 'Spotify Integration',
    description:
      'Server-side API routes fetch playlists. Web Playback SDK coming soon for in-app streaming.',
    gradient: 'from-green-500 to-emerald-600'
  },
  {
    title: 'Serverless Architecture',
    description:
      'Edge-optimized API routes deployed on Vercel with automatic scaling and global CDN distribution.',
    gradient: 'from-orange-500 to-red-600'
  }
]

export default function TechPage() {
  useEffect(() => {
    const overlay = document.getElementById('transition-overlay')
    const label = document.getElementById('transition-label')

    if (label) {
      label.classList.remove('opacity-100', 'glitch-once')
    }

    if (overlay) {
      overlay.style.opacity = '1'
      requestAnimationFrame(() => {
        overlay.style.opacity = '0'
      })
    }
  }, [])

  return (
    <main className='relative min-h-screen bg-[#07050A] pt-10 text-white'>
      {/* Aurora background */}
      <div className='pointer-events-none fixed inset-0 opacity-30'>
        <Aurora
          colorStops={['#5227FF', '#00eaff', '#ff00ea']}
          amplitude={1.5}
          blend={0.6}
          speed={0.3}
        />
      </div>

      <NavBar selectedTab='tech' />

      <div className='relative z-10 mx-auto max-w-6xl px-4 pt-24 pb-16 sm:px-6'>
        {/* HEADER */}
        <header className='mb-16 flex flex-col gap-6'>
          <h1 className='font-mono text-xs tracking-[0.35em] text-gray-400 uppercase sm:text-sm'>
            Tech Stack
          </h1>
          <BlurText
            text='Built for Performance & Creativity'
            delay={50}
            animateBy='words'
            direction='top'
            className='text-4xl font-bold sm:text-5xl lg:text-6xl'
          />
          <p className='max-w-4xl text-lg text-gray-300 sm:text-xl'>
            A modern full-stack web app powered by Next.js, AWS cloud storage,
            and custom-built audio playback.
          </p>
        </header>

        {/* TECH STACK SECTIONS */}
        <section className='mb-20 space-y-12'>
          {techStack.map((section, idx) => (
            <div
              key={section.category}
              className='rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10'
            >
              <div className='mb-6 flex items-center gap-3'>
                <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-fuchsia-600'>
                  {section.icon}
                </div>
                <h2 className='text-2xl font-semibold'>{section.category}</h2>
              </div>

              <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
                {section.technologies.map(tech => (
                  <div
                    key={tech.name}
                    className='group flex items-center gap-4 rounded-xl border border-white/5 bg-black/20 p-4 transition-all hover:border-white/20 hover:bg-white/5'
                  >
                    {'icon' in tech && tech.icon && (
                      <div
                        className='flex h-12 w-12 items-center justify-center rounded-lg transition-transform group-hover:scale-110'
                        style={{ color: tech.color }}
                      >
                        {tech.icon}
                      </div>
                    )}
                    <div className='flex flex-col'>
                      <span className='font-semibold'>{tech.name}</span>
                      {'description' in tech && tech.description && (
                        <span className='text-sm text-gray-400'>
                          {tech.description}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* FEATURES GRID */}
        <section className='mb-20'>
          <h2 className='mb-8 font-mono text-xs tracking-[0.35em] text-gray-400 uppercase'>
            Key Features
          </h2>
          <div className='grid gap-6 md:grid-cols-2'>
            {features.map((feature, idx) => (
              <div
                key={feature.title}
                className='group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-white/20'
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-10`}
                />
                <div className='relative z-10'>
                  <h3 className='mb-3 text-xl font-semibold'>
                    {feature.title}
                  </h3>
                  <p className='text-gray-300'>{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* API ROUTES SECTION */}
        <section className='mb-20'>
          <h2 className='mb-8 font-mono text-xs tracking-[0.35em] text-gray-400 uppercase'>
            Backend API Routes
          </h2>
          <div className='space-y-4'>
            {[
              {
                endpoint: '/api/beats',
                description:
                  'Generates AWS S3 signed URLs for secure audio streaming'
              },
              {
                endpoint: '/api/spotify/playlists',
                description: 'Fetches curated playlists from Spotify API'
              },
              {
                endpoint: '/api/spotify/callback',
                description: 'OAuth 2.0 authentication flow handler'
              }
            ].map(route => (
              <div
                key={route.endpoint}
                className='rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm'
              >
                <div className='mb-1 font-mono text-sm text-cyan-400'>
                  {route.endpoint}
                </div>
                <div className='text-sm text-gray-400'>{route.description}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CODE EXAMPLE */}
        <section className='mb-20'>
          <h2 className='mb-8 font-mono text-xs tracking-[0.35em] text-gray-400 uppercase'>
            Under the Hood
          </h2>
          <div className='overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm'>
            <div className='border-b border-white/10 bg-white/5 px-6 py-3'>
              <span className='font-mono text-xs text-cyan-400'>
                components/PlayerBar.tsx
              </span>
            </div>
            <pre className='overflow-x-auto p-6 text-sm'>
              <code className='text-gray-300'>
                {`useEffect(() => {
  if (audioRef.current && track?.audioUrl) {
    audioRef.current.load()
    audioRef.current.play()
      .then(() => setIsPlaying(true))
      .catch(err => console.error('Play error:', err))
  }
}, [track?.audioUrl])

function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
  if (!audioRef.current) return
  const rect = e.currentTarget.getBoundingClientRect()
  const percent = (e.clientX - rect.left) / rect.width
  audioRef.current.currentTime = percent * duration
}`}
              </code>
            </pre>
          </div>
        </section>

        {/* PERFORMANCE METRICS */}
        <section>
          <h2 className='mb-8 font-mono text-xs tracking-[0.35em] text-gray-400 uppercase'>
            Performance
          </h2>
          <div className='grid gap-4 sm:grid-cols-3'>
            {[
              { label: 'First Load', value: '< 2s', color: 'cyan' },
              { label: 'Bundle Size', value: '~220KB', color: 'fuchsia' },
              { label: 'Lighthouse', value: '95+', color: 'green' }
            ].map(metric => (
              <div
                key={metric.label}
                className='rounded-xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm'
              >
                <div
                  className={`mb-2 text-3xl font-bold text-${metric.color}-400`}
                >
                  {metric.value}
                </div>
                <div className='text-sm text-gray-400'>{metric.label}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
