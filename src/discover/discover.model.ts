type DiscoverSourceType =
  | "Anything Me"
  | "Following"
  | "Playlist"
  | "Artiste"
  | "Keyword";

interface DiscoverSourceTypesData {
  selectedSourceType: DiscoverSourceType;
  sourceTypes: DiscoverSourceType[];
}

interface DiscoverDestinationPlaylist {
  name: string; // Playlist name.
  image: string; // Playlist image.
  id: string; //playlist id.
}

interface DiscoverDestinationData {
  selectedDestinationId: string;
  offset: number; // The index at which the server terminated it's search for valid discover destinations (i.e. user owned spotify playlists) in the total user playlists.
  total: number; // The total number of user playlists. The server searches these playlists for discover destinations (i.e. user owned playlists).
  discoverDestinationPlaylists: DiscoverDestinationPlaylist[];
}

export {
  DiscoverSourceType,
  DiscoverSourceTypesData,
  DiscoverDestinationPlaylist,
  DiscoverDestinationData,
};
