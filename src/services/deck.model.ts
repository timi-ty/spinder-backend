import { DiscoverSource } from "../discover/discover.model";

interface DeckItem {
  trackId: string;
  image: string;
  previewUrl: string;
  trackName: string;
  trackUri: string;
  artists: DeckItemArtist[];
  relatedSources: DiscoverSource[];
}

interface DeckItemArtist {
  artistName: string;
  artistUri: string;
  artistImage: string;
}

export { DeckItem, DeckItemArtist };
