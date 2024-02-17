type DiscoverSource =
  | "Anything Me"
  | "Following"
  | "Playlist"
  | "Artiste"
  | "Keyword";

interface DiscoverSourceData {
  selectedSource: DiscoverSource;
  availableSources: DiscoverSource[];
}

//For now, destination has to be a Spotify Playlist.
interface DiscoverDestination {
  name: string;
  image: string;
  id: string;
}

const emptyDiscoverDestination: DiscoverDestination = {
  name: "",
  image: "",
  id: "",
};

interface DiscoverDestinationData {
  selectedDestination: DiscoverDestination;
  offset: number; // The index at which the server terminated it's search for valid discover destinations (i.e. user owned spotify playlists) in the total user playlists.
  total: number; // The total number of user playlists. The server searches these playlists for discover destinations (i.e. user owned playlists).
  availableDestinations: DiscoverDestination[];
}

export {
  DiscoverSource,
  DiscoverSourceData,
  DiscoverDestination,
  emptyDiscoverDestination,
  DiscoverDestinationData,
};
