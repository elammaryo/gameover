import { SiInstagram, SiSoundcloud, SiSpotify } from 'react-icons/si'

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

export const SOCIAL_LINKS = [
  {
    name: 'SoundCloud',
    href: 'https://soundcloud.com/goproductions',
    handle: '@goproductions',
    icon: SiSoundcloud
  },
  {
    name: 'Spotify',
    href: 'https://open.spotify.com/user/groudono',
    handle: '@groudono',
    icon: SiSpotify
  },
  {
    name: 'Instagram',
    href: 'https://instagram.com/omer.el__',
    handle: '@omer.el__',
    icon: SiInstagram
  }
] as const

export const SOUNDCLOUD_URL = 'https://soundcloud.com/goproductions'
export const SPOTIFY_PROFILE_URL = 'https://open.spotify.com/user/groudono'
export const GITHUB_URL = 'https://github.com/elammaryo'
