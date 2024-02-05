interface SpotifyError {
  status: number;
  message: string;
}

interface SpotifyErrorResponse {
  error: SpotifyError;
}

interface ExplicitContent {
  filter_enabled: boolean;
  filter_locked: boolean;
}

interface ExternalUrls {
  spotify: string;
}

interface Followers {
  href: string;
  total: number;
}

interface Image {
  url: string;
  height: number;
  width: number;
}

interface SpotifyUserProfileData {
  country: string;
  display_name: string;
  email: string;
  explicit_content: ExplicitContent;
  external_urls: ExternalUrls;
  followers: Followers;
  href: string;
  id: string;
  images: Image[];
  product: string;
  type: string;
  uri: string;
}

interface PlaylistItem {
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
  items: PlaylistItem[];
}

interface TopTrack {
  album: Album;
  artists: Artist[];
  available_markets: string[];
  disc_number: number;
  duration_ms: number;
  explicit: boolean;
  external_ids: ExternalIDS;
  external_urls: ExternalUrls;
  href: string;
  id: string;
  name: string;
  popularity: number;
  preview_url: string;
  track_number: number;
  type: "track";
  uri: string;
  is_local: boolean;
}

interface Album {
  album_type: "album" | "single" | "comilation";
  total_tracks: number;
  available_markets: string[];
  external_urls: ExternalUrls;
  href: string;
  id: string;
  images: Image[];
  name: string;
  release_date: Date;
  release_date_precision: "year" | "month" | "day";
  type: "album";
  uri: string;
  artists: Artist[];
}

interface Artist {
  external_urls: ExternalUrls;
  href: string;
  id: string;
  name: string;
  type: "artist";
  uri: string;
}

interface ExternalIDS {
  isrc: string;
  ean: string;
  ups: string;
}

interface SpotifyTopTracks {
  href: string;
  limit: number;
  next: string;
  offset: number;
  previous: null;
  total: number;
  items: TopTrack[];
}

export {
  SpotifyErrorResponse,
  SpotifyUserProfileData,
  SpotifyPlaylists,
  SpotifyTopTracks,
};
