type DiscoverSourceType =
  | "Anything Me"
  | "Following"
  | "Playlist"
  | "Artiste"
  | "Keyword";

interface DiscoverSourceTypesData {
  selectedSourceType: number;
  sourceTypes: DiscoverSourceType[];
}

export { DiscoverSourceTypesData };
