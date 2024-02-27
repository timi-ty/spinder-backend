import {
  DiscoverDestinationData,
  DiscoverDestination,
  emptyDiscoverDestination,
} from "./discover.model.js";
import { discoverLogger } from "../utils/logger.js";
import { SpotifyPlaylists } from "../spotify/spotify.model.js";
import { getSpotifyUserPlaylists } from "../spotify/spotify.api.js";

async function getCountOrAllOwnedSpotifyPlaylists(
  accessToken: string,
  userId: string,
  count: number,
  offset: number
): Promise<DiscoverDestinationData> {
  var spotifyPlaylists = await getSpotifyUserPlaylists(accessToken, offset);
  var ownedSpotifyPlaylists = filterOwnedSpotifyPlaylists(
    spotifyPlaylists,
    userId
  );
  var keepCurating =
    ownedSpotifyPlaylists.length < count && spotifyPlaylists.next;
  while (keepCurating) {
    discoverLogger.debug(
      `Found ${ownedSpotifyPlaylists.length} playlists owned by user ${userId} so far but there are more playlists to search at ${spotifyPlaylists.next}. Continuing...`
    );
    spotifyPlaylists = await getSpotifyUserPlaylists(
      accessToken,
      -1,
      50,
      spotifyPlaylists.next
    );
    const moreOwnedSpotifyPlaylists = filterOwnedSpotifyPlaylists(
      spotifyPlaylists,
      userId
    );
    ownedSpotifyPlaylists = ownedSpotifyPlaylists.concat(
      moreOwnedSpotifyPlaylists
    );
    keepCurating =
      ownedSpotifyPlaylists.length < count && spotifyPlaylists.next;
  }

  const discoverDestinationData: DiscoverDestinationData = {
    offset: spotifyPlaylists.offset,
    total: spotifyPlaylists.total,
    availableDestinations: ownedSpotifyPlaylists,
    selectedDestination: emptyDiscoverDestination, // Will be set by controller.
  };

  return discoverDestinationData;
}

function filterOwnedSpotifyPlaylists(
  spotifyPlaylists: SpotifyPlaylists,
  userId: string
): DiscoverDestination[] {
  const userOwnedPlaylists = spotifyPlaylists.items
    .filter((playlist) => playlist.owner.id === userId)
    .map((playlist) => {
      const discoverDestinationPlaylist: DiscoverDestination = {
        name: playlist.name,
        image: playlist.images.length > 0 ? playlist.images[0].url : "",
        id: playlist.id,
      };
      discoverLogger.debug(
        `Found user owned playlist - ${discoverDestinationPlaylist.name}.`
      );
      return discoverDestinationPlaylist;
    });
  return userOwnedPlaylists;
}

export { getCountOrAllOwnedSpotifyPlaylists };
