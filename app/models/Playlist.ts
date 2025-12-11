import { BeatTrack, SpotifyTrack } from './Track'

export class Playlist {
  collaborative: boolean
  description: string | null
  external_urls: { spotify: string }
  href: string
  id: string
  images: { url: string }[]
  name: string
  public: boolean
  snapshot_id: string
  tracks: { href: string; items: { track: SpotifyTrack }[]; total: number }
  trackIds?: string[] = []
  type: 'spotify' | 'beat'
  uri: string
  items?: SpotifyTrack[] | BeatTrack[] = []
  owner: { displayName: string; id: string }

  constructor(data: {
    collaborative: boolean
    description: string | null
    external_urls: { spotify: string }
    href: string
    id: string
    images: { url: string }[]
    name: string
    public: boolean
    snapshot_id: string
    tracks: { href: string; items: { track: SpotifyTrack }[]; total: number }
    type: 'spotify' | 'beat'
    uri: string
    items?: SpotifyTrack[] | BeatTrack[]
    owner: { displayName: string; id: string }
  }) {
    this.collaborative = data.collaborative
    this.description = data.description
    this.external_urls = data.external_urls
    this.href = data.href
    this.id = data.id
    this.images = data.images
    this.name = data.name
    this.items = data.items
    this.public = data.public
    this.snapshot_id = data.snapshot_id
    this.tracks = data.tracks
    this.type = data.type
    this.uri = data.uri
    this.owner = data.owner
  }
}
