//Composite sources function on their own as usable discover sources.
type DiscoverCompositeSource =
  | "Anything Me" //Randomly get 25 tracks from the user's top items, and use 5 of those to seed spotify recommendations for another 25 tracks.
  | "Spinder People" //Should change to My People (Spinder users that follow you) but requires more work to implement.
  | "My Artists" //Artists that the user follows. Mix up their discography and deliver.
  | "My Playlists"; //Playlists that the user owns/follows. Mix up their tracks and deliver.

//Solo sources here are source types and each requires a corresponding value/id to be valid.
type DiscoverSoloSource =
  | "Vibe" //Search playlists with this word(s) and randomly mix the tracks in them.
  | "Spinder Person" //"Anything Me" but for someone else.
  | "Artist" //Mix up a single artist's discography and deliver.
  | "Playlist"; //Deliver the playlist as is.

type DiscoverSourceType = DiscoverCompositeSource | DiscoverSoloSource;

interface DiscoverSource {
  type: DiscoverSourceType;
  id: string;
  name: string;
  image: string;
}

const defaultDiscoverSource: DiscoverSource = {
  type: "Anything Me",
  id: "Anything Me",
  name: "Anything Me",
  image: "",
};

interface DiscoverSourceData {
  selectedSource: DiscoverSource;
  availableSources: DiscoverSource[];
}

interface DiscoverSourceSearchResult {
  artists: DiscoverSource[];
  playlists: DiscoverSource[];
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
  defaultDiscoverSource,
  DiscoverSourceData,
  DiscoverSourceSearchResult,
  DiscoverDestination,
  emptyDiscoverDestination,
  DiscoverDestinationData,
};
