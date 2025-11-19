export class Playlist {
  collaborative: boolean
  description: string | null
  external_urls: any[]
  href: string
  id: string
  images: any[]
  name: string
  primary_color: string | null
  public: boolean
  snapshot_id: string
  tracks: any[]
  type: 'playlist'
  uri: string

  constructor(data: {
    collaborative: boolean
    description: string | null
    external_urls: any[]
    href: string
    id: string
    images: any[]
    name: string
    primary_color: string | null
    public: boolean
    snapshot_id: string
    tracks: any[]
    type: 'playlist'
    uri: string
  }) {
    this.collaborative = data.collaborative
    this.description = data.description
    this.external_urls = data.external_urls
    this.href = data.href
    this.id = data.id
    this.images = data.images
    this.name = data.name
    this.primary_color = data.primary_color
    this.public = data.public
    this.snapshot_id = data.snapshot_id
    this.tracks = data.tracks
    this.type = data.type
    this.uri = data.uri
  }
}
