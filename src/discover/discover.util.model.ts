interface Item {
  collaborative: boolean;
  description: string;
  external_urls: ExternalUrls;
  href: string;
  id: string;
  images: Image[];
  name: string;
  owner: Owner;
  public: boolean;
  snapshot_id: string;
  tracks: Tracks;
  type: string;
  uri: string;
}

interface ExternalUrls {
  spotify: string;
}

interface Image {
  url: string;
  height: number;
  width: number;
}

interface Owner {
  external_urls: ExternalUrls;
  followers: Tracks;
  href: string;
  id: string;
  type: string;
  uri: string;
  display_name: string;
}

interface Tracks {
  href: string;
  total: number;
}

interface SpotifyPlaylists {
  href: string;
  limit: number;
  next: string;
  offset: number;
  previous: string;
  total: number;
  items: Item[];
}

export { SpotifyPlaylists };
