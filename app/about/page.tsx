'use client'

import { NavBar } from '../components/NavBar'
import Aurora from '../components/Aurora'
import Image from 'next/image'
import {
  SiSpotify,
  SiSoundcloud,
  SiInstagram,
  SiGithub,
  SiLinkedin
} from 'react-icons/si'
import {
  HiMusicalNote,
  HiSparkles,
  HiClock,
  HiHeart,
  HiGlobeAlt
} from 'react-icons/hi2'
import profileImage from '../../public/profile.png'

export default function AboutPage() {
  // Mock data - replace with actual API calls if you add endpoints
  const topArtists = [
    {
      name: 'Travis Scott',
      plays: '2.5K',
      image: 'https://i.scdn.co/image/ab6761610000e5eb19c2790744c792d05570bb71'
    },
    {
      name: 'Drake',
      plays: '2.1K',
      image: 'https://i.scdn.co/image/ab6761610000e5eb4293385d324db8558179afd9'
    },
    {
      name: 'Kanye West',
      plays: '1.8K',
      image: 'https://i.scdn.co/image/ab6761610000e5eb867008a971fae0f4d913f63a'
    },
    {
      name: 'Burna Boy',
      plays: '1.6K',
      image: 'https://i.scdn.co/image/ab6761610000e5eb987c8d6c9b24610e3502480c'
    },
    {
      name: 'WizKid',
      plays: '1.4K',
      image: 'https://i.scdn.co/image/ab6761610000e5eb59d6c54e62c37e62c6be85c3'
    }
  ]

  const topTracks = [
    {
      name: 'SICKO MODE',
      artist: 'Travis Scott',
      plays: '342',
      image: 'https://i.scdn.co/image/ab67616d0000b273072e9faef2ef7b6db63834a3'
    },
    {
      name: 'Last Last',
      artist: 'Burna Boy',
      plays: '298',
      image: 'https://i.scdn.co/image/ab67616d0000b273726d48d93d02e1271774f023'
    },
    {
      name: 'One Dance',
      artist: 'Drake',
      plays: '276',
      image: 'https://i.scdn.co/image/ab67616d0000b273f46b9d202509a8f7384b90de'
    },
    {
      name: 'Essence',
      artist: 'WizKid ft. Tems',
      plays: '264',
      image: 'https://i.scdn.co/image/ab67616d0000b273b6c010cb0bfb3a42b7e6a7a2'
    },
    {
      name: 'Runaway',
      artist: 'Kanye West',
      plays: '251',
      image: 'https://i.scdn.co/image/ab67616d0000b273d9194aa18fa4c9362b47464f'
    }
  ]

  const stats = [
    {
      label: 'Years Producing',
      value: '5+',
      icon: <HiClock size={20} />,
      color: 'cyan'
    },
    {
      label: 'Beats Created',
      value: '100+',
      icon: <HiMusicalNote size={20} />,
      color: 'purple'
    },
    {
      label: 'Genres Explored',
      value: '8',
      icon: <HiSparkles size={20} />,
      color: 'fuchsia'
    },
    {
      label: 'Spotify Hours',
      value: '12K+',
      icon: <HiHeart size={20} />,
      color: 'green'
    }
  ]

  const socialLinks = [
    {
      name: 'Spotify',
      url: 'https://open.spotify.com/user/groudono',
      icon: <SiSpotify size={24} />,
      color: 'hover:text-green-500',
      handle: '@groudono'
    },
    {
      name: 'SoundCloud',
      url: 'https://soundcloud.com/goproductions',
      icon: <SiSoundcloud size={24} />,
      color: 'hover:text-orange-500',
      handle: '@goproductions'
    },
    {
      name: 'Instagram',
      url: 'https://instagram.com/omer.el__',
      icon: <SiInstagram size={24} />,
      color: 'hover:text-pink-500',
      handle: '@omer.el__'
    },
    {
      name: 'LinkedIn',
      url: 'https://linkedin.com/in/omerelammary',
      icon: <SiLinkedin size={24} />,
      color: 'hover:text-blue-500',
      handle: '@omerelammary'
    },
    {
      name: 'GitHub',
      url: 'https://github.com/elammaryo',
      icon: <SiGithub size={24} />,
      color: 'hover:text-gray-300',
      handle: '@elammaryo'
    }
  ]

  return (
    <main className='relative min-h-screen bg-[#07050A] text-white'>
      {/* Purple/Pink Aurora for personal touch */}
      <div className='pointer-events-none fixed inset-0 opacity-35'>
        <Aurora
          colorStops={['#a855f7', '#ec4899', '#8b5cf6']}
          amplitude={1.2}
          blend={0.65}
          speed={0.3}
        />
      </div>

      <NavBar selectedTab='about' />

      <div className='relative z-10 mx-auto max-w-6xl px-4 pt-24 pb-16 sm:px-6'>
        {/* HEADER SECTION */}
        <header className='mb-16'>
          {/* Profile Card */}
          <div className='relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-fuchsia-500/5 p-8 backdrop-blur-sm md:p-12'>
            {/* Background gradient accent */}
            <div className='pointer-events-none absolute top-0 right-0 h-96 w-96 bg-gradient-to-bl from-purple-500/20 to-transparent blur-3xl' />

            <div className='relative z-10 flex flex-col items-center gap-8 md:flex-row'>
              {/* Profile Photo */}
              <div className='relative flex-shrink-0'>
                <div className='h-40 w-40 overflow-hidden rounded-2xl border-2 border-purple-500/40 bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 shadow-2xl shadow-purple-500/20 md:h-48 md:w-48'>
                  <Image
                    src={profileImage}
                    alt='Profile'
                    width={192}
                    height={192}
                    className='h-full w-full object-cover'
                  />
                </div>
              </div>

              {/* Bio */}
              <div className='flex flex-1 flex-col gap-4 text-center md:text-left'>
                <div>
                  <h1 className='mb-2 font-mono text-xs tracking-[0.35em] text-purple-400 uppercase'>
                    Music Producer
                  </h1>
                  <h2 className='text-5xl font-bold text-white sm:text-6xl'>
                    Omer Elammary
                  </h2>
                </div>
                <p className='text-lg leading-relaxed text-gray-300 md:text-xl'>
                  Crafting hard-hitting trap, drill, and afrobeats that push
                  boundaries. Based in Toronto, blending heavy 808s with
                  experimental sound design.
                </p>

                {/* Quick Stats Inline */}
                <div className='flex flex-wrap items-center justify-center gap-4 md:justify-start'>
                  <div className='flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2'>
                    <HiClock className='text-purple-400' size={16} />
                    <span className='text-sm font-semibold text-white'>
                      5+ Years
                    </span>
                  </div>
                  <div className='flex items-center gap-2 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-4 py-2'>
                    <HiMusicalNote className='text-fuchsia-400' size={16} />
                    <span className='text-sm font-semibold text-white'>
                      100+ Beats
                    </span>
                  </div>
                  <div className='flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2'>
                    <HiSparkles className='text-cyan-400' size={16} />
                    <span className='text-sm font-semibold text-white'>
                      8 Genres
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Extended Stats */}
          <div className='mt-6 grid grid-cols-2 gap-4 md:grid-cols-4'>
            <div className='group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-all hover:border-green-400/40 hover:bg-white/10'>
              <div className='flex items-center gap-3'>
                <div className='flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600'>
                  <SiSpotify size={20} />
                </div>
                <div>
                  <div className='text-2xl font-bold text-white'>8.2K</div>
                  <div className='text-xs text-gray-400'>Hours Listened</div>
                </div>
              </div>
            </div>

            <div className='group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-all hover:border-purple-400/40 hover:bg-white/10'>
              <div className='flex items-center gap-3'>
                <div className='flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-600'>
                  <HiMusicalNote size={20} />
                </div>
                <div>
                  <div className='text-2xl font-bold text-white'>450+</div>
                  <div className='text-xs text-gray-400'>Saved Tracks</div>
                </div>
              </div>
            </div>

            <div className='group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-all hover:border-cyan-400/40 hover:bg-white/10'>
              <div className='flex items-center gap-3'>
                <div className='flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600'>
                  <HiSparkles size={20} />
                </div>
                <div>
                  <div className='text-2xl font-bold text-white'>120+</div>
                  <div className='text-xs text-gray-400'>Unique Artists</div>
                </div>
              </div>
            </div>

            <div className='group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-all hover:border-orange-400/40 hover:bg-white/10'>
              <div className='flex items-center gap-3'>
                <div className='flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-600'>
                  <HiHeart size={20} />
                </div>
                <div>
                  <div className='text-2xl font-bold text-white'>35+</div>
                  <div className='text-xs text-gray-400'>Playlists Created</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* TOP SPOTIFY ARTISTS */}
        <section className='mb-16'>
          <div className='mb-6 flex items-center gap-3'>
            <SiSpotify className='text-green-500' size={24} />
            <h2 className='font-mono text-xs tracking-[0.35em] text-gray-400 uppercase'>
              Top Spotify Artists
            </h2>
          </div>

          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-5'>
            {topArtists.map((artist, index) => (
              <div
                key={artist.name}
                className='group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm transition-all hover:border-green-400/40 hover:bg-white/10'
              >
                {/* Artist Image */}
                <div className='relative aspect-square w-full overflow-hidden'>
                  <Image
                    src={artist.image}
                    alt={artist.name}
                    width={300}
                    height={300}
                    className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-110'
                  />
                  {/* Ranking badge */}
                  <div className='absolute top-3 left-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-lg font-bold text-white shadow-lg'>
                    {index + 1}
                  </div>
                  {/* Gradient overlay */}
                  <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent' />
                </div>

                {/* Artist Info */}
                <div className='absolute right-0 bottom-0 left-0 p-4'>
                  <div className='font-semibold text-white'>{artist.name}</div>
                  <div className='text-sm text-green-400'>
                    {artist.plays} plays
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* TOP SPOTIFY TRACKS */}
        <section className='mb-16'>
          <div className='mb-6 flex items-center gap-3'>
            <HiMusicalNote className='text-purple-500' size={24} />
            <h2 className='font-mono text-xs tracking-[0.35em] text-gray-400 uppercase'>
              Most Played Tracks
            </h2>
          </div>

          <div className='space-y-3'>
            {topTracks.map((track, index) => (
              <div
                key={track?.name}
                className='group flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm transition-all hover:border-purple-400/40 hover:bg-white/10'
              >
                {/* Album Cover */}
                <div className='relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg'>
                  <Image
                    src={track.image} // {track.images[0].url ?? ''}
                    alt={track.name}
                    width={64}
                    height={64}
                    className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-110'
                  />
                  {/* Ranking badge */}
                  <div className='absolute top-1 left-1 flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-xs font-bold text-white shadow-lg'>
                    {index + 1}
                  </div>
                </div>

                {/* Track Info */}
                <div className='min-w-0 flex-1'>
                  <div className='truncate font-semibold text-white'>
                    {track.name}
                  </div>
                  <div className='truncate text-sm text-gray-400'>
                    {track.artist}
                  </div>
                </div>

                {/* Play Count */}
                <div className='text-right'>
                  <div className='text-sm font-semibold text-purple-400'>
                    {/* {track.plays} */}
                  </div>
                  <div className='text-xs text-gray-500'>plays</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* MUSICAL JOURNEY / STORY */}
        <section className='mb-16'>
          <h2 className='mb-6 font-mono text-xs tracking-[0.35em] text-gray-400 uppercase'>
            My Journey
          </h2>

          <div className='space-y-6 rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm'>
            <div>
              <h3 className='mb-2 text-xl font-semibold text-white'>
                How It Started
              </h3>
              <p className='leading-relaxed text-gray-300'>
                My journey into music production began 5 years ago when I first
                discovered FL Studio. What started as a hobby quickly became a
                passion. I spent countless hours learning sound design,
                sampling, and arrangement techniques.
              </p>
            </div>

            <div>
              <h3 className='mb-2 text-xl font-semibold text-white'>
                My Sound
              </h3>
              <p className='leading-relaxed text-gray-300'>
                I specialize in creating hard-hitting trap and drill beats with
                heavy 808s, crisp hi-hats, and atmospheric melodies. I also love
                experimenting with afrobeats rhythms and blending genres to
                create unique sonic landscapes.
              </p>
            </div>

            <div>
              <h3 className='mb-2 text-xl font-semibold text-white'>
                Beyond Music
              </h3>
              <p className='leading-relaxed text-gray-300'>
                As a developer, I built this website from scratch using Next.js,
                AWS, and custom WebGL shaders. I love combining my technical
                skills with my creative passion to build unique digital
                experiences.
              </p>
            </div>
          </div>
        </section>

        {/* PRODUCER × DEVELOPER SECTION */}
        <section className='mb-16'>
          <h2 className='mb-6 font-mono text-xs tracking-[0.35em] text-gray-400 uppercase'>
            Producer × Developer
          </h2>

          <div className='grid gap-6 md:grid-cols-2'>
            {/* Music Producer Card */}
            <div className='group relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-fuchsia-500/5 p-8 backdrop-blur-sm transition-all hover:border-purple-400/40'>
              <div className='pointer-events-none absolute top-0 right-0 h-64 w-64 bg-gradient-to-bl from-purple-500/20 to-transparent blur-3xl' />

              <div className='relative z-10'>
                <div className='mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600'>
                  <HiMusicalNote size={28} className='text-white' />
                </div>

                <h3 className='mb-3 text-2xl font-bold text-white'>
                  Music Producer
                </h3>

                <p className='mb-4 text-gray-300'>
                  Specializing in trap, drill, and afrobeats. I craft
                  hard-hitting beats with heavy 808s, crisp hi-hats, and
                  atmospheric melodies that push boundaries.
                </p>

                <div className='space-y-2 text-sm text-gray-400'>
                  <div className='flex items-center gap-2'>
                    <div className='h-1.5 w-1.5 rounded-full bg-purple-400' />
                    <span>100+ beats created</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <div className='h-1.5 w-1.5 rounded-full bg-fuchsia-400' />
                    <span>5+ years experience</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <div className='h-1.5 w-1.5 rounded-full bg-pink-400' />
                    <span>8 genres explored</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Full-Stack Developer Card */}
            <div className='group relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 p-8 backdrop-blur-sm transition-all hover:border-cyan-400/40'>
              <div className='pointer-events-none absolute top-0 right-0 h-64 w-64 bg-gradient-to-bl from-cyan-500/20 to-transparent blur-3xl' />

              <div className='relative z-10'>
                <div className='mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600'>
                  <HiGlobeAlt size={28} className='text-white' />
                </div>

                <h3 className='mb-3 text-2xl font-bold text-white'>
                  Software Engineer
                </h3>

                <p className='mb-4 text-gray-300'>
                  Building modern web experiences with Next.js, AWS, . This
                  site? Built from scratch with custom shaders, serverless
                  functions, and a focus on performance and design.
                </p>

                <div className='space-y-2 text-sm text-gray-400'>
                  <div className='flex items-center gap-2'>
                    <div className='h-1.5 w-1.5 rounded-full bg-cyan-400' />
                    <span>Next.js & React</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <div className='h-1.5 w-1.5 rounded-full bg-blue-400' />
                    <span>AWS & Serverless</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <div className='h-1.5 w-1.5 rounded-full bg-indigo-400' />
                    <span>WebGL & Custom Shaders</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SOCIAL LINKS */}
        <section className='mb-16'>
          <h2 className='mb-6 font-mono text-xs tracking-[0.35em] text-gray-400 uppercase'>
            Connect With Me
          </h2>

          <div className='grid gap-4 sm:grid-cols-2'>
            {socialLinks.map((social, index) => {
              const isLastAndOdd =
                socialLinks.length % 2 !== 0 && index === socialLinks.length - 1

              return (
                <a
                  key={social.name}
                  href={social.url}
                  target='_blank'
                  rel='noopener noreferrer'
                  className={`group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10 ${social.color} ${
                    isLastAndOdd ? 'sm:col-span-2' : ''
                  }`}
                >
                  <div className='flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-white/5 transition-transform group-hover:scale-110'>
                    {social.icon}
                  </div>
                  <div className='flex flex-col'>
                    <span className='text-lg font-semibold text-white'>
                      {social.name}
                    </span>
                    <span className='text-sm text-gray-400'>
                      {social.handle}
                    </span>
                  </div>
                  <div className='ml-auto text-gray-500 transition-transform group-hover:translate-x-1'>
                    →
                  </div>
                </a>
              )
            })}
          </div>
        </section>

        {/* TECH STACK TEASER */}
        <section>
          <div className='relative overflow-hidden rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 p-8 backdrop-blur-sm'>
            <div className='relative z-10 text-center'>
              <HiGlobeAlt className='mx-auto mb-4 text-cyan-400' size={48} />
              <h3 className='mb-3 text-2xl font-bold text-white'>
                Curious About The Tech?
              </h3>
              <p className='mb-6 text-gray-300'>
                Explore the full-stack architecture powering this site. Built
                with Next.js, AWS S3, serverless functions, and custom WebGL
                shaders.
              </p>
              <a
                href='/tech'
                className='inline-flex items-center gap-2 rounded-full border border-cyan-500 bg-cyan-500/10 px-8 py-3 font-semibold text-cyan-400 transition-all hover:border-cyan-400 hover:bg-cyan-500/20'
              >
                View Tech Stack →
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
