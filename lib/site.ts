import type { IconType } from 'react-icons'
import {
  SiGithub,
  SiInstagram,
  SiLinkedin,
  SiSoundcloud,
  SiSpotify
} from 'react-icons/si'

/* Site-wide links, shared by the nav (client) and the footer (server). */

export const NAV_LINKS = [
  { id: 'studio', href: '/studio', label: 'Studio', blurb: 'Beats & packs' },
  {
    id: 'spotify',
    href: '/spotify',
    label: 'Spotify',
    blurb: 'Curated playlists'
  },
  { id: 'tech', href: '/tech', label: 'Tech', blurb: 'How it’s built' },
  { id: 'about', href: '/about', label: 'About', blurb: 'The producer' }
] as const

export type SocialLink = {
  name: string
  href: string
  handle: string
  icon: IconType
  /** the platform's colour: icons light up in it on hover */
  color: string
  /** the icon's colour on a tile filled with `fill` (or `color`) */
  on: string
  /** a fill that isn't one flat colour (Instagram's gradient) */
  fill?: string
}

export const SOCIAL_LINKS: SocialLink[] = [
  {
    name: 'SoundCloud',
    href: 'https://soundcloud.com/goproductions',
    handle: '@goproductions',
    icon: SiSoundcloud,
    color: '#FF5500',
    on: '#FFFFFF'
  },
  {
    name: 'Spotify',
    href: 'https://open.spotify.com/user/groudono',
    handle: '@groudono',
    icon: SiSpotify,
    color: '#1ED760',
    on: '#000000'
  },
  {
    name: 'Instagram',
    href: 'https://instagram.com/omer.el__',
    handle: '@omer.el__',
    icon: SiInstagram,
    color: '#FF2E7E',
    on: '#FFFFFF',
    fill: 'linear-gradient(45deg, #FFD600, #FF7A00 25%, #FF0069 55%, #D300C5 80%, #7638FA)'
  }
]

/** the About page's list: the socials, plus where the code and work live */
export const CONNECT_LINKS: SocialLink[] = [
  ...SOCIAL_LINKS,
  {
    name: 'LinkedIn',
    href: 'https://linkedin.com/in/omerelammary',
    handle: '@omerelammary',
    icon: SiLinkedin,
    color: '#2D8CE6',
    on: '#FFFFFF',
    fill: '#0A66C2'
  },
  {
    name: 'GitHub',
    href: 'https://github.com/elammaryo',
    handle: '@elammaryo',
    icon: SiGithub,
    color: '#F3F0EA',
    on: '#0C0B10'
  }
]

export const SOUNDCLOUD_URL = 'https://soundcloud.com/goproductions'
export const SPOTIFY_PROFILE_URL = 'https://open.spotify.com/user/groudono'
export const GITHUB_URL = 'https://github.com/elammaryo'
