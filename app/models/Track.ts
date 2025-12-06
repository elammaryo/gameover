export type TrackSource = 'beat' | 'spotify'

abstract class BaseTrack {
  id: string
  title: string
  artist?: string
  durationMs?: number
  artworkUrl?: string
  source: TrackSource
  audioUrl: string

  constructor(data: BaseTrack) {
    this.id = data.id
    this.title = data.title
    this.artist = data.artist
    this.durationMs = data.durationMs
    this.artworkUrl = data.artworkUrl
    this.source = data.source
    this.audioUrl = data.audioUrl
  }
}

export class BeatTrack extends BaseTrack {
  source: 'beat' = 'beat'
  bpm: number
  subtitle?: string
  genre: string
  mood?: string
  tags?: string[]
  key?: string

  constructor(data: BeatTrack) {
    super(data)
    this.bpm = data.bpm
    this.subtitle = data.subtitle
    this.genre = data.genre
    this.mood = data.mood
    this.tags = data.tags
    this.key = data.key
  }
}

export class SpotifyTrack extends BaseTrack {
  source: 'spotify' = 'spotify'
  name: string
  album: {
    name: string
    images: [{ url: string }]
  }
  artists: [{ name: string; uri: string }]
  mediaType: string
  images: { url: string; height: number; width: number }[]

  constructor(data: SpotifyTrack) {
    super({
      id: data.id,
      title: data.name,
      artist: data.artists?.[0]?.name || 'Unknown Artist',
      durationMs: data.duration_ms,
      artworkUrl: data.album?.images?.[0]?.url || data.images?.[0]?.url,
      source: 'spotify'
    })

    this.id = data.id
    this.name = data.name
    this.album = data.album
    this.artists = data.artists
    this.durationMs = data.duration_ms
    this.mediaType = data.type || 'track'
    this.images = data.album?.images || data.images || []
  }
}

export type Track = BeatTrack | SpotifyTrack
